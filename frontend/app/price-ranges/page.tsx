'use client'

import { useEffect, useState, useRef } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Bot,
  Info,
  Loader2,
  MapPin,
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
} from 'lucide-react'
import { categoriesApi, priceScraperApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Listing {
  title: string
  price: number
  url: string
}

interface PriceResult {
  id?: number
  category_id: number
  category_name: string
  product_type: string
  product_type_label: string
  min_price: number | null
  max_price: number | null
  avg_price: number | null
  cluster_avg_price: number | null
  listings: Listing[]
  total_found: number
  location: string
  time_period: string
  error?: string | null
  searched_at: string
}

interface ProductType {
  value: string
  label: string
  fields?: any[] | null
}

interface Category {
  id: number
  name: string
  product_types?: ProductType[]
}

interface FilterState {
  time_period: string
  location: string
}

const TIME_OPTIONS = [
  { value: '24_hours', label: 'Son 24 Saat' },
  { value: '7_days', label: 'Son 7 Gün' },
  { value: '30_days', label: 'Son 30 Gün' },
]

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  return price.toLocaleString('tr-TR') + ' ₺'
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Az önce'
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} saat önce`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} gün önce`
}

function ReferencePopover({
  listings,
  onClose,
}: {
  listings: Listing[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 p-3"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">
          Referans İlanlar ({listings.length})
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {listings.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-700 truncate">{item.title}</div>
              <div className="text-xs font-semibold text-blue-600">
                {formatPrice(item.price)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function ProductTypeRow({
  category,
  pt,
  existingResult,
  onSearchComplete,
}: {
  category: Category
  pt: ProductType
  existingResult?: PriceResult | null
  onSearchComplete: (result: PriceResult) => void
}) {
  const [filters, setFilters] = useState<FilterState>({
    time_period: '24_hours',
    location: 'İzmir',
  })
  const [loading, setLoading] = useState(false)
  const [showRefs, setShowRefs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await priceScraperApi.search({
        category_id: category.id,
        category_name: category.name,
        product_type: pt.value,
        product_type_label: pt.label,
        location: filters.location,
        time_period: filters.time_period,
      })
      onSearchComplete(res.data)
      if (res.data.error) {
        setError(res.data.error)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Bir hata oluştu'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const result = existingResult

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-col gap-3">
        {/* Title */}
        <div className="font-medium text-gray-800">{pt.label}</div>

        {/* Filters + Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filters.time_period}
              onChange={(e) => setFilters({ ...filters, time_period: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
              disabled={loading}
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-24 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Konum"
              disabled={loading}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading || !filters.location.trim()}
            className="flex items-center gap-1.5 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Aranıyor...
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5" />
                AI ile Fiyat Çek
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && result.min_price !== null && result.max_price !== null && (
          <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Min</div>
                <div className="text-sm font-bold text-blue-700">
                  {formatPrice(result.min_price)}
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Max</div>
                <div className="text-sm font-bold text-emerald-700">
                  {formatPrice(result.max_price)}
                </div>
              </div>
            </div>
            {result.avg_price && (
              <>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ort</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {formatPrice(result.avg_price)}
                  </div>
                </div>
              </>
            )}
            {result.cluster_avg_price != null && (
              <>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <div className="text-[10px] text-violet-600 uppercase tracking-wide font-medium">Yakın Ort</div>
                  <div className="text-sm font-bold text-violet-700">
                    {formatPrice(result.cluster_avg_price)}
                  </div>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-[10px] text-gray-500">
              {result.total_found} ilan &middot; {timeAgo(result.searched_at)}
            </div>

            {/* Reference Links Info Button */}
            {result.listings && result.listings.length > 0 && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowRefs(!showRefs)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-white rounded-lg px-2 py-1 border border-blue-200 hover:border-blue-400 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  Referanslar
                </button>
                {showRefs && (
                  <ReferencePopover
                    listings={result.listings}
                    onClose={() => setShowRefs(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-px bg-gray-200" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-px bg-gray-200" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              Facebook Marketplace taranıyor... Bu işlem 1-2 dakika sürebilir.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PriceRangesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [priceResults, setPriceResults] = useState<PriceResult[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, resultsRes] = await Promise.all([
        categoriesApi.getAll(),
        priceScraperApi.getResults(),
      ])
      const cats = catRes.data.filter(
        (c: Category) => c.product_types && c.product_types.length > 0
      )
      setCategories(cats)
      setPriceResults(resultsRes.data)

      if (cats.length > 0) {
        const tostCat = cats.find((c: Category) => c.name === 'Tost Makineleri')
        if (tostCat) {
          setExpandedCategories(new Set([tostCat.id]))
        } else {
          setExpandedCategories(new Set([cats[0].id]))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const getResultForType = (categoryId: number, productType: string) => {
    return priceResults.find(
      (r) => r.category_id === categoryId && r.product_type === productType
    )
  }

  const handleSearchComplete = (result: PriceResult) => {
    setPriceResults((prev) => {
      const idx = prev.findIndex(
        (r) => r.category_id === result.category_id && r.product_type === result.product_type
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = result
        return next
      }
      return [...prev, result]
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Fiyat Aralıkları
          </h1>
          <p className="text-sm text-gray-500">
            AI destekli Facebook Marketplace fiyat araştırması
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 animate-pulse">
                  <div className="h-5 w-40 bg-gray-200 rounded" />
                  <div className="mt-4 space-y-3">
                    <div className="h-16 bg-gray-100 rounded-xl" />
                    <div className="h-16 bg-gray-100 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Henüz ürün çeşidi tanımlı kategori bulunamadı.</p>
              <p className="text-xs mt-1">
                Kategoriler sayfasından ürün çeşitleri ekleyin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const isExpanded = expandedCategories.has(cat.id)
              const ptCount = cat.product_types?.length || 0
              const resultCount =
                cat.product_types?.filter((pt) =>
                  getResultForType(cat.id, pt.value)
                ).length || 0

              return (
                <Card key={cat.id} className="overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {ptCount} ürün çeşidi
                          {resultCount > 0 && (
                            <span className="text-blue-600 ml-1">
                              &middot; {resultCount} fiyat verisi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Product Types */}
                  {isExpanded && cat.product_types && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                      {cat.product_types.map((pt) => (
                        <ProductTypeRow
                          key={pt.value}
                          category={cat}
                          pt={pt}
                          existingResult={getResultForType(cat.id, pt.value)}
                          onSearchComplete={handleSearchComplete}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
