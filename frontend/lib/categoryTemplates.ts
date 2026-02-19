// ============================================================
// Kategori bazlı teknik özellik alanları (Ortak Modül)
// Her ürün çeşidinin kendine özel veya kategori varsayılan alanları olabilir
// ============================================================

export interface SpecField {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  unit?: string
  placeholder?: string
}

export interface ProductType {
  value: string
  label: string
  fields?: SpecField[]
}

export interface CategoryTemplate {
  types: ProductType[]
  fields: SpecField[]
}

// Bir ürün çeşidinin alanlarını döndürür: önce type-level, yoksa category-level
export function getFieldsForType(template: CategoryTemplate, typeValue: string): SpecField[] {
  const productType = template.types.find(t => t.value === typeValue)
  if (productType?.fields && productType.fields.length > 0) {
    return productType.fields
  }
  return template.fields
}

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
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
      {
        value: 'pilav_arabasi', label: 'Pilav Arabası',
        fields: [
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 150' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
          { name: 'energy_type', label: 'Isıtma Tipi', type: 'select', options: ['Tüplü', 'Doğalgaz', 'Elektrikli'] },
          { name: 'benmari_type', label: 'Benmari', type: 'select', options: ['Kuru', 'Sulu', 'Yok'] },
          { name: 'has_glass', label: 'Cam', type: 'select', options: ['Var', 'Yok'] },
          { name: 'wheel_count', label: 'Teker Sayısı', type: 'select', options: ['2', '4'] },
        ],
      },
      {
        value: 'kokorec_arabasi', label: 'Kokoreç Arabası',
        fields: [
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 150' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
          { name: 'energy_type', label: 'Isıtma Tipi', type: 'select', options: ['Kömürlü', 'Gazlı'] },
          { name: 'has_glass', label: 'Cam', type: 'select', options: ['Var', 'Yok'] },
          { name: 'wheel_count', label: 'Teker Sayısı', type: 'select', options: ['2', '4'] },
        ],
      },
      { value: 'tantuni_arabasi', label: 'Tantuni Arabası' },
      { value: 'doner_arabasi', label: 'Döner Arabası' },
      {
        value: 'servis_arabasi', label: 'Servis Arabası',
        fields: [
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
          { name: 'shelf_count', label: 'Raf Sayısı', type: 'select', options: ['2', '3', '4'] },
          { name: 'wheel_count', label: 'Teker Sayısı', type: 'select', options: ['4'] },
        ],
      },
      {
        value: 'tasima_arabasi', label: 'Taşıma Arabası',
        fields: [
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 60' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'load_capacity_kg', label: 'Yük Kapasitesi', type: 'number', unit: 'kg', placeholder: 'örn: 150' },
          { name: 'shelf_count', label: 'Raf Sayısı', type: 'select', options: ['1', '2', '3'] },
          { name: 'wheel_count', label: 'Teker Sayısı', type: 'select', options: ['4'] },
        ],
      },
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
      {
        value: 'konveksiyonlu_firin', label: 'Konveksiyonlu Fırın',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'tray_count', label: 'Tepsi Sayısı', type: 'number', placeholder: 'örn: 10' },
          { name: 'tray_size', label: 'Tepsi Ölçüsü', type: 'select', options: ['40x60', '60x80'] },
          { name: 'has_steam', label: 'Buhar Fonksiyonu', type: 'select', options: ['Var', 'Yok'] },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 90' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 170' },
        ],
      },
      {
        value: 'pastane_firini', label: 'Pastane Fırını',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'deck_count', label: 'Kat Sayısı', type: 'select', options: ['1', '2', '3', '4'] },
          { name: 'tray_count', label: 'Tepsi Sayısı (kat başı)', type: 'number', placeholder: 'örn: 3' },
          { name: 'tray_size', label: 'Tepsi Ölçüsü', type: 'select', options: ['40x60', '60x80'] },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 100' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 160' },
        ],
      },
      {
        value: 'pizza_firini', label: 'Pizza Fırını',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli', 'Odunlu'] },
          { name: 'pizza_capacity', label: 'Pizza Kapasitesi', type: 'number', placeholder: 'örn: 4' },
          { name: 'pizza_diameter_cm', label: 'Max Pizza Çapı', type: 'number', unit: 'cm', placeholder: 'örn: 33' },
          { name: 'deck_count', label: 'Kat Sayısı', type: 'select', options: ['1', '2', '3'] },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 100' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 100' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
        ],
      },
      {
        value: 'doner_firini', label: 'Döner Fırını',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'capacity_kg', label: 'Et Kapasitesi', type: 'number', unit: 'kg', placeholder: 'örn: 60' },
          { name: 'burner_count', label: 'Radyan Sayısı', type: 'number', placeholder: 'örn: 4' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
        ],
      },
      {
        value: 'tunnel_firin', label: 'Tünel Fırın',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'belt_width_cm', label: 'Bant Genişliği', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
        ],
      },
      {
        value: 'rotary_firin', label: 'Rotary Fırın',
        fields: [
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'rack_count', label: 'Çevirme Raf Sayısı', type: 'number', placeholder: 'örn: 1' },
          { name: 'tray_count', label: 'Tepsi Sayısı', type: 'number', placeholder: 'örn: 18' },
          { name: 'tray_size', label: 'Tepsi Ölçüsü', type: 'select', options: ['40x60', '60x80'] },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 150' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 120' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 220' },
        ],
      },
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
      {
        value: 'wok_ocagi', label: 'Wok Ocağı',
        fields: [
          { name: 'burner_count', label: 'Göz Sayısı', type: 'select', options: ['1', '2', '3'] },
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'wok_diameter_cm', label: 'Wok Çapı', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 85' },
        ],
      },
      { value: 'pasta_ocagi', label: 'Pasta Ocağı' },
      {
        value: 'krep_ocagi', label: 'Krep Ocağı',
        fields: [
          { name: 'plate_count', label: 'Plaka Sayısı', type: 'select', options: ['1', '2'] },
          { name: 'plate_diameter_cm', label: 'Plaka Çapı', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
        ],
      },
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
      {
        value: 'soklama_buzdolabi', label: 'Şoklama Buzdolabı',
        fields: [
          { name: 'volume_liters', label: 'Hacim', type: 'number', unit: 'litre', placeholder: 'örn: 300' },
          { name: 'tray_count', label: 'Tepsi Sayısı', type: 'number', placeholder: 'örn: 5' },
          { name: 'temperature_min', label: 'Min. Sıcaklık', type: 'number', unit: '°C', placeholder: 'örn: -40' },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
        ],
      },
      {
        value: 'vitrini_buzdolabi', label: 'Vitrinli Buzdolabı',
        fields: [
          { name: 'volume_liters', label: 'Hacim', type: 'number', unit: 'litre', placeholder: 'örn: 400' },
          { name: 'door_count', label: 'Kapı Sayısı', type: 'select', options: ['1', '2', '3'] },
          { name: 'cooling_type', label: 'Soğutma Tipi', type: 'select', options: ['Statik', 'Fan (No-Frost)'] },
          { name: 'display_type', label: 'Vitrin Tipi', type: 'select', options: ['Cam Kapılı', 'Açık Vitrin', 'Tezgah Üstü'] },
          { name: 'length_cm', label: 'Uzunluk', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
          { name: 'width_cm', label: 'Genişlik', type: 'number', unit: 'cm', placeholder: 'örn: 70' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 200' },
        ],
      },
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
      {
        value: 'buhar_kazani', label: 'Buhar Kazanı',
        fields: [
          { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 100' },
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Gazlı', 'Elektrikli'] },
          { name: 'pressure_bar', label: 'Basınç', type: 'number', unit: 'bar', placeholder: 'örn: 1.5' },
          { name: 'diameter_cm', label: 'Çap', type: 'number', unit: 'cm', placeholder: 'örn: 50' },
          { name: 'height_cm', label: 'Yükseklik', type: 'number', unit: 'cm', placeholder: 'örn: 80' },
        ],
      },
      { value: 'cift_cidarli_kazan', label: 'Çift Cidarlı Kazan' },
      { value: 'tencere_kazan', label: 'Tencere Kazan' },
      {
        value: 'cay_kazani', label: 'Çay Kazanı',
        fields: [
          { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 40' },
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
          { name: 'tap_count', label: 'Musluk Sayısı', type: 'select', options: ['1', '2', '3'] },
        ],
      },
      {
        value: 'corba_kazani', label: 'Çorba Kazanı',
        fields: [
          { name: 'capacity_liters', label: 'Kapasite', type: 'number', unit: 'litre', placeholder: 'örn: 50' },
          { name: 'energy_type', label: 'Enerji Tipi', type: 'select', options: ['Elektrikli', 'Gazlı'] },
          { name: 'has_mixer', label: 'Karıştırıcı', type: 'select', options: ['Var', 'Yok'] },
          { name: 'diameter_cm', label: 'Çap', type: 'number', unit: 'cm', placeholder: 'örn: 40' },
        ],
      },
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
      {
        value: 'et_kiyma_makinesi', label: 'Et Kıyma Makinesi',
        fields: [
          { name: 'power_hp', label: 'Motor Gücü', type: 'number', unit: 'HP', placeholder: 'örn: 1.5' },
          { name: 'capacity_kg_h', label: 'Kapasite', type: 'number', unit: 'kg/saat', placeholder: 'örn: 200' },
          { name: 'plate_size', label: 'Ayna Numarası', type: 'select', options: ['22', '32', '42'] },
          { name: 'energy_type', label: 'Tip', type: 'select', options: ['Elektrikli', 'Manuel'] },
        ],
      },
      {
        value: 'sebze_dograma_makinesi', label: 'Sebze Doğrama Makinesi',
        fields: [
          { name: 'power_hp', label: 'Motor Gücü', type: 'number', unit: 'HP', placeholder: 'örn: 0.5' },
          { name: 'capacity_kg_h', label: 'Kapasite', type: 'number', unit: 'kg/saat', placeholder: 'örn: 100' },
          { name: 'disc_count', label: 'Disk Sayısı', type: 'number', placeholder: 'örn: 5' },
        ],
      },
      {
        value: 'ekmek_dilimleme_makinesi', label: 'Ekmek Dilimleme Makinesi',
        fields: [
          { name: 'blade_diameter_mm', label: 'Bıçak Çapı', type: 'number', unit: 'mm', placeholder: 'örn: 300' },
          { name: 'slice_thickness_mm', label: 'Dilim Kalınlığı', type: 'text', placeholder: 'örn: 1-15 mm arası' },
          { name: 'energy_type', label: 'Tip', type: 'select', options: ['Elektrikli', 'Manuel'] },
        ],
      },
      {
        value: 'et_dilimleme_makinesi', label: 'Et Dilimleme Makinesi',
        fields: [
          { name: 'blade_diameter_mm', label: 'Bıçak Çapı', type: 'number', unit: 'mm', placeholder: 'örn: 300' },
          { name: 'cut_thickness_mm', label: 'Kesim Kalınlığı', type: 'text', placeholder: 'örn: 0-25 mm arası' },
          { name: 'energy_type', label: 'Tip', type: 'select', options: ['Elektrikli', 'Manuel'] },
        ],
      },
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
