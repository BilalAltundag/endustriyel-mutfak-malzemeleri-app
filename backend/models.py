from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class StockStatus(str, Enum):
    AVAILABLE = "available"
    SOLD = "sold"
    RESERVED = "reserved"


# Spec field definition (embedded in ProductTypeItem or Category defaults)
class SpecFieldItem(BaseModel):
    name: str
    label: str
    type: str = "text"
    options: Optional[List[str]] = None
    unit: Optional[str] = None
    placeholder: Optional[str] = None


# Product Type Model (embedded in Category)
class ProductTypeItem(BaseModel):
    value: str
    label: str
    fields: Optional[List[SpecFieldItem]] = None


# Category Models
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    product_types: Optional[List[ProductTypeItem]] = None
    default_fields: Optional[List[SpecFieldItem]] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    product_types: Optional[List[ProductTypeItem]] = None
    default_fields: Optional[List[SpecFieldItem]] = None


class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryRef(BaseModel):
    """Lightweight category reference for nested use in Product"""
    id: int
    name: str

    class Config:
        from_attributes = True


# Product Models
class ProductBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    product_type: Optional[str] = None
    purchase_price: float
    sale_price: float
    negotiation_margin: float = 0.0
    negotiation_type: str = "amount"
    material: Optional[str] = None
    status: str = "working"
    stock_status: StockStatus = StockStatus.AVAILABLE
    notes: Optional[str] = None
    extra_specs: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    product_type: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    negotiation_margin: Optional[float] = None
    negotiation_type: Optional[str] = None
    material: Optional[str] = None
    status: Optional[str] = None
    stock_status: Optional[StockStatus] = None
    notes: Optional[str] = None
    extra_specs: Optional[Dict[str, Any]] = None


class Product(ProductBase):
    id: int
    images: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryRef] = None

    class Config:
        from_attributes = True


# Transaction Models
class TransactionBase(BaseModel):
    product_id: Optional[int] = None
    transaction_type: str
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Expense Models
class ExpenseBase(BaseModel):
    product_id: Optional[int] = None
    expense_type: str
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    products_data: Optional[List[dict]] = None


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Reminder Models
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    is_completed: bool = False


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class Reminder(ReminderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Note Models
class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[datetime] = None


class Note(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# PriceRange Models
class PriceRangeBase(BaseModel):
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    min_purchase_price: float
    max_purchase_price: float
    min_sale_price: float
    max_sale_price: float
    notes: Optional[str] = None


class PriceRangeCreate(PriceRangeBase):
    pass


class PriceRangeUpdate(BaseModel):
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    min_purchase_price: Optional[float] = None
    max_purchase_price: Optional[float] = None
    min_sale_price: Optional[float] = None
    max_sale_price: Optional[float] = None
    notes: Optional[str] = None


class PriceRange(PriceRangeBase):
    id: int
    last_updated: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Supplier Models
class SupplierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Calendar Models
class DailySummary(BaseModel):
    date: datetime
    sold_products: List[Transaction] = []
    purchased_products: List[Transaction] = []
    expenses: List[Expense] = []
    reminders: List[Reminder] = []
    notes: List[Note] = []
    new_products: List[Product] = []
    new_categories: List[Category] = []

    class Config:
        from_attributes = True
