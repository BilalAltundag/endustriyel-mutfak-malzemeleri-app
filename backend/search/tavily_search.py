"""
Tavily Web Search
─────────────────────────────────────────
Tavily API ile ürün arama ve fiyat araştırma.
Facebook Marketplace bireysel ilan linkleri + çoklu kaynak desteği.
"""
import logging
import os
import re
from typing import Optional
from urllib.parse import quote

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
    """Metin içinden TL/TRY fiyat çıkarır: ₺7.100 -> 7100, TRY5,750 -> 5750"""
    if not text:
        return 0.0
    patterns = [
        r"TRY\s?([\d,. ]+)",
        r"(\d{1,3}(?:\.\d{3})+)\s*(?:TL|₺)",
        r"(?:TL|₺)\s*(\d{1,3}(?:\.\d{3})+)",
        r"(\d{1,3}(?:\.\d{3})+)\s*(?:tl|lira)",
        r"(\d+[\.,]?\d*)\s*(?:TL|₺|tl|lira)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            s = match.group(1).strip()
            s = s.replace(" ", "").replace(",", "")
            if re.match(r"^\d{1,3}(\.\d{3})+$", s):
                s = s.replace(".", "")
            else:
                s = s.replace(".", "")
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
    combined = re.findall(
        r"(?:TRY\s?)([\d,. ]+)|(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(?:TL|₺|tl|lira)",
        text,
        re.IGNORECASE,
    )
    for groups in combined:
        raw = groups[0] or groups[1]
        if not raw:
            continue
        s = raw.strip().replace(" ", "").replace(",", "")
        if re.match(r"^\d{1,3}(\.\d{3})+$", s):
            s = s.replace(".", "")
        else:
            s = s.replace(".", "")
        try:
            val = float(s)
            if val >= MIN_REAL_PRICE_TL:
                prices.append(val)
        except ValueError:
            continue
    return prices


def _extract_location_from_text(text: str) -> str:
    """Facebook Marketplace ilan metninden konum bilgisi çıkarır."""
    location_pattern = r"(?:in|[-–])\s+([A-ZÇĞİÖŞÜa-zçğıöşü]+(?:\s*,\s*[A-ZÇĞİÖŞÜa-zçğıöşü]+)*)"
    m = re.search(location_pattern, text)
    if m:
        loc = m.group(1).strip()
        if len(loc) > 2 and loc.lower() not in ("facebook", "marketplace", "stock", "item"):
            return loc
    return ""


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


# ─── Facebook Marketplace özel arama ─────────────────────────────


def search_facebook_marketplace(
    query: str,
    location: str = "İzmir",
    max_results: int = 20,
) -> list[dict]:
    """
    Facebook Marketplace'te bireysel ilan araması.
    site:facebook.com/marketplace filtresi ile sadece FB sonuçları döner.
    Her sonuç: {"title", "price", "url", "location", "description", "is_individual"}
    """
    search_queries = [
        f"{query} site:facebook.com/marketplace",
        f"{query} {location} site:facebook.com/marketplace",
    ]

    all_results = []
    seen_urls = set()

    for sq in search_queries:
        try:
            results = search_web(query=sq, max_results=max_results, search_depth="advanced")
            for r in results:
                url = r.get("url", "")
                clean_url = url.split("?")[0]
                if clean_url in seen_urls:
                    continue
                seen_urls.add(clean_url)
                all_results.append(r)
        except Exception as e:
            logger.warning("FB Marketplace search failed: %s", e)
            continue

    listings = []
    for r in all_results:
        url = r.get("url", "")
        title = r.get("title", "")
        content = r.get("content", "")
        full_text = f"{title} {content}"

        is_individual = "/marketplace/item/" in url
        price = _parse_price(full_text)
        detected_location = _extract_location_from_text(title) or location

        listings.append({
            "title": title,
            "price": price,
            "url": url,
            "location": detected_location,
            "description": content[:300] if content else "",
            "is_individual": is_individual,
        })

    individual = [l for l in listings if l["is_individual"]]
    pages = [l for l in listings if not l["is_individual"]]

    logger.info(
        "FB Marketplace: %d total, %d individual items, %d category pages",
        len(listings), len(individual), len(pages),
    )

    return individual + pages


# ─── Genel ürün arama (çoklu kaynak) ─────────────────────────────


def search_product_listings(
    query: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> list[dict]:
    """
    Önce Facebook Marketplace'te arar, sonra diğer kaynaklardan tamamlar.
    Sonuç formatı: [{"title", "price", "url", "location", "description"}]
    """
    fb_listings = search_facebook_marketplace(query=query, location=location, max_results=15)

    time_label_map = {
        "24_hours": "son 24 saat",
        "7_days": "son 7 gün",
        "30_days": "son 30 gün",
    }
    time_label = time_label_map.get(time_period, "")
    other_query = f"{query} ikinci el satılık {location} {time_label} fiyat TL"

    logger.info("Tavily multi-source search: '%s'", other_query)

    try:
        other_results = search_web(
            query=other_query,
            max_results=10,
            search_depth="advanced",
            exclude_domains=["facebook.com"],
        )
    except Exception:
        other_results = []

    seen_urls = {l["url"].split("?")[0] for l in fb_listings}
    other_listings = []
    for r in other_results:
        url = r.get("url", "")
        if url.split("?")[0] in seen_urls:
            continue
        title = r.get("title", "")
        content = r.get("content", "")
        price = _parse_price(f"{title} {content}")
        other_listings.append({
            "title": title,
            "price": price,
            "url": url,
            "location": location,
            "description": content[:300] if content else "",
            "is_individual": False,
            "source": "web",
        })

    for l in fb_listings:
        l["source"] = "facebook"

    return fb_listings + other_listings


# ─── Fiyat araştırma ─────────────────────────────────────────────


def search_product_prices(
    product_name: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> list[dict]:
    """
    Fiyat araştırması: FB Marketplace + web kaynakları.
    """
    fb_results = search_facebook_marketplace(
        query=product_name, location=location, max_results=15,
    )

    time_label_map = {
        "24_hours": "son 24 saat",
        "7_days": "son 7 gün",
        "30_days": "son 30 gün",
    }
    time_label = time_label_map.get(time_period, "")

    web_query = f"{product_name} ikinci el fiyat {location} {time_label} TL satılık"
    try:
        web_results = search_web(
            query=web_query, max_results=10, search_depth="advanced",
            exclude_domains=["facebook.com"],
        )
    except Exception:
        web_results = []

    all_results = []
    seen_urls = set()

    for item in fb_results:
        url = item.get("url", "")
        if url not in seen_urls:
            seen_urls.add(url)
            all_results.append({
                "title": item.get("title", ""),
                "url": url,
                "content": item.get("description", ""),
                "source": "facebook",
            })

    for item in web_results:
        url = item.get("url", "")
        if url not in seen_urls:
            seen_urls.add(url)
            all_results.append({**item, "source": "web"})

    return all_results
