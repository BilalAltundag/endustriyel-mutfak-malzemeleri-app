"""
Database migration script
"""
from sqlalchemy import create_engine, text
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "app.db")


def migrate():
    """Run all migrations"""
    engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

    with engine.connect() as conn:
        # Migration 1: Add products_data column to expenses table
        result = conn.execute(text("PRAGMA table_info(expenses)"))
        columns = [row[1] for row in result]

        if 'products_data' not in columns:
            print("Adding products_data column to expenses table...")
            conn.execute(text("ALTER TABLE expenses ADD COLUMN products_data TEXT"))
            conn.commit()
            print("[OK] products_data column added!")
        else:
            print("[OK] products_data column already exists")

        # Migration 2: Add product_type column to products table
        result = conn.execute(text("PRAGMA table_info(products)"))
        columns = [row[1] for row in result]

        if 'product_type' not in columns:
            print("Adding product_type column to products table...")
            conn.execute(text("ALTER TABLE products ADD COLUMN product_type TEXT"))
            conn.commit()
            print("[OK] product_type column added!")
        else:
            print("[OK] product_type column already exists")

        # Migration 3: Ensure extra_specs column exists in products table
        if 'extra_specs' not in columns:
            print("Adding extra_specs column to products table...")
            conn.execute(text("ALTER TABLE products ADD COLUMN extra_specs TEXT"))
            conn.commit()
            print("[OK] extra_specs column added!")
        else:
            print("[OK] extra_specs column already exists")

    print("\nAll migrations completed!")


if __name__ == "__main__":
    migrate()
