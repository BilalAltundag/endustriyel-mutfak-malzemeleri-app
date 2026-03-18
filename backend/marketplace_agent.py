"""
Facebook Marketplace Search Agent
──────────────────────────────────────────
Playwright ile Facebook Marketplace'te serbest metin araması yapar.
Render uyumlu, browser-use yerine dogrudan Playwright kullanir.
Urun basligi, fiyat, link bilgilerini dondurur. Gercek fiyatli ilanlari filtreler.
"""
import os
import logging
import uuid
from datetime import datetime
from contextlib import contextmanager

from dotenv import load_dotenv
from langsmith import Client as LangSmithClient

load_dotenv()

logger = logging.getLogger(__name__)

LANGSMITH_MARKETPLACE_API_KEY = os.getenv("LANGSMITH_MARKETPLACE_API_KEY")
LANGSMITH_MARKETPLACE_PROJECT = os.getenv("LANGSMITH_MARKETPLACE_PROJECT", "marketplace arama")

ls_client = None
if LANGSMITH_MARKETPLACE_API_KEY:
    ls_client = LangSmithClient(
        api_key=LANGSMITH_MARKETPLACE_API_KEY,
        api_url="https://api.smith.langchain.com",
    )


@contextmanager
def _langsmith_env():
    """Agent calisirken LangSmith env'ini marketplace projesine cevirir."""
    old = {
        "LANGSMITH_TRACING": os.environ.get("LANGSMITH_TRACING"),
        "LANGSMITH_ENDPOINT": os.environ.get("LANGSMITH_ENDPOINT"),
        "LANGSMITH_API_KEY": os.environ.get("LANGSMITH_API_KEY"),
        "LANGSMITH_PROJECT": os.environ.get("LANGSMITH_PROJECT"),
    }
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_ENDPOINT"] = "https://api.smith.langchain.com"
    os.environ["LANGSMITH_API_KEY"] = LANGSMITH_MARKETPLACE_API_KEY
    os.environ["LANGSMITH_PROJECT"] = LANGSMITH_MARKETPLACE_PROJECT
    try:
        yield
    finally:
        for k, v in old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def _normalize_turkish(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğÂâÎîÛû", "IiSsCcUuOoGgAaIiUu")
    return text.translate(tr_map).lower().strip()


def _title_matches_query(title: str, query: str) -> bool:
    norm_title = _normalize_turkish(title)
    query_words = query.strip().split()
    for word in query_words:
        norm_word = _normalize_turkish(word)
        if len(norm_word) < 2:
            continue
        if norm_word in norm_title:
            return True
    return False


async def search_marketplace_listings(
    query: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> dict:
    """Facebook Marketplace'te verilen sorguyu arar. Playwright ile (Render uyumlu)."""
    run_id = uuid.uuid4()
    if ls_client:
        ls_client.create_run(
            name="marketplace_listing_search",
            run_type="chain",
            project_name=LANGSMITH_MARKETPLACE_PROJECT,
            inputs={
                "query": query,
                "location": location,
                "time_period": time_period,
            },
            start_time=datetime.utcnow(),
            id=run_id,
        )

    days_map = {"24_hours": 1, "7_days": 7, "30_days": 30}
    days = days_map.get(time_period, 1)

    try:
        def _run_search():
            from browser.playwright_marketplace_search import fetch_marketplace_listings_playwright
            return fetch_marketplace_listings_playwright(
                query=query,
                location=location,
                days=days,
            )

        if LANGSMITH_MARKETPLACE_API_KEY:
            with _langsmith_env():
                raw_listings = await _run_search()
        else:
            raw_listings = await _run_search()

        parsed = _format_playwright_result(raw_listings, query)

        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=parsed,
                end_time=datetime.utcnow(),
            )

        return parsed

    except Exception as e:
        logger.error("Marketplace Playwright error: %s", str(e), exc_info=True)
        error_result = {
            "listings": [],
            "total_found": 0,
            "error": str(e),
        }
        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=error_result,
                error=str(e),
                end_time=datetime.utcnow(),
            )
        return error_result


def _format_playwright_result(listings: list, query: str) -> dict:
    """Playwright sonuclarini API formatina cevirir, baslik eslesmesine gore filtreler."""
    empty = {"listings": [], "total_found": 0}

    if not listings:
        return {**empty, "error": "Bu arama icin Facebook Marketplace'te ilan bulunamadi. Zaman dilimini 'Son 30 Gun' yaparak tekrar deneyin."}

    all_listings = [
        {
            "title": str(item.get("title", "")),
            "price": float(item.get("price", 0)),
            "url": str(item.get("url", "")),
            "location": str(item.get("location", "")),
            "description": str(item.get("description", "")),
        }
        for item in listings
    ]

    matched = [l for l in all_listings if _title_matches_query(l["title"], query)]

    logger.info(
        "Marketplace Playwright: %d extracted -> %d title matched (query='%s')",
        len(all_listings), len(matched), query,
    )

    if matched:
        return {
            "listings": matched,
            "total_found": len(matched),
            "total_extracted": len(all_listings),
        }

    return {
        "listings": all_listings,
        "total_found": len(all_listings),
        "total_extracted": len(all_listings),
        "note": f"'{query}' baslikta bulunamadi, tum sonuclar gosteriliyor.",
    }
