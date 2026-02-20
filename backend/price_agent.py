"""
Facebook Marketplace Price Scraper Agent
──────────────────────────────────────────
browser-use + Gemini ile Facebook Marketplace'te fiyat araştırması yapar.
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


def _turkish_slug(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğ", "IiSsCcUuOoGg")
    return text.translate(tr_map).lower().strip()


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

    from browser_use import Agent, Browser
    from browser_use.llm import ChatGoogle

    llm = ChatGoogle(
        model="gemini-2.5-flash",
        api_key=GOOGLE_API_KEY,
    )

    days_map = {"24_hours": 1, "7_days": 7, "30_days": 30}
    days = days_map.get(time_period, 1)
    location_slug = _turkish_slug(location)

    search_url = (
        f"https://www.facebook.com/marketplace/{location_slug}/search"
        f"?query={product_name}&daysSinceListed={days}"
    )

    task = f"""Go to {search_url}
Close any login popup or overlay (click "Kapat" or X button).
Scroll down 8 times slowly to load more listings.

Then use the extract_content action with this query:
"Find all product listing cards on this Facebook Marketplace page. For each listing extract: 1) the product title, 2) the price in Turkish Lira as a plain number (e.g. '₺7.100' means 7100, '₺15.000' means 15000 — dots are thousand separators in Turkish), 3) the listing URL. IMPORTANT: SKIP any listing priced at 0, 1, 2, 3, 4, 5 TL or marked as 'Ücretsiz' / 'Free' — these are placeholder prices. Only include listings with realistic prices above 50 TL. Return as a JSON array."

After extraction, immediately use the done action with a JSON object like:
{{"listings":[{{"title":"...","price":7100,"url":"..."}}]}}

IMPORTANT RULES:
- Do NOT use find_elements. Use extract_content to read the page.
- Only include up to 40 listings related to "{product_name}".
- Turkish price format uses dots as thousand separators: ₺7.100 = 7100, ₺15.000 = 15000.
- Prices must be numbers (not strings), and must be above 50.
- SKIP listings with price 0, 1, 2, 3, 4, 5 TL — these are "contact for price" placeholders.
- If no valid results after filtering, return {{"listings":[]}}
- Complete within 20 steps. Do NOT retry extractions."""

    browser = Browser(headless=True)

    try:
        agent = Agent(
            task=task,
            llm=llm,
            browser=browser,
            max_steps=25,
        )

        result = await agent.run()
        final_text = result.final_result()
        logger.info(
            "Agent completed. Result length: %d",
            len(final_text) if final_text else 0,
        )
        parsed = _parse_agent_result(final_text, product_name)

        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=parsed,
                end_time=datetime.utcnow(),
            )

        return parsed

    except Exception as e:
        logger.error("Browser agent error: %s", str(e), exc_info=True)
        error_result = {
            "min_price": None,
            "max_price": None,
            "avg_price": None,
            "cluster_avg_price": None,
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
    finally:
        try:
            await browser.close()
        except Exception:
            pass


def _parse_agent_result(text: str, product_name: str) -> dict:
    """Parse agent output into structured price data."""
    empty = {
        "min_price": None,
        "max_price": None,
        "avg_price": None,
        "cluster_avg_price": None,
        "listings": [],
        "total_found": 0,
    }

    if not text:
        return {**empty, "error": "Agent returned empty result"}

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

    if not data or not isinstance(data, dict):
        return {**empty, "error": f"Could not parse result: {text[:300]}"}

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
            if url and not url.startswith("http"):
                url = "https://www.facebook.com" + url
            valid_prices.append(float(price))
            valid_listings.append(
                {
                    "title": str(item.get("title", "")),
                    "price": float(price),
                    "url": url,
                }
            )

    if valid_prices:
        return {
            "min_price": min(valid_prices),
            "max_price": max(valid_prices),
            "avg_price": round(sum(valid_prices) / len(valid_prices), 2),
            "cluster_avg_price": _cluster_average(valid_prices),
            "listings": valid_listings,
            "total_found": len(valid_listings),
        }

    return {**empty, "error": "No valid listings found after filtering"}


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
