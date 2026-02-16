from fastapi import APIRouter
from typing import Optional
from datetime import datetime, date, timedelta

from database import products_col, categories_col, doc_to_dict

router = APIRouter()


@router.get("/summary")
def get_inventory_summary():
    """Envanter özeti: toplam/mevcut/satılan + toplam mal değeri."""
    total = products_col.count_documents({})
    available = products_col.count_documents({"stock_status": "available"})
    sold = products_col.count_documents({"stock_status": "sold"})
    reserved = products_col.count_documents({"stock_status": "reserved"})

    # Toplam mal değeri (sadece mevcut ürünler)
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

    # Min değer: satış fiyatı - pazarlık payı
    min_value = total_sale - total_margin
    # Max değer: satış fiyatı
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
    pipeline = [
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
    ]
    results = list(products_col.aggregate(pipeline))

    category_counts = {}
    for r in results:
        cat_id = r["_id"]
        if cat_id:
            cat = categories_col.find_one({"id": cat_id})
            name = cat["name"] if cat else f"Kategori #{cat_id}"
        else:
            name = "Kategorisiz"
        category_counts[name] = r["count"]

    all_cats = categories_col.find({})
    for c in all_cats:
        if c["name"] not in category_counts:
            category_counts[c["name"]] = 0

    return [{"category": name, "count": count} for name, count in category_counts.items()]


@router.get("/by-material")
def get_inventory_by_material():
    pipeline = [
        {"$match": {"material": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$material", "count": {"$sum": 1}}},
    ]
    results = list(products_col.aggregate(pipeline))
    return [{"material": r["_id"], "count": r["count"]} for r in results]


@router.get("/empty-categories")
def get_empty_categories():
    """Ürün çeşidi sayısı sıfır olan kategorileri döndürür."""
    all_cats = list(categories_col.find({"is_active": True}))
    result = []

    for cat in all_cats:
        count = products_col.count_documents({"category_id": cat["id"], "stock_status": "available"})
        if count == 0:
            result.append({
                "id": cat["id"],
                "name": cat["name"],
                "description": cat.get("description"),
                "total_ever": products_col.count_documents({"category_id": cat["id"]}),
            })

    return result


@router.get("/daily-log")
def get_daily_log(days: int = 30):
    """Son N günde eklenen ürünlerin günlük listesi."""
    start = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$project": {
            "name": 1, "id": 1, "category_id": 1,
            "purchase_price": 1, "sale_price": 1,
            "stock_status": 1, "created_at": 1,
            "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
        }},
        {"$sort": {"created_at": -1}},
    ]
    products = list(products_col.aggregate(pipeline))

    # Günlere göre grupla
    days_map = {}
    for p in products:
        day = p.get("day", "unknown")
        if day not in days_map:
            days_map[day] = {"date": day, "count": 0, "products": []}
        days_map[day]["count"] += 1

        # Kategori adı ekle
        cat_name = None
        if p.get("category_id"):
            cat = categories_col.find_one({"id": p["category_id"]})
            cat_name = cat["name"] if cat else None

        days_map[day]["products"].append({
            "id": p["id"],
            "name": p["name"],
            "category": cat_name,
            "purchase_price": p.get("purchase_price"),
            "sale_price": p.get("sale_price"),
            "stock_status": p.get("stock_status"),
        })

    return sorted(days_map.values(), key=lambda x: x["date"], reverse=True)


@router.get("/sold-products")
def get_sold_products(skip: int = 0, limit: int = 100):
    """Satılmış ürünler listesi."""
    docs = products_col.find({"stock_status": "sold"}).sort("updated_at", -1).skip(skip).limit(limit)
    result = []
    for d in docs:
        d.pop("_id", None)
        if d.get("category_id"):
            cat = categories_col.find_one({"id": d["category_id"]})
            d["category"] = {"id": cat["id"], "name": cat["name"]} if cat else None
        else:
            d["category"] = None
        result.append(d)
    return result


@router.get("/missing")
def get_missing_products():
    docs = products_col.find({"stock_status": {"$in": ["sold", "reserved"]}})
    result = []
    for d in docs:
        d.pop("_id", None)
        result.append(d)
    return result


@router.get("/needed")
def get_needed_products():
    docs = products_col.find({
        "status": {"$in": ["broken", "repair"]},
        "stock_status": "available",
    })
    result = []
    for d in docs:
        d.pop("_id", None)
        result.append(d)
    return result


@router.get("/by-stock-status")
def get_inventory_by_stock_status():
    pipeline = [
        {"$group": {"_id": "$stock_status", "count": {"$sum": 1}}},
    ]
    results = list(products_col.aggregate(pipeline))
    return [{"stock_status": r["_id"], "count": r["count"]} for r in results]
