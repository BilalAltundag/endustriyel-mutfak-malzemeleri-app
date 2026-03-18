from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import logging
import traceback
import json
from datetime import datetime, date
from bson import ObjectId


class MongoJSONEncoder(json.JSONEncoder):
    """MongoDB tiplerini JSON-serializable yapan encoder."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


class MongoJSONResponse(JSONResponse):
    """MongoDB tipleri destekleyen JSONResponse."""
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            cls=MongoJSONEncoder,
        ).encode("utf-8")

logging.basicConfig(level=logging.INFO, format="%(name)s - %(levelname)s - %(message)s")

from database import init_db
from api import products, categories, inventory, finance, calendar, notes, price_ranges, suppliers, ai_agent, price_scraper, marketplace_search
from api.categories import seed_product_types as _seed_pt

app = FastAPI(title="Endüstriyel Mutfak Yönetim Sistemi", default_response_class=MongoJSONResponse)

# MongoDB index'leri oluştur
init_db()

# Mevcut kategorilere product_types ekle (henüz yoksa)
try:
    _seed_pt()
except Exception as e:
    logging.warning(f"Product types seed skipped: {e}")

# CORS middleware - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# API routes
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(price_ranges.router, prefix="/api/price-ranges", tags=["price-ranges"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(ai_agent.router, prefix="/api/ai", tags=["ai-agent"])
app.include_router(price_scraper.router, prefix="/api/price-scraper", tags=["price-scraper"])
app.include_router(marketplace_search.router, prefix="/api/marketplace-search", tags=["marketplace-search"])

# Global exception handler to ensure CORS headers are always included
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler that ensures CORS headers are included in error responses"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "type": type(exc).__name__
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Endüstriyel Mutfak Yönetim API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

