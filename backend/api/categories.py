from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import categories_col, products_col, get_next_id, doc_to_dict
from models import CategoryCreate, CategoryUpdate, Category as CategoryModel

router = APIRouter()


@router.get("/")
def get_categories(include_inactive: bool = False):
    query = {} if include_inactive else {"is_active": True}
    docs = categories_col.find(query).sort("name", 1)
    return [doc_to_dict(d) for d in docs]


@router.get("/{category_id}")
def get_category(category_id: int):
    doc = categories_col.find_one({"id": category_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return doc_to_dict(doc)


@router.post("/")
def create_category(category: CategoryCreate):
    existing = categories_col.find_one({"name": category.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    now = datetime.utcnow()
    doc = {
        "id": get_next_id("categories"),
        **category.dict(),
        "created_at": now,
        "updated_at": now,
    }
    categories_col.insert_one(doc)
    return doc_to_dict(doc)


@router.put("/{category_id}")
def update_category(category_id: int, category_update: CategoryUpdate):
    doc = categories_col.find_one({"id": category_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_update.dict(exclude_unset=True)

    if "name" in update_data:
        existing = categories_col.find_one({"name": update_data["name"], "id": {"$ne": category_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Category with this name already exists")

    update_data["updated_at"] = datetime.utcnow()
    categories_col.update_one({"id": category_id}, {"$set": update_data})

    updated = categories_col.find_one({"id": category_id})
    return doc_to_dict(updated)


@router.delete("/{category_id}")
def delete_category(category_id: int):
    doc = categories_col.find_one({"id": category_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")

    has_products = products_col.find_one({"category_id": category_id})
    if has_products:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with associated products. Please remove or reassign products first."
        )

    categories_col.delete_one({"id": category_id})
    return {"message": "Category deleted successfully"}
