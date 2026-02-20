"""
MongoDB kategorilerine product_types (alanlarıyla) ve default_fields ekleyen seed script.
categoryTemplates.ts verisini Python dict'lere dönüştürür.
"""
from database import categories_col
from datetime import datetime, timezone


def f(name, label, ftype="text", unit=None, options=None, placeholder=None):
    d = {"name": name, "label": label, "type": ftype}
    if options is not None:
        d["options"] = options
    if unit is not None:
        d["unit"] = unit
    if placeholder is not None:
        d["placeholder"] = placeholder
    return d


# Common fields
length_cm = f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 120")
width_cm = f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 60")
height_cm = f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85")

SEED_DATA = {
    "Evyeler": {
        "default_fields": [
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 120"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 60"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
            f("depth_cm", "Göz Derinliği", "number", "cm", placeholder="örn: 30"),
            f("basin_count", "Göz Sayısı", "select", options=["1", "2", "3"]),
            f("has_drainboard", "Damlalık", "select", options=["Var", "Yok"]),
            f("thickness_mm", "Sac Kalınlığı", "number", "mm", placeholder="örn: 0.8"),
        ],
        "product_types": [
            {"value": "tek_gozlu_evye", "label": "Tek Gözlü Evye", "fields": None},
            {"value": "cift_gozlu_evye", "label": "Çift Gözlü Evye", "fields": None},
            {"value": "uc_gozlu_evye", "label": "Üç Gözlü Evye", "fields": None},
            {"value": "damlalikli_evye", "label": "Damlalıklı Evye", "fields": None},
            {"value": "kose_evye", "label": "Köşe Evye", "fields": None},
        ],
    },
    "Arabalar": {
        "default_fields": [
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 150"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 90"),
            f("energy_type", "Isıtma Tipi", "select", options=["Tüplü", "Doğalgaz", "Elektrikli", "Yok"]),
            f("has_glass", "Cam", "select", options=["Var", "Yok"]),
            f("wheel_count", "Teker Sayısı", "select", options=["2", "4"]),
        ],
        "product_types": [
            {
                "value": "pilav_arabasi",
                "label": "Pilav Arabası",
                "fields": [
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 150"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 90"),
                    f("energy_type", "Isıtma Tipi", "select", options=["Tüplü", "Doğalgaz", "Elektrikli"]),
                    f("benmari_type", "Benmari", "select", options=["Kuru", "Sulu", "Yok"]),
                    f("has_glass", "Cam", "select", options=["Var", "Yok"]),
                    f("wheel_count", "Teker Sayısı", "select", options=["2", "4"]),
                ],
            },
            {
                "value": "kokorec_arabasi",
                "label": "Kokoreç Arabası",
                "fields": [
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 150"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 90"),
                    f("energy_type", "Isıtma Tipi", "select", options=["Kömürlü", "Gazlı"]),
                    f("has_glass", "Cam", "select", options=["Var", "Yok"]),
                    f("wheel_count", "Teker Sayısı", "select", options=["2", "4"]),
                ],
            },
            {"value": "tantuni_arabasi", "label": "Tantuni Arabası", "fields": None},
            {"value": "doner_arabasi", "label": "Döner Arabası", "fields": None},
            {
                "value": "servis_arabasi",
                "label": "Servis Arabası",
                "fields": [
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 80"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 50"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 90"),
                    f("shelf_count", "Raf Sayısı", "select", options=["2", "3", "4"]),
                    f("wheel_count", "Teker Sayısı", "select", options=["4"]),
                ],
            },
            {
                "value": "tasima_arabasi",
                "label": "Taşıma Arabası",
                "fields": [
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 60"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 40"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 80"),
                    f("load_capacity_kg", "Yük Kapasitesi", "number", "kg", placeholder="örn: 150"),
                    f("shelf_count", "Raf Sayısı", "select", options=["1", "2", "3"]),
                    f("wheel_count", "Teker Sayısı", "select", options=["4"]),
                ],
            },
        ],
    },
    "Fırınlar": {
        "default_fields": [
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
            f("tray_count", "Tepsi Sayısı", "number", placeholder="örn: 10"),
            f("tray_size", "Tepsi Ölçüsü", "text", placeholder="örn: 40x60, 60x80"),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 90"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 170"),
        ],
        "product_types": [
            {
                "value": "konveksiyonlu_firin",
                "label": "Konveksiyonlu Fırın",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("tray_count", "Tepsi Sayısı", "number", placeholder="örn: 10"),
                    f("tray_size", "Tepsi Ölçüsü", "select", options=["40x60", "60x80"]),
                    f("has_steam", "Buhar Fonksiyonu", "select", options=["Var", "Yok"]),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 90"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 170"),
                ],
            },
            {
                "value": "pastane_firini",
                "label": "Pastane Fırını",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("deck_count", "Kat Sayısı", "select", options=["1", "2", "3", "4"]),
                    f("tray_count", "Tepsi Sayısı (kat başı)", "number", placeholder="örn: 3"),
                    f("tray_size", "Tepsi Ölçüsü", "select", options=["40x60", "60x80"]),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 120"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 100"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 160"),
                ],
            },
            {
                "value": "pizza_firini",
                "label": "Pizza Fırını",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli", "Odunlu"]),
                    f("pizza_capacity", "Pizza Kapasitesi", "number", placeholder="örn: 4"),
                    f("pizza_diameter_cm", "Max Pizza Çapı", "number", "cm", placeholder="örn: 33"),
                    f("deck_count", "Kat Sayısı", "select", options=["1", "2", "3"]),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 100"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 100"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 80"),
                ],
            },
            {
                "value": "doner_firini",
                "label": "Döner Fırını",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("capacity_kg", "Et Kapasitesi", "number", "kg", placeholder="örn: 60"),
                    f("burner_count", "Radyan Sayısı", "number", placeholder="örn: 4"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 120"),
                ],
            },
            {
                "value": "tunnel_firin",
                "label": "Tünel Fırın",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("belt_width_cm", "Bant Genişliği", "number", "cm", placeholder="örn: 50"),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 200"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 50"),
                ],
            },
            {
                "value": "rotary_firin",
                "label": "Rotary Fırın",
                "fields": [
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("rack_count", "Çevirme Raf Sayısı", "number", placeholder="örn: 1"),
                    f("tray_count", "Tepsi Sayısı", "number", placeholder="örn: 18"),
                    f("tray_size", "Tepsi Ölçüsü", "select", options=["40x60", "60x80"]),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 150"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 120"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 220"),
                ],
            },
        ],
    },
    "Ocaklar": {
        "default_fields": [
            f("burner_count", "Göz Sayısı", "select", options=["1", "2", "3", "4", "5", "6"]),
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli", "İndüksiyon"]),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 80"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
        ],
        "product_types": [
            {"value": "gazli_ocak", "label": "Gazlı Ocak", "fields": None},
            {"value": "elektrikli_ocak", "label": "Elektrikli Ocak", "fields": None},
            {"value": "induksiyonlu_ocak", "label": "İndüksiyonlu Ocak", "fields": None},
            {
                "value": "wok_ocagi",
                "label": "Wok Ocağı",
                "fields": [
                    f("burner_count", "Göz Sayısı", "select", options=["1", "2", "3"]),
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("wok_diameter_cm", "Wok Çapı", "number", "cm", placeholder="örn: 40"),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 50"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 50"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
                ],
            },
            {"value": "pasta_ocagi", "label": "Pasta Ocağı", "fields": None},
            {
                "value": "krep_ocagi",
                "label": "Krep Ocağı",
                "fields": [
                    f("plate_count", "Plaka Sayısı", "select", options=["1", "2"]),
                    f("plate_diameter_cm", "Plaka Çapı", "number", "cm", placeholder="örn: 40"),
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                ],
            },
        ],
    },
    "Tezgahlar": {
        "default_fields": [
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 150"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
            f("has_bottom_shelf", "Alt Raf", "select", options=["Var", "Yok"]),
            f("has_backsplash", "Arka Sıçrama Kenarı", "select", options=["Var", "Yok"]),
            f("thickness_mm", "Sac Kalınlığı", "number", "mm", placeholder="örn: 1.0"),
        ],
        "product_types": [
            {"value": "paslanmaz_celik_tezgah", "label": "Paslanmaz Çelik Tezgah", "fields": None},
            {"value": "granit_tezgah", "label": "Granit Tezgah", "fields": None},
            {"value": "mermer_tezgah", "label": "Mermer Tezgah", "fields": None},
            {"value": "kesme_tezgahi", "label": "Kesme Tezgahı", "fields": None},
            {"value": "hazirlik_tezgahi", "label": "Hazırlık Tezgahı", "fields": None},
        ],
    },
    "Buzdolapları": {
        "default_fields": [
            f("volume_liters", "Hacim", "number", "litre", placeholder="örn: 600"),
            f("door_count", "Kapı Sayısı", "select", options=["1", "2", "3", "4"]),
            f("cooling_type", "Soğutma Tipi", "select", options=["Statik", "Fan (No-Frost)"]),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 70"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 200"),
        ],
        "product_types": [
            {"value": "tek_kapili_buzdolabi", "label": "Tek Kapılı Buzdolabı", "fields": None},
            {"value": "cift_kapili_buzdolabi", "label": "Çift Kapılı Buzdolabı", "fields": None},
            {"value": "dikey_donduruculu_buzdolabi", "label": "Dikey Donduruculu Buzdolabı", "fields": None},
            {
                "value": "soklama_buzdolabi",
                "label": "Şoklama Buzdolabı",
                "fields": [
                    f("volume_liters", "Hacim", "number", "litre", placeholder="örn: 300"),
                    f("tray_count", "Tepsi Sayısı", "number", placeholder="örn: 5"),
                    f("temperature_min", "Min. Sıcaklık", "number", "°C", placeholder="örn: -40"),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 80"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 200"),
                ],
            },
            {
                "value": "vitrini_buzdolabi",
                "label": "Vitrinli Buzdolabı",
                "fields": [
                    f("volume_liters", "Hacim", "number", "litre", placeholder="örn: 400"),
                    f("door_count", "Kapı Sayısı", "select", options=["1", "2", "3"]),
                    f("cooling_type", "Soğutma Tipi", "select", options=["Statik", "Fan (No-Frost)"]),
                    f("display_type", "Vitrin Tipi", "select", options=["Cam Kapılı", "Açık Vitrin", "Tezgah Üstü"]),
                    f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 70"),
                    f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 200"),
                ],
            },
        ],
    },
    "Dondurucular": {
        "default_fields": [
            f("volume_liters", "Hacim", "number", "litre", placeholder="örn: 500"),
            f("temperature_min", "Min. Sıcaklık", "number", "°C", placeholder="örn: -22"),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 70"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 80"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 200"),
        ],
        "product_types": [
            {"value": "dikey_dondurucu", "label": "Dikey Dondurucu", "fields": None},
            {"value": "yatay_dondurucu", "label": "Yatay Dondurucu", "fields": None},
            {"value": "soklama_dondurucu", "label": "Şoklama Dondurucu", "fields": None},
            {"value": "dondurma_dondurucu", "label": "Dondurma Dondurucu", "fields": None},
        ],
    },
    "Aspiratörler": {
        "default_fields": [
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 200"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 100"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 50"),
            f("filter_type", "Filtre Tipi", "select", options=["Labirent", "Standart", "Yağ Filtreli"]),
            f("has_motor", "Motor", "select", options=["Dahili", "Harici", "Yok"]),
        ],
        "product_types": [
            {"value": "duvar_tipi_aspirator", "label": "Duvar Tipi Aspiratör", "fields": None},
            {"value": "ada_tipi_aspirator", "label": "Ada Tipi Aspiratör", "fields": None},
            {"value": "tavan_tipi_aspirator", "label": "Tavan Tipi Aspiratör", "fields": None},
            {"value": "kanalli_aspirator", "label": "Kanallı Aspiratör", "fields": None},
        ],
    },
    "Kazanlar": {
        "default_fields": [
            f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 100"),
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
            f("diameter_cm", "Çap", "number", "cm", placeholder="örn: 50"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 80"),
        ],
        "product_types": [
            {
                "value": "buhar_kazani",
                "label": "Buhar Kazanı",
                "fields": [
                    f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 100"),
                    f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
                    f("pressure_bar", "Basınç", "number", "bar", placeholder="örn: 1.5"),
                    f("diameter_cm", "Çap", "number", "cm", placeholder="örn: 50"),
                    f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 80"),
                ],
            },
            {"value": "cift_cidarli_kazan", "label": "Çift Cidarlı Kazan", "fields": None},
            {"value": "tencere_kazan", "label": "Tencere Kazan", "fields": None},
            {
                "value": "cay_kazani",
                "label": "Çay Kazanı",
                "fields": [
                    f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 40"),
                    f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
                    f("tap_count", "Musluk Sayısı", "select", options=["1", "2", "3"]),
                ],
            },
            {
                "value": "corba_kazani",
                "label": "Çorba Kazanı",
                "fields": [
                    f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 50"),
                    f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
                    f("has_mixer", "Karıştırıcı", "select", options=["Var", "Yok"]),
                    f("diameter_cm", "Çap", "number", "cm", placeholder="örn: 40"),
                ],
            },
        ],
    },
    "Kesme Makineleri": {
        "default_fields": [
            f("power_hp", "Motor Gücü", "number", "HP", placeholder="örn: 1.5"),
            f("blade_diameter_mm", "Bıçak Çapı", "number", "mm", placeholder="örn: 300"),
            f("capacity_kg_h", "Kapasite", "number", "kg/saat", placeholder="örn: 200"),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Manuel"]),
        ],
        "product_types": [
            {
                "value": "et_kiyma_makinesi",
                "label": "Et Kıyma Makinesi",
                "fields": [
                    f("power_hp", "Motor Gücü", "number", "HP", placeholder="örn: 1.5"),
                    f("capacity_kg_h", "Kapasite", "number", "kg/saat", placeholder="örn: 200"),
                    f("plate_size", "Ayna Numarası", "select", options=["22", "32", "42"]),
                    f("energy_type", "Tip", "select", options=["Elektrikli", "Manuel"]),
                ],
            },
            {
                "value": "sebze_dograma_makinesi",
                "label": "Sebze Doğrama Makinesi",
                "fields": [
                    f("power_hp", "Motor Gücü", "number", "HP", placeholder="örn: 0.5"),
                    f("capacity_kg_h", "Kapasite", "number", "kg/saat", placeholder="örn: 100"),
                    f("disc_count", "Disk Sayısı", "number", placeholder="örn: 5"),
                ],
            },
            {
                "value": "ekmek_dilimleme_makinesi",
                "label": "Ekmek Dilimleme Makinesi",
                "fields": [
                    f("blade_diameter_mm", "Bıçak Çapı", "number", "mm", placeholder="örn: 300"),
                    f("slice_thickness_mm", "Dilim Kalınlığı", "text", placeholder="örn: 1-15 mm arası"),
                    f("energy_type", "Tip", "select", options=["Elektrikli", "Manuel"]),
                ],
            },
            {
                "value": "et_dilimleme_makinesi",
                "label": "Et Dilimleme Makinesi",
                "fields": [
                    f("blade_diameter_mm", "Bıçak Çapı", "number", "mm", placeholder="örn: 300"),
                    f("cut_thickness_mm", "Kesim Kalınlığı", "text", placeholder="örn: 0-25 mm arası"),
                    f("energy_type", "Tip", "select", options=["Elektrikli", "Manuel"]),
                ],
            },
        ],
    },
    "Mikserler": {
        "default_fields": [
            f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 20"),
            f("power_hp", "Motor Gücü", "number", "HP", placeholder="örn: 1"),
            f("speed_count", "Hız Kademesi", "select", options=["1", "2", "3", "Değişken"]),
        ],
        "product_types": [
            {"value": "planet_mikser", "label": "Planet Mikser", "fields": None},
            {"value": "spiral_mikser", "label": "Spiral Mikser", "fields": None},
            {"value": "cirpma_makinesi", "label": "Çırpma Makinesi", "fields": None},
            {"value": "hamur_yogurma_makinesi", "label": "Hamur Yoğurma Makinesi", "fields": None},
        ],
    },
    "Fritözler": {
        "default_fields": [
            f("capacity_liters", "Yağ Kapasitesi", "number", "litre", placeholder="örn: 20"),
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
            f("tank_count", "Hazne Sayısı", "select", options=["1", "2"]),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 40"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 60"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
        ],
        "product_types": [
            {"value": "basincli_fritoz", "label": "Basınçlı Fritöz", "fields": None},
            {"value": "klasik_fritoz", "label": "Klasik Fritöz", "fields": None},
            {"value": "elektrikli_fritoz", "label": "Elektrikli Fritöz", "fields": None},
            {"value": "gazli_fritoz", "label": "Gazlı Fritöz", "fields": None},
        ],
    },
    "Izgaralar": {
        "default_fields": [
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli", "Kömürlü"]),
            f("cooking_area", "Pişirme Alanı", "text", placeholder="örn: 50x70 cm"),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 80"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
        ],
        "product_types": [
            {"value": "gazli_izgara", "label": "Gazlı Izgara", "fields": None},
            {"value": "elektrikli_izgara", "label": "Elektrikli Izgara", "fields": None},
            {"value": "kontakt_izgara", "label": "Kontakt Izgara", "fields": None},
            {"value": "tavuk_izgara", "label": "Tavuk Izgara", "fields": None},
        ],
    },
    "Tost Makineleri": {
        "default_fields": [
            f("plate_size", "Plaka Boyutu", "text", placeholder="örn: 30x40 cm"),
            f("plate_type", "Plaka Tipi", "select", options=["Düz", "Oluklu", "Karışık"]),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
        ],
        "product_types": [
            {"value": "sandvic_tost_makinesi", "label": "Sandviç Tost Makinesi", "fields": None},
            {"value": "krep_tost_makinesi", "label": "Krep Tost Makinesi", "fields": None},
            {"value": "panini_makinesi", "label": "Panini Makinesi", "fields": None},
        ],
    },
    "Kahve Makineleri": {
        "default_fields": [
            f("group_count", "Grup Sayısı", "select", options=["1", "2", "3", "4"]),
            f("boiler_capacity", "Kazan Kapasitesi", "number", "litre", placeholder="örn: 10"),
            f("brand", "Marka", "text", placeholder="örn: La Cimbali, Faema"),
        ],
        "product_types": [
            {"value": "espresso_makinesi", "label": "Espresso Makinesi", "fields": None},
            {"value": "filtre_kahve_makinesi", "label": "Filtre Kahve Makinesi", "fields": None},
            {"value": "turk_kahvesi_makinesi", "label": "Türk Kahvesi Makinesi", "fields": None},
            {"value": "otomatik_kahve_makinesi", "label": "Otomatik Kahve Makinesi", "fields": None},
        ],
    },
    "Çay Kazanları": {
        "default_fields": [
            f("capacity_liters", "Kapasite", "number", "litre", placeholder="örn: 40"),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
            f("tap_count", "Musluk Sayısı", "select", options=["1", "2", "3"]),
        ],
        "product_types": [
            {"value": "elektrikli_cay_kazani", "label": "Elektrikli Çay Kazanı", "fields": None},
            {"value": "gazli_cay_kazani", "label": "Gazlı Çay Kazanı", "fields": None},
            {"value": "termos_cay_kazani", "label": "Termos Çay Kazanı", "fields": None},
        ],
    },
    "Bulaşık Makineleri": {
        "default_fields": [
            f("capacity_basket_h", "Kapasite", "number", "sepet/saat", placeholder="örn: 40"),
            f("wash_type", "Yıkama Tipi", "select", options=["Giyotin", "Tünel", "Tezgah Altı"]),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 60"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 60"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 140"),
        ],
        "product_types": [
            {"value": "bulasik_yikama_makinesi", "label": "Bulaşık Yıkama Makinesi", "fields": None},
            {"value": "bulasik_kurutma_makinesi", "label": "Bulaşık Kurutma Makinesi", "fields": None},
            {"value": "tunel_tipi_bulasik_makinesi", "label": "Tünel Tipi Bulaşık Makinesi", "fields": None},
        ],
    },
    "Ekmek Kızartma Makineleri": {
        "default_fields": [
            f("slice_capacity", "Dilim Kapasitesi", "number", placeholder="örn: 6"),
            f("conveyor_type", "Tip", "select", options=["Konveyörlü", "Klasik", "Salamander"]),
        ],
        "product_types": [
            {"value": "ekmek_kizartma_makinesi", "label": "Ekmek Kızartma Makinesi", "fields": None},
            {"value": "coklu_ekmek_kizartma_makinesi", "label": "Çoklu Ekmek Kızartma Makinesi", "fields": None},
        ],
    },
    "Döner Makineleri": {
        "default_fields": [
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli"]),
            f("capacity_kg", "Et Kapasitesi", "number", "kg", placeholder="örn: 60"),
            f("burner_count", "Radyan Sayısı", "number", placeholder="örn: 4"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 120"),
        ],
        "product_types": [
            {"value": "elektrikli_doner_makinesi", "label": "Elektrikli Döner Makinesi", "fields": None},
            {"value": "gazli_doner_makinesi", "label": "Gazlı Döner Makinesi", "fields": None},
            {"value": "dikey_doner_makinesi", "label": "Dikey Döner Makinesi", "fields": None},
        ],
    },
    "Pizza Fırınları": {
        "default_fields": [
            f("energy_type", "Enerji Tipi", "select", options=["Gazlı", "Elektrikli", "Odunlu"]),
            f("pizza_capacity", "Pizza Kapasitesi", "number", placeholder="örn: 4"),
            f("pizza_diameter_cm", "Max Pizza Çapı", "number", "cm", placeholder="örn: 33"),
            f("deck_count", "Kat Sayısı", "select", options=["1", "2", "3"]),
        ],
        "product_types": [
            {"value": "tas_firin", "label": "Taş Fırın", "fields": None},
            {"value": "elektrikli_pizza_firini", "label": "Elektrikli Pizza Fırını", "fields": None},
            {"value": "tunel_pizza_firini", "label": "Tünel Pizza Fırını", "fields": None},
        ],
    },
    "Krep Makineleri": {
        "default_fields": [
            f("plate_diameter_cm", "Plaka Çapı", "number", "cm", placeholder="örn: 40"),
            f("plate_count", "Plaka Sayısı", "select", options=["1", "2"]),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
        ],
        "product_types": [
            {"value": "krep_tavasi", "label": "Krep Tavası", "fields": None},
            {"value": "elektrikli_krep_makinesi", "label": "Elektrikli Krep Makinesi", "fields": None},
            {"value": "gazli_krep_makinesi", "label": "Gazlı Krep Makinesi", "fields": None},
        ],
    },
    "Waffle Makineleri": {
        "default_fields": [
            f("mold_count", "Kalıp Sayısı", "number", placeholder="örn: 2"),
            f("mold_shape", "Kalıp Şekli", "select", options=["Kare", "Yuvarlak", "Kalpli"]),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
        ],
        "product_types": [
            {"value": "elektrikli_waffle_makinesi", "label": "Elektrikli Waffle Makinesi", "fields": None},
            {"value": "gazli_waffle_makinesi", "label": "Gazlı Waffle Makinesi", "fields": None},
        ],
    },
    "Raflar": {
        "default_fields": [
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 120"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 40"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 180"),
            f("shelf_count", "Raf Sayısı", "select", options=["2", "3", "4", "5"]),
            f("load_capacity_kg", "Yük Kapasitesi", "number", "kg", placeholder="örn: 150"),
        ],
        "product_types": [
            {"value": "duz_raf", "label": "Düz Raf", "fields": None},
            {"value": "kose_raf", "label": "Köşe Raf", "fields": None},
            {"value": "duvar_rafi", "label": "Duvar Rafı", "fields": None},
            {"value": "delikli_raf", "label": "Delikli Raf", "fields": None},
        ],
    },
    "Benmari": {
        "default_fields": [
            f("compartment_count", "Göz Sayısı", "select", options=["1", "2", "3", "4", "5", "6"]),
            f("energy_type", "Enerji Tipi", "select", options=["Elektrikli", "Gazlı"]),
            f("heating_type", "Isıtma Tipi", "select", options=["Kuru", "Sulu"]),
            f("length_cm", "Uzunluk", "number", "cm", placeholder="örn: 120"),
            f("width_cm", "Genişlik", "number", "cm", placeholder="örn: 70"),
            f("height_cm", "Yükseklik", "number", "cm", placeholder="örn: 85"),
        ],
        "product_types": [
            {"value": "elektrikli_benmari", "label": "Elektrikli Benmari", "fields": None},
            {"value": "gazli_benmari", "label": "Gazlı Benmari", "fields": None},
            {"value": "kuru_benmari", "label": "Kuru Benmari", "fields": None},
            {"value": "sulu_benmari", "label": "Sulu Benmari", "fields": None},
        ],
    },
}


def main():
    updated = 0
    not_found = 0

    for doc in categories_col.find():
        name = doc.get("name", "")
        seed = SEED_DATA.get(name)
        if seed:
            # Convert product_types: remove "fields" key if None for MongoDB (or keep as null)
            product_types = []
            for pt in seed["product_types"]:
                p = {"value": pt["value"], "label": pt["label"]}
                if pt.get("fields") is not None:
                    p["fields"] = pt["fields"]
                else:
                    p["fields"] = None
                product_types.append(p)

            categories_col.update_one(
                {"id": doc["id"]},
                {
                    "$set": {
                        "product_types": product_types,
                        "default_fields": seed["default_fields"],
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            print(f"[OK] {name}")
            updated += 1
        else:
            print(f"[SKIP] {name}: şablonda karşılığı yok")
            not_found += 1

    print(f"\nToplam: {updated} kategori güncellendi, {not_found} eşleşmedi")


if __name__ == "__main__":
    main()
