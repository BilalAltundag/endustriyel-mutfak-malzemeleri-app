'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Image as ImageIcon, ShoppingCart, X, ArrowRight, Filter, TrendingUp } from 'lucide-react'
import { productsApi } from '@/lib/api'
import { useProducts, useCategories, useInvalidate, useAiPriceResults } from '@/lib/hooks'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Product {
  id: number
  name: string
  category_id?: number
  product_type?: string
  images?: string[]
  purchase_price: number
  sale_price: number
  negotiation_margin: number
  negotiation_type: string
  material?: string
  status: string
  stock_status: string
  notes?: string
  extra_specs?: Record<string, any>
  category?: {
    id: number
    name: string
  }
}

const SPEC_LABELS: Record<string, string> = {
  length_cm: 'Uzunluk', width_cm: 'Genişlik', height_cm: 'Yükseklik',
  depth_cm: 'Derinlik', basin_count: 'Göz', has_drainboard: 'Damlalık',
  thickness_mm: 'Sac Kalınlığı', energy_type: 'Enerji', tray_count: 'Tepsi',
  tray_size: 'Tepsi Ölçüsü', burner_count: 'Göz', volume_liters: 'Hacim',
  door_count: 'Kapı', cooling_type: 'Soğutma', temperature_min: 'Min Sıcaklık',
  filter_type: 'Filtre', has_motor: 'Motor', capacity_liters: 'Kapasite',
  diameter_cm: 'Çap', power_hp: 'Motor Gücü', blade_diameter_mm: 'Bıçak Çapı',
  capacity_kg_h: 'Kapasite', speed_count: 'Hız Kademe', tank_count: 'Hazne',
  cooking_area: 'Pişirme Alanı', plate_size: 'Plaka', plate_type: 'Plaka Tipi',
  group_count: 'Grup', boiler_capacity: 'Kazan', brand: 'Marka',
  tap_count: 'Musluk', capacity_basket_h: 'Kapasite', wash_type: 'Yıkama Tipi',
  slice_capacity: 'Dilim', conveyor_type: 'Tip', capacity_kg: 'Kapasite',
  pizza_capacity: 'Pizza', pizza_diameter_cm: 'Pizza Çapı', deck_count: 'Kat',
  plate_diameter_cm: 'Plaka Çapı', plate_count: 'Plaka', mold_count: 'Kalıp',
  mold_shape: 'Kalıp Şekli', shelf_count: 'Raf', load_capacity_kg: 'Yük Kapasitesi',
  compartment_count: 'Göz', heating_type: 'Isıtma', has_glass: 'Cam',
  wheel_count: 'Teker', has_bottom_shelf: 'Alt Raf', has_backsplash: 'Sıçrama Kenarı',
}

const SPEC_UNITS: Record<string, string> = {
  length_cm: 'cm', width_cm: 'cm', height_cm: 'cm', depth_cm: 'cm',
  thickness_mm: 'mm', volume_liters: 'L', capacity_liters: 'L',
  diameter_cm: 'cm', power_hp: 'HP', blade_diameter_mm: 'mm',
  capacity_kg_h: 'kg/s', boiler_capacity: 'L', capacity_basket_h: 'sepet/s',
  capacity_kg: 'kg', pizza_diameter_cm: 'cm', plate_diameter_cm: 'cm',
  load_capacity_kg: 'kg', temperature_min: '°C',
}

function formatDimensions(specs: Record<string, any>): string | null {
  const l = specs.length_cm, w = specs.width_cm, h = specs.height_cm
  if (l && w && h) return `${l}x${w}x${h} cm`
  if (l && w) return `${l}x${w} cm`
  return null
}

function getKeySpecs(specs: Record<string, any>): string[] {
  const result: string[] = []
  const dims = formatDimensions(specs)
  if (dims) result.push(dims)
  const skipKeys = ['length_cm', 'width_cm', 'height_cm']
  for (const [key, val] of Object.entries(specs)) {
    if (skipKeys.includes(key) || val === null || val === undefined || val === '') continue
    const label = SPEC_LABELS[key] || key
    const unit = SPEC_UNITS[key] || ''
    result.push(`${label}: ${val}${unit ? ' ' + unit : ''}`)
    if (result.length >= 4) break
  }
  return result
}

function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `/api/static${path}`
}

export default function ProductsPage() {
  const [filter, setFilter] = useState({ category_id: '', stock_status: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)

  const [sellModalProduct, setSellModalProduct] = useState<Product | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [sellLoading, setSellLoading] = useState(false)

  const invalidate = useInvalidate()

  const params = useMemo(() => {
    const p: any = {}
    if (filter.category_id) p.category_id = parseInt(filter.category_id)
    if (filter.stock_status) p.stock_status = filter.stock_status
    if (filter.status) p.status = filter.status
    return p
  }, [filter])

  const { data: allProducts = [], isLoading: loading } = useProducts(params)
  const { data: categories = [] } = useCategories(true)
  const { data: aiPriceResults = [] } = useAiPriceResults()

  const priceResultMap = useMemo(() => {
    const map: Record<string, any> = {}
    for (const r of aiPriceResults as any[]) {
      map[`${r.category_id}::${r.product_type}`] = r
    }
    return map
  }, [aiPriceResults])

  const products = useMemo(
    () => (allProducts as Product[]).filter((p) => p.stock_status !== 'sold'),
    [allProducts]
  )
  const soldCount = useMemo(
    () => (allProducts as Product[]).filter((p) => p.stock_status === 'sold').length,
    [allProducts]
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await productsApi.delete(id)
      invalidate.products()
      invalidate.inventory()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Ürün silinirken bir hata oluştu')
    }
  }

  const handleSell = async () => {
    if (!sellModalProduct || !sellPrice) return
    const price = parseFloat(sellPrice)
    if (isNaN(price) || price <= 0) {
      alert('Geçerli bir satış fiyatı girin')
      return
    }

    setSellLoading(true)
    try {
      await productsApi.sell(sellModalProduct.id, price)
      setSellModalProduct(null)
      setSellPrice('')
      invalidate.products()
      invalidate.inventory()
    } catch (error: any) {
      console.error('Error selling product:', error)
      alert(error.response?.data?.detail || 'Satış işlemi sırasında hata oluştu')
    } finally {
      setSellLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800'
      case 'broken': return 'bg-red-100 text-red-800'
      case 'repair': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-800'
      case 'sold': return 'bg-orange-100 text-orange-800'
      case 'reserved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const hasActiveFilter = filter.category_id || filter.stock_status || filter.status

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ürünler</h1>
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Ürün yönetimi ve stok takibi</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                hasActiveFilter
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtre
            </button>
            <Link href="/products/new">
              <Button>
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Yeni Ürün</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters - always visible on desktop, toggle on mobile */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 sm:mb-6`}>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                  <select
                    value={filter.category_id}
                    onChange={(e) => setFilter({ ...filter, category_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Tümü</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Stok Durumu</label>
                  <select
                    value={filter.stock_status}
                    onChange={(e) => setFilter({ ...filter, stock_status: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="available">Mevcut</option>
                    <option value="reserved">Rezerve</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Durum</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="working">Çalışıyor</option>
                    <option value="broken">Arızalı</option>
                    <option value="repair">Tamirde</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sold Products Banner */}
        {soldCount > 0 && (
          <Link href="/inventory?tab=sold">
            <div className="mb-4 sm:mb-6 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 hover:shadow-md transition-all group">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-orange-800 text-sm sm:text-base">{soldCount} ürün satıldı</span>
                  <p className="text-[10px] sm:text-xs text-orange-600 mt-0.5 hidden sm:block">Satılan ürünleri envanter sayfasından görüntüleyebilirsiniz</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-600 font-medium text-xs sm:text-sm group-hover:gap-2 transition-all flex-shrink-0">
                <span className="hidden sm:inline">Satılanları Gör</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">Henüz ürün eklenmemiş</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {/* Image */}
                {product.images && product.images.length > 0 ? (
                  <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  {/* Title + Actions */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{product.name}</h3>
                      {product.category && (
                        <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 -mr-1 flex-shrink-0">
                      <Link href={`/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Specs */}
                  {product.extra_specs && Object.keys(product.extra_specs).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {getKeySpecs(product.extra_specs).map((spec, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-md">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Prices */}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div>
                      <span className="text-gray-400 text-xs">Alış</span>
                      <div className="font-semibold text-gray-700">{product.purchase_price.toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 text-xs">Satış</span>
                      <div className="font-semibold text-blue-600">{product.sale_price.toLocaleString('tr-TR')} ₺</div>
                    </div>
                  </div>

                  {/* AI Price Range */}
                  {(() => {
                    const key = `${product.category_id}::${product.product_type}`
                    const ai = priceResultMap[key]
                    if (!ai || ai.min_price == null) return null
                    const timePeriodLabel: Record<string, string> = {
                      '24_hours': 'Son 24 Saat',
                      '7_days': 'Son 7 Gün',
                      '30_days': 'Son 30 Gün',
                    }
                    return (
                      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/60 rounded-xl px-3 py-2.5 mb-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-[11px] font-semibold text-violet-700">Piyasa Fiyatı</span>
                          <span className="text-[10px] text-violet-500 ml-auto">
                            {ai.location} · {timePeriodLabel[ai.time_period] || ai.time_period}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-violet-500">Min</span>
                            <span className="font-semibold text-violet-800 ml-1">{ai.min_price.toLocaleString('tr-TR')} ₺</span>
                          </div>
                          <span className="text-violet-300">—</span>
                          <div>
                            <span className="text-violet-500">Max</span>
                            <span className="font-semibold text-violet-800 ml-1">{ai.max_price.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        </div>
                        {ai.cluster_avg_price != null && (
                          <div className="mt-1.5 pt-1.5 border-t border-violet-200/50 text-xs flex items-center justify-between">
                            <span className="text-violet-500">Yakın Ort.</span>
                            <span className="font-bold text-violet-700">{ai.cluster_avg_price.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Material */}
                  {product.material && (
                    <div className="text-xs text-gray-500 mb-2">
                      Malzeme: {product.material}
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${getStatusColor(product.status)}`}>
                      {product.status === 'working' ? 'Çalışıyor' : product.status === 'broken' ? 'Arızalı' : 'Tamirde'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${getStockStatusColor(product.stock_status)}`}>
                      {product.stock_status === 'available' ? 'Mevcut' : product.stock_status === 'sold' ? 'Satıldı' : 'Rezerve'}
                    </span>
                  </div>

                  {/* Sell button */}
                  {product.stock_status === 'available' && (
                    <button
                      onClick={() => {
                        setSellModalProduct(product)
                        setSellPrice(String(product.sale_price))
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Satıldı
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {sellModalProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 animate-slide-up sm:animate-none">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ürün Satışı</h3>
              <button
                onClick={() => { setSellModalProduct(null); setSellPrice('') }}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="font-medium text-gray-800">{sellModalProduct.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {sellModalProduct.category?.name || 'Kategorisiz'}
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-500">Alış: {sellModalProduct.purchase_price.toLocaleString('tr-TR')} ₺</span>
                <span className="text-blue-600 font-medium">
                  Liste: {sellModalProduct.sale_price.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satış Fiyatı (₺) *
              </label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Satış fiyatını girin"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="0.01"
                autoFocus
              />
              {sellPrice && !isNaN(parseFloat(sellPrice)) && (
                <div className="mt-2 text-sm">
                  <span className={`font-medium ${
                    parseFloat(sellPrice) >= sellModalProduct.purchase_price ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Kar/Zarar: {(parseFloat(sellPrice) - sellModalProduct.purchase_price).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSellModalProduct(null); setSellPrice('') }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSell}
                disabled={!sellPrice || isNaN(parseFloat(sellPrice)) || parseFloat(sellPrice) <= 0 || sellLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {sellLoading ? 'İşleniyor...' : 'Satışı Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
