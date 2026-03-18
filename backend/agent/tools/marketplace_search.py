"""
Tool — Facebook Marketplace Search (Playwright)
────────────────────────────────────────────────
Facebook Marketplace'te urun aramasi yapar. Playwright ile Render uyumlu.
Gercek fiyatli ilanlari filtreler (1 TL, 25 TL vs. sahte fiyatlar elenir).
"""
import asyncio
import json
import os
import sys

from langchain_core.tools import tool


def _ensure_backend_path() -> None:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)


@tool
def search_facebook_marketplace(
    query: str,
    location: str = "Izmir",
    time_period: str = "24_hours",
) -> str:
    """Facebook Marketplace'te urun aramasi yapar.
    Sonuclar gercek fiyatli ilanlari icerir (1 TL, 25 TL gibi sahte fiyatlar filtrelenir).

    Args:
        query: Aranacak urun (orn: "buzdolabi ikinciel", "mikser")
        location: Sehir (orn: "Izmir", "Istanbul")
        time_period: "24_hours", "7_days" veya "30_days"
    """
    _ensure_backend_path()

    async def _run():
        from marketplace_agent import search_marketplace_listings
        return await search_marketplace_listings(
            query=query,
            location=location,
            time_period=time_period,
        )

    try:
        result = asyncio.run(_run())
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "listings": [], "total_found": 0})
