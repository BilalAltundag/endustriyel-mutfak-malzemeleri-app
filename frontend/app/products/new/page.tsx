'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Upload, X, Loader2, AlertCircle, CheckCircle2, Mic, MicOff, Camera } from 'lucide-react'
import Link from 'next/link'
import { productsApi, categoriesApi, aiApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

// ============================================================
// Kategori bazlı teknik özellik alanları
// Her kategorideki tüm ürün çeşitleri aynı teknik alanları paylaşır
// ============================================================

interface SpecField {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  unit?: string
  placeholder?: string
}

interface ProductType {
  value: string
  label: string
}

interface CategoryTemplate {
  types: ProductType[]
  fields: SpecField[]
}

const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  Evyeler: {
    types: [
      { value: 'tek_gozlu_evye', label: 'Tek Gözlü Evye' },
      { value: 'cift_gozlu_evye', label: 'Çift Gözlü Evye' },
      { value: 'uc_gozlu_evye', label: 'Üç Gözlü Evye' },
      { value: 'damlalikli_evye', label: 'Damlalıklı Evye' },
      { value: 'kose_evye', label: 'Köşe Evye' },
    ],
    fields: [
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 60' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
      { name: 'depth_cm', label: 'Göz Derinliği', type: 'number', unit: 'cm', placeholder: 'örn: 30' },
      { name: 'basin_count', label: 'Göz Sayısı', type: 'select', options: ['1', '2', '3'] },
      { name: 'has_drainboard', label: 'Damlalık', type: 'select', options: ['Var', 'Yok'] },
      { name: 'thickness_mm', label: 'Sac Kalınlığı', type: 'number', unit: 'mm', placeholder: 'örn: 0.8' },
    ],
  },
  Arabalar: {
    types: [
      { value: 'pilav_arabasi', label: 'Pilav Arabası' },
      { value: 'kokorec_arabasi', label: 'Kokoreç Arabası' },
      { value: 'tantuni_arabasi', label: 'Tantuni Arabası' },
      { value: 'doner_arabasi', label: 'Döner Arabası' },
      { value: 'servis_arabasi', label: 'Servis Arabası' },
      { value: 'tasima_arabasi', label: 'Taşıma Arabası' },
    ],
    fields: [
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 150' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
      { name: 'energy_type', label: 'Isıtma Tipi', type: 'select', options: ['Tüplü', 'Doğalgaz', 'Elektrikli', 'Yok'] },
      { name: 'has_glass', label: 'Cam', type: 'select', options: ['Var', 'Yok'] },
      { name: 'wheel_count', label: 'Teker Sayısı', type: 'select', options: ['2', '4'] },
    ],
  },
  Fırınlar: {
    types: [
      { value: 'konveksiyonlu_firin', label: 'Konveksiyonlu Fırın' },
      { value: 'pastane_firini', label: 'Pastane Fırını' },
      { value: 'pizza_firini', label: 'Pizza Fırını' },
      { value: 'doner_firini', label: 'Döner Fırını' },
      { value: 'tunnel_firin', label: 'Tünel Fırın' },
      { value: 'rotary_firin', label: 'Rotary Fırın' },
    ],
    fields: [
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
      { name: 'tray_count', label: 'Tepsi Sayısı', type: 'number', placeholder: 'örn: 10' },
      { name: 'tray_size', label: 'Tepsi Ölçüsü', type: 'text', placeholder: 'örn: 40x60, 60x80' },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 170' },
    ],
  },
  Ocaklar: {
    types: [
      { value: 'gazli_ocak', label: 'Gazlı Ocak' },
      { value: 'elektrikli_ocak', label: 'Elektrikli Ocak' },
      { value: 'induksiyonlu_ocak', label: 'İndüksiyonlu Ocak' },
      { value: 'wok_ocagi', label: 'Wok Ocağı' },
      { value: 'pasta_ocagi', label: 'Pasta Ocağı' },
      { value: 'krep_ocagi', label: 'Krep Ocağı' },
    ],
    fields: [
      { name: 'burner_count', label: 'Göz Sayısı', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli', 'İndüksiyon'] },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
    ],
  },
  Tezgahlar: {
    types: [
      { value: 'paslanmaz_celik_tezgah', label: 'Paslanmaz Çelik Tezgah' },
      { value: 'granit_tezgah', label: 'Granit Tezgah' },
      { value: 'mermer_tezgah', label: 'Mermer Tezgah' },
      { value: 'kesme_tezgahi', label: 'Kesme Tezgahı' },
      { value: 'hazirlik_tezgahi', label: 'Hazırlık Tezgahı' },
    ],
    fields: [
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 150' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
      { name: 'has_bottom_shelf', label: 'Alt Raf', type: 'select', options: ['Var', 'Yok'] },
      { name: 'has_backsplash', label: 'Arka Sıçrama Kenarı', type: 'select', options: ['Var', 'Yok'] },
      { name: 'thickness_mm', label: 'Sac Kalınlığı', type: 'number', unit: 'mm', placeholder: 'örn: 1.0' },
    ],
  },
  Buzdolapları: {
    types: [
      { value: 'tek_kapili_buzdolabi', label: 'Tek Kapılı Buzdolabı' },
      { value: 'cift_kapili_buzdolabi', label: 'Çift Kapılı Buzdolabı' },
      { value: 'dikey_donduruculu_buzdolabi', label: 'Dikey Donduruculu Buzdolabı' },
      { value: 'soklama_buzdolabi', label: 'Şoklama Buzdolabı' },
      { value: 'vitrini_buzdolabi', label: 'Vitrini Buzdolabı' },
    ],
    fields: [
      { name: 'volume_liters', label: 'Hacim', type: 'number', unit: 'litre', placeholder: 'örn: 600' },
      { name: 'door_count', label: 'Kapı Sayısı', type: 'select', options: ['1', '2', '3', '4'] },
      { name: 'cooling_type', label: 'Soğutma Tipi', type: 'select', options: ['Statik', 'Fan (No-Frost)'] },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
    ],
  },
  Dondurucular: {
    types: [
      { value: 'dikey_dondurucu', label: 'Dikey Dondurucu' },
      { value: 'yatay_dondurucu', label: 'Yatay Dondurucu' },
      { value: 'soklama_dondurucu', label: 'Şoklama Dondurucu' },
      { value: 'dondurma_dondurucu', label: 'Dondurma Dondurucu' },
    ],
    fields: [
      { name: 'volume_liters', label: 'Hacim', type: 'number', unit: 'litre', placeholder: 'örn: 500' },
      { name: 'temperature_min', label: 'Min. Sıcaklık', type: 'number', unit: '°C', placeholder: 'örn: -22' },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
    ],
  },
  Aspiratörler: {
    types: [
      { value: 'duvar_tipi_aspirator', label: 'Duvar Tipi Aspiratör' },
      { value: 'ada_tipi_aspirator', label: 'Ada Tipi Aspiratör' },
      { value: 'tavan_tipi_aspirator', label: 'Tavan Tipi Aspiratör' },
      { value: 'kanalli_aspirator', label: 'Kanallı Aspiratör' },
    ],
    fields: [
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 100' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
      { name: 'filter_type', label: 'Filtre Tipi', type: 'select', options: ['Labirent', 'Standart', 'Yağ Filtreli'] },
      { name: 'has_motor', label: 'Motor', type: 'select', options: ['Dahili', 'Harici', 'Yok'] },
    ],
  },
  Kazanlar: {
    types: [
      { value: 'buhar_kazani', label: 'Buhar Kazanı' },
      { value: 'cift_cidarli_kazan', label: 'Çift Cidarlı Kazan' },
      { value: 'tencere_kazan', label: 'Tencere Kazan' },
      { value: 'cay_kazani', label: 'Çay Kazanı' },
      { value: 'corba_kazani', label: 'Çorba Kazanı' },
    ],
    fields: [
      { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 100' },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
      { name: 'diameter_cm', label: 'Çap', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
    ],
  },
  'Kesme Makineleri': {
    types: [
      { value: 'et_kiyma_makinesi', label: 'Et Kıyma Makinesi' },
      { value: 'sebze_dograma_makinesi', label: 'Sebze Doğrama Makinesi' },
      { value: 'ekmek_dilimleme_makinesi', label: 'Ekmek Dilimleme Makinesi' },
      { value: 'et_dilimleme_makinesi', label: 'Et Dilimleme Makinesi' },
    ],
    fields: [
      { name: 'power_hp', label: 'Motor Gücü', type: 'number', unit: 'HP', placeholder: 'örn: 1.5' },
      { name: 'blade_diameter_mm', label: 'Bıçak Çapı', type: 'number', unit: 'mm', placeholder: 'örn: 300' },
      { name: 'capacity_kg_h', label: 'Kapasite', type: 'number', unit: 'kg/saat', placeholder: 'örn: 200' },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Manuel'] },
    ],
  },
  Mikserler: {
    types: [
      { value: 'planet_mikser', label: 'Planet Mikser' },
      { value: 'spiral_mikser', label: 'Spiral Mikser' },
      { value: 'cirpma_makinesi', label: 'Çırpma Makinesi' },
      { value: 'hamur_yogurma_makinesi', label: 'Hamur Yoğurma Makinesi' },
    ],
    fields: [
      { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 20' },
      { name: 'power_hp', label: 'Motor Gücü', type: 'number', unit: 'HP', placeholder: 'örn: 1' },
      { name: 'speed_count', label: 'Hız Kademesi', type: 'select', options: ['1', '2', '3', 'Değişken'] },
    ],
  },
  Fritözler: {
    types: [
      { value: 'basincli_fritoz', label: 'Basınçlı Fritöz' },
      { value: 'klasik_fritoz', label: 'Klasik Fritöz' },
      { value: 'elektrikli_fritoz', label: 'Elektrikli Fritöz' },
      { value: 'gazli_fritoz', label: 'Gazlı Fritöz' },
    ],
    fields: [
      { name: 'capacity_liters', label: 'Yağ Kapasitesi', type: 'number', unit: 'litre', placeholder: 'örn: 20' },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
      { name: 'tank_count', label: 'Hazne Sayısı', type: 'select', options: ['1', '2'] },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 60' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
    ],
  },
  Izgaralar: {
    types: [
      { value: 'gazli_izgara', label: 'Gazlı Izgara' },
      { value: 'elektrikli_izgara', label: 'Elektrikli Izgara' },
      { value: 'kontakt_izgara', label: 'Kontakt Izgara' },
      { value: 'tavuk_izgara', label: 'Tavuk Izgara' },
    ],
    fields: [
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli', 'Kömürlü'] },
      { name: 'cooking_area', label: 'Pişirme Alanı', type: 'text', placeholder: 'örn: 50x70 cm' },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
    ],
  },
  'Tost Makineleri': {
    types: [
      { value: 'sandvic_tost_makinesi', label: 'Sandviç Tost Makinesi' },
      { value: 'krep_tost_makinesi', label: 'Krep Tost Makinesi' },
      { value: 'panini_makinesi', label: 'Panini Makinesi' },
    ],
    fields: [
      { name: 'plate_size', label: 'Plaka Boyutu', type: 'text', placeholder: 'örn: 30x40 cm' },
      { name: 'plate_type', label: 'Plaka Tipi', type: 'select', options: ['Düz', 'Oluklu', 'Karışık'] },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
    ],
  },
  'Kahve Makineleri': {
    types: [
      { value: 'espresso_makinesi', label: 'Espresso Makinesi' },
      { value: 'filtre_kahve_makinesi', label: 'Filtre Kahve Makinesi' },
      { value: 'turk_kahvesi_makinesi', label: 'Türk Kahvesi Makinesi' },
      { value: 'otomatik_kahve_makinesi', label: 'Otomatik Kahve Makinesi' },
    ],
    fields: [
      { name: 'group_count', label: 'Grup Sayısı', type: 'select', options: ['1', '2', '3', '4'] },
      { name: 'boiler_capacity', label: 'Kazan Kapasitesi', type: 'number', unit: 'litre', placeholder: 'örn: 10' },
      { name: 'brand', label: 'Marka', type: 'text', placeholder: 'örn: La Cimbali, Faema' },
    ],
  },
  'Çay Kazanları': {
    types: [
      { value: 'elektrikli_cay_kazani', label: 'Elektrikli Çay Kazanı' },
      { value: 'gazli_cay_kazani', label: 'Gazlı Çay Kazanı' },
      { value: 'termos_cay_kazani', label: 'Termos Çay Kazanı' },
    ],
    fields: [
      { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 40' },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
      { name: 'tap_count', label: 'Musluk Sayısı', type: 'select', options: ['1', '2', '3'] },
    ],
  },
  'Bulaşık Makineleri': {
    types: [
      { value: 'bulasik_yikama_makinesi', label: 'Bulaşık Yıkama Makinesi' },
      { value: 'bulasik_kurutma_makinesi', label: 'Bulaşık Kurutma Makinesi' },
      { value: 'tunel_tipi_bulasik_makinesi', label: 'Tünel Tipi Bulaşık Makinesi' },
    ],
    fields: [
      { name: 'capacity_basket_h', label: 'Kapasite', type: 'number', unit: 'sepet/saat', placeholder: 'örn: 40' },
      { name: 'wash_type', label: 'Yıkama Tipi', type: 'select', options: ['Giyotin', 'Tünel', 'Tezgah Altı'] },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 60' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 60' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 140' },
    ],
  },
  'Ekmek Kızartma Makineleri': {
    types: [
      { value: 'ekmek_kizartma_makinesi', label: 'Ekmek Kızartma Makinesi' },
      { value: 'coklu_ekmek_kizartma_makinesi', label: 'Çoklu Ekmek Kızartma Makinesi' },
    ],
    fields: [
      { name: 'slice_capacity', label: 'Dilim Kapasitesi', type: 'number', placeholder: 'örn: 6' },
      { name: 'conveyor_type', label: 'Tip', type: 'select', options: ['Konveyörlü', 'Klasik', 'Salamander'] },
    ],
  },
  'Döner Makineleri': {
    types: [
      { value: 'elektrikli_doner_makinesi', label: 'Elektrikli Döner Makinesi' },
      { value: 'gazli_doner_makinesi', label: 'Gazlı Döner Makinesi' },
      { value: 'dikey_doner_makinesi', label: 'Dikey Döner Makinesi' },
    ],
    fields: [
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
      { name: 'capacity_kg', label: 'Et Kapasitesi', type: 'number', unit: 'kg', placeholder: 'örn: 60' },
      { name: 'burner_count', label: 'Radyan Sayısı', type: 'number', placeholder: 'örn: 4' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
    ],
  },
  'Pizza Fırınları': {
    types: [
      { value: 'tas_firin', label: 'Taş Fırın' },
      { value: 'elektrikli_pizza_firini', label: 'Elektrikli Pizza Fırını' },
      { value: 'tunel_pizza_firini', label: 'Tünel Pizza Fırını' },
    ],
    fields: [
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli', 'Odunlu'] },
      { name: 'pizza_capacity', label: 'Pizza Kapasitesi', type: 'number', placeholder: 'örn: 4' },
      { name: 'pizza_diameter_cm', label: 'Max Pizza Çapı', type: 'number', unit: 'cm', placeholder: 'örn: 33' },
      { name: 'deck_count', label: 'Kat Sayısı', type: 'select', options: ['1', '2', '3'] },
    ],
  },
  'Krep Makineleri': {
    types: [
      { value: 'krep_tavasi', label: 'Krep Tavası' },
      { value: 'elektrikli_krep_makinesi', label: 'Elektrikli Krep Makinesi' },
      { value: 'gazli_krep_makinesi', label: 'Gazlı Krep Makinesi' },
    ],
    fields: [
      { name: 'plate_diameter_cm', label: 'Plaka Çapı', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
      { name: 'plate_count', label: 'Plaka Sayısı', type: 'select', options: ['1', '2'] },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
    ],
  },
  'Waffle Makineleri': {
    types: [
      { value: 'elektrikli_waffle_makinesi', label: 'Elektrikli Waffle Makinesi' },
      { value: 'gazli_waffle_makinesi', label: 'Gazlı Waffle Makinesi' },
    ],
    fields: [
      { name: 'mold_count', label: 'Kalıp Sayısı', type: 'number', placeholder: 'örn: 2' },
      { name: 'mold_shape', label: 'Kalıp Şekli', type: 'select', options: ['Kare', 'Yuvarlak', 'Kalpli'] },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
    ],
  },
  Raflar: {
    types: [
      { value: 'duz_raf', label: 'Düz Raf' },
      { value: 'kose_raf', label: 'Köşe Raf' },
      { value: 'duvar_rafi', label: 'Duvar Rafı' },
      { value: 'delikli_raf', label: 'Delikli Raf' },
    ],
    fields: [
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 180' },
      { name: 'shelf_count', label: 'Raf Sayısı', type: 'select', options: ['2', '3', '4', '5'] },
      { name: 'load_capacity_kg', label: 'Yük Kapasitesi', type: 'number', unit: 'kg', placeholder: 'örn: 150' },
    ],
  },
  Benmari: {
    types: [
      { value: 'elektrikli_benmari', label: 'Elektrikli Benmari' },
      { value: 'gazli_benmari', label: 'Gazlı Benmari' },
      { value: 'kuru_benmari', label: 'Kuru Benmari' },
      { value: 'sulu_benmari', label: 'Sulu Benmari' },
    ],
    fields: [
      { name: 'compartment_count', label: 'Göz Sayısı', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
      { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
      { name: 'heating_type', label: 'Isıtma Tipi', type: 'select', options: ['Kuru', 'Sulu'] },
      { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
      { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
      { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
    ],
  },
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProductType, setSelectedProductType] = useState<string>('')
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    purchase_price: '',
    sale_price: '',
    negotiation_margin: '',
    negotiation_type: 'amount',
    material: '',
    status: 'working',
    stock_status: 'available',
    notes: '',
  })

  // ─── AI Assist State ───
  const [aiImages, setAiImages] = useState<File[]>([])
  const [aiImagePreviews, setAiImagePreviews] = useState<string[]>([])
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)
  const [aiWarnings, setAiWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // ─── Ses Kayıt State (MediaRecorder + Whisper) ───
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(true)
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Seçili kategorinin template'ini bul
  const getTemplateForCategory = () => {
    if (!formData.category_id) return null
    const selectedCategory = categories.find(
      (cat) => cat.id === parseInt(formData.category_id)
    )
    if (!selectedCategory) return null
    return CATEGORY_TEMPLATES[selectedCategory.name] || null
  }

  const template = getTemplateForCategory()

  // ─── Ses Kayıt Kontrol ───
  const toggleRecording = useCallback(async () => {
    if (isRecording && mediaRecorderRef.current) {
      // Kaydı durdur
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
      // Kayda başla
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          // Stream'i kapat
          stream.getTracks().forEach((track) => track.stop())

          // Blob oluştur ve Whisper'a gönder
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          if (audioBlob.size < 100) return

          setIsTranscribing(true)
          try {
            const response = await aiApi.transcribe(audioBlob)
            const text = response.data?.text || ''
            if (text) {
              setAiDescription((prev) => (prev ? prev + ' ' + text : text))
            }
          } catch (err: any) {
            console.error('Transcription error:', err)
            setAiError('Ses çevirme hatası: ' + (err.response?.data?.detail || err.message))
          } finally {
            setIsTranscribing(false)
          }
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
      } catch (err) {
        console.error('Mikrofon erişim hatası:', err)
        setAiError('Mikrofon erişimi reddedildi. Lütfen izin verin.')
      }
    }
  }, [isRecording])

  // ─── AI Resim Yükleme ───
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setAiImages((prev) => [...prev, ...files])

    // Preview oluştur
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAiImagePreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setAiImages((prev) => prev.filter((_, i) => i !== index))
    setAiImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // ─── AI ile Form Doldurma ───
  const handleAiFill = async () => {
    if (!aiDescription.trim()) {
      setAiError('Lütfen ürün açıklaması yazın')
      return
    }

    setAiLoading(true)
    setAiError('')
    setAiSuccess(false)
    setAiWarnings([])

    try {
      const response = await aiApi.analyze(aiImages, aiDescription)
      const data = response.data

      if (data.status === 'error') {
        setAiError(data.errors?.join('. ') || 'AI analiz hatası')
        return
      }

      const form = data.product_form
      if (!form) {
        setAiError('AI sonuç döndüremedi')
        return
      }

      // ─── 1. Kategoriyi bul ve seç ───
      const categoryName = form.category_name || ''
      const matchedCategory = categoryName
        ? categories.find((cat) => cat.name === categoryName)
        : null

      if (matchedCategory) {
        setFormData((prev) => ({
          ...prev,
          category_id: String(matchedCategory.id),
          name: form.name || '',
          purchase_price: form.purchase_price != null ? String(form.purchase_price) : '',
          sale_price: form.sale_price != null ? String(form.sale_price) : '',
          negotiation_margin: form.negotiation_margin != null ? String(form.negotiation_margin) : '',
          negotiation_type: form.negotiation_type || 'amount',
          material: form.material || '',
          notes: form.notes || '',
        }))

        // ─── 2. Ürün çeşidini seç ───
        const catTemplate = CATEGORY_TEMPLATES[categoryName]
        if (catTemplate && form.product_type_value) {
          const matchedType = catTemplate.types.find(
            (t) => t.value === form.product_type_value
          )
          if (matchedType) {
            setSelectedProductType(matchedType.value)
            // Ürün adını ayarla (eğer AI'dan gelmediyse template'den al)
            if (!form.name) {
              setFormData((prev) => ({
                ...prev,
                name: matchedType.label,
              }))
            }
          } else {
            setSelectedProductType(form.product_type_value)
          }
        }

        // ─── 3. Teknik alanları doldur (extra_specs) ───
        if (form.extra_specs && typeof form.extra_specs === 'object') {
          const newDynamicFields: Record<string, string> = {}
          for (const [key, value] of Object.entries(form.extra_specs)) {
            if (value != null && value !== '') {
              newDynamicFields[key] = String(value)
            }
          }
          setDynamicFields(newDynamicFields)
        }
      } else {
        // Kategori bulunamadı, en azından diğer alanları doldur
        setFormData((prev) => ({
          ...prev,
          name: form.name || '',
          purchase_price: form.purchase_price != null ? String(form.purchase_price) : '',
          sale_price: form.sale_price != null ? String(form.sale_price) : '',
          negotiation_margin: form.negotiation_margin != null ? String(form.negotiation_margin) : '',
          negotiation_type: form.negotiation_type || 'amount',
          material: form.material || '',
          notes: form.notes || '',
        }))

        if (categoryName) {
          setAiWarnings((prev) => [
            ...prev,
            `Kategori "${categoryName}" veritabanında bulunamadı. Lütfen elle seçin.`,
          ])
        } else {
          setAiWarnings((prev) => [
            ...prev,
            'AI kategori belirleyemedi. Lütfen elle seçin.',
          ])
        }
      }

      // Uyarıları göster
      if (data.warnings && data.warnings.length > 0) {
        setAiWarnings((prev) => [...prev, ...data.warnings])
      }

      setAiSuccess(true)
    } catch (error: any) {
      console.error('AI analiz hatası:', error)
      const detail = error.response?.data?.detail
        || error.response?.data?.error
        || error.message
        || 'AI analiz sırasında bir hata oluştu'
      setAiError(`Hata: ${detail}`)
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Form Submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      // extra_specs olarak teknik özellikleri JSON kaydet
      const extraSpecs: Record<string, any> = {}
      if (template) {
        for (const field of template.fields) {
          const val = dynamicFields[field.name]
          if (val !== undefined && val !== '') {
            extraSpecs[field.name] = field.type === 'number' ? parseFloat(val) : val
          }
        }
      }

      const data = {
        name: formData.name,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        product_type: selectedProductType || null,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
        negotiation_margin: parseFloat(formData.negotiation_margin) || 0,
        negotiation_type: formData.negotiation_type,
        material: formData.material || null,
        status: formData.status,
        stock_status: formData.stock_status,
        notes: formData.notes || null,
        extra_specs: Object.keys(extraSpecs).length > 0 ? extraSpecs : null,
      }

      const createResponse = await productsApi.create(data)
      const productId = createResponse.data?.id

      // Resimleri yükle (AI ile eklenen resimler)
      if (productId && aiImages.length > 0) {
        for (const img of aiImages) {
          try {
            await productsApi.uploadImage(productId, img)
          } catch (imgError) {
            console.error('Resim yükleme hatası:', imgError)
          }
        }
      }

      router.push('/products')
    } catch (error: any) {
      console.error('Error creating product:', error)
      alert(error.response?.data?.detail || 'Ürün oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Ürün</h1>
        </div>

        {/* ══════════════════════════════════════════════════
            AI YARDIMCISI — Fotoğraf + Açıklama → Formu Doldur
            ══════════════════════════════════════════════════ */}
        <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Sparkles className="w-5 h-5" />
              AI ile Hızlı Doldur
            </CardTitle>
            <p className="text-sm text-blue-600 mt-1">
              Fotoğraf ekleyin ve ürünü kısaca anlatın, AI formu sizin için doldursun.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fotoğraf Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Fotoğrafları
              </label>
              <div className="flex flex-wrap gap-3">
                {aiImagePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-200 shadow-sm"
                  >
                    <img
                      src={preview}
                      alt={`Ürün ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Galeriden Seç */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Galeri</span>
                </button>

                {/* Kameradan Çek */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Çek</span>
                </button>

                {/* Galeri input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {/* Kamera input */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Açıklama + Ses Kayıt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Açıklaması *
              </label>
              <div className="relative">
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Yazın veya mikrofona basarak konuşun..."
                  className={`w-full rounded-xl border px-4 py-2.5 pr-14 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white ${
                    isRecording ? 'border-red-400 ring-2 ring-red-200' : 'border-blue-200'
                  }`}
                  rows={3}
                />
                {/* Mikrofon Butonu */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`absolute right-2 bottom-2 p-2.5 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                      : isTranscribing
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                  }`}
                  title={isRecording ? 'Kaydı Durdur' : isTranscribing ? 'Çevriliyor...' : 'Sesle Anlat'}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-500 mt-1 animate-pulse">
                  Kaydediliyor... Bitince mikrofon butonuna tekrar basın.
                </p>
              )}
              {isTranscribing && (
                <p className="text-xs text-amber-600 mt-1 animate-pulse">
                  Ses yazıya çevriliyor...
                </p>
              )}
            </div>

            {/* Hata/Başarı mesajları */}
            {aiError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {aiError}
              </div>
            )}
            {aiSuccess && (
              <div className="flex items-start gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Form başarıyla dolduruldu! Aşağıdaki alanları kontrol edip kaydedin.
              </div>
            )}
            {aiWarnings.length > 0 && (
              <div className="text-amber-700 bg-amber-50 px-4 py-3 rounded-xl text-sm space-y-1">
                {aiWarnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}

            {/* AI Buton */}
            <button
              type="button"
              onClick={handleAiFill}
              disabled={aiLoading || !aiDescription.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Analiz Ediyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI ile Doldur
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════
            ÜRÜN FORMU — Manuel veya AI tarafından doldurulur
            ══════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kategori ve Ürün Çeşidi */}
          <Card>
            <CardHeader>
              <CardTitle>Kategori ve Çeşit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({ ...formData, category_id: value, name: '' })
                    setSelectedProductType('')
                    setDynamicFields({})
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Kategori Seçiniz</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category_id && template && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Çeşidi *
                  </label>
                  <select
                    required
                    value={selectedProductType}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedProductType(value)
                      const selectedType = template.types.find((t) => t.value === value)
                      setFormData((prev) => ({
                        ...prev,
                        name: selectedType ? selectedType.label : '',
                      }))
                      setDynamicFields({})
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Ürün Çeşidi Seçiniz</option>
                    {template.types.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Eğer kategori template'de yoksa serbest isim girişi */}
              {formData.category_id && !template && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ürün adını yazınız"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teknik Özellikler - sadece ürün çeşidi seçildiyse göster */}
          {formData.category_id && selectedProductType && template && template.fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Teknik Özellikler</span>
                  <span className="text-sm font-normal text-gray-500">
                    (Alıcı için önemli bilgiler)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.unit && (
                          <span className="text-gray-400 ml-1">({field.unit})</span>
                        )}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={dynamicFields[field.name] || ''}
                          onChange={(e) =>
                            setDynamicFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Seçiniz</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          step={field.type === 'number' ? 'any' : undefined}
                          value={dynamicFields[field.name] || ''}
                          placeholder={field.placeholder || ''}
                          onChange={(e) =>
                            setDynamicFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fiyat Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Fiyat Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alış Fiyatı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_price: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satış Fiyatı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pazarlık Payı
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.negotiation_margin}
                    onChange={(e) =>
                      setFormData({ ...formData, negotiation_margin: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pazarlık Tipi
                  </label>
                  <select
                    value={formData.negotiation_type}
                    onChange={(e) =>
                      setFormData({ ...formData, negotiation_type: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="amount">Tutar (₺)</option>
                    <option value="percentage">Yüzde (%)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diğer Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Diğer Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Malzeme
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
                  placeholder="Bakır, çelik, demir, alüminyum vs."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="working">Çalışıyor</option>
                    <option value="broken">Arızalı</option>
                    <option value="repair">Tamirde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Durumu
                  </label>
                  <select
                    value={formData.stock_status}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_status: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="available">Mevcut</option>
                    <option value="sold">Satıldı</option>
                    <option value="reserved">Rezerve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Ek notlar..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Kaydet Butonları */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Link href="/products">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
