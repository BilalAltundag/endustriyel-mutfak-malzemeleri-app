"""
Marketplace Search Agent (Tavily)
──────────────────────────────────────────
Tavily API ile web'de ürün ilanı araması yapar.
Birden fazla kaynaktan sonuç toplar (sahibinden, letgo, facebook, vs.).
LangSmith ile izlenir.
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
    """Agent çalışırken LangSmith env'ini marketplace projesine çevirir."""
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
    for word in query.strip().split():
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
    """Tavily ile web'de ürün ilanı araması yapar."""
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

    try:
        from search.tavily_search import search_product_listings

        if LANGSMITH_MARKETPLACE_API_KEY:
            with _langsmith_env():
                raw_listings = search_product_listings(
                    query=query,
                    location=location,
                    time_period=time_period,
                )
        else:
            raw_listings = search_product_listings(
                query=query,
                location=location,
                time_period=time_period,
            )

        parsed = _format_search_result(raw_listings, query)

        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=parsed,
                end_time=datetime.utcnow(),
            )

        return parsed

    except Exception as e:
        logger.error("Marketplace Tavily error: %s", str(e), exc_info=True)
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


def _format_search_result(listings: list, query: str) -> dict:
    """
    Sonuçları API formatına çevirir.
    Sadece Facebook Marketplace bireysel ilanları, başlık eşleşmesiyle filtrelenir.
    """
    if not listings:
        return {
            "listings": [],
            "total_found": 0,
            "fb_individual_count": 0,
            "error": "Bu arama için Facebook Marketplace'te ilan bulunamadı. Farklı bir arama terimi veya konum deneyin.",
        }

    all_listings = []
    for item in listings:
        all_listings.append({
            "title": str(item.get("title", "")),
            "price": float(item.get("price", 0)),
            "url": str(item.get("url", "")),
            "location": str(item.get("location", "")),
            "description": str(item.get("description", "")),
            "source": "facebook",
            "is_individual": True,
            "in_target_city": bool(item.get("in_target_city", False)),
        })

    matched = [l for l in all_listings if _title_matches_query(l["title"], query)]

    final = matched if matched else all_listings
    has_match = bool(matched)

    logger.info(
        "Marketplace: %d total -> %d title matched (query='%s')",
        len(all_listings), len(matched), query,
    )

    return {
        "listings": final,
        "total_found": len(final),
        "total_extracted": len(all_listings),
        "fb_individual_count": len(final),
        **({"note": f"'{query}' başlıkta bulunamadı, tüm FB ilanları gösteriliyor."} if not has_match else {}),
    }
