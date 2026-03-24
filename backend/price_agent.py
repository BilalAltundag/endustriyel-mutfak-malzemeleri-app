"""
Price Research Agent (Tavily + Gemini)
──────────────────────────────────────────
Tavily API ile web'de fiyat araştırması yapar.
Gemini ile sonuçlardan yapılandırılmış fiyat verisi çıkarır.
LangSmith "fiyatarama" projesiyle izlenir.
"""
import json
import os
import re
import logging
import uuid
from datetime import datetime

from dotenv import load_dotenv
from langsmith import Client as LangSmithClient

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LANGSMITH_PRICE_API_KEY = os.getenv("LANGSMITH_PRICE_API_KEY")
LANGSMITH_PRICE_PROJECT = os.getenv("LANGSMITH_PRICE_PROJECT", "fiyatarama")

ls_client = None
if LANGSMITH_PRICE_API_KEY:
    ls_client = LangSmithClient(
        api_key=LANGSMITH_PRICE_API_KEY,
        api_url="https://api.smith.langchain.com",
    )


async def search_marketplace_prices(
    product_name: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> dict:
    run_id = uuid.uuid4()
    if ls_client:
        ls_client.create_run(
            name="marketplace_price_search",
            run_type="chain",
            project_name=LANGSMITH_PRICE_PROJECT,
            inputs={
                "product_name": product_name,
                "location": location,
                "time_period": time_period,
            },
            start_time=datetime.utcnow(),
            id=run_id,
        )

    try:
        from search.tavily_search import search_product_prices, _extract_prices_from_text
        from agent.config import get_google_llm, GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK

        raw_results = search_product_prices(
            product_name=product_name,
            location=location,
            time_period=time_period,
        )

        if not raw_results:
            empty = _empty_result()
            empty["error"] = "Web aramasında sonuç bulunamadı"
            if run_id and ls_client:
                ls_client.update_run(run_id, outputs=empty, end_time=datetime.utcnow())
            return empty

        search_context = _build_context(raw_results, product_name)

        parsed = await _extract_with_gemini(
            search_context, product_name, location,
            [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK],
        )

        if run_id and ls_client:
            ls_client.update_run(run_id, outputs=parsed, end_time=datetime.utcnow())

        return parsed

    except Exception as e:
        logger.error("Price agent error: %s", str(e), exc_info=True)
        error_result = _empty_result()
        error_result["error"] = str(e)
        if run_id and ls_client:
            ls_client.update_run(
                run_id, outputs=error_result, error=str(e), end_time=datetime.utcnow(),
            )
        return error_result


def _empty_result() -> dict:
    return {
        "min_price": None,
        "max_price": None,
        "avg_price": None,
        "cluster_avg_price": None,
        "listings": [],
        "total_found": 0,
    }


def _build_context(results: list[dict], product_name: str) -> str:
    """Tavily sonuçlarını Gemini'ye göndermek için metin bloğuna çevirir."""
    lines = [f"Ürün: {product_name}\n"]
    for i, r in enumerate(results[:20], 1):
        title = r.get("title", "")
        content = r.get("content", "")[:500]
        url = r.get("url", "")
        lines.append(f"[{i}] {title}\nURL: {url}\n{content}\n")
    return "\n".join(lines)


PRICE_EXTRACTION_PROMPT = """Aşağıdaki web arama sonuçları "{product_name}" ürünü için {location} bölgesindeki ikinci el fiyatları içeriyor.

Bu sonuçlardan TÜM geçerli ürün ilanlarını çıkar. Her ilan için:
- title: İlan başlığı
- price: Fiyat (sayı olarak, TL cinsinden. Türk format: nokta binlik ayracı. ₺7.100 = 7100)
- url: İlan URL'si

KURALLAR:
- Sadece gerçek ikinci el satış ilanlarını dahil et
- 50 TL altı fiyatları atla (sahte/placeholder)
- Ücretsiz/bedava ilanları atla
- Mümkün olduğunca fazla geçerli ilan çıkar

Çıktı SADECE JSON olsun:
{{"listings": [{{"title": "...", "price": 7100, "url": "..."}}]}}

İlan bulunamadıysa: {{"listings": []}}

--- ARAMA SONUÇLARI ---
{context}
"""


async def _extract_with_gemini(
    context: str,
    product_name: str,
    location: str,
    models: list[str],
) -> dict:
    """Gemini ile arama sonuçlarından fiyat verisi çıkarır."""
    from agent.config import get_google_llm
    from langchain_core.messages import HumanMessage

    prompt = PRICE_EXTRACTION_PROMPT.format(
        product_name=product_name,
        location=location,
        context=context,
    )

    last_error = None
    for model_name in models:
        try:
            llm = get_google_llm(model=model_name)
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content if hasattr(response, "content") else str(response)
            return _parse_gemini_result(content, product_name)
        except Exception as e:
            last_error = e
            msg = str(e).lower()
            if "429" in msg or "resource_exhausted" in msg or "quota" in msg:
                logger.warning("Model %s kota aşımı, fallback deneniyor...", model_name)
                continue
            logger.error("Gemini extraction error: %s", e, exc_info=True)
            raise

    if last_error:
        raise last_error
    return _empty_result()


def _parse_gemini_result(text: str, product_name: str) -> dict:
    """Gemini çıktısını yapılandırılmış fiyat verisine çevirir."""
    empty = _empty_result()

    if not text:
        return {**empty, "error": "Gemini boş sonuç döndü"}

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```\w*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)

    data = None
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            try:
                data = json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

    if not data or not isinstance(data, dict):
        return {**empty, "error": f"Sonuç ayrıştırılamadı: {text[:300]}"}

    listings = data.get("listings", [])

    valid_prices = []
    valid_listings = []
    for item in listings:
        price = item.get("price")
        if isinstance(price, str):
            price = price.replace("₺", "").replace("TL", "").strip()
            if re.match(r"^\d{1,3}(\.\d{3})+$", price):
                price = price.replace(".", "")
            else:
                price = re.sub(r"[^\d.]", "", price)
            try:
                price = float(price)
            except ValueError:
                continue
        if price and isinstance(price, (int, float)) and price >= 50:
            url = str(item.get("url", ""))
            valid_prices.append(float(price))
            valid_listings.append({
                "title": str(item.get("title", "")),
                "price": float(price),
                "url": url,
            })

    if valid_prices:
        return {
            "min_price": min(valid_prices),
            "max_price": max(valid_prices),
            "avg_price": round(sum(valid_prices) / len(valid_prices), 2),
            "cluster_avg_price": _cluster_average(valid_prices),
            "listings": valid_listings,
            "total_found": len(valid_listings),
        }

    return {**empty, "error": "Filtreleme sonrası geçerli ilan bulunamadı"}


def _cluster_average(prices: list[float]) -> float | None:
    """IQR yöntemiyle outlier'ları eleyerek yakın fiyatların ortalamasını hesaplar."""
    if len(prices) < 3:
        return round(sum(prices) / len(prices), 2) if prices else None

    sorted_p = sorted(prices)
    n = len(sorted_p)
    q1 = sorted_p[n // 4]
    q3 = sorted_p[(3 * n) // 4]
    iqr = q3 - q1

    if iqr == 0:
        return round(sum(sorted_p) / n, 2)

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    inliers = [p for p in sorted_p if lower <= p <= upper]

    if not inliers:
        return round(sum(sorted_p) / n, 2)

    return round(sum(inliers) / len(inliers), 2)
