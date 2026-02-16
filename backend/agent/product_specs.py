"""
Ürün Teknik Şema Tanımları
─────────────────────────────────────────────────────────────
Her ürün çeşidine ait teknik alanları (extra_specs) tanımlar.

Hiyerarşi:
  COMMON_SPECS        → Tüm ürünlerde ortak (boyutlar, marka, vb.)
  CATEGORY_SPECS      → Kategoriye özgü (enerji tipi, kapasite, vb.)
  TYPE_SPECIFIC_SPECS → Ürün çeşidine özgü (tepsi sayısı, göz sayısı, vb.)

get_product_schema() fonksiyonu bu 3 katmanı birleştirerek
belirli bir ürün çeşidinin tam şemasını döndürür.
"""
from typing import Any

# ─── Genel Ürün Alanları (products tablosu) ──────────────────
GENERAL_PRODUCT_FIELDS: dict[str, dict[str, Any]] = {
    "name": {
        "type": "string",
        "required": True,
        "label": "Ürün Adı",
        "description": "Ürünün tanımlayıcı adı",
    },
    "category_id": {
        "type": "integer",
        "required": False,
        "label": "Kategori ID",
        "description": "Ürünün ait olduğu kategori",
    },
    "product_type": {
        "type": "string",
        "required": False,
        "label": "Ürün Çeşidi",
        "description": "Kategori altındaki spesifik ürün tipi",
    },
    "purchase_price": {
        "type": "number",
        "required": True,
        "label": "Alış Fiyatı (TL)",
        "description": "Ürünün satın alma fiyatı",
    },
    "sale_price": {
        "type": "number",
        "required": True,
        "label": "Satış Fiyatı (TL)",
        "description": "Ürünün satış fiyatı",
    },
    "negotiation_margin": {
        "type": "number",
        "required": False,
        "label": "Pazarlık Payı",
        "description": "İndirim/pazarlık marjı",
        "default": 0.0,
    },
    "negotiation_type": {
        "type": "string",
        "required": False,
        "label": "Pazarlık Tipi",
        "description": "Pazarlık türü",
        "options": ["amount", "percentage"],
        "default": "amount",
    },
    "material": {
        "type": "string",
        "required": False,
        "label": "Ana Malzeme",
        "description": "Ürünün ana malzemesi (paslanmaz çelik, krom, vb.)",
    },
    "status": {
        "type": "string",
        "required": False,
        "label": "Durum",
        "description": "Ürünün çalışma durumu",
        "options": ["working", "broken", "repair"],
        "default": "working",
    },
    "stock_status": {
        "type": "string",
        "required": False,
        "label": "Stok Durumu",
        "description": "Stok/satış durumu",
        "options": ["available", "sold", "reserved"],
        "default": "available",
    },
    "notes": {
        "type": "string",
        "required": False,
        "label": "Notlar",
        "description": "Ürün hakkında ek notlar",
    },
}

# ─── Tüm Ürünlerde Ortak Teknik Alanlar (extra_specs) ───────
COMMON_SPECS: dict[str, dict[str, Any]] = {
    "width_cm": {
        "type": "number",
        "label": "Genişlik (cm)",
        "unit": "cm",
    },
    "depth_cm": {
        "type": "number",
        "label": "Derinlik (cm)",
        "unit": "cm",
    },
    "height_cm": {
        "type": "number",
        "label": "Yükseklik (cm)",
        "unit": "cm",
    },
    "weight_kg": {
        "type": "number",
        "label": "Ağırlık (kg)",
        "unit": "kg",
    },
    "brand": {
        "type": "string",
        "label": "Marka",
    },
    "model_name": {
        "type": "string",
        "label": "Model",
    },
    "production_year": {
        "type": "integer",
        "label": "Üretim Yılı",
    },
    "condition": {
        "type": "string",
        "label": "Durumu",
        "options": ["sıfır", "ikinci el", "yenilenmiş"],
    },
    "color": {
        "type": "string",
        "label": "Renk",
    },
}

# ─── Kategori Bazlı Teknik Alanlar ──────────────────────────
CATEGORY_SPECS: dict[str, dict[str, dict[str, Any]]] = {
    "Fırınlar": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz", "doğalgaz"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
        "temperature_max_c": {
            "type": "number",
            "label": "Max Sıcaklık (°C)",
            "unit": "°C",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V", "220V/380V"],
        },
        "tray_count": {
            "type": "integer",
            "label": "Tepsi Sayısı",
        },
        "tray_size": {
            "type": "string",
            "label": "Tepsi Boyutu",
            "options": ["GN 1/1", "GN 2/1", "60x40", "80x60"],
        },
    },
    "Ocaklar": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["gaz", "elektrik", "indüksiyon", "doğalgaz"],
        },
        "burner_count": {
            "type": "integer",
            "label": "Gözlü Sayısı",
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "has_pilot_light": {
            "type": "boolean",
            "label": "Pilot Ateşli mi",
        },
        "has_oven_below": {
            "type": "boolean",
            "label": "Alt Fırınlı mı",
        },
    },
    "Tezgahlar": {
        "shelf_count": {
            "type": "integer",
            "label": "Raf Sayısı",
        },
        "has_backsplash": {
            "type": "boolean",
            "label": "Arka Sıçrama Paneli",
        },
        "has_drawer": {
            "type": "boolean",
            "label": "Çekmeceli mi",
        },
        "surface_type": {
            "type": "string",
            "label": "Yüzey Tipi",
            "options": ["düz", "oluklu", "delikli"],
        },
        "leg_type": {
            "type": "string",
            "label": "Ayak Tipi",
            "options": ["sabit", "ayarlanabilir", "tekerlekli"],
        },
    },
    "Buzdolapları": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "temperature_min_c": {
            "type": "number",
            "label": "Min Sıcaklık (°C)",
            "unit": "°C",
        },
        "temperature_max_c": {
            "type": "number",
            "label": "Max Sıcaklık (°C)",
            "unit": "°C",
        },
        "door_count": {
            "type": "integer",
            "label": "Kapı Sayısı",
        },
        "compressor_type": {
            "type": "string",
            "label": "Kompresör Tipi",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "refrigerant_type": {
            "type": "string",
            "label": "Soğutucu Gaz Tipi",
        },
    },
    "Dondurucular": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "temperature_min_c": {
            "type": "number",
            "label": "Min Sıcaklık (°C)",
            "unit": "°C",
        },
        "door_count": {
            "type": "integer",
            "label": "Kapı Sayısı",
        },
        "drawer_count": {
            "type": "integer",
            "label": "Çekmece Sayısı",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
    },
    "Aspiratörler": {
        "air_flow_m3h": {
            "type": "number",
            "label": "Hava Debisi (m³/h)",
            "unit": "m³/h",
        },
        "motor_count": {
            "type": "integer",
            "label": "Motor Sayısı",
        },
        "filter_type": {
            "type": "string",
            "label": "Filtre Tipi",
            "options": ["yağ filtresi", "karbon filtresi", "çelik filtre"],
        },
        "speed_count": {
            "type": "integer",
            "label": "Hız Kademesi",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
    },
    "Kazanlar": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["gaz", "elektrik", "buhar"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "pressure_bar": {
            "type": "number",
            "label": "Basınç (bar)",
            "unit": "bar",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "has_mixer": {
            "type": "boolean",
            "label": "Karıştırıcılı mı",
        },
        "has_tilt": {
            "type": "boolean",
            "label": "Devirmeli mi",
        },
        "inner_material": {
            "type": "string",
            "label": "İç Malzeme",
        },
    },
    "Kesme Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "blade_type": {
            "type": "string",
            "label": "Bıçak Tipi",
        },
        "capacity_kg_h": {
            "type": "number",
            "label": "Kapasite (kg/h)",
            "unit": "kg/h",
        },
        "motor_power_hp": {
            "type": "number",
            "label": "Motor Gücü (HP)",
            "unit": "HP",
        },
    },
    "Mikserler": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "speed_count": {
            "type": "integer",
            "label": "Hız Kademesi",
        },
        "bowl_material": {
            "type": "string",
            "label": "Kap Malzemesi",
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
    },
    "Fritözler": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Yağ Kapasitesi (lt)",
            "unit": "lt",
        },
        "tank_count": {
            "type": "integer",
            "label": "Hazne Sayısı",
        },
        "temperature_max_c": {
            "type": "number",
            "label": "Max Sıcaklık (°C)",
            "unit": "°C",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "has_timer": {
            "type": "boolean",
            "label": "Zamanlayıcılı mı",
        },
    },
    "Izgaralar": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["gaz", "elektrik", "kömür"],
        },
        "surface_area_cm2": {
            "type": "number",
            "label": "Pişirme Alanı (cm²)",
            "unit": "cm²",
        },
        "temperature_max_c": {
            "type": "number",
            "label": "Max Sıcaklık (°C)",
            "unit": "°C",
        },
        "has_lid": {
            "type": "boolean",
            "label": "Kapaklı mı",
        },
        "surface_type": {
            "type": "string",
            "label": "Yüzey Tipi",
            "options": ["düz", "oluklu", "karışık"],
        },
    },
    "Tost Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "plate_count": {
            "type": "integer",
            "label": "Plaka Sayısı",
        },
        "surface_type": {
            "type": "string",
            "label": "Yüzey Tipi",
            "options": ["düz", "oluklu"],
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
    },
    "Kahve Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "group_count": {
            "type": "integer",
            "label": "Grup Sayısı",
        },
        "boiler_capacity_lt": {
            "type": "number",
            "label": "Kazan Kapasitesi (lt)",
            "unit": "lt",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "has_grinder": {
            "type": "boolean",
            "label": "Öğütücülü mü",
        },
        "water_connection": {
            "type": "boolean",
            "label": "Şebeke Bağlantılı mı",
        },
    },
    "Çay Kazanları": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "has_tap": {
            "type": "boolean",
            "label": "Musluğu Var mı",
        },
    },
    "Bulaşık Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "cycle_time_min": {
            "type": "number",
            "label": "Yıkama Süresi (dk)",
            "unit": "dk",
        },
        "rack_size": {
            "type": "string",
            "label": "Sepet Boyutu",
            "options": ["50x50", "60x50", "GN 1/1"],
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "water_consumption_lt": {
            "type": "number",
            "label": "Su Tüketimi (lt/saat)",
            "unit": "lt/saat",
        },
        "has_boiler": {
            "type": "boolean",
            "label": "Boyler Var mı",
        },
    },
    "Ekmek Kızartma Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "slice_count": {
            "type": "integer",
            "label": "Dilim Kapasitesi",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
    },
    "Döner Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "capacity_kg": {
            "type": "number",
            "label": "Et Kapasitesi (kg)",
            "unit": "kg",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "motor_type": {
            "type": "string",
            "label": "Motor Tipi",
        },
        "skewer_length_cm": {
            "type": "number",
            "label": "Şiş Uzunluğu (cm)",
            "unit": "cm",
        },
    },
    "Pizza Fırınları": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz", "odun"],
        },
        "deck_count": {
            "type": "integer",
            "label": "Kat Sayısı",
        },
        "pizza_capacity": {
            "type": "integer",
            "label": "Pizza Kapasitesi",
        },
        "temperature_max_c": {
            "type": "number",
            "label": "Max Sıcaklık (°C)",
            "unit": "°C",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V", "380V"],
        },
        "internal_diameter_cm": {
            "type": "number",
            "label": "İç Çap (cm)",
            "unit": "cm",
        },
    },
    "Krep Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "plate_count": {
            "type": "integer",
            "label": "Plaka Sayısı",
        },
        "plate_diameter_cm": {
            "type": "number",
            "label": "Plaka Çapı (cm)",
            "unit": "cm",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
    },
    "Waffle Makineleri": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik"],
        },
        "plate_count": {
            "type": "integer",
            "label": "Plaka Sayısı",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "power_kw": {
            "type": "number",
            "label": "Güç (kW)",
            "unit": "kW",
        },
        "waffle_shape": {
            "type": "string",
            "label": "Waffle Şekli",
            "options": ["kare", "yuvarlak", "belçika"],
        },
    },
    "Evyeler": {
        "bowl_count": {
            "type": "integer",
            "label": "Göz Sayısı",
        },
        "has_drainboard": {
            "type": "boolean",
            "label": "Damlalık Var mı",
        },
        "drainboard_side": {
            "type": "string",
            "label": "Damlalık Yönü",
            "options": ["sol", "sağ", "çift taraflı"],
        },
        "tap_included": {
            "type": "boolean",
            "label": "Batarya Dahil mi",
        },
        "leg_type": {
            "type": "string",
            "label": "Ayak Tipi",
            "options": ["sabit", "ayarlanabilir"],
        },
        "bowl_dimensions_cm": {
            "type": "string",
            "label": "Göz Boyutları (cm)",
        },
    },
    "Arabalar": {
        "wheel_count": {
            "type": "integer",
            "label": "Tekerlek Sayısı",
        },
        "wheel_type": {
            "type": "string",
            "label": "Tekerlek Tipi",
            "options": ["sabit", "döner", "frenli"],
        },
        "has_cover": {
            "type": "boolean",
            "label": "Kapaklı mı",
        },
        "has_drawer": {
            "type": "boolean",
            "label": "Çekmeceli mi",
        },
        "shelf_count": {
            "type": "integer",
            "label": "Raf Sayısı",
        },
        "cart_function": {
            "type": "string",
            "label": "Araba İşlevi",
            "options": ["satış", "servis", "taşıma"],
        },
        "tray_count": {
            "type": "integer",
            "label": "Tepsi/Bölme Sayısı",
        },
    },
    "Raflar": {
        "shelf_count": {
            "type": "integer",
            "label": "Raf Sayısı",
        },
        "shelf_material": {
            "type": "string",
            "label": "Raf Malzemesi",
            "options": ["paslanmaz çelik", "krom", "plastik"],
        },
        "load_capacity_kg": {
            "type": "number",
            "label": "Taşıma Kapasitesi (kg)",
            "unit": "kg",
        },
        "is_wall_mounted": {
            "type": "boolean",
            "label": "Duvara Monte mu",
        },
        "is_adjustable": {
            "type": "boolean",
            "label": "Ayarlanabilir mi",
        },
    },
    "Benmari": {
        "energy_type": {
            "type": "string",
            "label": "Enerji Tipi",
            "options": ["elektrik", "gaz"],
        },
        "compartment_count": {
            "type": "integer",
            "label": "Bölme Sayısı",
        },
        "capacity_liters": {
            "type": "number",
            "label": "Kapasite (lt)",
            "unit": "lt",
        },
        "voltage": {
            "type": "string",
            "label": "Voltaj",
            "options": ["220V"],
        },
        "temperature_control": {
            "type": "string",
            "label": "Sıcaklık Kontrolü",
            "options": ["termostatlı", "kademeli", "dijital"],
        },
        "has_drain": {
            "type": "boolean",
            "label": "Tahliye Musluğu Var mı",
        },
        "heating_type": {
            "type": "string",
            "label": "Isıtma Tipi",
            "options": ["kuru", "sulu"],
        },
    },
}

# ─── Ürün Çeşidine Özgü Ek Alanlar ─────────────────────────
# Sadece kategoriden farklı ek alanlara ihtiyaç duyan tipler burada.
TYPE_SPECIFIC_SPECS: dict[str, dict[str, dict[str, Any]]] = {
    # Fırınlar
    "Konveksiyonlu Fırın": {
        "has_steam": {"type": "boolean", "label": "Buhar Fonksiyonu"},
        "has_grill": {"type": "boolean", "label": "Izgara Fonksiyonu"},
        "has_timer": {"type": "boolean", "label": "Zamanlayıcılı mı"},
        "fan_speed_count": {"type": "integer", "label": "Fan Hız Kademesi"},
    },
    "Pastane Fırını": {
        "has_steam": {"type": "boolean", "label": "Buhar Fonksiyonu"},
        "deck_count": {"type": "integer", "label": "Kat Sayısı"},
        "stone_base": {"type": "boolean", "label": "Taş Tabanlı mı"},
    },
    "Rotary Fırın": {
        "rack_type": {"type": "string", "label": "Arabalı Tipi"},
        "rotation_speed": {"type": "string", "label": "Dönüş Hızı"},
    },
    # Ocaklar
    "Wok Ocağı": {
        "wok_ring_size_cm": {"type": "number", "label": "Wok Ring Çapı (cm)", "unit": "cm"},
        "btu_rating": {"type": "number", "label": "BTU Değeri"},
    },
    # Buzdolapları
    "Şoklama Buzdolabı": {
        "shock_capacity_kg": {"type": "number", "label": "Şoklama Kapasitesi (kg)", "unit": "kg"},
        "core_probe": {"type": "boolean", "label": "Çekirdek Prob Var mı"},
    },
    # Arabalar
    "Pilav Arabası": {
        "bain_marie_included": {"type": "boolean", "label": "Benmari Dahil mi"},
        "gas_tube_connection": {"type": "boolean", "label": "Tüp Bağlantısı Var mı"},
        "serving_capacity": {"type": "integer", "label": "Servis Kapasitesi (kişi)"},
    },
    "Kokoreç Arabası": {
        "grill_type": {"type": "string", "label": "Izgara Tipi"},
        "has_charcoal_tray": {"type": "boolean", "label": "Kömür Tepsili mi"},
        "bread_warmer": {"type": "boolean", "label": "Ekmek Isıtıcı Var mı"},
    },
    "Tantuni Arabası": {
        "sac_diameter_cm": {"type": "number", "label": "Saç Çapı (cm)", "unit": "cm"},
        "has_side_counter": {"type": "boolean", "label": "Yan Tezgah Var mı"},
    },
    "Döner Arabası": {
        "has_döner_motor": {"type": "boolean", "label": "Döner Motor Dahil mi"},
        "gas_tube_connection": {"type": "boolean", "label": "Tüp Bağlantısı Var mı"},
    },
    # Evyeler
    "Damlalıklı Evye": {
        "drainboard_count": {"type": "integer", "label": "Damlalık Sayısı"},
    },
    "Köşe Evye": {
        "angle_degree": {"type": "number", "label": "Köşe Açısı (derece)"},
    },
    # Benmari
    "Kuru Benmari": {
        "gn_pan_count": {"type": "integer", "label": "GN Küvet Sayısı"},
        "gn_pan_size": {"type": "string", "label": "GN Küvet Boyutu", "options": ["GN 1/1", "GN 1/2", "GN 1/3"]},
    },
    "Sulu Benmari": {
        "gn_pan_count": {"type": "integer", "label": "GN Küvet Sayısı"},
        "gn_pan_size": {"type": "string", "label": "GN Küvet Boyutu", "options": ["GN 1/1", "GN 1/2", "GN 1/3"]},
        "water_level_indicator": {"type": "boolean", "label": "Su Seviye Göstergesi Var mı"},
    },
}


def get_product_schema(category_name: str, product_type: str | None = None) -> dict[str, Any]:
    """Belirtilen kategori ve ürün çeşidi için birleşik şemayı döndürür.

    Dönen yapı::

        {
            "general_fields": { ... },       # products tablosu alanları
            "technical_fields": { ... },     # extra_specs JSON alanları
            "category_name": "...",
            "product_type": "...",
        }
    """
    # Teknik alanları birleştir: common + category + type-specific
    technical_fields: dict[str, dict[str, Any]] = {}

    # 1) Ortak alanlar
    technical_fields.update(COMMON_SPECS)

    # 2) Kategori alanları
    if category_name in CATEGORY_SPECS:
        technical_fields.update(CATEGORY_SPECS[category_name])

    # 3) Ürün çeşidi alanları
    if product_type and product_type in TYPE_SPECIFIC_SPECS:
        technical_fields.update(TYPE_SPECIFIC_SPECS[product_type])

    return {
        "general_fields": GENERAL_PRODUCT_FIELDS,
        "technical_fields": technical_fields,
        "category_name": category_name,
        "product_type": product_type,
    }


def get_all_category_names() -> list[str]:
    """Tanımlı tüm kategori isimlerini döndürür."""
    return list(CATEGORY_SPECS.keys())


def get_product_types_for_category(category_name: str) -> list[str]:
    """Belirli bir kategoriye ait ürün çeşitlerini döndürür.

    Bu veriler seed_data.py ile senkronize tutulmalıdır.
    """
    # seed_data.py'deki PRODUCTS haritasından
    from seed_data import PRODUCTS
    return PRODUCTS.get(category_name, [])
