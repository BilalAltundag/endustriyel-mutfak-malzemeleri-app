'use client'

import { useEffect, useState } from 'react'
import { Package, AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, FolderOpen, ShoppingCart } from 'lucide-react'
import { inventoryApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function InventoryPage() {
  const [summary, setSummary] = useState<any>(null)
  const [byCategory, setByCategory] = useState<any[]>([])
  const [byStockStatus, setByStockStatus] = useState<any[]>([])
  const [emptyCategories, setEmptyCategories] = useState<any[]>([])
  const [dailyLog, setDailyLog] = useState<any[]>([])
  const [soldProducts, setSoldProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'sold' | 'empty'>('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [summaryRes, categoryRes, stockStatusRes, emptyRes, dailyRes, soldRes] = await Promise.all([
        inventoryApi.getSummary(),
        inventoryApi.getByCategory(),
        inventoryApi.getByStockStatus(),
        inventoryApi.getEmptyCategories(),
        inventoryApi.getDailyLog(30),
        inventoryApi.getSoldProducts(),
      ])
      setSummary(summaryRes.data || {})
      setByCategory(categoryRes.data || [])
      setByStockStatus(stockStatusRes.data || [])
      setEmptyCategories(emptyRes.data || [])
      setDailyLog(dailyRes.data || [])
      setSoldProducts(soldRes.data || [])
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  const fmt = (n: number) => n?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'

  const categoryChartData = byCategory.map((item) => ({
    name: item.category || 'Kategorisiz',
    value: item.count,
  }))

  const stockStatusChartData = byStockStatus.map((item) => ({
    name: item.stock_status === 'available' ? 'Mevcut' : item.stock_status === 'sold' ? 'Satıldı' : 'Rezerve',
    value: item.count,
  }))

  const tabs = [
    { id: 'overview' as const, label: 'Genel Bakış', icon: Package },
    { id: 'daily' as const, label: 'Günlük Log', icon: Calendar },
    { id: 'sold' as const, label: 'Satılanlar', icon: ShoppingCart },
    { id: 'empty' as const, label: 'Boş Kategoriler', icon: FolderOpen },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Envanter</h1>
          <p className="text-gray-600">Stok durumu, değer analizi ve günlük log</p>
        </div>

        {/* ═══ Değer Kartları ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Toplam Ürün</div>
                  <div className="text-2xl font-bold text-gray-900">{summary?.total_products || 0}</div>
                </div>
                <Package className="w-7 h-7 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Mevcut</div>
                  <div className="text-2xl font-bold text-green-600">{summary?.available || 0}</div>
                </div>
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Satıldı</div>
                  <div className="text-2xl font-bold text-orange-600">{summary?.sold || 0}</div>
                </div>
                <ShoppingCart className="w-7 h-7 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Rezerve</div>
                  <div className="text-2xl font-bold text-purple-600">{summary?.reserved || 0}</div>
                </div>
                <AlertCircle className="w-7 h-7 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Toplam Mal Değeri ═══ */}
        <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="py-5">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-800">Toplam Mal Değeri (Mevcut Ürünler)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Alış Toplam</div>
                <div className="text-xl font-bold text-gray-800">₺{fmt(summary?.total_purchase_value)}</div>
              </div>
              <div className="bg-white/70 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Satış Aralığı (Pazarlık Dahil)</div>
                <div className="text-xl font-bold text-emerald-700">
                  ₺{fmt(summary?.min_sale_value)} — ₺{fmt(summary?.max_sale_value)}
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Toplam Pazarlık Payı</div>
                <div className="text-xl font-bold text-amber-700">₺{fmt(summary?.total_margin)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Tab Navigation ═══ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: Genel Bakış ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Kategoriye Göre Dağılım</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" name="Ürün Sayısı" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Stok Durumu</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stockStatusChartData}
                        cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80} fill="#8884d8" dataKey="value"
                      >
                        {stockStatusChartData.map((entry, index) => (
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
              <CardHeader><CardTitle>Kategoriye Göre Liste</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {byCategory
                    .sort((a, b) => b.count - a.count)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                        <span className="text-gray-700">{item.category || 'Kategorisiz'}</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
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

        {/* ═══ TAB: Günlük Log ═══ */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {dailyLog.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Son 30 günde eklenen ürün yok.
                </CardContent>
              </Card>
            ) : (
              dailyLog.map((day: any) => (
                <Card key={day.date}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(day.date).toLocaleDateString('tr-TR', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </CardTitle>
                      <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {day.count} ürün
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-100">
                      {day.products.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <span className="font-medium text-gray-800">{p.name}</span>
                            {p.category && (
                              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {p.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">₺{fmt(p.purchase_price)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-emerald-600">₺{fmt(p.sale_price)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              p.stock_status === 'sold'
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {p.stock_status === 'sold' ? 'Satıldı' : 'Mevcut'}
                            </span>
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

        {/* ═══ TAB: Satılanlar ═══ */}
        {activeTab === 'sold' && (
          <div className="space-y-4">
            {soldProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Henüz satılan ürün yok.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Satılan Ürünler ({soldProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100">
                    {soldProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          {p.images && p.images.length > 0 ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{p.name}</div>
                            <div className="text-xs text-gray-500">
                              {p.category?.name || 'Kategorisiz'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Alış: ₺{fmt(p.purchase_price)}</div>
                          <div className="font-medium text-emerald-600">Satış: ₺{fmt(p.sale_price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ═══ TAB: Boş Kategoriler ═══ */}
        {activeTab === 'empty' && (
          <div className="space-y-4">
            {emptyCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Tüm kategorilerde en az bir ürün var.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Mevcut Ürünü Olmayan Kategoriler ({emptyCategories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emptyCategories.map((cat: any) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <div>
                          <div className="font-medium text-gray-800">{cat.name}</div>
                          {cat.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-red-600 font-medium">0 mevcut</div>
                          {cat.total_ever > 0 && (
                            <div className="text-xs text-gray-500">Toplam: {cat.total_ever} (satıldı/silindi)</div>
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
