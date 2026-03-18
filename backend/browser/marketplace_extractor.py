"""
Gemini ile HTML'den Marketplace ilanları çıkarma
────────────────────────────────────────────────
Playwright'tan gelen HTML'i tek LLM çağrısıyla JSON'a dönüştürür.
"""
import json
import logging
import re
import sys
import os

# backend root'tan import için
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """Bu HTML, Facebook Marketplace arama sonuç sayfasından alındı.
Sorgu: "{query}"

Görevin: Sayfadaki TÜM ürün ilan kartlarını çıkar. Her ilan için:
- title: İlan başlığı (tam metin)
- price: Fiyat sayı olarak (TL işareti ve noktaları kaldır: ₺7.100 = 7100, Ücretsiz = 0)
- url: İlan linki (tam URL veya /marketplace/... path)
- location: Şehir/ilçe bilgisi
- description: Varsa kısa açıklama

Çıktı SADECE şu formatta JSON olsun, başka metin ekleme:
{{"listings": [{{"title":"...","price":7100,"url":"...","location":"...","description":"..."}}]}}

İlan yoksa: {{"listings": []}}

HTML:
{html}
"""


def _is_rate_limit_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "resource_exhausted" in msg or "quota" in msg or "rate limit" in msg


def _extract_json_from_text(text: str) -> str:
    """Metinden JSON blob'unu çıkarır."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```\w*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return match.group()
    return "{}"


async def extract_listings_from_html(
    html: str,
    query: str,
) -> dict:
    """
    HTML'i Gemini'ye gönderir, ilan listesi döner.
    Flash → Flash-Lite fallback ile rate limit yönetimi.
    """
    from agent.config import GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK, get_google_llm

    models_to_try = [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK]
    last_error = None

    prompt = EXTRACTION_PROMPT.format(query=query, html=html[:150_000])

    for model_name in models_to_try:
        try:
            llm = get_google_llm(model=model_name)
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content if hasattr(response, "content") else str(response)
            raw = _extract_json_from_text(content)
            data = json.loads(raw)
            if isinstance(data, dict) and "listings" in data:
                return data
            return {"listings": []}
        except Exception as e:
            last_error = e
            if _is_rate_limit_error(e):
                logger.warning("Model %s kota aşımı, fallback deneniyor...", model_name)
                continue
            logger.error("Extraction error: %s", e, exc_info=True)
            raise

    raise last_error or RuntimeError("Tüm modeller başarısız")
