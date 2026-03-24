"""
Tavily Web Search
─────────────────────────────────────────
Tavily API ile ürün arama ve fiyat araştırma.
Playwright/browser-use yerine kullanılır — tarayıcı gerektirmez.
Birden fazla kaynaktan sonuç getirir (sahibinden, letgo, facebook, hepsiburada, vs.).
"""
import json
import logging
import os
import re
from typing import Optional

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

logger = logging.getLogger(__name__)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

MIN_REAL_PRICE_TL = 50


def _get_client() -> TavilyClient:
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY ortam değişkeni ayarlanmamış")
    return TavilyClient(api_key=TAVILY_API_KEY)


def _normalize_turkish(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğÂâÎîÛû", "IiSsCcUuOoGgAaIiUu")
    return text.translate(tr_map).lower().strip()


def _title_matches_query(title: str, query: str) -> bool:
    norm_title = _normalize_turkish(title)
    for word in query.strip().split():
        norm_word = _normalize_turkish(word)
        if len(norm_word) < 2:
            continue
        if norm_word in norm_title:
            return True
    return False


def _parse_price(text: str) -> float:
    """Metin içinden TL fiyat çıkarır: ₺7.100 -> 7100, 15.000 TL -> 15000"""
    if not text:
        return 0.0
    patterns = [
        r"(\d{1,3}(?:\.\d{3})+)\s*(?:TL|₺)",
        r"(?:TL|₺)\s*(\d{1,3}(?:\.\d{3})+)",
        r"(\d{1,3}(?:\.\d{3})+)\s*(?:tl|lira)",
        r"(\d+[\.,]?\d*)\s*(?:TL|₺|tl|lira)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            s = match.group(1)
            if re.match(r"^\d{1,3}(\.\d{3})+$", s):
                s = s.replace(".", "")
            else:
                s = s.replace(".", "").replace(",", ".")
            try:
                val = float(s)
                if val >= MIN_REAL_PRICE_TL:
                    return val
            except ValueError:
                continue
    return 0.0


def _extract_prices_from_text(text: str) -> list[float]:
    """Metin bloğundan tüm geçerli TL fiyatlarını çıkarır."""
    prices = []
    all_patterns = re.findall(
        r"(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(?:TL|₺|tl|lira)",
        text,
        re.IGNORECASE,
    )
    for raw in all_patterns:
        s = raw
        if re.match(r"^\d{1,3}(\.\d{3})+$", s):
            s = s.replace(".", "")
        else:
            s = s.replace(".", "").replace(",", ".")
        try:
            val = float(s)
            if val >= MIN_REAL_PRICE_TL:
                prices.append(val)
        except ValueError:
            continue
    return prices


def search_web(
    query: str,
    max_results: int = 20,
    search_depth: str = "advanced",
    include_domains: Optional[list[str]] = None,
    exclude_domains: Optional[list[str]] = None,
) -> list[dict]:
    """
    Tavily ile genel web araması yapar.
    Dönen her sonuç: {"title", "url", "content", "score"}
    """
    client = _get_client()
    kwargs = {
        "query": query,
        "max_results": max_results,
        "search_depth": search_depth,
    }
    if include_domains:
        kwargs["include_domains"] = include_domains
    if exclude_domains:
        kwargs["exclude_domains"] = exclude_domains

    try:
        response = client.search(**kwargs)
        return response.get("results", [])
    except Exception as e:
        logger.error("Tavily search error: %s", e, exc_info=True)
        raise


def search_product_listings(
    query: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> list[dict]:
    """
    Ürün ilanı araması yapar. Birden fazla kaynak tarar.
    Sonuç formatı: [{"title", "price", "url", "location", "description"}]
    """
    time_label_map = {
        "24_hours": "son 24 saat",
        "7_days": "son 7 gün",
        "30_days": "son 30 gün",
    }
    time_label = time_label_map.get(time_period, "")

    search_query = f"{query} ikinci el satılık {location} {time_label} fiyat TL"

    logger.info("Tavily product search: '%s'", search_query)

    results = search_web(
        query=search_query,
        max_results=20,
        search_depth="advanced",
    )

    listings = []
    for r in results:
        title = r.get("title", "")
        content = r.get("content", "")
        url = r.get("url", "")
        full_text = f"{title} {content}"

        price = _parse_price(full_text)

        listing = {
            "title": title,
            "price": price,
            "url": url,
            "location": location,
            "description": content[:300] if content else "",
        }
        listings.append(listing)

    return listings


def search_product_prices(
    product_name: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> list[dict]:
    """
    Fiyat araştırması için optimize edilmiş arama.
    Fiyat içeren sonuçlara odaklanır.
    """
    time_label_map = {
        "24_hours": "son 24 saat",
        "7_days": "son 7 gün",
        "30_days": "son 30 gün",
    }
    time_label = time_label_map.get(time_period, "")

    queries = [
        f"{product_name} ikinci el fiyat {location} {time_label} TL satılık",
        f"{product_name} 2.el fiyatları {location} ne kadar",
    ]

    all_results = []
    seen_urls = set()

    for q in queries:
        try:
            results = search_web(query=q, max_results=15, search_depth="advanced")
            for r in results:
                url = r.get("url", "")
                if url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)
        except Exception as e:
            logger.warning("Tavily price search query failed: %s", e)
            continue

    return all_results
