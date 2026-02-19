'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Image as ImageIcon, ShoppingCart, X } from 'lucide-react'
import { productsApi, categoriesApi } from '@/lib/api'
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
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category_id: '', stock_status: '', status: '' })

  // Satış modal state
  const [sellModalProduct, setSellModalProduct] = useState<Product | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [sellLoading, setSellLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filter.category_id) params.category_id = parseInt(filter.category_id)
      if (filter.stock_status) params.stock_status = filter.stock_status
      if (filter.status) params.status = filter.status
      const response = await productsApi.getAll(params)
      setProducts(response.data)
    } catch (error: any) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(true)
      setCategories(response.data)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await productsApi.delete(id)
      fetchProducts()
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
      fetchProducts()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürünler</h1>
            <p className="text-gray-600">Ürün yönetimi ve stok takibi</p>
          </div>
          <Link href="/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={filter.category_id}
                  onChange={(e) => setFilter({ ...filter, category_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2"
                >
                  <option value="">Tümü</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok Durumu</label>
                <select
                  value={filter.stock_status}
                  onChange={(e) => setFilter({ ...filter, stock_status: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2"
                >
                  <option value="">Tümü</option>
                  <option value="available">Mevcut</option>
                  <option value="sold">Satıldı</option>
                  <option value="reserved">Rezerve</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2"
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

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">Henüz ürün eklenmemiş</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className={product.stock_status === 'sold' ? 'opacity-70' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <CardTitle>{product.name}</CardTitle>
                      {product.category && (
                        <p className="text-sm text-gray-500 mt-1">{product.category.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {product.images && product.images.length > 0 ? (
                    <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {product.extra_specs && Object.keys(product.extra_specs).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {getKeySpecs(product.extra_specs).map((spec, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Alış:</span>
                      <span className="font-semibold">{product.purchase_price.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Satış:</span>
                      <span className="font-semibold text-blue-600">{product.sale_price.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    {product.material && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Malzeme:</span>
                        <span className="text-sm">{product.material}</span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status === 'working' ? 'Çalışıyor' : product.status === 'broken' ? 'Arızalı' : 'Tamirde'}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStockStatusColor(product.stock_status)}`}>
                        {product.stock_status === 'available' ? 'Mevcut' : product.stock_status === 'sold' ? 'Satıldı' : 'Rezerve'}
                      </span>
                    </div>

                    {/* Satıldı Butonu */}
                    {product.stock_status === 'available' && (
                      <button
                        onClick={() => {
                          setSellModalProduct(product)
                          setSellPrice(String(product.sale_price))
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Satıldı
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Satış Modal ═══ */}
      {sellModalProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ürün Satışı</h3>
              <button
                onClick={() => { setSellModalProduct(null); setSellPrice('') }}
                className="p-1 hover:bg-gray-100 rounded-full"
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
