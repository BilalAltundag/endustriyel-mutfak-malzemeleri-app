"""
Facebook Marketplace Search Agent
──────────────────────────────────────────
browser-use + Gemini ile Facebook Marketplace'te serbest metin araması yapar.
Ürün başlığı, fiyat, açıklama, konum ve link bilgilerini döndürür.
"""
import asyncio
import json
import os
import re
import sys
import logging
import uuid
from datetime import datetime
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from langsmith import Client as LangSmithClient

load_dotenv()

logger = logging.getLogger(__name__)

_browser_executor = ThreadPoolExecutor(max_workers=2)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
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
    """Agent çalışırken LangSmith env'ini marketplace projesine çevirir, sonra eski haline döndürür."""
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


def _turkish_slug(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğ", "IiSsCcUuOoGg")
    return text.translate(tr_map).lower().strip()


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


def _run_browser_agent_sync(task_text: str, api_key: str):
    """Windows'ta subprocess desteği için ProactorEventLoop ile ayrı thread'de çalıştırır."""
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_run_browser_agent_async(task_text, api_key))
    finally:
        loop.close()


def _is_rate_limit_error(exc: BaseException) -> bool:
    """429 / quota / rate limit hatalarını tespit eder."""
    msg = str(exc).lower()
    return "429" in msg or "resource_exhausted" in msg or "quota" in msg or "rate limit" in msg


async def _run_browser_agent_async(task_text: str, api_key: str):
    """Browser agent'ı async olarak çalıştırır. Flash → Flash-Lite fallback."""
    from browser_use import Agent, Browser, ChatGoogle
    from agent.config import GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK

    models_to_try = [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK]
    last_error = None

    for model_name in models_to_try:
        llm = ChatGoogle(model=model_name, api_key=api_key)
        browser = Browser(headless=True)
        try:
            agent = Agent(task=task_text, llm=llm, browser=browser, max_steps=25)
            return await agent.run()
        except Exception as e:
            last_error = e
            if _is_rate_limit_error(e):
                next_idx = models_to_try.index(model_name) + 1
                next_model = models_to_try[next_idx] if next_idx < len(models_to_try) else None
                if next_model:
                    logger.warning("Model %s kota aşımı, %s deneniyor...", model_name, next_model)
                continue
            raise
        finally:
            try:
                await browser.close()
            except Exception:
                pass

    raise last_error


async def search_marketplace_listings(
    query: str,
    location: str = "İzmir",
    time_period: str = "24_hours",
) -> dict:
    """Facebook Marketplace'te verilen sorguyu arar ve tüm ilgili ilanları döndürür."""
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
    location_slug = _turkish_slug(location)

    search_url = (
        f"https://www.facebook.com/marketplace/{location_slug}/search"
        f"?query={query}&daysSinceListed={days}"
    )

    task = f"""You MUST follow these steps IN ORDER. Do NOT skip any step.

STEP 1: Navigate to this URL: {search_url}

STEP 2: If a login popup or overlay appears, close it (click "Kapat" or the X button). If no popup, move on.

STEP 3: MANDATORY SCROLLING — You MUST scroll down the page at least 10 times (one page each time). Do this even if the page appears empty or shows a "no results" message. Facebook loads listings lazily, scrolling is required. Do all 10 scrolls in a single multi-action step if possible.

STEP 4: After all scrolling is complete, you MUST use the extract_content action with this exact query:
"Extract ALL product listing cards visible on this Facebook Marketplace page. For EACH listing, return: title (exact text), price (number in TL — dots are thousand separators: ₺7.100 = 7100), url (href link), location (city/district shown on card), description (any text snippet). Return as a JSON array with keys: title, price, url, location, description. Include EVERY listing, do NOT skip any."

STEP 5: You MUST use the done action with ONLY a JSON object. Examples:
- With results: {{"listings":[{{"title":"...","price":7100,"url":"...","location":"...","description":"..."}}]}}
- No results: {{"listings":[]}}

CRITICAL RULES:
- Complete ALL 5 steps. NEVER skip scrolling or extraction.
- Do NOT decide "no results" yourself. ALWAYS scroll and ALWAYS run extract_content.
- Do NOT navigate to any other URL. Stay on the search results page.
- Do NOT use find_elements. Only use extract_content.
- Extract EVERY listing visible on the page. Do NOT filter or skip any.
- Prices MUST be numbers: ₺7.100 = 7100, ₺15.000 = 15000.
- If price is "Ücretsiz" or missing, set to 0.
- The done action text MUST be ONLY valid JSON. No explanation text before or after.
- Complete within 20 steps."""

    try:
        with _langsmith_env():
            main_loop = asyncio.get_running_loop()
            result = await main_loop.run_in_executor(
                _browser_executor,
                _run_browser_agent_sync,
                task, GOOGLE_API_KEY,
            )

        final_text = result.final_result()
        logger.info(
            "Marketplace agent completed. Result length: %d",
            len(final_text) if final_text else 0,
        )
        parsed = _parse_marketplace_result(final_text, query)

        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=parsed,
                end_time=datetime.utcnow(),
            )

        return parsed

    except Exception as e:
        logger.error("Marketplace browser agent error: %s", str(e), exc_info=True)
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


def _parse_marketplace_result(text: str, query: str) -> dict:
    """Agent çıktısını parse eder ve arama terimine göre filtreler."""
    empty = {
        "listings": [],
        "total_found": 0,
    }

    if not text:
        return {**empty, "error": "Agent boş sonuç döndürdü."}

    no_result_phrases = [
        "no listings found", "no results", "bulunamadı", "sonuç yok",
        "empty json", "returning an empty", "no product listing",
        "hic ilan bulunamadi", "hiç ilan bulunamadı",
    ]
    text_lower = _normalize_turkish(text)
    if any(phrase in text_lower for phrase in [_normalize_turkish(p) for p in no_result_phrases]):
        return {**empty, "error": "Bu arama için Facebook Marketplace'te ilan bulunamadı. Zaman dilimini 'Son 30 Gün' yaparak tekrar deneyin."}

    data = None
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```\w*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            try:
                data = json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        if not data:
            arr_match = re.search(r"\[[\s\S]*\]", text)
            if arr_match:
                try:
                    arr = json.loads(arr_match.group())
                    if isinstance(arr, list):
                        data = {"listings": arr}
                except json.JSONDecodeError:
                    pass

    if not data or not isinstance(data, dict):
        return {**empty, "error": "Bu arama için Facebook Marketplace'te ilan bulunamadı. Zaman dilimini 'Son 30 Gün' yaparak tekrar deneyin."}

    listings = data.get("listings", [])

    if not listings:
        return {**empty, "error": "Bu arama için Facebook Marketplace'te ilan bulunamadı. Zaman dilimini 'Son 30 Gün' yaparak tekrar deneyin."}

    all_listings = []
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
                price = 0

        if price is None:
            price = 0

        url = str(item.get("url", ""))
        if url and not url.startswith("http"):
            url = "https://www.facebook.com" + url

        all_listings.append({
            "title": str(item.get("title", "")),
            "price": float(price) if price else 0,
            "url": url,
            "location": str(item.get("location", "")),
            "description": str(item.get("description", "")),
        })

    matched = [l for l in all_listings if _title_matches_query(l["title"], query)]

    logger.info(
        "Marketplace parse: %d extracted → %d title matched (query='%s')",
        len(all_listings), len(matched), query,
    )

    if matched:
        return {
            "listings": matched,
            "total_found": len(matched),
            "total_extracted": len(all_listings),
        }

    # Başlık filtresi hiç eşleşmediyse tüm sonuçları göster
    return {
        "listings": all_listings,
        "total_found": len(all_listings),
        "total_extracted": len(all_listings),
        "note": f"'{query}' başlıkta bulunamadı, tüm sonuçlar gösteriliyor.",
    }
