"""
Tool 2 — DB Schema Fetcher
─────────────────────────────────────────────────────────────
Girdi  : kategori adı + ürün çeşidi
Çıktı  : genel ürün alanları + teknik (extra_specs) alanları

Veritabanından kategori bilgisini doğrular,
product_specs modülünden teknik alan şemasını çeker.
"""
import json
import os
import sys
from typing import Any

from langchain_core.tools import tool


def _ensure_backend_path() -> None:
    """backend/ dizinini sys.path'e ekle."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)


@tool
def fetch_product_schema(category_name: str, product_type: str) -> str:
    """Veritabanından ve şema tanımlarından belirtilen kategori ve ürün çeşidi
    için gerekli tüm form alanlarını getirir.

    Dönen JSON yapısı:
    - general_fields: Ürün tablosundaki temel alanlar
    - technical_fields: extra_specs JSON alanları (boyut, enerji tipi, vb.)
    - category_id: Veritabanındaki kategori ID (null ise kategori bulunamadı)
    - available_product_types: Bu kategorideki tanımlı ürün çeşitleri
    - category_exists: Kategori veritabanında var mı

    Args:
        category_name: Ürün kategorisinin adı (örn: "Buzdolapları", "Fırınlar")
        product_type: Ürün çeşidinin adı (örn: "Çift Kapılı Buzdolabı", "Konveksiyonlu Fırın")
    """
    _ensure_backend_path()

    result: dict[str, Any] = {
        "category_name": category_name,
        "product_type": product_type,
        "category_id": None,
        "category_exists": False,
        "product_type_valid": False,
        "available_product_types": [],
        "general_fields": {},
        "technical_fields": {},
    }

    # ── 1. Veritabanından kategori bilgisi ──
    try:
        from database import SessionLocal, Category

        db = SessionLocal()
        try:
            category = db.query(Category).filter(
                Category.name == category_name,
                Category.is_active == True,
            ).first()

            if category:
                result["category_id"] = category.id
                result["category_exists"] = True
            else:
                # Fuzzy arama: benzer kategori var mı?
                all_cats = db.query(Category).filter(Category.is_active == True).all()
                similar = [
                    c.name for c in all_cats
                    if category_name.lower() in c.name.lower()
                    or c.name.lower() in category_name.lower()
                ]
                if similar:
                    result["suggested_categories"] = similar
        finally:
            db.close()
    except Exception as e:
        result["db_error"] = f"Veritabanı hatası: {str(e)}"

    # ── 2. Ürün çeşitlerini al ──
    try:
        from seed_data import PRODUCTS

        available_types = PRODUCTS.get(category_name, [])
        result["available_product_types"] = available_types
        result["product_type_valid"] = product_type in available_types

        if not result["product_type_valid"] and product_type:
            # Benzer ürün çeşidi öner
            similar_types = [
                t for t in available_types
                if product_type.lower() in t.lower()
                or t.lower() in product_type.lower()
            ]
            if similar_types:
                result["suggested_product_types"] = similar_types
    except Exception:
        pass

    # ── 3. Şema tanımlarını al ──
    try:
        from agent.product_specs import get_product_schema

        schema = get_product_schema(category_name, product_type)
        result["general_fields"] = schema["general_fields"]
        result["technical_fields"] = schema["technical_fields"]
    except Exception as e:
        result["schema_error"] = f"Şema alınamadı: {str(e)}"

    return json.dumps(result, ensure_ascii=False, indent=2, default=str)
