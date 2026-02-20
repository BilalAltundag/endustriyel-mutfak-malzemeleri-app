'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Trash2,
  History,
  X,
  AlertCircle,
  Tag,
  Bot,
} from 'lucide-react'
import { marketplaceSearchApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface MarketplaceListing {
  title: string
  price: number
  url: string
  location: string
  description: string
}

interface SearchResult {
  id?: number
  query: string
  location: string
  time_period: string
  listings: MarketplaceListing[]
  total_found: number
  total_extracted?: number
  total_title_matched?: number
  note?: string | null
  error?: string | null
  searched_at: string
  created_at?: string
}

const TIME_OPTIONS = [
  { value: '24_hours', label: 'Son 24 Saat' },
  { value: '7_days', label: 'Son 7 Gün' },
  { value: '30_days', label: 'Son 30 Gün' },
]

function formatPrice(price: number): string {
  if (price === 0) return 'Fiyat belirtilmemiş'
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

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
          <ShoppingBag className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
              {listing.title}
            </h3>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-0.5 transition-colors" />
          </div>

          {listing.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {listing.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                listing.price > 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Tag className="w-3 h-3" />
              {formatPrice(listing.price)}
            </span>
            {listing.location && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function HistoryItem({
  item,
  onSelect,
  onDelete,
}: {
  item: SearchResult
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <button onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">
            {item.query}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-5.5">
          <span className="text-xs text-gray-400">{item.location}</span>
          <span className="text-xs text-gray-300">&middot;</span>
          <span className="text-xs text-gray-400">{item.total_found} ilan</span>
          <span className="text-xs text-gray-300">&middot;</span>
          <span className="text-xs text-gray-400">
            {timeAgo(item.searched_at)}
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function MarketplaceSearchPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('İzmir')
  const [timePeriod, setTimePeriod] = useState('24_hours')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null)
  const [history, setHistory] = useState<SearchResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await marketplaceSearchApi.getHistory(30)
      setHistory(res.data)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim() || !location.trim()) return

    setLoading(true)
    setError(null)
    setCurrentResult(null)

    try {
      const res = await marketplaceSearchApi.search({
        query: query.trim(),
        location: location.trim(),
        time_period: timePeriod,
      })
      setCurrentResult(res.data)
      if (res.data.error) {
        setError(res.data.error)
      }
      fetchHistory()
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || err.message || 'Bir hata oluştu'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHistory = async (id: number) => {
    try {
      await marketplaceSearchApi.delete(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
      if (currentResult?.id === id) {
        setCurrentResult(null)
      }
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleSelectHistory = (item: SearchResult) => {
    setCurrentResult(item)
    setQuery(item.query)
    setLocation(item.location)
    setTimePeriod(item.time_period)
    setShowHistory(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch()
    }
  }

  const timeLabel =
    TIME_OPTIONS.find((t) => t.value === timePeriod)?.label || timePeriod

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Marketplace Arama
          </h1>
          <p className="text-sm text-gray-500">
            Facebook Marketplace'te AI destekli ürün araması
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ne aramak istiyorsunuz? (örn: ızgara, buzdolabı, sandalye...)"
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-32 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                    placeholder="Konum"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                    disabled={loading}
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Geçmiş</span>
                    {history.length > 0 && (
                      <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </button>

                  <Button
                    onClick={handleSearch}
                    disabled={loading || !query.trim() || !location.trim()}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aranıyor...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        AI ile Ara
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Panel */}
        {showHistory && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Arama Geçmişi
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {historyLoading ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  Yükleniyor...
                </div>
              ) : history.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  Henüz arama yapılmamış.
                </div>
              ) : (
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelectHistory(item)}
                      onDelete={() => item.id && handleDeleteHistory(item.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Bot className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Facebook Marketplace taranıyor...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    &quot;{query}&quot; için {location} konumunda arama yapılıyor.
                    Bu işlem 1-2 dakika sürebilir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Arama Hatası
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {currentResult && !loading && (
          <div>
            {/* Note */}
            {currentResult.note && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">{currentResult.note}</p>
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  &quot;{currentResult.query}&quot; Sonuçları
                </h2>
                <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{currentResult.total_found} ilan bulundu</span>
                  {currentResult.total_extracted && currentResult.total_extracted > currentResult.total_found && (
                    <>
                      <span>&middot;</span>
                      <span className="text-gray-400">({currentResult.total_extracted} tarandı)</span>
                    </>
                  )}
                  <span>&middot;</span>
                  <span>{currentResult.location}</span>
                  <span>&middot;</span>
                  <span>{timeLabel}</span>
                  <span>&middot;</span>
                  <span>{timeAgo(currentResult.searched_at)}</span>
                </div>
              </div>
            </div>

            {/* Listings Grid */}
            {currentResult.listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentResult.listings.map((listing, i) => (
                  <ListingCard key={i} listing={listing} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Bu arama için ilan bulunamadı.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Farklı bir arama terimi veya konum deneyin.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!currentResult && !loading && !error && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Marketplace Araması
              </h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Yukarıdaki arama kutusuna aramak istediğinizi yazın.
                AI agent Facebook Marketplace&apos;te sizin için arayacak ve
                ilgili tüm ilanları listeleyecek.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
