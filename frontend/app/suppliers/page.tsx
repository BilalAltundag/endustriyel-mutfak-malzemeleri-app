'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { suppliersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  notes?: string
  is_active: boolean
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    is_active: true,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await suppliersApi.getAll(true)
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData)
      } else {
        await suppliersApi.create(formData)
      }
      setShowForm(false)
      setEditingSupplier(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        notes: '',
        is_active: true,
      })
      fetchSuppliers()
    } catch (error: any) {
      console.error('Error saving supplier:', error)
      alert(error.response?.data?.detail || 'Tedarikçi kaydedilirken bir hata oluştu')
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return

    try {
      await suppliersApi.delete(id)
      fetchSuppliers()
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      alert(error.response?.data?.detail || 'Tedarikçi silinirken bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tedarikçiler</h1>
            <p className="text-gray-600">Satın aldığınız ve alacağınız yerlerin bilgileri</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingSupplier(null)
              setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                notes: '',
                is_active: true,
              })
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Tedarikçi
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firma/İsim *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                  />
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingSupplier ? 'Güncelle' : 'Kaydet'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingSupplier(null)
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                        city: '',
                        notes: '',
                        is_active: true,
                      })
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
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Henüz tedarikçi eklenmemiş
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>{supplier.name}</CardTitle>
                      {supplier.city && (
                        <p className="text-sm text-gray-500 mt-1">{supplier.city}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {supplier.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {supplier.email}
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                    {supplier.notes && (
                      <div className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {supplier.notes}
                      </div>
                    )}
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {supplier.is_active ? 'Aktif' : 'Pasif'}
                    </span>
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



