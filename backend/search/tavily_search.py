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
MAX_REAL_PRICE_TL = 150_000


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


def _extract_location_from_title(title: str) -> str:
    """
    Facebook Marketplace ilan başlığından konum çıkarır.
    Tipik format: "Ürün adı - Kategori - Şehir, Ülke | Facebook Marketplace"
    """
    cleaned = re.sub(r"\s*\|\s*Facebook.*$", "", title, flags=re.IGNORECASE)
    parts = re.split(r"\s*[-–]\s*", cleaned)
    if len(parts) >= 3:
        candidate = parts[-1].strip()
        candidate = re.sub(r",\s*Turkey$", "", candidate, flags=re.IGNORECASE).strip()
        skip_words = {"facebook", "marketplace", "stock", "item", "sale", "buy", "sell"}
        if len(candidate) > 2 and candidate.lower() not in skip_words:
            return candidate
    turkey_match = re.search(
        r"[-–]\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+(?:\s*,\s*[A-ZÇĞİÖŞÜa-zçğıöşü]+)?)\s*,\s*(?:Turkey|Türkiye|T[uü]rkei)",
        title,
        re.IGNORECASE,
    )
    if turkey_match:
        return turkey_match.group(1).strip()
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


def _location_matches(text: str, target_city: str) -> bool:
    """Metin içinde hedef şehir var mı kontrol eder (Türkçe karakter toleranslı)."""
    norm_text = _normalize_turkish(text)
    norm_city = _normalize_turkish(target_city)
    return norm_city in norm_text


def _is_price_valid(price: float) -> bool:
    """Fiyat geçerli aralıkta mı? 0 = fiyat yok (kabul edilir), 1-49 = sahte, >150K = uçuk."""
    if price == 0.0:
        return True
    return MIN_REAL_PRICE_TL <= price <= MAX_REAL_PRICE_TL


def _extract_item_id(url: str) -> str:
    """Facebook marketplace item ID'sini URL'den çıkarır (dedup için)."""
    m = re.search(r"/marketplace/item/(\d+)", url)
    return m.group(1) if m else ""


def search_facebook_marketplace(
    query: str,
    location: str = "İzmir",
    max_results: int = 20,
) -> list[dict]:
    """
    Facebook Marketplace'te bireysel ilan araması.
    Filtreler:
      - Sadece /marketplace/item/ URL'leri (bireysel ilanlar)
      - Fiyat: 50-150K TL arası (0 = bilinmiyor, kabul edilir)
      - Başlık sorguyla eşleşmeli
      - Konum: hedef şehirden olanlar öne alınır
      - Dedup: aynı item ID tekrarlanmaz
    """
    search_queries = [
        f"{query} {location} site:facebook.com/marketplace",
        f"{query} site:facebook.com/marketplace",
    ]

    all_results = []
    seen_item_ids = set()

    for sq in search_queries:
        try:
            results = search_web(query=sq, max_results=max_results, search_depth="advanced")
            for r in results:
                url = r.get("url", "")
                item_id = _extract_item_id(url)
                if item_id:
                    if item_id in seen_item_ids:
                        continue
                    seen_item_ids.add(item_id)
                else:
                    clean_url = url.split("?")[0]
                    if clean_url in seen_item_ids:
                        continue
                    seen_item_ids.add(clean_url)
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
        detected_location = _extract_location_from_title(title) or ""

        if not _is_price_valid(price):
            continue

        in_target_city = _location_matches(full_text, location)

        listings.append({
            "title": title,
            "price": price,
            "url": url,
            "location": detected_location or location,
            "description": content[:300] if content else "",
            "is_individual": is_individual,
            "in_target_city": in_target_city,
        })

    individual = [l for l in listings if l["is_individual"]]
    pages = [l for l in listings if not l["is_individual"]]

    local_items = [l for l in individual if l.get("in_target_city")]
    other_items = [l for l in individual if not l.get("in_target_city")]
    sorted_listings = local_items + other_items + pages

    logger.info(
        "FB Marketplace: %d raw -> %d filtered (%d items: %d local, %d other, %d pages)",
        len(all_results), len(listings), len(individual),
        len(local_items), len(other_items), len(pages),
    )

    return sorted_listings


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
