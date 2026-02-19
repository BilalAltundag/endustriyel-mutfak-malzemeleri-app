'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { productsApi, categoriesApi } from '@/lib/api'
import { CATEGORY_TEMPLATES, getFieldsForType } from '@/lib/categoryTemplates'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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
  const activeFields = template && selectedProductType
    ? getFieldsForType(template, selectedProductType)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      // extra_specs olarak teknik özellikleri JSON kaydet
      const extraSpecs: Record<string, any> = {}
      for (const field of activeFields) {
        const val = dynamicFields[field.name]
        if (val !== undefined && val !== '') {
          extraSpecs[field.name] = field.type === 'number' ? parseFloat(val) : val
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
          {activeFields.length > 0 && (
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
                  {activeFields.map((field) => (
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
