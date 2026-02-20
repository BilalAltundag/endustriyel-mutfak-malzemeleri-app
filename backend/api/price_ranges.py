from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime

from database import price_ranges_col, products_col, categories_col, get_next_id, doc_to_dict
from models import PriceRangeCreate, PriceRangeUpdate

router = APIRouter()


@router.get("/")
def get_price_ranges(
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 200,
):
    query = {}
    if product_id:
        query["product_id"] = product_id
    if category_id:
        query["category_id"] = category_id

    docs = price_ranges_col.find(query).skip(skip).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.get("/{price_range_id}")
def get_price_range(price_range_id: int):
    doc = price_ranges_col.find_one({"id": price_range_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Price range not found")
    return doc_to_dict(doc)


@router.post("/")
def create_price_range(price_range: PriceRangeCreate):
    if price_range.product_id:
        if not products_col.find_one({"id": price_range.product_id}):
            raise HTTPException(status_code=404, detail="Product not found")
    if price_range.category_id:
        if not categories_col.find_one({"id": price_range.category_id}):
            raise HTTPException(status_code=404, detail="Category not found")

    now = datetime.utcnow()
    doc = {
        "id": get_next_id("price_ranges"),
        **price_range.dict(),
        "last_updated": now,
        "created_at": now,
        "updated_at": now,
    }
    price_ranges_col.insert_one(doc)
    return doc_to_dict(doc)


@router.put("/{price_range_id}")
def update_price_range(price_range_id: int, price_range_update: PriceRangeUpdate):
    doc = price_ranges_col.find_one({"id": price_range_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Price range not found")

    update_data = price_range_update.dict(exclude_unset=True)

    if "product_id" in update_data and update_data["product_id"]:
        if not products_col.find_one({"id": update_data["product_id"]}):
            raise HTTPException(status_code=404, detail="Product not found")
    if "category_id" in update_data and update_data["category_id"]:
        if not categories_col.find_one({"id": update_data["category_id"]}):
            raise HTTPException(status_code=404, detail="Category not found")

    now = datetime.utcnow()
    update_data["last_updated"] = now
    update_data["updated_at"] = now
    price_ranges_col.update_one({"id": price_range_id}, {"$set": update_data})

    updated = price_ranges_col.find_one({"id": price_range_id})
    return doc_to_dict(updated)


@router.delete("/{price_range_id}")
def delete_price_range(price_range_id: int):
    doc = price_ranges_col.find_one({"id": price_range_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Price range not found")
    price_ranges_col.delete_one({"id": price_range_id})
    return {"message": "Price range deleted successfully"}
