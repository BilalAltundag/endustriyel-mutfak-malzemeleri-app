from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, date

from database import transactions_col, expenses_col, products_col, get_next_id, doc_to_dict
from models import TransactionCreate, ExpenseCreate

router = APIRouter()


@router.get("/transactions")
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    transaction_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = {}
    if start_date:
        query.setdefault("date", {})["$gte"] = datetime.combine(start_date, datetime.min.time())
    if end_date:
        query.setdefault("date", {})["$lte"] = datetime.combine(end_date, datetime.max.time())
    if transaction_type:
        query["transaction_type"] = transaction_type

    docs = transactions_col.find(query).sort("date", -1).skip(skip).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.post("/transactions")
def create_transaction(transaction: TransactionCreate):
    if transaction.product_id:
        product = products_col.find_one({"id": transaction.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if transaction.transaction_type == "sale":
            products_col.update_one({"id": transaction.product_id}, {"$set": {"stock_status": "sold"}})

    now = datetime.utcnow()
    doc = {
        "id": get_next_id("transactions"),
        **transaction.dict(),
        "created_at": now,
    }
    transactions_col.insert_one(doc)
    return doc_to_dict(doc)


@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    doc = transactions_col.find_one({"id": transaction_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    transactions_col.delete_one({"id": transaction_id})
    return {"message": "Transaction deleted successfully"}


@router.get("/expenses")
def get_expenses(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    expense_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = {}
    if start_date:
        query.setdefault("date", {})["$gte"] = datetime.combine(start_date, datetime.min.time())
    if end_date:
        query.setdefault("date", {})["$lte"] = datetime.combine(end_date, datetime.max.time())
    if expense_type:
        query["expense_type"] = expense_type

    docs = expenses_col.find(query).sort("date", -1).skip(skip).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.post("/expenses")
def create_expense(expense: ExpenseCreate):
    if expense.product_id:
        product = products_col.find_one({"id": expense.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

    now = datetime.utcnow()
    doc = {
        "id": get_next_id("expenses"),
        **expense.dict(),
        "created_at": now,
    }
    expenses_col.insert_one(doc)
    return doc_to_dict(doc)


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    doc = expenses_col.find_one({"id": expense_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Expense not found")
    expenses_col.delete_one({"id": expense_id})
    return {"message": "Expense deleted successfully"}


@router.get("/summary")
def get_financial_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Finansal özet: gelir, gider, kar."""
    revenue_query = {"transaction_type": "sale"}
    expense_query = {}

    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time())
        revenue_query.setdefault("date", {})["$gte"] = start_dt
        expense_query.setdefault("date", {})["$gte"] = start_dt
    if end_date:
        end_dt = datetime.combine(end_date, datetime.max.time())
        revenue_query.setdefault("date", {})["$lte"] = end_dt
        expense_query.setdefault("date", {})["$lte"] = end_dt

    pipeline_rev = [{"$match": revenue_query}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    pipeline_exp = [{"$match": expense_query}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]

    rev_result = list(transactions_col.aggregate(pipeline_rev))
    exp_result = list(expenses_col.aggregate(pipeline_exp))

    total_revenue = rev_result[0]["total"] if rev_result else 0
    total_expenses = exp_result[0]["total"] if exp_result else 0

    return {
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": total_revenue - total_expenses,
        "start_date": start_date,
        "end_date": end_date,
    }
