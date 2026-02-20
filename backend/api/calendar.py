from fastapi import APIRouter, HTTPException
from datetime import datetime, date

from database import (
    transactions_col, expenses_col, reminders_col,
    notes_col, products_col, categories_col, suppliers_col, doc_to_dict,
)

router = APIRouter()


@router.get("/daily/{day}")
def get_daily_summary(day: date):
    start_dt = datetime.combine(day, datetime.min.time())
    end_dt = datetime.combine(day, datetime.max.time())
    date_q = {"date": {"$gte": start_dt, "$lte": end_dt}}
    created_q = {"created_at": {"$gte": start_dt, "$lte": end_dt}}

    _txn_proj = {"_id": 0, "id": 1, "product_id": 1, "transaction_type": 1, "amount": 1, "date": 1, "description": 1}
    sold = list(transactions_col.find({**date_q, "transaction_type": "sale"}, _txn_proj))
    purchased = list(transactions_col.find({**date_q, "transaction_type": "purchase"}, _txn_proj))
    expenses = list(expenses_col.find(date_q, {"_id": 0, "id": 1, "product_id": 1, "expense_type": 1, "amount": 1, "date": 1, "description": 1}))
    reminders = list(reminders_col.find(date_q, {"_id": 0, "id": 1, "title": 1, "description": 1, "date": 1, "is_completed": 1}))
    notes = list(notes_col.find(date_q, {"_id": 0, "id": 1, "title": 1, "content": 1, "date": 1}))
    new_products = list(products_col.find(created_q, {"_id": 0, "id": 1, "name": 1}))
    new_categories = list(categories_col.find(created_q, {"_id": 0, "id": 1, "name": 1}))
    new_suppliers = list(suppliers_col.find(created_q, {"_id": 0, "id": 1, "name": 1, "phone": 1, "email": 1}))

    total_revenue = sum(t.get("amount", 0) for t in sold)
    total_expenses = sum(e.get("amount", 0) for e in expenses)

    def fmt_dt(d):
        return d.isoformat() if isinstance(d, datetime) else str(d) if d else None

    return {
        "date": start_dt.isoformat(),
        "sold_products": [
            {"id": t["id"], "product_id": t.get("product_id"), "transaction_type": t["transaction_type"],
             "amount": float(t["amount"]), "date": fmt_dt(t.get("date")), "description": t.get("description")}
            for t in sold
        ],
        "purchased_products": [
            {"id": t["id"], "product_id": t.get("product_id"), "transaction_type": t["transaction_type"],
             "amount": float(t["amount"]), "date": fmt_dt(t.get("date")), "description": t.get("description")}
            for t in purchased
        ],
        "expenses": [
            {"id": e["id"], "product_id": e.get("product_id"), "expense_type": e["expense_type"],
             "amount": float(e["amount"]), "date": fmt_dt(e.get("date")), "description": e.get("description")}
            for e in expenses
        ],
        "reminders": [
            {"id": r["id"], "title": r["title"], "description": r.get("description"),
             "date": fmt_dt(r.get("date")), "is_completed": r.get("is_completed", False)}
            for r in reminders
        ],
        "notes": [
            {"id": n["id"], "title": n.get("title"), "content": n.get("content"),
             "date": fmt_dt(n.get("date"))}
            for n in notes
        ],
        "new_products": [{"id": p["id"], "name": p["name"]} for p in new_products],
        "new_categories": [{"id": c["id"], "name": c["name"]} for c in new_categories],
        "new_suppliers": [
            {"id": s["id"], "name": s["name"], "phone": s.get("phone"), "email": s.get("email")}
            for s in new_suppliers
        ],
        "total_revenue": float(total_revenue),
        "total_expenses": float(total_expenses),
        "net_profit": float(total_revenue - total_expenses),
    }


@router.get("/upcoming-notes")
def get_upcoming_notes():
    now = datetime.now()
    docs = notes_col.find({"date": {"$gt": now}}).sort("date", 1)
    return [
        {"id": n["id"], "title": n.get("title"), "content": n.get("content"),
         "date": n["date"].isoformat() if isinstance(n.get("date"), datetime) else str(n.get("date"))}
        for n in docs
    ]


@router.get("/monthly/{year}/{month}")
def get_monthly_summary(year: int, month: int):
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.min.time())
    date_q = {"date": {"$gte": start_dt, "$lt": end_dt}}

    transactions = list(transactions_col.find(date_q).sort("date", -1))
    expenses = list(expenses_col.find(date_q).sort("date", -1))
    reminders = list(reminders_col.find(date_q).sort("date", -1))

    total_revenue = sum(t.get("amount", 0) for t in transactions if t.get("transaction_type") == "sale")
    total_expenses = sum(e.get("amount", 0) for e in expenses)

    return {
        "year": year,
        "month": month,
        "transactions": [doc_to_dict(t) for t in transactions],
        "expenses": [doc_to_dict(e) for e in expenses],
        "reminders": [doc_to_dict(r) for r in reminders],
        "total_revenue": float(total_revenue),
        "total_expenses": float(total_expenses),
        "net_profit": float(total_revenue - total_expenses),
    }
