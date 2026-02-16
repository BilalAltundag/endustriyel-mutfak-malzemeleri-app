"""
MongoDB Atlas Database Connection
──────────────────────────────────────────────
PyMongo ile MongoDB bağlantısı ve yardımcı fonksiyonlar.
Auto-increment ID pattern kullanılır (frontend uyumluluğu için).
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://bilalaltundag2000_db_user:nNfMQkWlzCQfyjdy@cluster0.29sib5m.mongodb.net/"
)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ayhanticaret")

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
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
    # Indexes
    categories_col.create_index([("name", ASCENDING)], unique=True)
    categories_col.create_index([("id", ASCENDING)], unique=True)
    products_col.create_index([("id", ASCENDING)], unique=True)
    products_col.create_index([("name", ASCENDING)])
    products_col.create_index([("category_id", ASCENDING)])
    products_col.create_index([("created_at", DESCENDING)])
    transactions_col.create_index([("id", ASCENDING)], unique=True)
    transactions_col.create_index([("date", DESCENDING)])
    expenses_col.create_index([("id", ASCENDING)], unique=True)
    expenses_col.create_index([("date", DESCENDING)])
    reminders_col.create_index([("id", ASCENDING)], unique=True)
    reminders_col.create_index([("date", ASCENDING)])
    notes_col.create_index([("id", ASCENDING)], unique=True)
    notes_col.create_index([("date", DESCENDING)])
    price_ranges_col.create_index([("id", ASCENDING)], unique=True)
    suppliers_col.create_index([("id", ASCENDING)], unique=True)
    suppliers_col.create_index([("name", ASCENDING)])

    print(f"MongoDB indexes created on {MONGODB_DB_NAME}")


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
