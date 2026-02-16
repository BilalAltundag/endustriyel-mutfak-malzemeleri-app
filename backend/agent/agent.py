"""
Product Analysis Agent — Direct Pipeline
─────────────────────────────────────────────────────────────
Tek LLM çağrısı ile ürün analizi + form oluşturma.

Akış (toplam 1 LLM çağrısı):
  1. [Python] Şema bilgisini al (DB + product_specs)
  2. [LLM]   Açıklama + şema → doldurulmuş form JSON
  3. [Python] Form doğrulama (validator)

Önceki ReAct agent 7+ API çağrısı yapıyordu.
Bu pipeline tek çağrı ile aynı sonucu üretir.
"""
import json
import logging
from typing import Any, Optional

from langchain_core.messages import HumanMessage

from agent.config import (
    GOOGLE_MODEL,
    GOOGLE_MODEL_FALLBACK,
    configure_langsmith,
    get_google_llm,
)
from agent.retry import invoke_with_retry, is_rate_limit_error

logger = logging.getLogger(__name__)

# ─── Frontend CATEGORY_TEMPLATES — AI'ın kullanacağı alan adları ───
# Frontend'teki formun EXACT alan adlarını kullanmalıyız
FRONTEND_CATEGORY_FIELDS: dict[str, dict] = {
    "Kazanlar": {
        "types": ["buhar_kazani", "cift_cidarli_kazan", "tencere_kazan", "cay_kazani", "corba_kazani"],
        "fields": ["capacity_liters", "energy_type", "diameter_cm", "height_cm"],
        "energy_options": ["Gazlı", "Elektrikli"],
    },
    "Fırınlar": {
        "types": ["konveksiyonlu_firin", "pastane_firini", "pizza_firini", "doner_firini", "tunnel_firin", "rotary_firin"],
        "fields": ["energy_type", "tray_count", "tray_size", "length_cm", "width_cm", "height_cm"],
        "energy_options": ["Gazlı", "Elektrikli"],
    },
    "Ocaklar": {
        "types": ["gazli_ocak", "elektrikli_ocak", "induksiyonlu_ocak", "wok_ocagi", "pasta_ocagi", "krep_ocagi"],
        "fields": ["burner_count", "energy_type", "length_cm", "width_cm", "height_cm"],
        "energy_options": ["Gazlı", "Elektrikli", "İndüksiyon"],
    },
    "Buzdolapları": {
        "types": ["tek_kapili_buzdolabi", "cift_kapili_buzdolabi", "dikey_donduruculu_buzdolabi", "soklama_buzdolabi", "vitrini_buzdolabi"],
        "fields": ["volume_liters", "door_count", "cooling_type", "length_cm", "width_cm", "height_cm"],
        "energy_options": [],
    },
    "Evyeler": {
        "types": ["tek_gozlu_evye", "cift_gozlu_evye", "uc_gozlu_evye", "damlalikli_evye", "kose_evye"],
        "fields": ["length_cm", "width_cm", "height_cm", "depth_cm", "basin_count", "has_drainboard", "thickness_mm"],
        "energy_options": [],
    },
    "Tezgahlar": {
        "types": ["paslanmaz_celik_tezgah", "granit_tezgah", "mermer_tezgah", "kesme_tezgahi", "hazirlik_tezgahi"],
        "fields": ["length_cm", "width_cm", "height_cm", "has_bottom_shelf", "has_backsplash", "thickness_mm"],
        "energy_options": [],
    },
    "Fritözler": {
        "types": ["basincli_fritoz", "klasik_fritoz", "elektrikli_fritoz", "gazli_fritoz"],
        "fields": ["capacity_liters", "energy_type", "tank_count", "length_cm", "width_cm", "height_cm"],
        "energy_options": ["Gazlı", "Elektrikli"],
    },
    "Benmari": {
        "types": ["elektrikli_benmari", "gazli_benmari", "kuru_benmari", "sulu_benmari"],
        "fields": ["compartment_count", "energy_type", "heating_type", "length_cm", "width_cm", "height_cm"],
        "energy_options": ["Elektrikli", "Gazlı"],
    },
}

# ─── Tek adımlık analiz + form prompt'u ───────────────────────
UNIFIED_PROMPT = """Sen endüstriyel mutfak ekipmanları uzmanısın. Kullanıcının ürün açıklamasını analiz edip form verisi oluştur.

## MEVCUT KATEGORİLER VE ÜRÜN ÇEŞİTLERİ
{category_types_desc}

## KULLANICI AÇIKLAMASI
{user_description}

## KURALLAR
1. Sadece açıklamada GEÇEN bilgileri kullan, UYDURMA
2. category_name: Tam olarak yukarıdaki kategori adlarından birini seç
3. product_type_value: Tam olarak yukarıdaki type değerlerinden birini seç (snake_case olanları)
4. extra_specs alanlarında SADECE o kategorinin tanımlı field isimlerini kullan
5. energy_type değerleri: "Gazlı", "Elektrikli" gibi Türkçe (select seçenek)
6. Fiyatları sayı yaz, birim dönüşümü yap
7. Bilmediğin alanları BOŞ BIRAK (null yazma, hiç ekleme)

## ÇIKTI (SADECE JSON)
{{
    "category_name": "Kategori adı (yukarıdakilerden biri)",
    "product_type_value": "urun_tipi_snake_case",
    "name": "Ürün adı",
    "purchase_price": 0,
    "sale_price": 0,
    "negotiation_margin": 0,
    "negotiation_type": "amount",
    "material": "",
    "notes": "",
    "extra_specs": {{
        "alan_adi": "deger"
    }}
}}"""


class ProductAnalysisAgent:
    """AI destekli ürün analiz pipeline'ı.

    Tek LLM çağrısı ile çalışır (ReAct agent yerine).

    Usage::

        agent = ProductAnalysisAgent()
        result = agent.analyze_sync(
            image_paths=["img.jpg"],
            user_description="Tencere kazanı, 100lt, gazlı..."
        )
    """

    def __init__(self) -> None:
        configure_langsmith()
        logger.info("ProductAnalysisAgent başlatıldı (Direct Pipeline). Model: %s", GOOGLE_MODEL)

    def analyze_sync(
        self,
        image_paths: list[str],
        user_description: str,
    ) -> dict[str, Any]:
        """Ürün analizi — tek LLM çağrısı ile.

        1. Kategori tahmin et (keyword matching)
        2. Şema al (product_specs)
        3. LLM: açıklama + şema → form JSON
        4. Doğrulama (validator)
        """
        logger.info(
            "Analiz başlatılıyor. Fotoğraf: %d, Açıklama: %d karakter",
            len(image_paths),
            len(user_description),
        )

        try:
            # ── Adım 1: Kategori ve tür bilgisini hazırla ──
            category_types_desc = ""
            for cat_name, cat_info in FRONTEND_CATEGORY_FIELDS.items():
                types_str = ", ".join(cat_info["types"])
                fields_str = ", ".join(cat_info["fields"])
                energy_str = f" (energy_type seçenekleri: {', '.join(cat_info['energy_options'])})" if cat_info["energy_options"] else ""
                category_types_desc += f"- {cat_name}: types=[{types_str}], fields=[{fields_str}]{energy_str}\n"

            # ── Adım 2: LLM çağrısı — tek seferde form oluştur ──
            prompt = UNIFIED_PROMPT.format(
                category_types_desc=category_types_desc,
                user_description=user_description,
            )

            # Google Gemini Flash ile tek çağrı — fallback zinciri
            models_to_try = [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK]
            raw_text = None
            form = None

            for model_name in models_to_try:
                try:
                    logger.info("Model deneniyor: %s", model_name)
                    llm = get_google_llm(model=model_name)
                    response = invoke_with_retry(
                        llm.invoke,
                        [HumanMessage(content=prompt)],
                    )
                    raw_text = response.content
                    form = self._extract_json(raw_text)
                    if form:
                        logger.info("Başarılı model: %s", model_name)
                        break
                except Exception as e:
                    if is_rate_limit_error(e):
                        logger.warning("Model %s kota aşımı, sonraki deneniyor...", model_name)
                        continue
                    raise

            if not form:
                return {
                    "status": "error",
                    "product_form": None,
                    "warnings": [],
                    "errors": ["LLM yanıtından geçerli JSON çıkarılamadı"],
                }

            # ── Adım 3: Sonucu frontend-uyumlu formata dönüştür ──
            category_name = form.get("category_name", "")
            product_type_value = form.get("product_type_value", "")
            extra_specs = form.get("extra_specs", {})

            warnings = []

            # Fiyat default'ları
            purchase_price = form.get("purchase_price")
            sale_price = form.get("sale_price")
            if purchase_price is None or purchase_price == "":
                purchase_price = 0
                warnings.append("Alış fiyatı belirtilmemiş — 0 olarak ayarlandı")
            if sale_price is None or sale_price == "":
                sale_price = 0
                warnings.append("Satış fiyatı belirtilmemiş — 0 olarak ayarlandı")

            # Geçersiz extra_specs alanlarını filtrele
            valid_fields = set()
            cat_info = FRONTEND_CATEGORY_FIELDS.get(category_name)
            if cat_info:
                valid_fields = set(cat_info["fields"])

            filtered_specs = {}
            if isinstance(extra_specs, dict):
                for key, val in extra_specs.items():
                    if val is not None and val != "" and val != "null":
                        if not valid_fields or key in valid_fields:
                            filtered_specs[key] = val

            # Frontend'in beklediği format
            result_form = {
                "category_name": category_name,
                "product_type_value": product_type_value,
                "name": form.get("name", ""),
                "purchase_price": purchase_price,
                "sale_price": sale_price,
                "negotiation_margin": form.get("negotiation_margin", 0),
                "negotiation_type": form.get("negotiation_type", "amount"),
                "material": form.get("material", ""),
                "notes": form.get("notes", ""),
                "extra_specs": filtered_specs,
            }

            return {
                "status": "success",
                "product_form": result_form,
                "warnings": warnings,
                "errors": [],
            }

        except Exception as e:
            logger.error("Analiz hatası: %s", str(e), exc_info=True)
            error_msg = (
                "API kota limiti aşıldı. Birkaç dakika bekleyip tekrar deneyin."
                if is_rate_limit_error(e)
                else f"Analiz hatası: {str(e)}"
            )
            return {
                "status": "error",
                "product_form": None,
                "warnings": [],
                "errors": [error_msg],
            }

    def _extract_json(self, text: str) -> Optional[dict]:
        """Metin içinden JSON bloğunu ayıkla."""
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

        # Doğrudan JSON dene
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Son çare: { ... } bloğunu bul
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            return json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return None
