"""
Tool 1 — Multimodal Analyzer
─────────────────────────────────────────────────────────────
Girdi  : ürün fotoğrafları (dosya yolları) + kullanıcı açıklaması
Çıktı  : kategori, ürün çeşidi, çıkarılan özellikler (JSON)

Vision desteği:
  1. Görsel varsa → Google Gemini (vision)
  2. Görsel yoksa veya okunamazsa → Groq (sadece metin)
"""
import base64
import json
import logging
import os
from typing import Any

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage

from agent.config import (
    get_google_llm,
    get_groq_llm,
    GOOGLE_API_KEY,
)
from agent.retry import invoke_with_retry

logger = logging.getLogger(__name__)

# ─── Analiz Prompt'u ─────────────────────────────────────────
ANALYSIS_PROMPT = """Sen bir endüstriyel mutfak ekipmanları uzmanısın.
Verilen ürün fotoğraflarını ve kullanıcının sesli/yazılı açıklamasını analiz et.

## Görevin

1. Ürünün **kategorisini** belirle
2. Kategoriye bağlı **ürün çeşidini** belirle
3. Görselden ve metinden çıkarılabilen tüm **özellikleri** listele

## Mevcut Kategoriler
{categories}

## Her kategori için bilinen ürün çeşitleri
{product_types}

## KURALLAR
- Sadece görselde GÖREBİLDİĞİN ve metinde OKUDUĞUN bilgileri kullan
- Hiçbir zaman bilgi UYDURMA
- Her bilgi için "confidence" değeri belirt: "high", "medium", "low"
- Bilginin kaynağını belirt: "image", "text", "both"
- Emin olmadığın alanları null bırak
- Birim dönüşümlerini doğru yap (metre → cm, vb.)

## ÇIKTI FORMATI (Sadece JSON döndür)
{{
    "category": {{
        "name": "Kategori adı veya null",
        "confidence": "high/medium/low",
        "alternatives": ["Alternatif kategori 1", "..."]
    }},
    "product_type": {{
        "name": "Ürün çeşidi adı veya null",
        "confidence": "high/medium/low",
        "alternatives": ["Alternatif tip 1", "..."]
    }},
    "extracted_features": {{
        "material": {{"value": "...", "confidence": "...", "source": "image/text/both"}},
        "brand": {{"value": "...", "confidence": "...", "source": "..."}},
        "model_name": {{"value": "...", "confidence": "...", "source": "..."}},
        "dimensions": {{
            "width_cm": null,
            "depth_cm": null,
            "height_cm": null,
            "confidence": "...",
            "source": "..."
        }},
        "energy_type": {{"value": "...", "confidence": "...", "source": "..."}},
        "condition": {{"value": "sıfır/ikinci el/yenilenmiş", "confidence": "...", "source": "..."}},
        "color": {{"value": "...", "confidence": "...", "source": "..."}},
        "purchase_price": {{"value": null, "confidence": "...", "source": "..."}},
        "sale_price": {{"value": null, "confidence": "...", "source": "..."}},
        "additional_features": {{}}
    }},
    "visual_description": "Görselden elde edilen kısa açıklama",
    "needs_clarification": ["Netleştirilmesi gereken konular listesi"],
    "notes": "Analizle ilgili ek notlar"
}}

Kullanıcı Açıklaması: {user_description}

Sadece geçerli JSON döndür, başka açıklama ekleme.
"""


def _encode_image(image_path: str) -> tuple[str, str]:
    """Görsel dosyasını base64 olarak kodla ve MIME tipini belirle."""
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
    }
    mime_type = mime_map.get(ext, "image/jpeg")

    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    return data, mime_type


def _get_categories_and_types() -> tuple[list[str], dict[str, list[str]]]:
    """Veritabanı ve seed_data'dan kategori ve ürün çeşitlerini al."""
    import sys
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    try:
        from database import SessionLocal, Category
        db = SessionLocal()
        try:
            categories = db.query(Category).filter(Category.is_active == True).all()
            category_names = [c.name for c in categories]
        finally:
            db.close()
    except Exception:
        category_names = []

    try:
        from seed_data import PRODUCTS
        product_types = PRODUCTS
    except Exception:
        product_types = {}

    if not category_names:
        from agent.product_specs import get_all_category_names
        category_names = get_all_category_names()

    return category_names, product_types


@tool
def analyze_product_images(image_paths: str, user_description: str) -> str:
    """Ürün fotoğraflarını ve kullanıcı açıklamasını analiz ederek
    kategori, ürün çeşidi ve teknik özellikleri belirler.

    Args:
        image_paths: Ürün fotoğraflarının dosya yolları (virgülle ayrılmış).
                     Örnek: "/path/img1.jpg, /path/img2.jpg"
        user_description: Kullanıcının ürün hakkındaki açıklaması.
    """
    paths = [p.strip() for p in image_paths.split(",") if p.strip()]

    # ── Kategori ve ürün çeşidi bilgilerini al ──
    category_names, product_types = _get_categories_and_types()

    types_text = ""
    for cat, types in product_types.items():
        types_text += f"  {cat}: {', '.join(types)}\n"

    prompt_text = ANALYSIS_PROMPT.format(
        categories=", ".join(category_names),
        product_types=types_text if types_text else "Bilgi yok",
        user_description=user_description,
    )

    # ── Görselleri hazırla ──
    has_valid_images = False
    content: list[dict[str, Any]] = []

    for path in paths:
        if not os.path.exists(path):
            continue
        try:
            data, mime_type = _encode_image(path)
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{data}"},
            })
            has_valid_images = True
        except Exception as e:
            logger.warning("Görsel okunamadı: %s — %s", path, str(e))

    content.append({"type": "text", "text": prompt_text})

    # ── LLM seçimi: görsel varsa Gemini, yoksa Groq ──
    if has_valid_images and GOOGLE_API_KEY:
        logger.info("Görsel analiz: Google Gemini kullanılıyor")
        llm = get_google_llm()
    else:
        logger.info("Metin analiz: Groq kullanılıyor")
        llm = get_groq_llm()
        # Groq için sadece text content gönder (vision desteklemez)
        content = [{"type": "text", "text": prompt_text}]

    try:
        response = invoke_with_retry(llm.invoke, [HumanMessage(content=content)])
        result_text = response.content

        # JSON bloğunu ayıkla
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(result_text)
        return json.dumps(parsed, ensure_ascii=False, indent=2)

    except json.JSONDecodeError:
        return json.dumps({
            "error": "Model yanıtı JSON olarak parse edilemedi",
            "raw_response": result_text[:2000] if 'result_text' in dir() else "Yanıt alınamadı",
            "category": None,
            "product_type": None,
        }, ensure_ascii=False)
    except Exception as e:
        # Gemini başarısız olursa Groq ile tekrar dene (sadece metin)
        if has_valid_images:
            logger.warning("Gemini başarısız, Groq ile metin analizi deneniyor: %s", str(e)[:100])
            try:
                llm = get_groq_llm()
                text_content = [{"type": "text", "text": prompt_text}]
                response = invoke_with_retry(llm.invoke, [HumanMessage(content=text_content)])
                result_text = response.content
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                parsed = json.loads(result_text)
                return json.dumps(parsed, ensure_ascii=False, indent=2)
            except Exception as e2:
                return json.dumps({
                    "error": f"Analiz hatası (Groq fallback): {str(e2)}",
                    "category": None,
                    "product_type": None,
                }, ensure_ascii=False)

        return json.dumps({
            "error": f"Multimodal analiz hatası: {str(e)}",
            "category": None,
            "product_type": None,
        }, ensure_ascii=False)
