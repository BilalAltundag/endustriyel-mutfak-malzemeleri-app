'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

interface DailySummary {
  date: string
  sold_products: any[]
  purchased_products: any[]
  expenses: any[]
  reminders: any[]
  notes?: any[]
  new_products?: any[]
  new_categories?: any[]
  new_suppliers?: any[]
  total_revenue: number
  total_expenses: number
  net_profit: number
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [upcomingNotes, setUpcomingNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    fetchDailySummary()
    fetchUpcomingNotes()
  }, [selectedDate])

  const fetchDailySummary = async () => {
    try {
      setLoading(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await calendarApi.getDaily(dateStr)
      setDailySummary(response.data)
    } catch (error) {
      console.error('Error fetching daily summary:', error)
      setDailySummary(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingNotes = async () => {
    try {
      const response = await calendarApi.getUpcomingNotes()
      setUpcomingNotes(response.data)
    } catch (error) {
      console.error('Error fetching upcoming notes:', error)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Takvim</h1>
          <p className="text-gray-600">Günlük hareketler ve özetler</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Bugün
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day) => {
                    const isSelected = isSameDay(day, selectedDate)
                    const isToday = isSameDay(day, new Date())
                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square rounded-xl p-2 text-sm transition-colors
                          ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
                          ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Yükleniyor...</div>
                ) : dailySummary ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Toplam Gelir</div>
                      <div className="text-2xl font-bold text-green-700">
                        {dailySummary.total_revenue.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Toplam Gider</div>
                      <div className="text-2xl font-bold text-red-700">
                        {dailySummary.total_expenses.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Net Kâr</div>
                      <div
                        className={`text-2xl font-bold ${
                          dailySummary.net_profit >= 0 ? 'text-blue-700' : 'text-red-700'
                        }`}
                      >
                        {dailySummary.net_profit.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Satılan Ürünler: {dailySummary.sold_products.length}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Alınan Ürünler: {dailySummary.purchased_products.length}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Giderler: {dailySummary.expenses.length}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Hatırlatıcılar: {dailySummary.reminders.length}
                      </div>
                      
                      {/* Yeni Eklenenler */}
                      {dailySummary.new_products && dailySummary.new_products.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Yeni Eklenen Ürünler:</div>
                          {dailySummary.new_products.map((product: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 mb-1 p-2 bg-blue-50 rounded">
                              <div className="font-medium">{product.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {dailySummary.new_categories && dailySummary.new_categories.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Yeni Eklenen Kategoriler:</div>
                          {dailySummary.new_categories.map((category: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 mb-1 p-2 bg-purple-50 rounded">
                              <div className="font-medium">{category.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {dailySummary.new_suppliers && dailySummary.new_suppliers.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-600 mb-2">Yeni Eklenen Tedarikçiler:</div>
                          {dailySummary.new_suppliers.map((supplier: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 mb-1 p-2 bg-green-50 rounded">
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.phone && <div className="text-gray-600">{supplier.phone}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {dailySummary.notes && dailySummary.notes.length > 0 && (
                        <>
                          <div className="text-sm font-medium text-gray-700">
                            Notlar: {dailySummary.notes.length}
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-semibold text-gray-600 mb-2">Notlar:</div>
                            {dailySummary.notes.map((note: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-700 mb-2 p-2 bg-gray-50 rounded">
                                {note.title && <div className="font-medium">{note.title}</div>}
                                <div>{note.content}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Bu gün için veri bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Yapılacak Notlar (Gelecek Tarihli) */}
        {upcomingNotes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Yapılacak Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingNotes.map((note: any) => (
                  <div key={note.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {note.title && (
                          <div className="font-semibold text-gray-900 mb-1">{note.title}</div>
                        )}
                        <div className="text-sm text-gray-700">{note.content}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {format(new Date(note.date), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

