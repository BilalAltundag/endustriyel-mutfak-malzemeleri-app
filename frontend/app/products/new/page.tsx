'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Upload, X, Loader2, AlertCircle, CheckCircle2, Mic, MicOff, Camera, Info, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { productsApi, categoriesApi, aiApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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

  const [aiImages, setAiImages] = useState<File[]>([])
  const [aiImagePreviews, setAiImagePreviews] = useState<string[]>([])
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)
  const [aiWarnings, setAiWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [showSpecGuide, setShowSpecGuide] = useState(false)
  const [expandedGuideCategory, setExpandedGuideCategory] = useState<string | null>(null)

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

  const getSelectedCategory = () => {
    if (!formData.category_id) return null
    return categories.find((cat) => cat.id === parseInt(formData.category_id)) || null
  }

  const selectedCategory = getSelectedCategory()
  const categoryProductTypes: { value: string; label: string; fields?: any[] | null }[] = selectedCategory?.product_types || []
  const defaultFields: any[] = selectedCategory?.default_fields || []

  const getActiveFields = (): any[] => {
    if (!selectedProductType) return []
    const pt = categoryProductTypes.find((t) => t.value === selectedProductType)
    if (pt?.fields && pt.fields.length > 0) return pt.fields
    return defaultFields
  }
  const activeFields = getActiveFields()

  const toggleRecording = useCallback(async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
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
          stream.getTracks().forEach((track) => track.stop())
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setAiImages((prev) => [...prev, ...files])
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

        const catTypes: { value: string; label: string }[] = matchedCategory.product_types || []
        if (catTypes.length > 0 && form.product_type_value) {
          const matchedType = catTypes.find((t) => t.value === form.product_type_value)
          if (matchedType) {
            setSelectedProductType(matchedType.value)
            if (!form.name) {
              setFormData((prev) => ({ ...prev, name: matchedType.label }))
            }
          } else {
            setSelectedProductType(form.product_type_value)
          }
        }

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
          setAiWarnings((prev) => [...prev, `Kategori "${categoryName}" veritabanında bulunamadı. Lütfen elle seçin.`])
        } else {
          setAiWarnings((prev) => [...prev, 'AI kategori belirleyemedi. Lütfen elle seçin.'])
        }
      }

      if (data.warnings && data.warnings.length > 0) {
        setAiWarnings((prev) => [...prev, ...data.warnings])
      }
      setAiSuccess(true)
    } catch (error: any) {
      console.error('AI analiz hatası:', error)
      const detail = error.response?.data?.detail || error.response?.data?.error || error.message || 'AI analiz sırasında bir hata oluştu'
      setAiError(`Hata: ${detail}`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
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

      const createResponse = await productsApi.create(data)
      const productId = createResponse.data?.id

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
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Geri Dön
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Yeni Ürün</h1>
        </div>

        {/* AI Assistant */}
        <Card className="mb-5 sm:mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-blue-800 text-base sm:text-xl">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                AI ile Hızlı Doldur
              </CardTitle>
              <button
                type="button"
                onClick={() => setShowSpecGuide(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ne söylemeliyim?</span>
                <span className="sm:hidden">Rehber</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">
              Fotoğraf ekleyin ve ürünü kısaca anlatın, AI formu sizin için doldursun.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {/* Photos */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Ürün Fotoğrafları
              </label>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {aiImagePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-blue-200 shadow-sm"
                  >
                    <img src={preview} alt={`Ürün ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[9px] sm:text-[10px] mt-0.5">Galeri</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] sm:text-[10px] mt-0.5">Çek</span>
                </button>

                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
              </div>
            </div>

            {/* Description + Voice */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Ürün Açıklaması *
              </label>
              <div className="relative">
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Yazın veya mikrofona basarak konuşun..."
                  className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 pr-14 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm ${
                    isRecording ? 'border-red-400 ring-2 ring-red-200' : 'border-blue-200'
                  }`}
                  rows={3}
                />
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

            {/* Alerts */}
            {aiError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {aiError}
              </div>
            )}
            {aiSuccess && (
              <div className="flex items-start gap-2 text-green-700 bg-green-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Form dolduruldu! Kontrol edip kaydedin.
              </div>
            )}
            {aiWarnings.length > 0 && (
              <div className="text-amber-700 bg-amber-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm space-y-1">
                {aiWarnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}

            {/* AI Button */}
            <button
              type="button"
              onClick={handleAiFill}
              disabled={aiLoading || !aiDescription.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-sm"
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

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Category & Type */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-xl">Kategori ve Çeşit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Kategori *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_id: e.target.value, name: '' })
                    setSelectedProductType('')
                    setDynamicFields({})
                  }}
                  className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Kategori Seçiniz</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {formData.category_id && categoryProductTypes.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Ürün Çeşidi *</label>
                  <select
                    required
                    value={selectedProductType}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedProductType(value)
                      const selectedType = categoryProductTypes.find((t) => t.value === value)
                      setFormData((prev) => ({ ...prev, name: selectedType ? selectedType.label : '' }))
                      setDynamicFields({})
                    }}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Ürün Çeşidi Seçiniz</option>
                    {categoryProductTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.category_id && categoryProductTypes.length === 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Ürün Adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ürün adını yazınız"
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Specs */}
          {activeFields.length > 0 && (
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-xl">Teknik Özellikler</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {activeFields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={dynamicFields[field.name] || ''}
                          onChange={(e) => setDynamicFields((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Seçiniz</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          step={field.type === 'number' ? 'any' : undefined}
                          value={dynamicFields[field.name] || ''}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => setDynamicFields((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-xl">Fiyat Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Alış (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Satış (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Pazarlık Payı</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.negotiation_margin}
                    onChange={(e) => setFormData({ ...formData, negotiation_margin: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Pazarlık Tipi</label>
                  <select
                    value={formData.negotiation_type}
                    onChange={(e) => setFormData({ ...formData, negotiation_type: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="amount">Tutar (₺)</option>
                    <option value="percentage">Yüzde (%)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Info */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-xl">Diğer Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Malzeme</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="Bakır, çelik, demir, alüminyum vs."
                  className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Durum</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="working">Çalışıyor</option>
                    <option value="broken">Arızalı</option>
                    <option value="repair">Tamirde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Stok Durumu</label>
                  <select
                    value={formData.stock_status}
                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="available">Mevcut</option>
                    <option value="sold">Satıldı</option>
                    <option value="reserved">Rezerve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Link href="/products" className="flex-1 sm:flex-none">
              <Button type="button" variant="outline" className="w-full">İptal</Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Spec Guide Bottom Sheet */}
      {showSpecGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => { setShowSpecGuide(false); setExpandedGuideCategory(null) }}
          />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col animate-slide-up shadow-2xl">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Sesle Ne Söylemeliyim?</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Kategoriye göre istenen bilgiler</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowSpecGuide(false); setExpandedGuideCategory(null) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-[10px] sm:text-xs text-amber-800">
                <strong>Her ürün için:</strong> boyutlar, marka, malzeme, durum ve fiyat bilgisi söyleyin.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-2 sm:px-3 py-2">
              {categories.filter((c: any) => c.product_types && c.product_types.length > 0).map((cat: any) => {
                const isExpanded = expandedGuideCategory === cat.name
                const catDefFields: any[] = cat.default_fields || []

                return (
                  <div key={cat.id} className="border-b border-gray-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => setExpandedGuideCategory(isExpanded ? null : cat.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-medium text-gray-800">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">
                          {cat.product_types.length} çeşit
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 sm:space-y-3">
                        {catDefFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {catDefFields.map((field: any) => (
                              <span
                                key={field.name}
                                className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] bg-blue-50 text-blue-700 rounded-md"
                              >
                                {field.label}
                                {field.unit && <span className="text-blue-400">({field.unit})</span>}
                                {field.type === 'select' && field.options && (
                                  <span className="text-blue-400">→ {field.options.join(' / ')}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] sm:text-[11px] text-gray-400">
                          Çeşitler: {cat.product_types.map((t: any) => t.label).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
