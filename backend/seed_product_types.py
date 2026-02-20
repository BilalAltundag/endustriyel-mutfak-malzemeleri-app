"""Mevcut kategorilere product_types ekleyen tek seferlik script."""
from database import categories_col
from datetime import datetime

SEED_PRODUCT_TYPES = {
    "Evyeler": [
        {"value": "tek_gozlu_evye", "label": "Tek Gözlü Evye"},
        {"value": "cift_gozlu_evye", "label": "Çift Gözlü Evye"},
        {"value": "uc_gozlu_evye", "label": "Üç Gözlü Evye"},
        {"value": "damlalikli_evye", "label": "Damlalıklı Evye"},
        {"value": "kose_evye", "label": "Köşe Evye"},
    ],
    "Arabalar": [
        {"value": "pilav_arabasi", "label": "Pilav Arabası"},
        {"value": "kokorec_arabasi", "label": "Kokoreç Arabası"},
        {"value": "tantuni_arabasi", "label": "Tantuni Arabası"},
        {"value": "doner_arabasi", "label": "Döner Arabası"},
        {"value": "servis_arabasi", "label": "Servis Arabası"},
        {"value": "tasima_arabasi", "label": "Taşıma Arabası"},
    ],
    "Fırınlar": [
        {"value": "konveksiyonlu_firin", "label": "Konveksiyonlu Fırın"},
        {"value": "pastane_firini", "label": "Pastane Fırını"},
        {"value": "pizza_firini", "label": "Pizza Fırını"},
        {"value": "doner_firini", "label": "Döner Fırını"},
        {"value": "tunnel_firin", "label": "Tünel Fırın"},
        {"value": "rotary_firin", "label": "Rotary Fırın"},
    ],
    "Ocaklar": [
        {"value": "gazli_ocak", "label": "Gazlı Ocak"},
        {"value": "elektrikli_ocak", "label": "Elektrikli Ocak"},
        {"value": "induksiyonlu_ocak", "label": "İndüksiyonlu Ocak"},
        {"value": "wok_ocagi", "label": "Wok Ocağı"},
        {"value": "pasta_ocagi", "label": "Pasta Ocağı"},
        {"value": "krep_ocagi", "label": "Krep Ocağı"},
    ],
    "Tezgahlar": [
        {"value": "paslanmaz_celik_tezgah", "label": "Paslanmaz Çelik Tezgah"},
        {"value": "granit_tezgah", "label": "Granit Tezgah"},
        {"value": "mermer_tezgah", "label": "Mermer Tezgah"},
        {"value": "kesme_tezgahi", "label": "Kesme Tezgahı"},
        {"value": "hazirlik_tezgahi", "label": "Hazırlık Tezgahı"},
    ],
    "Buzdolapları": [
        {"value": "tek_kapili_buzdolabi", "label": "Tek Kapılı Buzdolabı"},
        {"value": "cift_kapili_buzdolabi", "label": "Çift Kapılı Buzdolabı"},
        {"value": "dikey_donduruculu_buzdolabi", "label": "Dikey Donduruculu Buzdolabı"},
        {"value": "soklama_buzdolabi", "label": "Şoklama Buzdolabı"},
        {"value": "vitrini_buzdolabi", "label": "Vitrinli Buzdolabı"},
    ],
    "Dondurucular": [
        {"value": "dikey_dondurucu", "label": "Dikey Dondurucu"},
        {"value": "yatay_dondurucu", "label": "Yatay Dondurucu"},
        {"value": "soklama_dondurucu", "label": "Şoklama Dondurucu"},
        {"value": "dondurma_dondurucu", "label": "Dondurma Dondurucu"},
    ],
    "Aspiratörler": [
        {"value": "duvar_tipi_aspirator", "label": "Duvar Tipi Aspiratör"},
        {"value": "ada_tipi_aspirator", "label": "Ada Tipi Aspiratör"},
        {"value": "tavan_tipi_aspirator", "label": "Tavan Tipi Aspiratör"},
        {"value": "kanalli_aspirator", "label": "Kanallı Aspiratör"},
    ],
    "Kazanlar": [
        {"value": "buhar_kazani", "label": "Buhar Kazanı"},
        {"value": "cift_cidarli_kazan", "label": "Çift Cidarlı Kazan"},
        {"value": "tencere_kazan", "label": "Tencere Kazan"},
        {"value": "cay_kazani", "label": "Çay Kazanı"},
        {"value": "corba_kazani", "label": "Çorba Kazanı"},
    ],
    "Kesme Makineleri": [
        {"value": "et_kiyma_makinesi", "label": "Et Kıyma Makinesi"},
        {"value": "sebze_dograma_makinesi", "label": "Sebze Doğrama Makinesi"},
        {"value": "ekmek_dilimleme_makinesi", "label": "Ekmek Dilimleme Makinesi"},
        {"value": "et_dilimleme_makinesi", "label": "Et Dilimleme Makinesi"},
    ],
    "Mikserler": [
        {"value": "planet_mikser", "label": "Planet Mikser"},
        {"value": "spiral_mikser", "label": "Spiral Mikser"},
        {"value": "cirpma_makinesi", "label": "Çırpma Makinesi"},
        {"value": "hamur_yogurma_makinesi", "label": "Hamur Yoğurma Makinesi"},
    ],
    "Fritözler": [
        {"value": "basincli_fritoz", "label": "Basınçlı Fritöz"},
        {"value": "klasik_fritoz", "label": "Klasik Fritöz"},
        {"value": "elektrikli_fritoz", "label": "Elektrikli Fritöz"},
        {"value": "gazli_fritoz", "label": "Gazlı Fritöz"},
    ],
    "Izgaralar": [
        {"value": "gazli_izgara", "label": "Gazlı Izgara"},
        {"value": "elektrikli_izgara", "label": "Elektrikli Izgara"},
        {"value": "kontakt_izgara", "label": "Kontakt Izgara"},
        {"value": "tavuk_izgara", "label": "Tavuk Izgara"},
    ],
    "Tost Makineleri": [
        {"value": "sandvic_tost_makinesi", "label": "Sandviç Tost Makinesi"},
        {"value": "krep_tost_makinesi", "label": "Krep Tost Makinesi"},
        {"value": "panini_makinesi", "label": "Panini Makinesi"},
    ],
    "Kahve Makineleri": [
        {"value": "espresso_makinesi", "label": "Espresso Makinesi"},
        {"value": "filtre_kahve_makinesi", "label": "Filtre Kahve Makinesi"},
        {"value": "turk_kahvesi_makinesi", "label": "Türk Kahvesi Makinesi"},
        {"value": "otomatik_kahve_makinesi", "label": "Otomatik Kahve Makinesi"},
    ],
    "Çay Kazanları": [
        {"value": "elektrikli_cay_kazani", "label": "Elektrikli Çay Kazanı"},
        {"value": "gazli_cay_kazani", "label": "Gazlı Çay Kazanı"},
        {"value": "termos_cay_kazani", "label": "Termos Çay Kazanı"},
    ],
    "Bulaşık Makineleri": [
        {"value": "bulasik_yikama_makinesi", "label": "Bulaşık Yıkama Makinesi"},
        {"value": "bulasik_kurutma_makinesi", "label": "Bulaşık Kurutma Makinesi"},
        {"value": "tunel_tipi_bulasik_makinesi", "label": "Tünel Tipi Bulaşık Makinesi"},
    ],
    "Ekmek Kızartma Makineleri": [
        {"value": "ekmek_kizartma_makinesi", "label": "Ekmek Kızartma Makinesi"},
        {"value": "coklu_ekmek_kizartma_makinesi", "label": "Çoklu Ekmek Kızartma Makinesi"},
    ],
    "Döner Makineleri": [
        {"value": "elektrikli_doner_makinesi", "label": "Elektrikli Döner Makinesi"},
        {"value": "gazli_doner_makinesi", "label": "Gazlı Döner Makinesi"},
        {"value": "dikey_doner_makinesi", "label": "Dikey Döner Makinesi"},
    ],
    "Pizza Fırınları": [
        {"value": "tas_firin", "label": "Taş Fırın"},
        {"value": "elektrikli_pizza_firini", "label": "Elektrikli Pizza Fırını"},
        {"value": "tunel_pizza_firini", "label": "Tünel Pizza Fırını"},
    ],
    "Krep Makineleri": [
        {"value": "krep_tavasi", "label": "Krep Tavası"},
        {"value": "elektrikli_krep_makinesi", "label": "Elektrikli Krep Makinesi"},
        {"value": "gazli_krep_makinesi", "label": "Gazlı Krep Makinesi"},
    ],
    "Waffle Makineleri": [
        {"value": "elektrikli_waffle_makinesi", "label": "Elektrikli Waffle Makinesi"},
        {"value": "gazli_waffle_makinesi", "label": "Gazlı Waffle Makinesi"},
    ],
    "Raflar": [
        {"value": "duz_raf", "label": "Düz Raf"},
        {"value": "kose_raf", "label": "Köşe Raf"},
        {"value": "duvar_rafi", "label": "Duvar Rafı"},
        {"value": "delikli_raf", "label": "Delikli Raf"},
    ],
    "Benmari": [
        {"value": "elektrikli_benmari", "label": "Elektrikli Benmari"},
        {"value": "gazli_benmari", "label": "Gazlı Benmari"},
        {"value": "kuru_benmari", "label": "Kuru Benmari"},
        {"value": "sulu_benmari", "label": "Sulu Benmari"},
    ],
}

if __name__ == "__main__":
    updated = 0
    not_found = 0

    for doc in categories_col.find():
        name = doc.get("name", "")
        types = SEED_PRODUCT_TYPES.get(name)
        if types:
            categories_col.update_one(
                {"id": doc["id"]},
                {"$set": {"product_types": types, "updated_at": datetime.utcnow()}},
            )
            print(f"[OK] {name}: {len(types)} ürün çeşidi eklendi")
            updated += 1
        else:
            print(f"[SKIP] {name}: şablonda karşılığı yok")
            not_found += 1

    print(f"\nToplam: {updated} kategori güncellendi, {not_found} eşleşmedi")
