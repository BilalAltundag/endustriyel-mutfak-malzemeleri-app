"""
Price Scraper API
─────────────────────────────────────────
Facebook Marketplace fiyat araştırma endpoint'leri.
browser-use agent'ı çalıştırır ve sonuçları MongoDB'ye kaydeder.
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import ai_price_results_col, get_next_id, doc_to_dict

logger = logging.getLogger(__name__)

router = APIRouter()


class PriceSearchRequest(BaseModel):
    category_id: int
    category_name: str
    product_type: str
    product_type_label: str
    location: str = "İzmir"
    time_period: str = "24_hours"


@router.post("/search")
async def search_prices(req: PriceSearchRequest):
    """AI agent ile Facebook Marketplace'te fiyat araştırması yapar."""
    from price_agent import search_marketplace_prices

    logger.info(
        "Price search: %s > %s | %s | %s",
        req.category_name,
        req.product_type_label,
        req.location,
        req.time_period,
    )

    result = await search_marketplace_prices(
        product_name=req.product_type_label,
        location=req.location,
        time_period=req.time_period,
    )

    now = datetime.utcnow()
    doc = {
        "category_id": req.category_id,
        "category_name": req.category_name,
        "product_type": req.product_type,
        "product_type_label": req.product_type_label,
        "min_price": result.get("min_price"),
        "max_price": result.get("max_price"),
        "avg_price": result.get("avg_price"),
        "cluster_avg_price": result.get("cluster_avg_price"),
        "listings": result.get("listings", []),
        "total_found": result.get("total_found", 0),
        "location": req.location,
        "time_period": req.time_period,
        "error": result.get("error"),
        "searched_at": now,
        "updated_at": now,
    }

    existing = ai_price_results_col.find_one(
        {"category_id": req.category_id, "product_type": req.product_type}
    )

    if existing:
        ai_price_results_col.update_one(
            {"category_id": req.category_id, "product_type": req.product_type},
            {"$set": doc},
        )
        doc["id"] = existing["id"]
        doc["created_at"] = existing.get("created_at", now)
    else:
        doc["id"] = get_next_id("ai_price_results")
        doc["created_at"] = now
        ai_price_results_col.insert_one(doc)

    doc.pop("_id", None)
    return doc


@router.get("/results")
def get_all_results(category_id: Optional[int] = None):
    """Tüm AI fiyat sonuçlarını döndürür."""
    query = {}
    if category_id:
        query["category_id"] = category_id

    docs = ai_price_results_col.find(query).sort("updated_at", -1)
    return [doc_to_dict(d) for d in docs]


@router.get("/results/{category_id}/{product_type}")
def get_result(category_id: int, product_type: str):
    """Belirli bir ürün çeşidinin fiyat sonucunu döndürür."""
    doc = ai_price_results_col.find_one(
        {"category_id": category_id, "product_type": product_type}
    )
    if not doc:
        return None
    return doc_to_dict(doc)
