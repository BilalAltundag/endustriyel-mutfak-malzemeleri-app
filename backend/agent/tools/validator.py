"""
Tool 4 — Validator
─────────────────────────────────────────────────────────────
Girdi  : doldurulmuş ürün formu (JSON)
Çıktı  : doğrulama sonucu (geçerli/geçersiz + hata detayları)

Kural tabanlı JSON şema kontrolü yapar.
LLM çağrısı yapmaz — saf mantık ile doğrulama.
"""
import json
from typing import Any

from langchain_core.tools import tool


# ─── Doğrulama Kuralları ──────────────────────────────────────

REQUIRED_PRODUCT_FIELDS = ["name"]

PRICE_FIELDS = ["purchase_price", "sale_price", "negotiation_margin"]

VALID_STATUS = ["working", "broken", "repair"]
VALID_STOCK_STATUS = ["available", "sold", "reserved"]
VALID_NEGOTIATION_TYPE = ["amount", "percentage"]
VALID_CONDITIONS = ["sıfır", "ikinci el", "yenilenmiş"]

# Tip doğrulama haritası
TYPE_VALIDATORS: dict[str, type | tuple[type, ...]] = {
    "string": (str,),
    "number": (int, float),
    "integer": (int,),
    "boolean": (bool,),
}


def _validate_field_type(value: Any, expected_type: str) -> bool:
    """Değerin beklenen tipte olup olmadığını kontrol et."""
    if value is None:
        return True  # null her zaman geçerli
    valid_types = TYPE_VALIDATORS.get(expected_type)
    if not valid_types:
        return True  # bilinmeyen tip, kabul et
    return isinstance(value, valid_types)


def _validate_product_data(product_data: dict[str, Any], extra_specs: dict[str, Any] | None = None) -> tuple[list[str], list[str]]:
    """Genel ürün alanlarını doğrula."""
    errors: list[str] = []
    warnings: list[str] = []

    # 1. Zorunlu alanlar
    for field in REQUIRED_PRODUCT_FIELDS:
        if field not in product_data or product_data[field] is None:
            # name alanı yoksa otomatik oluştur
            if field == "name":
                auto_name_parts = []
                if product_data.get("product_type"):
                    auto_name_parts.append(str(product_data["product_type"]))
                if extra_specs and extra_specs.get("brand"):
                    auto_name_parts.insert(0, str(extra_specs["brand"]))
                if auto_name_parts:
                    product_data["name"] = " ".join(auto_name_parts)
                    warnings.append(f"Ürün adı otomatik oluşturuldu: '{product_data['name']}' — düzenlemeniz önerilir")
                else:
                    warnings.append(f"Zorunlu alan eksik: {field} — kullanıcı tarafından girilmeli")
            else:
                warnings.append(f"Zorunlu alan eksik: {field} — kullanıcı tarafından girilmeli")
        elif isinstance(product_data[field], str) and not product_data[field].strip():
            warnings.append(f"Zorunlu alan boş: {field} — kullanıcı tarafından girilmeli")

    # 2. Fiyat kontrolleri
    for price_field in ["purchase_price", "sale_price"]:
        val = product_data.get(price_field)
        if val is not None:
            if not isinstance(val, (int, float)):
                errors.append(f"{price_field} sayısal bir değer olmalıdır")
            elif val < 0:
                errors.append(f"{price_field} negatif olamaz")
        else:
            warnings.append(f"{price_field} belirtilmemiş — kullanıcıdan istenecek")

    # negotiation_margin
    margin = product_data.get("negotiation_margin")
    if margin is not None and isinstance(margin, (int, float)) and margin < 0:
        errors.append("negotiation_margin negatif olamaz")

    # 3. Enum alanları
    status = product_data.get("status")
    if status is not None and status not in VALID_STATUS:
        errors.append(f"Geçersiz status değeri: '{status}'. Geçerli: {VALID_STATUS}")

    stock_status = product_data.get("stock_status")
    if stock_status is not None and stock_status not in VALID_STOCK_STATUS:
        errors.append(
            f"Geçersiz stock_status değeri: '{stock_status}'. Geçerli: {VALID_STOCK_STATUS}"
        )

    negotiation_type = product_data.get("negotiation_type")
    if negotiation_type is not None and negotiation_type not in VALID_NEGOTIATION_TYPE:
        errors.append(
            f"Geçersiz negotiation_type: '{negotiation_type}'. "
            f"Geçerli: {VALID_NEGOTIATION_TYPE}"
        )

    # 4. Mantıksal kontroller
    purchase = product_data.get("purchase_price")
    sale = product_data.get("sale_price")
    if (
        purchase is not None
        and sale is not None
        and isinstance(purchase, (int, float))
        and isinstance(sale, (int, float))
    ):
        if sale < purchase:
            warnings.append(
                f"Satış fiyatı ({sale}) alış fiyatından ({purchase}) düşük — emin misiniz?"
            )

    # 5. category_id tipi
    cat_id = product_data.get("category_id")
    if cat_id is not None and not isinstance(cat_id, int):
        errors.append("category_id integer olmalıdır")

    return errors, warnings


def _validate_extra_specs(extra_specs: dict[str, Any]) -> tuple[list[str], list[str]]:
    """Teknik alanları (extra_specs) doğrula."""
    errors: list[str] = []
    warnings: list[str] = []

    if not extra_specs or not isinstance(extra_specs, dict):
        return errors, warnings

    for key, value in extra_specs.items():
        if value is None:
            continue  # null değerler OK

        # Boyut alanları pozitif olmalı
        if key.endswith("_cm") or key.endswith("_kg") or key.endswith("_lt"):
            if isinstance(value, (int, float)) and value <= 0:
                warnings.append(f"{key} değeri pozitif olmalıdır (şu an: {value})")

        # Sayı alanları
        if key.endswith("_count") and value is not None:
            if not isinstance(value, int):
                errors.append(f"{key} tam sayı (integer) olmalıdır")
            elif value < 0:
                errors.append(f"{key} negatif olamaz")

        # Yıl alanı
        if key == "production_year" and value is not None:
            if isinstance(value, int) and (value < 1950 or value > 2030):
                warnings.append(f"Üretim yılı şüpheli: {value}")

    return errors, warnings


def _validate_confidence(field_confidence: dict[str, str]) -> list[str]:
    """Confidence değerlerini kontrol et, düşük olanları uyarı listesine al."""
    low_confidence_fields: list[str] = []

    if not field_confidence or not isinstance(field_confidence, dict):
        return low_confidence_fields

    for field, confidence in field_confidence.items():
        if confidence == "low":
            low_confidence_fields.append(field)

    return low_confidence_fields


@tool
def validate_product_form(product_form_json: str) -> str:
    """Oluşturulan ürün formunu veritabanı şemasına göre doğrular.

    Kontrol edilen kurallar:
    - Zorunlu alanların varlığı (name, fiyatlar)
    - Veri tipi uyumluluğu
    - Enum değerlerinin geçerliliği
    - Mantıksal tutarlılık (satış > alış fiyatı)
    - Teknik alan değerlerinin geçerliliği
    - Düşük confidence değerli alanlar

    Geçerli ise backend'e gönderilmeye hazır form döner.

    Args:
        product_form_json: map_to_product_form aracından dönen JSON string.
    """
    # ── JSON parse ──
    try:
        form = json.loads(product_form_json)
    except json.JSONDecodeError as e:
        return json.dumps({
            "valid": False,
            "errors": [f"JSON parse hatası: {str(e)}"],
            "warnings": [],
            "validated_form": None,
        }, ensure_ascii=False, indent=2)

    all_errors: list[str] = []
    all_warnings: list[str] = []

    # ── Form yapısını kontrol et ──
    # Agent formatı: {"product_data": {...}, "extra_specs": {...}}
    # Alternatif format: doğrudan {"name": "...", "purchase_price": ...}
    product_data = form.get("product_data", {})
    extra_specs = form.get("extra_specs", {})
    field_confidence = form.get("field_confidence", {})

    if not product_data:
        # Alternatif: form doğrudan product verisi içeriyor olabilir
        if "name" in form or "purchase_price" in form or "sale_price" in form:
            product_data = {
                k: v for k, v in form.items()
                if k not in ("extra_specs", "field_confidence", "unmapped_info", "needs_user_input")
            }
        else:
            return json.dumps({
                "valid": False,
                "errors": ["product_data alanı bulunamadı"],
                "warnings": [],
                "validated_form": None,
            }, ensure_ascii=False, indent=2)

    # ── 1. Genel alan doğrulama ──
    errors, warnings = _validate_product_data(product_data, extra_specs)
    all_errors.extend(errors)
    all_warnings.extend(warnings)

    # ── 2. Teknik alan doğrulama ──
    errors, warnings = _validate_extra_specs(extra_specs)
    all_errors.extend(errors)
    all_warnings.extend(warnings)

    # ── 3. Confidence kontrolü ──
    low_confidence = _validate_confidence(field_confidence)
    if low_confidence:
        all_warnings.append(
            f"Düşük güvenilirlikli alanlar (kullanıcıya sorulmalı): {low_confidence}"
        )

    # ── 4. Kullanıcı onayı gereken bilgiler ──
    needs_user_input = form.get("needs_user_input", [])
    if needs_user_input:
        all_warnings.append(
            f"Kullanıcıdan istenecek bilgiler: {needs_user_input}"
        )

    # ── Backend'e gönderilecek form ──
    is_valid = len(all_errors) == 0

    validated_form = None
    if is_valid:
        # Backend'e uygun yapı oluştur
        validated_form = {
            **product_data,
            "extra_specs": extra_specs if extra_specs else None,
        }

        # null olan fiyatlara 0 ata (DB zorunlu)
        if validated_form.get("purchase_price") is None:
            validated_form["purchase_price"] = 0.0
            all_warnings.append("purchase_price 0 olarak ayarlandı — güncelleme gerekli")
        if validated_form.get("sale_price") is None:
            validated_form["sale_price"] = 0.0
            all_warnings.append("sale_price 0 olarak ayarlandı — güncelleme gerekli")

    return json.dumps({
        "valid": is_valid,
        "errors": all_errors,
        "warnings": all_warnings,
        "low_confidence_fields": low_confidence,
        "needs_user_input": needs_user_input,
        "validated_form": validated_form,
        "field_confidence": field_confidence,
    }, ensure_ascii=False, indent=2)
