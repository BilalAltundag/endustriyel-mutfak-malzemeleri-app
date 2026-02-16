'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { priceRangesApi, productsApi, categoriesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function PriceRangesPage() {
  const [priceRanges, setPriceRanges] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRange, setEditingRange] = useState<any>(null)
  const [formData, setFormData] = useState({
    product_id: '',
    category_id: '',
    min_purchase_price: '',
    max_purchase_price: '',
    min_sale_price: '',
    max_sale_price: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rangesRes, productsRes, categoriesRes] = await Promise.all([
        priceRangesApi.getAll(),
        productsApi.getAll(),
        categoriesApi.getAll(),
      ])
      setPriceRanges(rangesRes.data)
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        min_purchase_price: formData.min_purchase_price
          ? parseFloat(formData.min_purchase_price)
          : null,
        max_purchase_price: formData.max_purchase_price
          ? parseFloat(formData.max_purchase_price)
          : null,
        min_sale_price: formData.min_sale_price ? parseFloat(formData.min_sale_price) : null,
        max_sale_price: formData.max_sale_price ? parseFloat(formData.max_sale_price) : null,
      }

      if (editingRange) {
        await priceRangesApi.update(editingRange.id, data)
      } else {
        await priceRangesApi.create(data)
      }
      setShowForm(false)
      setEditingRange(null)
      setFormData({
        product_id: '',
        category_id: '',
        min_purchase_price: '',
        max_purchase_price: '',
        min_sale_price: '',
        max_sale_price: '',
        notes: '',
      })
      fetchData()
    } catch (error: any) {
      console.error('Error saving price range:', error)
      alert(error.response?.data?.detail || 'Fiyat aralığı kaydedilirken bir hata oluştu')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu fiyat aralığını silmek istediğinize emin misiniz?')) return

    try {
      await priceRangesApi.delete(id)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting price range:', error)
      alert(error.response?.data?.detail || 'Fiyat aralığı silinirken bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fiyat Aralıkları</h1>
            <p className="text-gray-600">Piyasa fiyat referansları</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingRange(null)
              setFormData({
                product_id: '',
                category_id: '',
                min_purchase_price: '',
                max_purchase_price: '',
                min_sale_price: '',
                max_sale_price: '',
                notes: '',
              })
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Fiyat Aralığı
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingRange ? 'Fiyat Aralığı Düzenle' : 'Yeni Fiyat Aralığı'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    >
                      <option value="">Seçiniz</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    >
                      <option value="">Seçiniz</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Alış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_purchase_price}
                      onChange={(e) =>
                        setFormData({ ...formData, min_purchase_price: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Alış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_purchase_price}
                      onChange={(e) =>
                        setFormData({ ...formData, max_purchase_price: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Satış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_sale_price}
                      onChange={(e) =>
                        setFormData({ ...formData, min_sale_price: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Satış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_sale_price}
                      onChange={(e) =>
                        setFormData({ ...formData, max_sale_price: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingRange ? 'Güncelle' : 'Kaydet'}</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingRange(null)
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : priceRanges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Henüz fiyat aralığı eklenmemiş
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priceRanges.map((range) => (
              <Card key={range.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>
                        {range.product_id
                          ? products.find((p) => p.id === range.product_id)?.name ||
                            'Ürün bulunamadı'
                          : range.category_id
                          ? categories.find((c) => c.id === range.category_id)?.name ||
                            'Kategori bulunamadı'
                          : 'Genel'}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRange(range)
                          setFormData({
                            product_id: range.product_id || '',
                            category_id: range.category_id || '',
                            min_purchase_price: range.min_purchase_price || '',
                            max_purchase_price: range.max_purchase_price || '',
                            min_sale_price: range.min_sale_price || '',
                            max_sale_price: range.max_sale_price || '',
                            notes: range.notes || '',
                          })
                          setShowForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(range.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {range.min_purchase_price && range.max_purchase_price && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Alış Fiyat Aralığı</div>
                        <div className="font-semibold">
                          {range.min_purchase_price.toLocaleString('tr-TR')} ₺ -{' '}
                          {range.max_purchase_price.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                    )}
                    {range.min_sale_price && range.max_sale_price && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Satış Fiyat Aralığı</div>
                        <div className="font-semibold text-blue-600">
                          {range.min_sale_price.toLocaleString('tr-TR')} ₺ -{' '}
                          {range.max_sale_price.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                    )}
                    {range.notes && (
                      <div className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {range.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



