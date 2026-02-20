'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, FolderOpen, ShoppingCart, Edit, Image as ImageIcon } from 'lucide-react'
import {
  useInventorySummary,
  useInventoryByCategory,
  useInventoryByStockStatus,
  useEmptyCategories,
  useDailyLog,
  useSoldProducts,
} from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab = (tabParam === 'sold' || tabParam === 'daily' || tabParam === 'empty') ? tabParam : 'overview'

  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'sold' | 'empty'>(initialTab)

  const { data: summary, isLoading: summaryLoading } = useInventorySummary()
  const { data: byCategory = [], isLoading: catLoading } = useInventoryByCategory()
  const { data: byStockStatus = [] } = useInventoryByStockStatus()
  const { data: emptyCategories = [] } = useEmptyCategories()
  const { data: dailyLog = [] } = useDailyLog(30)
  const { data: soldProducts = [] } = useSoldProducts()

  const loading = summaryLoading || catLoading

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  const fmt = (n: number) => n?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'

  const categoryChartData = byCategory.map((item: any) => ({
    name: item.category || 'Kategorisiz',
    value: item.count,
  }))

  const stockStatusChartData = byStockStatus.map((item: any) => ({
    name: item.stock_status === 'available' ? 'Mevcut' : item.stock_status === 'sold' ? 'Satıldı' : 'Rezerve',
    value: item.count,
  }))

  const tabs = [
    { id: 'overview' as const, label: 'Genel', icon: Package },
    { id: 'daily' as const, label: 'Günlük', icon: Calendar },
    { id: 'sold' as const, label: 'Satılanlar', icon: ShoppingCart },
    { id: 'empty' as const, label: 'Boş Kat.', icon: FolderOpen },
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Envanter</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Stok durumu, değer analizi ve günlük log</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Toplam Ürün</div>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{summary?.total_products || 0}</div>
                </div>
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Mevcut</div>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{summary?.available || 0}</div>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Satıldı</div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{summary?.sold || 0}</div>
                </div>
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Rezerve</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{summary?.reserved || 0}</div>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Value Card */}
        <Card className="mb-5 sm:mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="py-4 sm:py-5 px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              <h3 className="text-sm sm:text-lg font-semibold text-emerald-800">Toplam Mal Değeri</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/70 rounded-xl p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Alış Toplam</div>
                <div className="text-base sm:text-xl font-bold text-gray-800">₺{fmt(summary?.total_purchase_value)}</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Satış Aralığı</div>
                <div className="text-base sm:text-xl font-bold text-emerald-700">
                  ₺{fmt(summary?.min_sale_value)} — ₺{fmt(summary?.max_sale_value)}
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 sm:p-4">
                <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Pazarlık Payı</div>
                <div className="text-base sm:text-xl font-bold text-amber-700">₺{fmt(summary?.total_margin)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 sm:gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base sm:text-xl">Kategoriye Göre Dağılım</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" name="Ürün Sayısı" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base sm:text-xl">Stok Durumu</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stockStatusChartData}
                        cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70} fill="#8884d8" dataKey="value"
                      >
                        {stockStatusChartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.name === 'Mevcut' ? '#10b981' : entry.name === 'Satıldı' ? '#f59e0b' : '#a855f7'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base sm:text-xl">Kategoriye Göre Liste</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5 sm:space-y-2">
                  {[...byCategory]
                    .sort((a: any, b: any) => b.count - a.count)
                    .map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                        <span className="text-sm text-gray-700">{item.category || 'Kategorisiz'}</span>
                        <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs sm:text-sm ${
                          item.count === 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: Daily Log */}
        {activeTab === 'daily' && (
          <div className="space-y-3 sm:space-y-4">
            {dailyLog.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 text-sm">
                  Son 30 günde eklenen ürün yok.
                </CardContent>
              </Card>
            ) : (
              dailyLog.map((day: any) => (
                <Card key={day.date}>
                  <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(day.date).toLocaleDateString('tr-TR', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </CardTitle>
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">
                        {day.count} ürün
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="divide-y divide-gray-100">
                      {day.products.map((p: any) => (
                        <div key={p.id} className="py-2.5 sm:py-3">
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-medium text-sm text-gray-800 block truncate">{p.name}</span>
                              {p.category && (
                                <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                                  {p.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-shrink-0">
                              <div className="text-right">
                                <span className="text-gray-400 block sm:inline">₺{fmt(p.purchase_price)}</span>
                                <span className="text-gray-300 hidden sm:inline mx-1">→</span>
                                <span className="font-medium text-emerald-600 block sm:inline">₺{fmt(p.sale_price)}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${
                                p.stock_status === 'sold'
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                {p.stock_status === 'sold' ? 'Satıldı' : 'Mevcut'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB: Sold */}
        {activeTab === 'sold' && (
          <div className="space-y-3 sm:space-y-4">
            {soldProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 text-sm">
                  Henüz satılan ürün yok.
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-orange-800 text-sm sm:text-base">Toplam {soldProducts.length} ürün satıldı</span>
                      <p className="text-[10px] sm:text-xs text-orange-600 mt-0.5">
                        Alış: ₺{fmt(soldProducts.reduce((s: number, p: any) => s + (p.purchase_price || 0), 0))}
                        {' · '}
                        Satış: ₺{fmt(soldProducts.reduce((s: number, p: any) => s + (p.sale_price || 0), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-xl">Satılan Ürünler ({soldProducts.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="divide-y divide-gray-100">
                      {soldProducts.map((p: any) => (
                        <div key={p.id} className="py-3 sm:py-4">
                          <div className="flex items-start gap-3">
                            {p.images && p.images.length > 0 ? (
                              <img
                                src={p.images[0].startsWith('http') ? p.images[0] : `/api/static${p.images[0]}`}
                                alt={p.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm sm:text-base text-gray-800 truncate">{p.name}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                    {p.category?.name || 'Kategorisiz'}
                                    {p.material && <span> · {p.material}</span>}
                                  </div>
                                </div>
                                <Link href={`/products/${p.id}/edit`} className="flex-shrink-0">
                                  <div className="p-1.5 hover:bg-gray-100 rounded-lg">
                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                  </div>
                                </Link>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm">
                                <span className="text-gray-500">Alış: ₺{fmt(p.purchase_price)}</span>
                                <span className="font-medium text-emerald-600">Satış: ₺{fmt(p.sale_price)}</span>
                                {p.sale_price && p.purchase_price && (
                                  <span className={`font-medium ${p.sale_price >= p.purchase_price ? 'text-green-600' : 'text-red-600'}`}>
                                    Kar: ₺{fmt(p.sale_price - p.purchase_price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* TAB: Empty Categories */}
        {activeTab === 'empty' && (
          <div className="space-y-3 sm:space-y-4">
            {emptyCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 text-sm">
                  Tüm kategorilerde en az bir ürün var.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-xl">Boş Kategoriler ({emptyCategories.length})</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    {emptyCategories.map((cat: any) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">{cat.name}</div>
                          {cat.description && (
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{cat.description}</div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-xs sm:text-sm text-red-600 font-medium">0 mevcut</div>
                          {cat.total_ever > 0 && (
                            <div className="text-[10px] sm:text-xs text-gray-500">Toplam: {cat.total_ever}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
