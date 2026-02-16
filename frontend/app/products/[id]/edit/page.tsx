'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { productsApi, categoriesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

// ============================================================
// Aynı template yapısı (new/page.tsx ile senkron)
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

// Label map for displaying spec values nicely
const SPEC_LABEL_MAP: Record<string, string> = {}
for (const cat of Object.values(CATEGORY_TEMPLATES)) {
  for (const field of cat.fields) {
    SPEC_LABEL_MAP[field.name] = field.label + (field.unit ? ` (${field.unit})` : '')
  }
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = parseInt(params.id as string)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productRes, categoriesRes] = await Promise.all([
        productsApi.getById(productId),
        categoriesApi.getAll(true),
      ])
      const product = productRes.data
      setFormData({
        name: product.name,
        category_id: product.category_id?.toString() || '',
        purchase_price: product.purchase_price.toString(),
        sale_price: product.sale_price.toString(),
        negotiation_margin: product.negotiation_margin?.toString() || '',
        negotiation_type: product.negotiation_type || 'amount',
        material: product.material || '',
        status: product.status,
        stock_status: product.stock_status,
        notes: product.notes || '',
      })
      setCategories(categoriesRes.data)

      // Ürün çeşidi ve teknik özellikleri yükle
      if (product.product_type) {
        setSelectedProductType(product.product_type)
      }
      if (product.extra_specs && typeof product.extra_specs === 'object') {
        const fields: Record<string, string> = {}
        for (const [key, val] of Object.entries(product.extra_specs)) {
          fields[key] = String(val)
        }
        setDynamicFields(fields)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Ürün yüklenirken bir hata oluştu')
      router.push('/products')
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

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
      await productsApi.update(productId, data)
      router.push('/products')
    } catch (error: any) {
      console.error('Error updating product:', error)
      alert(error.response?.data?.detail || 'Ürün güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Yükleniyor...</div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Ürün Düzenle</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kategori ve Ürün Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Ürün Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_id: e.target.value })
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
                    Ürün Çeşidi
                  </label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => {
                      setSelectedProductType(e.target.value)
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
            </CardContent>
          </Card>

          {/* Teknik Özellikler */}
          {formData.category_id && template && template.fields.length > 0 && (
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
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Güncelle'}
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
