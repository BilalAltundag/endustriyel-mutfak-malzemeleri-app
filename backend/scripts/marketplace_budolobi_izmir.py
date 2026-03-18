"""
Basit Playwright script: Facebook Marketplace - buzdolabı ikinciel Izmir, son 24 saat
Ornek terminal ciktisi: python scripts/marketplace_budolobi_izmir.py
"""
import asyncio
import re
import sys
from urllib.parse import quote

# backend root'tan çalıştırılacak
sys.path.insert(0, __file__.rsplit("scripts", 1)[0])

from playwright.async_api import async_playwright


MIN_REAL_PRICE_TL = 50  # 1 TL, 25 TL, 50 TL gibi sahte fiyatlari filtrele


def _turkish_slug(text: str) -> str:
    tr_map = str.maketrans("İıŞşÇçÜüÖöĞğ", "IiSsCcUuOoGg")
    return text.translate(tr_map).lower().strip()


def _parse_price(price_str: str) -> float:
    """Fiyat string'ini sayiya cevirir: ₺7.100 -> 7100, ₺50.000 -> 50000"""
    if not price_str:
        return 0.0
    s = str(price_str).replace("₺", "").replace("TL", "").replace(" ", "").strip()
    if not s or "ücretsiz" in s.lower() or "ucretsiz" in s.lower():
        return 0.0
    # Turk format: 7.100 = 7100 (nokta binlik ayirac)
    if re.match(r"^\d{1,3}(\.\d{3})+$", s):
        s = s.replace(".", "")
    else:
        s = re.sub(r"[^\d.]", "", s).replace(".", "")
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


async def fetch_marketplace_listings(
    query: str = "buzdolabı ikinciel",
    location: str = "Izmir",
    days: int = 1,
    scroll_count: int = 8,
):
    """Playwright ile Marketplace sayfasını yükler, ilan kartlarını çıkarır."""
    location_slug = _turkish_slug(location)
    encoded_query = quote(query)
    url = (
        f"https://www.facebook.com/marketplace/{location_slug}/search"
        f"?query={encoded_query}&daysSinceListed={days}"
    )

    print(f"\n{'='*60}")
    print(f"Facebook Marketplace - Son {days} gun")
    print(f"Arama: '{query}' | Konum: {location}")
    print(f"URL: {url}")
    print(f"{'='*60}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
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
            print("Sayfa yükleniyor...")
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)

            # Popup kapat
            for sel in ['[aria-label="Kapat"]', '[aria-label="Close"]', 'button:has-text("Kapat")']:
                try:
                    btn = page.locator(sel).first
                    if await btn.count() > 0:
                        await btn.click(timeout=2000)
                        await page.wait_for_timeout(500)
                        print("Popup kapatildi.")
                        break
                except Exception:
                    pass

            # Scroll ile lazy load
            print(f"Scroll yapiliyor ({scroll_count} kez)...")
            for i in range(scroll_count):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await page.wait_for_timeout(800)

            # İlan kartlarını JS ile çıkar (Facebook'un yapısına göre)
            listings = await page.evaluate("""
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
                            title: text.slice(0, 120),
                            price: price,
                            url: href.startsWith('http') ? href : 'https://www.facebook.com' + href
                        });
                    }
                    return items.slice(0, 25);
                }
            """)

            if not listings:
                title = await page.title()
                print(f"Sayfa basligi: {title}")
                print("(İlan kartları otomatik parse edilemedi - Facebook login gerekebilir.)")

            await browser.close()
            return listings or []

        except Exception as e:
            await browser.close()
            raise e


def main():
    print("\n>> Playwright baslatiliyor...")
    listings = asyncio.run(
        fetch_marketplace_listings(
            query="buzdolabı ikinciel",
            location="Izmir",
            days=1,
        )
    )

    def _safe(s):
        return (s or "").encode("ascii", "replace").decode("ascii") if s else ""

    # 1 TL, 50 TL vs. sahte fiyatlari filtrele - gercek fiyatli ilanlari goster
    filtered = []
    for item in listings:
        price_val = _parse_price(item.get("price") or "")
        if price_val >= MIN_REAL_PRICE_TL:
            item["price_value"] = price_val
            filtered.append(item)

    print(f"\n>> Toplam {len(listings)} ilan, {len(filtered)} gercek fiyatli (>{MIN_REAL_PRICE_TL} TL)\n")
    for i, item in enumerate(filtered, 1):
        title = (item.get("title") or "")[:100]
        price = item.get("price") or "-"
        url = item.get("url") or ""
        print(f"--- Ilan {i} ---")
        print(f"  Baslik: {_safe(title)}")
        print(f"  Fiyat:  {_safe(str(price))}")
        print(f"  URL:    {url}")
        print()

    print(f"{'='*60}")
    print(f"Gosterilen: {len(filtered)} gercek fiyatli ilan")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
