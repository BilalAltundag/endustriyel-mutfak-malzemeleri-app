"""
Playwright ile Facebook Marketplace sayfa yükleme
────────────────────────────────────────────────
browser-use yerine doğrudan Playwright kullanır.
Render ve diğer cloud ortamlarında chromium ile çalışır.
"""
import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

# HTML token limiti (Gemini için)
MAX_HTML_CHARS = 150_000


async def load_marketplace_page(
    url: str,
    scroll_count: int = 10,
    scroll_delay_ms: int = 800,
    timeout_ms: int = 30_000,
) -> str:
    """
    Marketplace sayfasını yükler, scroll eder, HTML döner.
    Chromium headless kullanır (build.sh'de playwright install chromium).
    """
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
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            await page.wait_for_timeout(2000)

            # Popup kapat (varsa)
            await _close_popup_if_any(page)

            # Lazy load için scroll
            for i in range(scroll_count):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await page.wait_for_timeout(scroll_delay_ms)

            html = await page.content()
            if len(html) > MAX_HTML_CHARS:
                html = html[:MAX_HTML_CHARS] + "<!-- TRUNCATED -->"
            return html
        finally:
            await browser.close()


async def _close_popup_if_any(page) -> None:
    """Login veya cookie popup'ı kapatmaya çalışır."""
    selectors = [
        '[aria-label="Kapat"]',
        '[aria-label="Close"]',
        'button:has-text("Kapat")',
        'button:has-text("Close")',
        '[data-testid="cookie-policy-dialog-accept-button"]',
        'div[role="dialog"] button',
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                await loc.first.click(timeout=2000)
                await page.wait_for_timeout(500)
                break
        except Exception:
            pass
