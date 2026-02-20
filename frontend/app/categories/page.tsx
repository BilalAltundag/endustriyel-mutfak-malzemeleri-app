'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, Tag, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { categoriesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface SpecField {
  name: string
  label: string
  type: string
  options?: string[]
  unit?: string
  placeholder?: string
}

interface ProductType {
  value: string
  label: string
  fields?: SpecField[] | null
}

interface Category {
  id: number
  name: string
  description?: string
  is_active: boolean
  product_types?: ProductType[]
  default_fields?: SpecField[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true })
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [defaultFields, setDefaultFields] = useState<SpecField[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [showDefaultFields, setShowDefaultFields] = useState(false)

  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldUnit, setNewFieldUnit] = useState('')
  const [newFieldOptions, setNewFieldOptions] = useState('')

  const [newDefFieldLabel, setNewDefFieldLabel] = useState('')
  const [newDefFieldType, setNewDefFieldType] = useState('text')
  const [newDefFieldUnit, setNewDefFieldUnit] = useState('')
  const [newDefFieldOptions, setNewDefFieldOptions] = useState('')

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesApi.getAll(true)
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        product_types: productTypes,
        default_fields: defaultFields.length > 0 ? defaultFields : null,
      }
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, payload)
      } else {
        await categoriesApi.create(payload)
      }
      resetForm()
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(error.response?.data?.detail || 'Kategori kaydedilirken bir hata oluştu')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, description: category.description || '', is_active: category.is_active })
    setProductTypes(category.product_types || [])
    setDefaultFields(category.default_fields || [])
    setNewTypeName('')
    setExpandedType(null)
    setShowDefaultFields(false)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      await categoriesApi.delete(id)
      fetchCategories()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Kategori silinirken bir hata oluştu')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', is_active: true })
    setProductTypes([])
    setDefaultFields([])
    setNewTypeName('')
    setExpandedType(null)
    setShowDefaultFields(false)
    resetFieldForm()
    resetDefFieldForm()
  }

  const resetFieldForm = () => {
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldUnit('')
    setNewFieldOptions('')
  }

  const resetDefFieldForm = () => {
    setNewDefFieldLabel('')
    setNewDefFieldType('text')
    setNewDefFieldUnit('')
    setNewDefFieldOptions('')
  }

  const addProductType = () => {
    const label = newTypeName.trim()
    if (!label) return
    const value = slugify(label)
    if (productTypes.some((t) => t.value === value)) {
      alert('Bu ürün çeşidi zaten ekli.')
      return
    }
    setProductTypes([...productTypes, { value, label, fields: null }])
    setNewTypeName('')
  }

  const removeProductType = (value: string) => {
    setProductTypes(productTypes.filter((t) => t.value !== value))
    if (expandedType === value) setExpandedType(null)
  }

  const addFieldToType = (typeValue: string) => {
    const label = newFieldLabel.trim()
    if (!label) return
    const name = slugify(label)
    const field: SpecField = { name, label, type: newFieldType }
    if (newFieldUnit.trim()) field.unit = newFieldUnit.trim()
    if (newFieldType === 'select' && newFieldOptions.trim()) {
      field.options = newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
    }

    setProductTypes(productTypes.map((pt) => {
      if (pt.value !== typeValue) return pt
      const existing = pt.fields || []
      if (existing.some((f) => f.name === name)) {
        alert('Bu alan zaten ekli.')
        return pt
      }
      return { ...pt, fields: [...existing, field] }
    }))
    resetFieldForm()
  }

  const removeFieldFromType = (typeValue: string, fieldName: string) => {
    setProductTypes(productTypes.map((pt) => {
      if (pt.value !== typeValue) return pt
      const updated = (pt.fields || []).filter((f) => f.name !== fieldName)
      return { ...pt, fields: updated.length > 0 ? updated : null }
    }))
  }

  const addDefaultField = () => {
    const label = newDefFieldLabel.trim()
    if (!label) return
    const name = slugify(label)
    if (defaultFields.some((f) => f.name === name)) {
      alert('Bu alan zaten ekli.')
      return
    }
    const field: SpecField = { name, label, type: newDefFieldType }
    if (newDefFieldUnit.trim()) field.unit = newDefFieldUnit.trim()
    if (newDefFieldType === 'select' && newDefFieldOptions.trim()) {
      field.options = newDefFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
    }
    setDefaultFields([...defaultFields, field])
    resetDefFieldForm()
  }

  const removeDefaultField = (fieldName: string) => {
    setDefaultFields(defaultFields.filter((f) => f.name !== fieldName))
  }

  const handleTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addProductType() }
  }

  const FieldBadge = ({ field, onRemove }: { field: SpecField; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg px-2 py-0.5 text-[11px] sm:text-xs font-medium">
      <span>{field.label}</span>
      {field.unit && <span className="text-purple-400">({field.unit})</span>}
      {field.type === 'select' && field.options && (
        <span className="text-purple-400 max-w-[80px] sm:max-w-[120px] truncate" title={field.options.join(', ')}>
          [{field.options.join(', ')}]
        </span>
      )}
      <span className={`ml-0.5 px-1 py-0 rounded text-[10px] ${
        field.type === 'number' ? 'bg-blue-100 text-blue-600' :
        field.type === 'select' ? 'bg-amber-100 text-amber-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        {field.type === 'number' ? '#' : field.type === 'select' ? '▾' : 'Aa'}
      </span>
      <button type="button" onClick={onRemove} className="text-purple-400 hover:text-red-500 transition-colors ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  )

  const AddFieldForm = ({ onAdd, label, setLabel, type, setType, unit, setUnit, options, setOptions }: {
    onAdd: () => void
    label: string; setLabel: (v: string) => void
    type: string; setType: (v: string) => void
    unit: string; setUnit: (v: string) => void
    options: string; setOptions: (v: string) => void
  }) => (
    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Alan adı"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="text">Metin</option>
          <option value="number">Sayı</option>
          <option value="select">Seçenekli</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Birim (cm, kg)"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        {type === 'select' ? (
          <input
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Seçenekler (virgülle)"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
        ) : (
          <div />
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={!label.trim()}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        Alan Ekle
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kategoriler</h1>
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Kategori, ürün çeşidi ve teknik alan yönetimi</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Yeni Kategori</span>
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-5 sm:mb-6">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-xl">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Kategori Adı *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="is_active" checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="mr-2" />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Aktif</label>
                </div>

                {/* Product Types */}
                <div className="border-t pt-4 sm:pt-5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Ürün Çeşitleri ve Teknik Alanlar
                  </label>

                  {productTypes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {productTypes.map((pt) => {
                        const isExpanded = expandedType === pt.value
                        const fieldCount = pt.fields?.length || 0
                        return (
                          <div key={pt.value} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white hover:bg-gray-50">
                              <button
                                type="button"
                                onClick={() => setExpandedType(isExpanded ? null : pt.value)}
                                className="flex items-center gap-2 flex-1 text-left min-w-0"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                <span className="text-sm font-medium text-gray-800 truncate">{pt.label}</span>
                                <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
                                  {fieldCount > 0 ? `${fieldCount} alan` : 'Varsayılan'}
                                </span>
                              </button>
                              <button type="button" onClick={() => removeProductType(pt.value)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="px-3 sm:px-4 pb-4 pt-2 bg-gray-50/50 border-t border-gray-100">
                                {fieldCount > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {pt.fields!.map((field) => (
                                      <FieldBadge key={field.name} field={field}
                                        onRemove={() => removeFieldFromType(pt.value, field.name)} />
                                    ))}
                                  </div>
                                )}
                                {fieldCount === 0 && defaultFields.length > 0 && (
                                  <p className="text-xs text-gray-500 mb-3 italic">
                                    Bu çeşide özel alan tanımlanmamış. Kategori varsayılan alanları kullanılacak.
                                  </p>
                                )}
                                <p className="text-xs font-medium text-gray-600 mb-1">Yeni alan ekle:</p>
                                <AddFieldForm
                                  onAdd={() => addFieldToType(pt.value)}
                                  label={newFieldLabel} setLabel={setNewFieldLabel}
                                  type={newFieldType} setType={setNewFieldType}
                                  unit={newFieldUnit} setUnit={setNewFieldUnit}
                                  options={newFieldOptions} setOptions={setNewFieldOptions}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)}
                      onKeyDown={handleTypeKeyDown} placeholder="Ürün çeşidi adı..."
                      className="flex-1 rounded-xl border border-gray-300 px-3 sm:px-4 py-2 text-sm" />
                    <Button type="button" variant="outline" onClick={addProductType} disabled={!newTypeName.trim()}>
                      <Plus className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Ekle</span>
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                    Çeşit ekledikten sonra oka tıklayarak teknik alanlarını tanımlayabilirsiniz.
                  </p>
                </div>

                {/* Default Fields */}
                <div className="border-t pt-4 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => setShowDefaultFields(!showDefaultFields)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <Settings2 className="w-4 h-4" />
                    Varsayılan Teknik Alanlar
                    <span className="text-[10px] sm:text-xs text-gray-400 font-normal">
                      ({defaultFields.length} alan)
                    </span>
                    {showDefaultFields ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Özel alanı olmayan ürün çeşitleri bu alanları kullanır.
                  </p>

                  {showDefaultFields && (
                    <div className="mt-3">
                      {defaultFields.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {defaultFields.map((field) => (
                            <FieldBadge key={field.name} field={field}
                              onRemove={() => removeDefaultField(field.name)} />
                          ))}
                        </div>
                      )}
                      <AddFieldForm
                        onAdd={addDefaultField}
                        label={newDefFieldLabel} setLabel={setNewDefFieldLabel}
                        type={newDefFieldType} setType={setNewDefFieldType}
                        unit={newDefFieldUnit} setUnit={setNewDefFieldUnit}
                        options={newDefFieldOptions} setOptions={setNewDefFieldOptions}
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 sm:flex-none">
                    {editingCategory ? 'Güncelle' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 sm:flex-none">
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Category Cards */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Yükleniyor...</div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500 text-sm">Henüz kategori eklenmemiş</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((category) => {
              const typeCount = category.product_types?.length || 0
              const defFieldCount = category.default_fields?.length || 0
              return (
                <Card key={category.id}>
                  <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-xl truncate">{category.name}</CardTitle>
                        {category.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 -mr-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium ${
                          category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        {defFieldCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium bg-purple-50 text-purple-700">
                            {defFieldCount} varsayılan alan
                          </span>
                        )}
                      </div>

                      {typeCount > 0 && (
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5">
                            Ürün Çeşitleri ({typeCount})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {category.product_types!.map((pt) => (
                              <span key={pt.value} className="bg-gray-100 text-gray-700 rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                                {pt.label}
                                {pt.fields && pt.fields.length > 0 && (
                                  <span className="text-gray-400 ml-0.5">({pt.fields.length})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
