"""
Marketplace Search API
─────────────────────────────────────────
Facebook Marketplace serbest metin arama endpoint'leri.
browser-use agent'ı çalıştırır ve sonuçları MongoDB'ye kaydeder.
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from database import marketplace_searches_col, get_next_id, doc_to_dict

logger = logging.getLogger(__name__)

router = APIRouter()


class MarketplaceSearchRequest(BaseModel):
    query: str
    location: str = "İzmir"
    time_period: str = "24_hours"


@router.post("/search")
async def search_marketplace(req: MarketplaceSearchRequest):
    """AI agent ile Facebook Marketplace'te serbest metin araması yapar."""
    from marketplace_agent import search_marketplace_listings

    logger.info(
        "Marketplace search: '%s' | %s | %s",
        req.query,
        req.location,
        req.time_period,
    )

    result = await search_marketplace_listings(
        query=req.query,
        location=req.location,
        time_period=req.time_period,
    )

    now = datetime.utcnow()
    doc = {
        "query": req.query,
        "location": req.location,
        "time_period": req.time_period,
        "listings": result.get("listings", []),
        "total_found": result.get("total_found", 0),
        "total_extracted": result.get("total_extracted"),
        "total_title_matched": result.get("total_title_matched"),
        "note": result.get("note"),
        "error": result.get("error"),
        "searched_at": now,
        "updated_at": now,
    }

    existing = marketplace_searches_col.find_one(
        {"query": req.query, "location": req.location, "time_period": req.time_period}
    )

    if existing:
        marketplace_searches_col.update_one(
            {"_id": existing["_id"]},
            {"$set": doc},
        )
        doc["id"] = existing["id"]
        doc["created_at"] = existing.get("created_at", now)
    else:
        doc["id"] = get_next_id("marketplace_searches")
        doc["created_at"] = now
        marketplace_searches_col.insert_one(doc)

    doc.pop("_id", None)
    return doc


@router.get("/history")
def get_search_history(limit: int = 20):
    """Son arama geçmişini döndürür."""
    docs = marketplace_searches_col.find().sort("updated_at", -1).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.get("/history/{search_id}")
def get_search_by_id(search_id: int):
    """Belirli bir arama sonucunu döndürür."""
    doc = marketplace_searches_col.find_one({"id": search_id})
    if not doc:
        return None
    return doc_to_dict(doc)


@router.delete("/history/{search_id}")
def delete_search(search_id: int):
    """Bir arama kaydını siler."""
    result = marketplace_searches_col.delete_one({"id": search_id})
    return {"deleted": result.deleted_count > 0}
