"""
Endüstriyel Mutfak Kategorileri ve Ürünleri Önceden Tanımlı Veriler
"""
from database import SessionLocal, Category, Product, init_db
from datetime import datetime

# Kategoriler
CATEGORIES = [
    {"name": "Fırınlar", "description": "Endüstriyel fırınlar"},
    {"name": "Ocaklar", "description": "Endüstriyel ocaklar"},
    {"name": "Tezgahlar", "description": "Paslanmaz çelik tezgahlar"},
    {"name": "Buzdolapları", "description": "Endüstriyel buzdolapları"},
    {"name": "Dondurucular", "description": "Endüstriyel dondurucular"},
    {"name": "Aspiratörler", "description": "Endüstriyel aspiratörler"},
    {"name": "Kazanlar", "description": "Endüstriyel kazanlar"},
    {"name": "Kesme Makineleri", "description": "Et, sebze kesme makineleri"},
    {"name": "Mikserler", "description": "Endüstriyel mikserler"},
    {"name": "Fritözler", "description": "Endüstriyel fritözler"},
    {"name": "Izgaralar", "description": "Endüstriyel ızgaralar"},
    {"name": "Tost Makineleri", "description": "Endüstriyel tost makineleri"},
    {"name": "Kahve Makineleri", "description": "Endüstriyel kahve makineleri"},
    {"name": "Çay Kazanları", "description": "Endüstriyel çay kazanları"},
    {"name": "Bulaşık Makineleri", "description": "Endüstriyel bulaşık makineleri"},
    {"name": "Ekmek Kızartma Makineleri", "description": "Endüstriyel ekmek kızartma makineleri"},
    {"name": "Döner Makineleri", "description": "Döner pişirme makineleri"},
    {"name": "Pizza Fırınları", "description": "Endüstriyel pizza fırınları"},
    {"name": "Krep Makineleri", "description": "Endüstriyel krep makineleri"},
    {"name": "Waffle Makineleri", "description": "Endüstriyel waffle makineleri"},
    {"name": "Evyeler", "description": "Endüstriyel evyeler ve yıkama üniteleri"},
    {"name": "Arabalar", "description": "Servis ve satış arabaları"},
    {"name": "Raflar", "description": "Endüstriyel depolama rafları"},
    {"name": "Benmari", "description": "Benmari ısıtma üniteleri"},
]

# Ürünler (Kategori bazlı)
PRODUCTS = {
    "Fırınlar": [
        "Konveksiyonlu Fırın",
        "Pastane Fırını",
        "Pizza Fırını",
        "Döner Fırını",
        "Tünel Fırın",
        "Rotary Fırın",
    ],
    "Ocaklar": [
        "Gazlı Ocak",
        "Elektrikli Ocak",
        "İndüksiyonlu Ocak",
        "Wok Ocağı",
        "Pasta Ocağı",
        "Krep Ocağı",
    ],
    "Tezgahlar": [
        "Paslanmaz Çelik Tezgah",
        "Granit Tezgah",
        "Mermer Tezgah",
        "Kesme Tezgahı",
        "Hazırlık Tezgahı",
    ],
    "Buzdolapları": [
        "Tek Kapılı Buzdolabı",
        "Çift Kapılı Buzdolabı",
        "Dikey Donduruculu Buzdolabı",
        "Şoklama Buzdolabı",
        "Vitrini Buzdolabı",
    ],
    "Dondurucular": [
        "Dikey Dondurucu",
        "Yatay Dondurucu",
        "Şoklama Dondurucu",
        "Dondurma Dondurucu",
    ],
    "Aspiratörler": [
        "Duvar Tipi Aspiratör",
        "Ada Tipi Aspiratör",
        "Tavan Tipi Aspiratör",
        "Kanallı Aspiratör",
    ],
    "Kazanlar": [
        "Buhar Kazanı",
        "Çift Cidarlı Kazan",
        "Tencere Kazan",
        "Çay Kazanı",
        "Çorba Kazanı",
    ],
    "Kesme Makineleri": [
        "Et Kıyma Makinesi",
        "Sebze Doğrama Makinesi",
        "Ekmek Dilimleme Makinesi",
        "Et Dilimleme Makinesi",
    ],
    "Mikserler": [
        "Planet Mikser",
        "Spiral Mikser",
        "Çırpma Makinesi",
        "Hamur Yoğurma Makinesi",
    ],
    "Fritözler": [
        "Basınçlı Fritöz",
        "Klasik Fritöz",
        "Elektrikli Fritöz",
        "Gazlı Fritöz",
    ],
    "Izgaralar": [
        "Gazlı Izgara",
        "Elektrikli Izgara",
        "Kontakt Izgara",
        "Tavuk Izgara",
    ],
    "Tost Makineleri": [
        "Sandviç Tost Makinesi",
        "Krep Tost Makinesi",
        "Panini Makinesi",
    ],
    "Kahve Makineleri": [
        "Espresso Makinesi",
        "Filtre Kahve Makinesi",
        "Türk Kahvesi Makinesi",
        "Otomatik Kahve Makinesi",
    ],
    "Çay Kazanları": [
        "Elektrikli Çay Kazanı",
        "Gazlı Çay Kazanı",
        "Termos Çay Kazanı",
    ],
    "Bulaşık Makineleri": [
        "Bulaşık Yıkama Makinesi",
        "Bulaşık Kurutma Makinesi",
        "Tünel Tipi Bulaşık Makinesi",
    ],
    "Ekmek Kızartma Makineleri": [
        "Ekmek Kızartma Makinesi",
        "Çoklu Ekmek Kızartma Makinesi",
    ],
    "Döner Makineleri": [
        "Elektrikli Döner Makinesi",
        "Gazlı Döner Makinesi",
        "Dikey Döner Makinesi",
    ],
    "Pizza Fırınları": [
        "Taş Fırın",
        "Elektrikli Pizza Fırını",
        "Tünel Pizza Fırını",
    ],
    "Krep Makineleri": [
        "Krep Tavası",
        "Elektrikli Krep Makinesi",
        "Gazlı Krep Makinesi",
    ],
    "Waffle Makineleri": [
        "Elektrikli Waffle Makinesi",
        "Gazlı Waffle Makinesi",
    ],
    "Evyeler": [
        "Tek Gözlü Evye",
        "Çift Gözlü Evye",
        "Üç Gözlü Evye",
        "Damlalıklı Evye",
        "Köşe Evye",
    ],
    "Arabalar": [
        "Pilav Arabası",
        "Kokoreç Arabası",
        "Tantuni Arabası",
        "Döner Arabası",
        "Servis Arabası",
        "Taşıma Arabası",
    ],
    "Raflar": [
        "Düz Raf",
        "Köşe Raf",
        "Duvar Rafı",
        "Delikli Raf",
    ],
    "Benmari": [
        "Elektrikli Benmari",
        "Gazlı Benmari",
        "Kuru Benmari",
        "Sulu Benmari",
    ],
}


def seed_data():
    """Veritabanına önceden tanımlı kategorileri ve ürünleri ekle"""
    db = SessionLocal()
    try:
        # Kategorileri ekle
        category_map = {}
        for cat_data in CATEGORIES:
            existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                category = Category(**cat_data)
                db.add(category)
                db.commit()
                db.refresh(category)
                category_map[cat_data["name"]] = category.id
                print(f"[OK] Kategori eklendi: {cat_data['name']}")
            else:
                category_map[cat_data["name"]] = existing.id
                print(f"[SKIP] Kategori zaten var: {cat_data['name']}")

        # Ürünleri ekle
        for category_name, product_names in PRODUCTS.items():
            category_id = category_map.get(category_name)
            if not category_id:
                continue

            for product_name in product_names:
                existing = db.query(Product).filter(
                    Product.name == product_name,
                    Product.category_id == category_id
                ).first()
                
                if not existing:
                    product = Product(
                        name=product_name,
                        category_id=category_id,
                        purchase_price=0.0,  # Varsayılan değer, sonra güncellenebilir
                        sale_price=0.0,  # Varsayılan değer, sonra güncellenebilir
                        status="working",
                        stock_status="available"
                    )
                    db.add(product)
                    print(f"  [OK] Urun eklendi: {product_name}")
                else:
                    print(f"  [SKIP] Urun zaten var: {product_name}")

        db.commit()
        print("\n[SUCCESS] Tum veriler basariyla eklendi!")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Hata: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Veritabanı başlatılıyor...")
    init_db()
    print("\nÖnceden tanımlı veriler ekleniyor...\n")
    seed_data()

