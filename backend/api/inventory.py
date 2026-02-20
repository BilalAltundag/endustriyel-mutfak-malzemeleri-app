from fastapi import APIRouter
from typing import Optional
from datetime import datetime, date, timedelta

from database import products_col, categories_col, doc_to_dict

router = APIRouter()


@router.get("/summary")
def get_inventory_summary():
    """Envanter özeti: tek aggregation ile tüm count'lar + toplam mal değeri."""
    # 1 aggregation instead of 4 separate count_documents
    status_counts = list(products_col.aggregate([
        {"$group": {"_id": "$stock_status", "count": {"$sum": 1}}}
    ]))
    count_map = {r["_id"]: r["count"] for r in status_counts}
    total = sum(count_map.values())
    available = count_map.get("available", 0)
    sold = count_map.get("sold", 0)
    reserved = count_map.get("reserved", 0)

    pipeline = [
        {"$match": {"stock_status": "available"}},
        {"$group": {
            "_id": None,
            "total_purchase": {"$sum": "$purchase_price"},
            "total_sale": {"$sum": "$sale_price"},
            "total_margin": {"$sum": "$negotiation_margin"},
        }},
    ]
    agg = list(products_col.aggregate(pipeline))

    if agg:
        total_purchase = agg[0]["total_purchase"] or 0
        total_sale = agg[0]["total_sale"] or 0
        total_margin = agg[0]["total_margin"] or 0
    else:
        total_purchase = total_sale = total_margin = 0

    min_value = total_sale - total_margin
    max_value = total_sale

    return {
        "total_products": total,
        "available": available,
        "sold": sold,
        "reserved": reserved,
        "total_purchase_value": round(total_purchase, 2),
        "total_sale_value": round(total_sale, 2),
        "total_margin": round(total_margin, 2),
        "min_sale_value": round(min_value, 2),
        "max_sale_value": round(max_value, 2),
    }


@router.get("/by-category")
def get_inventory_by_category():
    """$lookup ile tek sorguda kategori adlarını çöz (N+1 yok)."""
    pipeline = [
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
        {"$lookup": {
            "from": "categories",
            "localField": "_id",
            "foreignField": "id",
            "as": "cat_info",
        }},
        {"$project": {
            "count": 1,
            "category": {
                "$cond": {
                    "if": {"$gt": [{"$size": "$cat_info"}, 0]},
                    "then": {"$arrayElemAt": ["$cat_info.name", 0]},
                    "else": {
                        "$cond": {
                            "if": {"$eq": ["$_id", None]},
                            "then": "Kategorisiz",
                            "else": {"$concat": ["Kategori #", {"$toString": "$_id"}]},
                        }
                    },
                }
            },
        }},
    ]
    results = list(products_col.aggregate(pipeline))

    existing_names = {r["category"] for r in results}
    all_cats = categories_col.find({}, {"name": 1, "_id": 0})
    for c in all_cats:
        if c["name"] not in existing_names:
            results.append({"category": c["name"], "count": 0})

    return [{"category": r["category"], "count": r["count"]} for r in results]


@router.get("/by-material")
def get_inventory_by_material():
    pipeline = [
        {"$match": {"material": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$material", "count": {"$sum": 1}}},
    ]
    results = list(products_col.aggregate(pipeline))
    return [{"material": r["_id"], "count": r["count"]} for r in results]


@router.get("/empty-categories")
def get_empty_categories():
    """2 aggregation + 1 query yerine N*2 query. Boş kategorileri döndürür."""
    available_counts = {
        r["_id"]: r["count"]
        for r in products_col.aggregate([
            {"$match": {"stock_status": "available"}},
            {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
        ])
    }
    total_counts = {
        r["_id"]: r["total"]
        for r in products_col.aggregate([
            {"$group": {"_id": "$category_id", "total": {"$sum": 1}}},
        ])
    }

    all_cats = list(categories_col.find(
        {"is_active": True},
        {"_id": 0, "id": 1, "name": 1, "description": 1},
    ))

    result = []
    for cat in all_cats:
        if available_counts.get(cat["id"], 0) == 0:
            result.append({
                "id": cat["id"],
                "name": cat["name"],
                "description": cat.get("description"),
                "total_ever": total_counts.get(cat["id"], 0),
            })
    return result


@router.get("/daily-log")
def get_daily_log(days: int = 30):
    """$lookup ile kategori adlarını tek sorguda çöz."""
    start = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "id",
            "as": "cat_info",
        }},
        {"$project": {
            "name": 1, "id": 1, "category_id": 1,
            "purchase_price": 1, "sale_price": 1,
            "stock_status": 1, "created_at": 1,
            "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "category_name": {"$arrayElemAt": ["$cat_info.name", 0]},
        }},
        {"$sort": {"created_at": -1}},
    ]
    products = list(products_col.aggregate(pipeline))

    days_map: dict = {}
    for p in products:
        day = p.get("day", "unknown")
        if day not in days_map:
            days_map[day] = {"date": day, "count": 0, "products": []}
        days_map[day]["count"] += 1
        days_map[day]["products"].append({
            "id": p["id"],
            "name": p["name"],
            "category": p.get("category_name"),
            "purchase_price": p.get("purchase_price"),
            "sale_price": p.get("sale_price"),
            "stock_status": p.get("stock_status"),
        })

    return sorted(days_map.values(), key=lambda x: x["date"], reverse=True)


@router.get("/sold-products")
def get_sold_products(skip: int = 0, limit: int = 100):
    """$lookup ile kategori bilgisini tek sorguda çöz."""
    pipeline = [
        {"$match": {"stock_status": "sold"}},
        {"$sort": {"updated_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "id",
            "as": "cat_info",
        }},
        {"$addFields": {
            "category": {
                "$cond": {
                    "if": {"$gt": [{"$size": "$cat_info"}, 0]},
                    "then": {
                        "$let": {
                            "vars": {"cat": {"$arrayElemAt": ["$cat_info", 0]}},
                            "in": {"id": "$$cat.id", "name": "$$cat.name"},
                        }
                    },
                    "else": None,
                }
            }
        }},
        {"$project": {"_id": 0, "cat_info": 0}},
    ]
    return list(products_col.aggregate(pipeline))


@router.get("/missing")
def get_missing_products():
    docs = products_col.find(
        {"stock_status": {"$in": ["sold", "reserved"]}},
        {"_id": 0},
    )
    return list(docs)


@router.get("/needed")
def get_needed_products():
    docs = products_col.find(
        {"status": {"$in": ["broken", "repair"]}, "stock_status": "available"},
        {"_id": 0},
    )
    return list(docs)


@router.get("/by-stock-status")
def get_inventory_by_stock_status():
    pipeline = [
        {"$group": {"_id": "$stock_status", "count": {"$sum": 1}}},
    ]
    results = list(products_col.aggregate(pipeline))
    return [{"stock_status": r["_id"], "count": r["count"]} for r in results]
