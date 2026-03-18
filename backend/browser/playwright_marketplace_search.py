"""
Playwright ile Facebook Marketplace arama
─────────────────────────────────────────
browser-use yerine dogrudan Playwright kullanir.
Render ve diger cloud ortamlarinda chromium ile calisir.
Gercek fiyatli ilanlari filtreler (1 TL, 25 TL vs. sahte fiyatlar elenir).
"""
import logging
import re
from urllib.parse import quote

from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

MIN_REAL_PRICE_TL = 50
SCROLL_COUNT = 8
SCROLL_DELAY_MS = 800
PAGE_TIMEOUT_MS = 30_000


def _turkish_slug(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğ", "IiSsCcUuOoGg")
    return text.translate(tr_map).lower().strip()


def _parse_price(price_str: str) -> float:
    """Fiyat string'ini sayiya cevirir: ₺7.100 -> 7100"""
    if not price_str:
        return 0.0
    s = str(price_str).replace("₺", "").replace("TL", "").replace(" ", "").strip()
    if not s or "ücretsiz" in s.lower() or "ucretsiz" in s.lower():
        return 0.0
    if re.match(r"^\d{1,3}(\.\d{3})+$", s):
        s = s.replace(".", "")
    else:
        s = re.sub(r"[^\d.]", "", s).replace(".", "")
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


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


async def fetch_marketplace_listings_playwright(
    query: str,
    location: str = "İzmir",
    days: int = 1,
    min_price_tl: float = MIN_REAL_PRICE_TL,
) -> list[dict]:
    """
    Playwright ile Marketplace sayfasini yukler, ilan kartlarini cikarir.
    Render uyumlu: chromium varsayilan launch kullanir.
    """
    location_slug = _turkish_slug(location)
    encoded_query = quote(query)
    url = (
        f"https://www.facebook.com/marketplace/{location_slug}/search"
        f"?query={encoded_query}&daysSinceListed={days}"
    )

    async with async_playwright() as p:
        # channel="chromium" = full chromium (build.sh --no-shell ile kurulur)
        # Varsayilan chromium_headless_shell Render'da yok, full chromium kullan
        browser = await p.chromium.launch(headless=True, channel="chromium")
        context = await browser.new_context(
            locale="tr-TR",
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
            await page.wait_for_timeout(3000)

            for sel in ['[aria-label="Kapat"]', '[aria-label="Close"]', 'button:has-text("Kapat")']:
                try:
                    btn = page.locator(sel).first
                    if await btn.count() > 0:
                        await btn.click(timeout=2000)
                        await page.wait_for_timeout(500)
                        break
                except Exception:
                    pass

            for _ in range(SCROLL_COUNT):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await page.wait_for_timeout(SCROLL_DELAY_MS)

            raw_listings = await page.evaluate("""
                () => {
                    const items = [];
                    const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
                    const seen = new Set();
                    for (const a of links) {
                        const href = a.getAttribute('href') || '';
                        if (seen.has(href)) continue;
                        seen.add(href);
                        const card = a.closest('[role="article"]') || a.closest('div[data-visualcompletion="ignore-dynamic"]') || a;
                        const text = (card?.textContent || a.textContent || '').trim();
                        if (text.length < 5) continue;
                        const priceMatch = text.match(/₺\\s*[\\d.,]+|[\\d.,]+\\s*TL|Ücretsiz/i);
                        const price = priceMatch ? priceMatch[0] : '';
                        items.push({
                            title: text.slice(0, 200),
                            price: price,
                            url: href.startsWith('http') ? href : 'https://www.facebook.com' + href
                        });
                    }
                    return items;
                }
            """)

            await browser.close()

            if not raw_listings:
                return []

            # Parse ve filtrele
            all_listings = []
            for item in raw_listings:
                price_val = _parse_price(item.get("price") or "")
                url = str(item.get("url", ""))
                if url and not url.startswith("http"):
                    url = "https://www.facebook.com" + url
                listing = {
                    "title": str(item.get("title", "")),
                    "price": price_val,
                    "url": url,
                    "location": location,
                    "description": "",
                }
                if price_val >= min_price_tl:
                    all_listings.append(listing)

            return all_listings

        except Exception as e:
            await browser.close()
            raise e
