"""
MongoDB Atlas Database Connection
──────────────────────────────────────────────
PyMongo ile MongoDB bağlantısı ve yardımcı fonksiyonlar.
Auto-increment ID pattern kullanılır (frontend uyumluluğu için).
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is required. Check backend/.env file.")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ayhanticaret")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000,
    tls=True,
    tlsCAFile=certifi.where(),
    tlsAllowInvalidCertificates=True,
)
db = client[MONGODB_DB_NAME]

# ─── Collections ───
categories_col = db["categories"]
products_col = db["products"]
transactions_col = db["transactions"]
expenses_col = db["expenses"]
reminders_col = db["reminders"]
notes_col = db["notes"]
price_ranges_col = db["price_ranges"]
suppliers_col = db["suppliers"]
ai_price_results_col = db["ai_price_results"]
marketplace_searches_col = db["marketplace_searches"]
counters_col = db["counters"]


def get_next_id(collection_name: str) -> int:
    """Auto-increment ID üretir (frontend uyumluluğu için integer ID)."""
    result = counters_col.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return result["seq"]


def init_db():
    """Indexler ve başlangıç verileri oluşturur."""
    try:
        categories_col.create_index([("name", ASCENDING)], unique=True)
        categories_col.create_index([("id", ASCENDING)], unique=True)
        products_col.create_index([("id", ASCENDING)], unique=True)
        products_col.create_index([("name", ASCENDING)])
        products_col.create_index([("category_id", ASCENDING)])
        products_col.create_index([("created_at", DESCENDING)])
        products_col.create_index([("stock_status", ASCENDING)])
        products_col.create_index([("status", ASCENDING)])
        products_col.create_index([("material", ASCENDING)])
        transactions_col.create_index([("id", ASCENDING)], unique=True)
        transactions_col.create_index([("date", DESCENDING)])
        transactions_col.create_index([("product_id", ASCENDING)])
        expenses_col.create_index([("id", ASCENDING)], unique=True)
        expenses_col.create_index([("date", DESCENDING)])
        expenses_col.create_index([("product_id", ASCENDING)])
        reminders_col.create_index([("id", ASCENDING)], unique=True)
        reminders_col.create_index([("date", ASCENDING)])
        notes_col.create_index([("id", ASCENDING)], unique=True)
        notes_col.create_index([("date", DESCENDING)])
        price_ranges_col.create_index([("id", ASCENDING)], unique=True)
        ai_price_results_col.create_index([("id", ASCENDING)], unique=True)
        ai_price_results_col.create_index(
            [("category_id", ASCENDING), ("product_type", ASCENDING)], unique=True
        )
        suppliers_col.create_index([("id", ASCENDING)], unique=True)
        suppliers_col.create_index([("name", ASCENDING)])
        marketplace_searches_col.create_index([("id", ASCENDING)], unique=True)
        marketplace_searches_col.create_index([("query", ASCENDING)])
        marketplace_searches_col.create_index([("searched_at", DESCENDING)])
        print(f"MongoDB indexes created on {MONGODB_DB_NAME}")
    except Exception as e:
        print(f"WARNING: MongoDB init_db failed (will retry on first request): {e}")


def doc_to_dict(doc: dict) -> dict:
    """MongoDB document'ını API-uyumlu dict'e çevirir (_id kaldırılır)."""
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


# Backward compatibility — eski kodda "get_db" kullanan yerler için
def get_db():
    """Eski SQLAlchemy dependency pattern'i yerine MongoDB db döndürür."""
    return db
