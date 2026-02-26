"""
Facebook Marketplace Price Scraper Agent
──────────────────────────────────────────
Playwright ile Facebook Marketplace'te fiyat araştırması yapar.
LangSmith "fiyatarama" projesiyle izlenir.
"""
import asyncio
import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langsmith import Client as LangSmithClient
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")  # Eski tasarımla uyum için tutuluyor
LANGSMITH_PRICE_API_KEY = os.getenv("LANGSMITH_PRICE_API_KEY")
LANGSMITH_PRICE_PROJECT = os.getenv("LANGSMITH_PRICE_PROJECT", "fiyatarama")

ls_client: Optional[LangSmithClient] = None
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
) -> Dict[str, Any]:
    """FastAPI'nin kullandığı async API.

    İçeride Playwright senkron API'sini ayrı bir thread'de çalıştırır.
    Böylece asyncio + subprocess sorunlarından tamamen kurtulmuş oluruz.
    """
    return await asyncio.to_thread(
        _scrape_and_aggregate,
        product_name,
        location,
        time_period,
    )


def _scrape_and_aggregate(
    product_name: str,
    location: str,
    time_period: str,
) -> Dict[str, Any]:
    """Playwright ile Facebook'u tarar ve fiyat istatistiklerini hesaplar."""
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
        result = _scrape_with_playwright(product_name, location, time_period)

        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=result,
                end_time=datetime.utcnow(),
            )

        return result

    except Exception as e:
        logger.error("Playwright price scraper error: %s", str(e), exc_info=True)
        error_result = {
            "min_price": None,
            "max_price": None,
            "avg_price": None,
            "cluster_avg_price": None,
            "listings": [],
            "total_found": 0,
            "error": f"Playwright error: {e}",
        }
        if run_id and ls_client:
            ls_client.update_run(
                run_id,
                outputs=error_result,
                error=str(e),
                end_time=datetime.utcnow(),
            )
        return error_result


def _scrape_with_playwright(
    product_name: str,
    location: str,
    time_period: str,
) -> Dict[str, Any]:
    """Playwright ile Facebook Marketplace'ten ilanları çeker."""
    listings: List[Dict[str, Any]] = []
    error: Optional[str] = None

    days_map = {"24_hours": 1, "7_days": 7, "30_days": 30}
    days = days_map.get(time_period, 1)
    location_slug = _turkish_slug(location)

    search_url = (
        f"https://www.facebook.com/marketplace/{location_slug}/search"
        f"?query={product_name}&daysSinceListed={days}"
    )

    logger.info("Playwright search URL: %s", search_url)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.goto(search_url, wait_until="networkidle", timeout=60_000)

            _dismiss_overlays(page)

            # Sayfayı aşağıya kaydırarak daha fazla ilan yükle
            for _ in range(8):
                page.mouse.wheel(0, 2500)
                page.wait_for_timeout(1500)

            anchors = page.locator('a[href^="/marketplace/item/"]').all()
            seen_urls: set[str] = set()

            for a in anchors:
                href = a.get_attribute("href") or ""
                if not href:
                    continue
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                try:
                    text = a.inner_text()
                except Exception:
                    continue

                item = _extract_listing_from_text(text, href)
                if item:
                    listings.append(item)

            browser.close()

    except PlaywrightTimeoutError as e:
        error = f"Playwright timeout: {e}"
        logger.warning("%s", error)
    except Exception as e:
        error = f"Playwright unexpected error: {e}"
        logger.error("%s", error, exc_info=True)

    # Fiyat istatistikleri
    if not listings:
        return {
            "min_price": None,
            "max_price": None,
            "avg_price": None,
            "cluster_avg_price": None,
            "listings": [],
            "total_found": 0,
            "error": error or "No valid listings found after filtering",
        }

    prices = [float(item["price"]) for item in listings]
    return {
        "min_price": min(prices),
        "max_price": max(prices),
        "avg_price": round(sum(prices) / len(prices), 2),
        "cluster_avg_price": _cluster_average(prices),
        "listings": listings,
        "total_found": len(listings),
        "error": error,
    }


def _dismiss_overlays(page) -> None:
    """Facebook login / cookie popup'larını kapatmaya çalış."""
    try_selectors = [
        'button:has-text("Kapat")',
        'div[aria-label="Kapat"]',
        'button[aria-label="Kapat"]',
        'div[role="button"]:has-text("Sadece gerekli çerezlere izin ver")',
    ]
    for selector in try_selectors:
        try:
            el = page.locator(selector).first
            if el and el.is_visible():
                el.click()
                page.wait_for_timeout(1000)
        except Exception:
            continue


def _extract_listing_from_text(text: str, href: str) -> Optional[Dict[str, Any]]:
    """Bir ilan kartının iç metninden başlık ve fiyatı çıkarır."""
    if not text:
        return None

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return None

    price: Optional[float] = None
    price_line_idx: Optional[int] = None

    for idx, line in enumerate(lines):
        parsed = _parse_price(line)
        if parsed is not None:
            price = parsed
            price_line_idx = idx
            break

    if price is None or price < 50:
        return None

    # Başlık: fiyat satırı dışındaki ilk anlamlı satır
    title = ""
    for idx, line in enumerate(lines):
        if idx == price_line_idx:
            continue
        title = line
        break

    if not title:
        title = lines[price_line_idx] if price_line_idx is not None else lines[0]

    url = href if href.startswith("http") else "https://www.facebook.com" + href

    return {
        "title": title,
        "price": float(price),
        "url": url,
    }


def _parse_price(line: str) -> Optional[float]:
    """Bir satır içinden ₺ fiyatı parse eder."""
    if not line:
        return None

    # Örnek formatlar:
    # ₺7.100  → 7100
    # ₺15.000 → 15000
    s = line
    s = s.replace("TL", "").replace("₺", "").strip()

    # Türkçe binlik ayırıcı varsa
    if re.match(r"^\d{1,3}(\.\d{3})+$", s):
        s = s.replace(".", "")
    else:
        s = re.sub(r"[^\d.]", "", s)

    if not s:
        return None

    try:
        value = float(s)
    except ValueError:
        return None

    return value


def _cluster_average(prices: List[float]) -> Optional[float]:
    """IQR yöntemiyle outlier'ları eleyerek yakın fiyatların ortalamasını hesaplar."""
    if not prices:
        return None
    if len(prices) < 3:
        return round(sum(prices) / len(prices), 2)

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

