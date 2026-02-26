"""
AI Agent API Endpoint
─────────────────────────────────────────────────────────────
Multimodal ürün analizi ve otomatik form oluşturma.

Endpoints:
  POST /analyze        — Fotoğraf + metin → ürün formu
  POST /analyze-and-save — Analiz et + doğrudan veritabanına kaydet
  GET  /status         — Agent durumu ve konfigürasyon kontrolü
"""
import asyncio
import json
import os
import shutil
import uuid
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel as _PydanticBaseModel

from database import products_col, categories_col, get_next_id

logger = logging.getLogger(__name__)

router = APIRouter()

# Upload dizini
AGENT_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads",
    "agent_temp",
)
os.makedirs(AGENT_UPLOAD_DIR, exist_ok=True)


def _save_uploaded_images(
    images: List[UploadFile], session_id: str
) -> list[str]:
    """Yüklenen görselleri geçici dizine kaydet, dosya yollarını döndür."""
    session_dir = os.path.join(AGENT_UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    paths: list[str] = []
    for img in images:
        if not img.filename:
            continue

        # Güvenli dosya adı oluştur
        ext = os.path.splitext(img.filename)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"):
            continue

        safe_name = f"{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(session_dir, safe_name)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(img.file, f)

        paths.append(file_path)

    return paths


def _cleanup_session(session_id: str) -> None:
    """Geçici oturum dosyalarını temizle."""
    session_dir = os.path.join(AGENT_UPLOAD_DIR, session_id)
    if os.path.exists(session_dir):
        try:
            shutil.rmtree(session_dir)
        except Exception as e:
            logger.warning("Geçici dosya temizleme hatası: %s", str(e))


@router.post("/analyze")
async def analyze_product(
    images: List[UploadFile] = File(default=[], description="Ürün fotoğrafları (opsiyonel)"),
    description: str = Form(..., description="Kullanıcı açıklaması (metin)"),
):
    """Ürün açıklamasını (ve opsiyonel fotoğrafları) AI ile analiz ederek form verisi oluşturur.

    Multipart form data olarak:
    - images: Ürün fotoğrafları (opsiyonel)
    - description: Kullanıcının ürün hakkındaki açıklaması (zorunlu)

    Dönen yapı:
    - status: "success" | "error"
    - product_form: Frontend formunu dolduracak veri
    - warnings: Uyarılar
    - errors: Hatalar
    """
    session_id = uuid.uuid4().hex

    try:
        # ── 1. Görselleri kaydet (varsa) ──
        image_paths = _save_uploaded_images(images, session_id) if images else []

        logger.info(
            "Analiz başlatılıyor. Session: %s, Fotoğraf: %d, Açıklama: %d karakter",
            session_id,
            len(image_paths),
            len(description),
        )

        # ── 2. Agent'ı çalıştır (senkron — Windows TLS uyumluluğu için) ──
        from agent import ProductAnalysisAgent

        agent = ProductAnalysisAgent()
        result = await asyncio.to_thread(
            agent.analyze_sync,
            image_paths=image_paths,
            user_description=description,
        )

        # ── 3. Yanıtı dön ──
        return JSONResponse(
            content={
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                **result,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Analiz hatası: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Ürün analizi sırasında hata oluştu: {str(e)}",
        )
    finally:
        # Geçici dosyaları temizle
        _cleanup_session(session_id)


@router.post("/analyze-and-save")
async def analyze_and_save_product(
    images: List[UploadFile] = File(..., description="Ürün fotoğrafları"),
    description: str = Form(..., description="Kullanıcı açıklaması"),
    auto_save: bool = Form(
        default=False,
        description="True ise doğrudan veritabanına kaydet, False ise onay bekle",
    ),
):
    """Ürünü analiz et ve opsiyonel olarak doğrudan veritabanına kaydet.

    auto_save=True olduğunda:
    - Analiz başarılıysa ürün otomatik kaydedilir
    - Hata/belirsizlik varsa kaydetmez, kullanıcıya bildirir
    """
    session_id = uuid.uuid4().hex
    saved_image_paths: list[str] = []

    try:
        # ── 1. Görselleri kaydet ──
        image_paths = _save_uploaded_images(images, session_id)

        if not image_paths:
            raise HTTPException(
                status_code=400,
                detail="Geçerli bir ürün fotoğrafı yüklenemedi.",
            )

        # ── 2. Agent analizi (senkron — Windows TLS uyumluluğu için) ──
        from agent import ProductAnalysisAgent

        agent = ProductAnalysisAgent()
        result = await asyncio.to_thread(
            agent.analyze_sync,
            image_paths=image_paths,
            user_description=description,
        )

        # ── 3. Otomatik kaydetme ──
        product_id = None

        if auto_save and result.get("status") == "success" and result.get("product_form"):
            form = result["product_form"]

            # Görselleri kalıcı dizine taşı
            saved_image_paths = _move_images_to_permanent(image_paths, session_id)

            # Ürünü veritabanına ekle
            product_id = _save_product_to_db(form, saved_image_paths)

            result["saved"] = True
            result["product_id"] = product_id
        else:
            result["saved"] = False
            result["product_id"] = None

            if auto_save and result.get("status") != "success":
                result["save_skipped_reason"] = (
                    "Analiz durumu 'success' değil. "
                    "Önce uyarıları/soruları çözün."
                )

        return JSONResponse(
            content={
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                **result,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Analiz ve kaydetme hatası: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Ürün analizi/kaydetme sırasında hata oluştu: {str(e)}",
        )
    finally:
        # Geçici dosyaları temizle (kaydedilmemişleri)
        _cleanup_session(session_id)


def _move_images_to_permanent(
    temp_paths: list[str], session_id: str
) -> list[str]:
    """Geçici görselleri kalıcı ürün dizinine taşı."""
    permanent_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "uploads",
        "products",
    )
    os.makedirs(permanent_dir, exist_ok=True)

    saved_paths: list[str] = []
    for temp_path in temp_paths:
        ext = os.path.splitext(temp_path)[1]
        permanent_name = f"ai_{session_id[:8]}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
        permanent_path = os.path.join(permanent_dir, permanent_name)

        try:
            shutil.copy2(temp_path, permanent_path)
            relative_path = f"/uploads/products/{permanent_name}"
            saved_paths.append(relative_path)
        except Exception as e:
            logger.warning("Görsel taşıma hatası: %s", str(e))

    return saved_paths


def _save_product_to_db(
    form: dict,
    image_paths: list[str],
) -> int:
    """Ürün formunu MongoDB'ye kaydet."""
    extra_specs = form.pop("extra_specs", None)
    if extra_specs and isinstance(extra_specs, dict):
        extra_specs = {k: v for k, v in extra_specs.items() if v is not None}
    else:
        extra_specs = None

    now = datetime.utcnow()
    product_id = get_next_id("products")

    doc = {
        "id": product_id,
        "name": form.get("name", "AI Analizi - İsimsiz Ürün"),
        "category_id": form.get("category_id"),
        "product_type": form.get("product_type"),
        "purchase_price": form.get("purchase_price", 0.0),
        "sale_price": form.get("sale_price", 0.0),
        "negotiation_margin": form.get("negotiation_margin", 0.0),
        "negotiation_type": form.get("negotiation_type", "amount"),
        "material": form.get("material"),
        "status": form.get("status", "working"),
        "stock_status": form.get("stock_status", "available"),
        "notes": form.get("notes"),
        "extra_specs": extra_specs,
        "images": image_paths if image_paths else [],
        "created_at": now,
        "updated_at": now,
    }

    products_col.insert_one(doc)
    logger.info("Ürün kaydedildi. ID: %d, Ad: %s", product_id, doc["name"])
    return product_id


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Ses dosyası (webm, mp3, wav, m4a)"),
):
    """Ses dosyasını Groq Whisper ile yazıya çevirir.

    Returns:
        {"text": "Çevrilen metin"}
    """
    try:
        from groq import Groq
        from agent.config import GROQ_API_KEY

        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY ayarlanmamış")

        # Ses dosyasını geçici kaydet
        temp_path = os.path.join(AGENT_UPLOAD_DIR, f"audio_{uuid.uuid4().hex[:8]}")
        ext = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
        temp_path += ext

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        try:
            client = Groq(api_key=GROQ_API_KEY)
            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(os.path.basename(temp_path), audio_file),
                    model="whisper-large-v3-turbo",
                    language="tr",
                    response_format="text",
                )

            text = transcription.strip() if isinstance(transcription, str) else str(transcription).strip()
            logger.info("Transcription başarılı: %d karakter", len(text))
            return {"text": text}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Transcription hatası: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ses çevirme hatası: {str(e)}")


CATEGORY_ASSIST_PROMPT = """Sen endüstriyel mutfak ekipmanları kategori yönetim asistanısın. Kullanıcının doğal dilde yazdığı talimatları anlayıp kategori verisini güncelleyeceksin.

## MEVCUT KATEGORİ VERİSİ
{current_data}

## KULLANICI TALİMATI
{user_message}

## KURALLAR
1. Kullanıcının talebini analiz et ve mevcut kategori verisini buna göre güncelle.
2. Ürün çeşidi (product_types) eklerken value alanı snake_case olmalı (Türkçe karakterler dönüştürülmeli: ş→s, ç→c, ğ→g, ü→u, ö→o, ı→i).
3. Teknik alan (fields) eklerken name alanı snake_case olmalı.
4. Teknik alan tipi "text", "number" veya "select" olabilir.
5. Select tipindeki alanlar için options listesi sağla.
6. Birim (unit) varsa ekle: cm, mm, kg, L, HP vb.
7. Mevcut verileri koruyarak sadece talep edilen değişiklikleri yap.
8. Eğer kullanıcı sadece ürün çeşidi ekliyorsa, diğer alanları olduğu gibi bırak.
9. Eğer kullanıcı sadece teknik alan ekliyorsa, diğer alanları olduğu gibi bırak.
10. "message" alanında yaptığın değişiklikleri kısa özetle (Türkçe).

## ÇIKTI (SADECE JSON, başka bir şey yazma)
{{
    "name": "Kategori adı",
    "description": "Kategori açıklaması",
    "product_types": [
        {{
            "value": "snake_case_deger",
            "label": "Görünen Ad",
            "fields": [
                {{
                    "name": "alan_adi",
                    "label": "Alan Başlığı",
                    "type": "number|text|select",
                    "unit": "cm",
                    "options": ["seçenek1", "seçenek2"]
                }}
            ]
        }}
    ],
    "default_fields": [
        {{
            "name": "alan_adi",
            "label": "Alan Başlığı",
            "type": "number|text|select",
            "unit": "birim",
            "options": []
        }}
    ],
    "message": "Yapılan değişikliklerin kısa özeti"
}}"""


class CategoryAssistRequest(_PydanticBaseModel):
    message: str
    current_category: Optional[dict] = None


@router.post("/category-assist")
async def category_assist(body: CategoryAssistRequest):
    """AI ile kategori oluşturma/düzenleme asistanı.

    Kullanıcı doğal dilde ne istediğini yazar,
    AI mevcut kategori verisini buna göre günceller.
    """
    try:
        current_data = body.current_category or {
            "name": "",
            "description": "",
            "product_types": [],
            "default_fields": [],
        }

        current_data_str = json.dumps(current_data, ensure_ascii=False, indent=2)

        prompt = CATEGORY_ASSIST_PROMPT.format(
            current_data=current_data_str,
            user_message=body.message,
        )

        from agent.config import (
            GOOGLE_MODEL,
            GOOGLE_MODEL_FALLBACK,
            configure_langsmith,
            get_google_llm,
        )
        from agent.retry import invoke_with_retry, is_rate_limit_error
        from langchain_core.messages import HumanMessage

        configure_langsmith()

        models_to_try = [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK]
        result_data = None

        for model_name in models_to_try:
            try:
                llm = get_google_llm(model=model_name)
                response = invoke_with_retry(
                    llm.invoke,
                    [HumanMessage(content=prompt)],
                )
                raw_text = response.content

                parsed = _extract_json_from_text(raw_text)
                if parsed:
                    result_data = parsed
                    break
            except Exception as e:
                if is_rate_limit_error(e):
                    continue
                raise

        if not result_data:
            return JSONResponse(content={
                "status": "error",
                "message": "AI yanıtı işlenemedi. Lütfen tekrar deneyin.",
                "category_data": None,
            })

        ai_message = result_data.pop("message", "Kategori güncellendi.")

        category_data = {
            "name": result_data.get("name", current_data.get("name", "")),
            "description": result_data.get("description", current_data.get("description", "")),
            "product_types": result_data.get("product_types", current_data.get("product_types", [])),
            "default_fields": result_data.get("default_fields", current_data.get("default_fields", [])),
        }

        for pt in category_data.get("product_types", []):
            if pt.get("fields") is None:
                pt["fields"] = None
            elif isinstance(pt.get("fields"), list) and len(pt["fields"]) == 0:
                pt["fields"] = None

        return JSONResponse(content={
            "status": "success",
            "message": ai_message,
            "category_data": category_data,
        })

    except Exception as e:
        logger.error("Category assist hatası: %s", str(e), exc_info=True)
        error_msg = (
            "API kota limiti aşıldı. Birkaç dakika bekleyip tekrar deneyin."
            if "rate_limit" in str(e).lower() or "429" in str(e)
            else f"AI hatası: {str(e)}"
        )
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": error_msg, "category_data": None},
        )


def _extract_json_from_text(text: str) -> Optional[dict]:
    """Extract JSON from AI response text."""
    if not text:
        return None

    try:
        if "```json" in text:
            json_str = text.split("```json")[1].split("```")[0].strip()
            return json.loads(json_str)
        elif "```" in text:
            for block in text.split("```")[1::2]:
                block = block.strip()
                if block.startswith("json"):
                    block = block[4:].strip()
                try:
                    return json.loads(block)
                except json.JSONDecodeError:
                    continue
    except (json.JSONDecodeError, IndexError):
        pass

    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return None


@router.get("/status")
def agent_status():
    """Agent durumu ve konfigürasyon kontrolü."""
    from agent.config import validate_config, GOOGLE_MODEL, LANGSMITH_PROJECT

    issues = validate_config()

    return {
        "status": "ready" if not issues else "configuration_needed",
        "model": GOOGLE_MODEL,
        "langsmith_project": LANGSMITH_PROJECT,
        "configuration_issues": issues,
    }
