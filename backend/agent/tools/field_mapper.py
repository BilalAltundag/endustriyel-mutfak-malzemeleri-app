"""
Tool 3 — Field Mapper
─────────────────────────────────────────────────────────────
Girdi  : multimodal analiz sonucu + ürün şeması
Çıktı  : doldurulmuş ürün formu (JSON)

Groq (Llama 3.3) kullanarak analiz edilen bilgileri şema alanlarına
semantik olarak eşler. Birim dönüşümlerini yapar.
Kanıtı olmayan alanları null bırakır.
"""
import json
import logging
from typing import Any

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage

from agent.config import get_groq_llm
from agent.retry import invoke_with_retry

logger = logging.getLogger(__name__)

# ─── Eşleme Prompt'u ─────────────────────────────────────────
MAPPING_PROMPT = """Sen bir veri eşleme uzmanısın. Görevin, ürün analizinden elde edilen bilgileri
veritabanı şemasına göre doğru alanlara yerleştirmektir.

## ANALİZ SONUCU
{analysis_result}

## ÜRÜN ŞEMASI
### Genel Alanlar (products tablosu):
{general_fields}

### Teknik Alanlar (extra_specs JSON):
{technical_fields}

## KURALLAR

1. **Sadece kanıtı olan alanları doldur** — Analizde bulunmayan bilgiyi UYDURMA
2. **Birim dönüşümü yap** — "2 metre genişliğinde" → width_cm: 200
3. **Doğru tipleri kullan** — number alanına string yazma, boolean alanına true/false kullan
4. **Confidence değeri belirt** — Her doldurulan alan için:
   - "high": Kesin bilgi (açıkça belirtilmiş veya net görünüyor)
   - "medium": Muhtemel (görsellerden çıkarılmış ama kesin değil)
   - "low": Tahmin (belirsiz, kullanıcıya sorulmalı)
5. **Null bırak** — Bilgi yoksa değeri null yap, uydurma
6. **Enum/options alanları** — Tanımlı seçeneklerden birini kullan, yoksa en yakınını seç
7. **Fiyat alanları** — purchase_price ve sale_price 0 olamaz, bilgi yoksa null bırak

## ÇIKTI FORMATI (Sadece JSON döndür)
{{
    "product_data": {{
        "name": "Ürün adı",
        "category_id": null,
        "product_type": "Ürün çeşidi",
        "purchase_price": null,
        "sale_price": null,
        "negotiation_margin": 0,
        "negotiation_type": "amount",
        "material": null,
        "status": "working",
        "stock_status": "available",
        "notes": null
    }},
    "extra_specs": {{
        "width_cm": null,
        "depth_cm": null,
        "height_cm": null,
        "...diğer teknik alanlar...": null
    }},
    "field_confidence": {{
        "name": "high",
        "purchase_price": "medium",
        "...": "..."
    }},
    "unmapped_info": ["Şemaya eşlenemeyen bilgiler"],
    "needs_user_input": ["Kullanıcıdan istenmesi gereken bilgiler"]
}}

Sadece geçerli JSON döndür.
"""


def _format_fields(fields: Any) -> str:
    """Alan tanımlarını okunabilir formata dönüştür.

    Hem dict hem list formatını destekler (agent farklı format aktarabilir).
    """
    if isinstance(fields, str):
        # JSON string gelmişse parse et
        try:
            fields = json.loads(fields)
        except (json.JSONDecodeError, TypeError):
            return fields

    if isinstance(fields, dict):
        lines = []
        for key, spec in fields.items():
            if isinstance(spec, dict):
                parts = [f"  - {key} ({spec.get('type', 'string')}): {spec.get('label', key)}"]
                if "options" in spec:
                    parts.append(f"    Seçenekler: {spec['options']}")
                if "unit" in spec:
                    parts.append(f"    Birim: {spec['unit']}")
                if spec.get("required"):
                    parts.append("    [ZORUNLU]")
                lines.extend(parts)
            else:
                lines.append(f"  - {key}: {spec}")
        return "\n".join(lines)
    elif isinstance(fields, list):
        lines = []
        for item in fields:
            if isinstance(item, dict):
                name = item.get("name", item.get("key", ""))
                label = item.get("label", item.get("description", name))
                ftype = item.get("type", "string")
                lines.append(f"  - {name} ({ftype}): {label}")
            else:
                lines.append(f"  - {item}")
        return "\n".join(lines)
    else:
        return str(fields)


@tool
def map_to_product_form(analysis_result: str, product_schema: str) -> str:
    """Multimodal analiz sonuçlarını veritabanı şemasına eşleyerek
    doldurulmuş ürün formu oluşturur.

    Semantik eşleme yapar: birim dönüşümleri, alan adı eşleştirme,
    confidence değerlendirmesi. Kanıtı olmayan alanlar null kalır.

    Args:
        analysis_result: analyze_product_images aracından dönen JSON string.
        product_schema: fetch_product_schema aracından dönen JSON string.
    """
    try:
        analysis = json.loads(analysis_result)
    except json.JSONDecodeError:
        analysis = {"raw": analysis_result}

    try:
        schema = json.loads(product_schema)
    except json.JSONDecodeError:
        schema = {"raw": product_schema}

    general_fields = schema.get("general_fields", {})
    technical_fields = schema.get("technical_fields", {})
    category_id = schema.get("category_id")

    prompt = MAPPING_PROMPT.format(
        analysis_result=json.dumps(analysis, ensure_ascii=False, indent=2),
        general_fields=_format_fields(general_fields),
        technical_fields=_format_fields(technical_fields),
    )

    llm = get_groq_llm()

    try:
        response = invoke_with_retry(llm.invoke, [HumanMessage(content=prompt)])
        result_text = response.content

        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        form = json.loads(result_text)

        if "product_data" in form and category_id is not None:
            form["product_data"]["category_id"] = category_id

        return json.dumps(form, ensure_ascii=False, indent=2)

    except json.JSONDecodeError:
        return json.dumps({
            "error": "Form oluşturma yanıtı JSON olarak parse edilemedi",
            "raw_response": result_text[:2000] if 'result_text' in dir() else "Yanıt alınamadı",
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "error": f"Alan eşleme hatası: {str(e)}",
        }, ensure_ascii=False)
