from fastapi import APIRouter, HTTPException, UploadFile, File
from datetime import datetime
from typing import Optional
import os
import logging
import cloudinary
import cloudinary.uploader

from database import products_col, categories_col, transactions_col, expenses_col, get_next_id, doc_to_dict
from models import ProductCreate, ProductUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

# Cloudinary config
cloudinary.config(secure=True)


def _upload_to_cloudinary(file: UploadFile, product_id: int) -> str:
    """Dosyayı Cloudinary'ye yükler, URL döndürür."""
    result = cloudinary.uploader.upload(
        file.file,
        folder=f"ayhanticaret/products/{product_id}",
        resource_type="image",
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return result["secure_url"]


def _delete_from_cloudinary(url: str) -> None:
    """Cloudinary'den görseli siler."""
    try:
        parts = url.split("/upload/")
        if len(parts) == 2:
            public_id = parts[1].rsplit(".", 1)[0]
            # version prefix'i kaldır
            if public_id.startswith("v"):
                public_id = "/".join(public_id.split("/")[1:])
            cloudinary.uploader.destroy(public_id)
    except Exception as e:
        logger.warning("Cloudinary silme hatası: %s", e)


def _enrich_product(doc: dict) -> dict:
    """Ürün doc'unu API yanıtı için zenginleştirir."""
    if doc is None:
        return None
    doc.pop("_id", None)

    if doc.get("category_id"):
        cat = categories_col.find_one({"id": doc["category_id"]})
        if cat:
            doc["category"] = {"id": cat["id"], "name": cat["name"]}
        else:
            doc["category"] = None
    else:
        doc["category"] = None

    if doc.get("images") is None:
        doc["images"] = []

    return doc


@router.get("/")
def get_products(
    category_id: int = None,
    stock_status: str = None,
    skip: int = 0,
    limit: int = 100,
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if stock_status:
        query["stock_status"] = stock_status

    docs = products_col.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return [_enrich_product(d) for d in docs]


@router.get("/{product_id}")
def get_product(product_id: int):
    doc = products_col.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return _enrich_product(doc)


@router.post("/")
def create_product(product: ProductCreate):
    if product.category_id:
        cat = categories_col.find_one({"id": product.category_id})
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

    now = datetime.utcnow()
    product_id = get_next_id("products")
    doc = {
        "id": product_id,
        **product.dict(),
        "images": [],
        "created_at": now,
        "updated_at": now,
    }
    products_col.insert_one(doc)

    # Otomatik gider kaydı (mal alımı)
    if product.purchase_price and product.purchase_price > 0:
        expense_doc = {
            "id": get_next_id("expenses"),
            "product_id": product_id,
            "expense_type": "mal_alimi",
            "amount": product.purchase_price,
            "date": now,
            "description": f"Ürün alımı: {product.name}",
            "products_data": [],
            "created_at": now,
        }
        expenses_col.insert_one(expense_doc)

    return _enrich_product(doc)


@router.put("/{product_id}")
def update_product(product_id: int, product_update: ProductUpdate):
    doc = products_col.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_update.category_id:
        cat = categories_col.find_one({"id": product_update.category_id})
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

    update_data = product_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    products_col.update_one({"id": product_id}, {"$set": update_data})
    updated = products_col.find_one({"id": product_id})
    return _enrich_product(updated)


@router.delete("/{product_id}")
def delete_product(product_id: int):
    doc = products_col.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    # Cloudinary'den görselleri sil
    for img_url in doc.get("images", []):
        if "cloudinary" in img_url:
            _delete_from_cloudinary(img_url)

    products_col.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}


@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
):
    doc = products_col.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        image_url = _upload_to_cloudinary(file, product_id)
    except Exception as e:
        logger.error("Cloudinary upload hatası: %s", e)
        raise HTTPException(status_code=500, detail=f"Resim yükleme hatası: {str(e)}")

    images = doc.get("images", [])
    images.append(image_url)

    products_col.update_one(
        {"id": product_id},
        {"$set": {"images": images, "updated_at": datetime.utcnow()}}
    )

    return {"message": "Image uploaded successfully", "image_path": image_url}


from pydantic import BaseModel as _BaseModel

class SellRequest(_BaseModel):
    sale_price: float

@router.post("/{product_id}/sell")
def sell_product(product_id: int, body: SellRequest):
    """Ürünü satıldı olarak işaretle ve finans kaydı oluştur."""
    doc = products_col.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    if doc.get("stock_status") == "sold":
        raise HTTPException(status_code=400, detail="Ürün zaten satılmış")

    sale_price = body.sale_price
    now = datetime.utcnow()

    # Ürünü satıldı olarak işaretle
    products_col.update_one(
        {"id": product_id},
        {"$set": {"stock_status": "sold", "updated_at": now}}
    )

    # Gelir kaydı oluştur (transaction - sale)
    transaction_doc = {
        "id": get_next_id("transactions"),
        "product_id": product_id,
        "transaction_type": "sale",
        "amount": sale_price,
        "date": now,
        "description": f"Ürün satışı: {doc.get('name', '')}",
        "created_at": now,
    }
    transactions_col.insert_one(transaction_doc)

    updated = products_col.find_one({"id": product_id})
    return {
        "message": "Ürün satıldı olarak işaretlendi",
        "product": _enrich_product(updated),
        "transaction": doc_to_dict(transaction_doc),
    }
