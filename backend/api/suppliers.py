from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import suppliers_col, get_next_id, doc_to_dict
from models import SupplierCreate, SupplierUpdate

router = APIRouter()


@router.get("/")
def get_suppliers(include_inactive: bool = False, skip: int = 0, limit: int = 200):
    query = {} if include_inactive else {"is_active": True}
    docs = suppliers_col.find(query).sort("name", 1).skip(skip).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.get("/{supplier_id}")
def get_supplier(supplier_id: int):
    doc = suppliers_col.find_one({"id": supplier_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return doc_to_dict(doc)


@router.post("/")
def create_supplier(supplier: SupplierCreate):
    now = datetime.utcnow()
    doc = {
        "id": get_next_id("suppliers"),
        **supplier.dict(),
        "created_at": now,
        "updated_at": now,
    }
    suppliers_col.insert_one(doc)
    return doc_to_dict(doc)


@router.put("/{supplier_id}")
def update_supplier(supplier_id: int, supplier_update: SupplierUpdate):
    doc = suppliers_col.find_one({"id": supplier_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    suppliers_col.update_one({"id": supplier_id}, {"$set": update_data})

    updated = suppliers_col.find_one({"id": supplier_id})
    return doc_to_dict(updated)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int):
    doc = suppliers_col.find_one({"id": supplier_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    suppliers_col.delete_one({"id": supplier_id})
    return {"message": "Supplier deleted successfully"}
