'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Trash2 } from 'lucide-react'
import { financeApi, productsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null)
  const [revenues, setRevenues] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [revenueForm, setRevenueForm] = useState({
    product_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [expenseForm, setExpenseForm] = useState({
    expense_type: 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    product_ids: [] as string[], // Sadece ürün ID'leri
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [summaryRes, transactionsRes, expensesRes, productsRes] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getTransactions({ transaction_type: 'sale', limit: 100 }),
        financeApi.getExpenses({ limit: 100 }),
        productsApi.getAll(),
      ])
      setSummary(summaryRes.data)
      setRevenues(transactionsRes.data)
      setExpenses(expensesRes.data)
      const productsData = productsRes.data || []
      setProducts(productsData)
      console.log('Products loaded:', productsData.length, productsData)
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await financeApi.createTransaction({
        product_id: revenueForm.product_id ? parseInt(revenueForm.product_id) : null,
        transaction_type: 'sale',
        amount: parseFloat(revenueForm.amount),
        date: new Date(revenueForm.date).toISOString(),
        description: revenueForm.description,
      })
      setShowRevenueForm(false)
      setRevenueForm({
        product_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
      fetchData()
    } catch (error: any) {
      console.error('Error creating revenue:', error)
      alert(error.response?.data?.detail || 'Gelir kaydedilirken bir hata oluştu')
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalAmount = parseFloat(expenseForm.amount) || 0
      
      if (totalAmount <= 0) {
        alert('Lütfen toplam fiyat giriniz')
        return
      }

      // Seçilen ürünleri products_data formatına çevir
      const productsData = expenseForm.product_ids
        .filter((id) => id)
        .map((id) => ({
          product_id: parseInt(id),
          quantity: 1, // Miktar gerekmez, sadece ürün seçimi
          unit_price: 0, // Birim fiyat gerekmez
        }))

      await financeApi.createExpense({
        product_id: expenseForm.product_ids.length === 1 ? parseInt(expenseForm.product_ids[0]) : null,
        expense_type: expenseForm.expense_type,
        amount: totalAmount,
        date: new Date(expenseForm.date).toISOString(),
        description: expenseForm.description,
        products_data: productsData.length > 0 ? productsData : null,
      })
      setShowExpenseForm(false)
      setExpenseForm({
        expense_type: 'other',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        product_ids: [],
      })
      fetchData()
    } catch (error: any) {
      console.error('Error creating expense:', error)
      alert(error.response?.data?.detail || 'Gider kaydedilirken bir hata oluştu')
    }
  }

  const handleDeleteRevenue = async (id: number) => {
    if (!confirm('Bu geliri silmek istediğinize emin misiniz?')) return
    try {
      await financeApi.deleteTransaction(id)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting revenue:', error)
      alert('Gelir silinirken bir hata oluştu')
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return
    try {
      await financeApi.deleteExpense(id)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      alert('Gider silinirken bir hata oluştu')
    }
  }

  const addProductToExpense = () => {
    setExpenseForm({
      ...expenseForm,
      product_ids: [...expenseForm.product_ids, ''],
    })
  }

  const removeProductFromExpense = (index: number) => {
    setExpenseForm({
      ...expenseForm,
      product_ids: expenseForm.product_ids.filter((_, i) => i !== index),
    })
  }

  const updateProductInExpense = (index: number, productId: string) => {
    const newProductIds = [...expenseForm.product_ids]
    newProductIds[index] = productId
    setExpenseForm({
      ...expenseForm,
      product_ids: newProductIds,
    })
  }

  // Prepare chart data - combine revenues and expenses by date
  const allDates = new Set<string>()
  revenues.slice(0, 30).forEach((r) => {
    allDates.add(new Date(r.date).toISOString().split('T')[0])
  })
  expenses.slice(0, 30).forEach((e) => {
    allDates.add(new Date(e.date).toISOString().split('T')[0])
  })

  const dateMap = new Map<string, { gelir: number; gider: number; kar: number }>()
  
  allDates.forEach((date) => {
    dateMap.set(date, { gelir: 0, gider: 0, kar: 0 })
  })

  revenues.slice(0, 30).forEach((r) => {
    const date = new Date(r.date).toISOString().split('T')[0]
    const entry = dateMap.get(date) || { gelir: 0, gider: 0, kar: 0 }
    entry.gelir += r.amount
    entry.kar = entry.gelir - entry.gider
    dateMap.set(date, entry)
  })

  expenses.slice(0, 30).forEach((e) => {
    const date = new Date(e.date).toISOString().split('T')[0]
    const entry = dateMap.get(date) || { gelir: 0, gider: 0, kar: 0 }
    entry.gider += e.amount
    entry.kar = entry.gelir - entry.gider
    dateMap.set(date, entry)
  })

  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14) // Son 14 gün
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      gelir: data.gelir,
      gider: data.gider,
      kar: data.kar,
    }))

  const expenseTypeData = expenses.reduce((acc: any, e) => {
    const type = e.expense_type === 'purchase' ? 'Mal Alımı' : e.expense_type === 'paint' ? 'Boya' : e.expense_type === 'repair' ? 'Tamir' : e.expense_type === 'rent' ? 'Kira' : e.expense_type === 'transport' ? 'Nakliye' : 'Diğer'
    if (!acc[type]) acc[type] = 0
    acc[type] += e.amount
    return acc
  }, {})

  const pieData = Object.entries(expenseTypeData).map(([name, value]) => ({
    name,
    value: value as number,
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finans</h1>
          <p className="text-gray-600">Gelir-gider takibi</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Toplam Gelir</div>
                <div className="text-2xl font-bold text-green-600">
                  {summary?.total_revenue?.toLocaleString('tr-TR') || 0} ₺
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Toplam Gider</div>
                  <div className="text-2xl font-bold text-red-600">
                    {summary?.total_expenses?.toLocaleString('tr-TR') || 0} ₺
                  </div>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Net Kâr</div>
                  <div
                    className={`text-2xl font-bold ${
                      (summary?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}
                  >
                    {summary?.net_profit?.toLocaleString('tr-TR') || 0} ₺
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gelir & Gider Grafiği (Son 14 Gün)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gelir" stroke="#10b981" strokeWidth={2} name="Gelir" />
                  <Line type="monotone" dataKey="gider" stroke="#ef4444" strokeWidth={2} name="Gider" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kâr Grafiği (Son 14 Gün)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kar" fill="#3b82f6" name="Kâr" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Gider Tipi Dağılımı */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Gider Tipi Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenues */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gelirler</CardTitle>
                <Button size="sm" onClick={() => setShowRevenueForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Gelir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showRevenueForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Yeni Gelir</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowRevenueForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleRevenueSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün (Opsiyonel)
                      </label>
                       <select
                         value={revenueForm.product_id}
                         onChange={(e) => setRevenueForm({ ...revenueForm, product_id: e.target.value })}
                         className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                         disabled={loading}
                       >
                         <option value="">Ürün Seçiniz</option>
                         {products && products.length > 0 ? (
                           products.map((p) => (
                             <option key={p.id} value={p.id.toString()}>
                               {p.name}
                             </option>
                           ))
                         ) : (
                           <option disabled>Ürün yükleniyor... ({products?.length || 0} ürün)</option>
                         )}
                       </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tutar (₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={revenueForm.amount}
                        onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarih *
                      </label>
                      <input
                        type="date"
                        required
                        value={revenueForm.date}
                        onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        value={revenueForm.description}
                        onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Kaydet
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowRevenueForm(false)}>
                        İptal
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {revenues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Henüz gelir kaydı yok</div>
              ) : (
                <div className="space-y-4">
                  {revenues.map((revenue) => (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Satış</div>
                        <div className="text-sm text-gray-600">
                          {new Date(revenue.date).toLocaleDateString('tr-TR')}
                        </div>
                        {revenue.description && (
                          <div className="text-sm text-gray-500 mt-1">{revenue.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-green-600">
                          {revenue.amount.toLocaleString('tr-TR')} ₺
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRevenue(revenue.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Giderler</CardTitle>
                <Button size="sm" onClick={() => setShowExpenseForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Gider
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showExpenseForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Yeni Gider</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowExpenseForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleExpenseSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gider Tipi *
                      </label>
                      <select
                        required
                        value={expenseForm.expense_type}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="purchase">Mal Alımı</option>
                        <option value="paint">Boya</option>
                        <option value="repair">Tamir</option>
                        <option value="rent">Kira</option>
                        <option value="transport">Nakliye</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Ürünler (Mal Alma İçin - Opsiyonel)
                        </label>
                        <Button type="button" variant="outline" size="sm" onClick={addProductToExpense}>
                          <Plus className="w-3 h-3 mr-1" />
                          Ürün Ekle
                        </Button>
                      </div>
                      {expenseForm.product_ids.map((productId, index) => (
                        <div key={index} className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                             <select
                               value={productId}
                               onChange={(e) => updateProductInExpense(index, e.target.value)}
                               className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                             >
                               <option value="">Ürün Seçiniz</option>
                               {products && products.length > 0 ? (
                                 products.map((p) => (
                                   <option key={p.id} value={p.id.toString()}>
                                     {p.name}
                                   </option>
                                 ))
                               ) : (
                                 <option disabled>Ürün yükleniyor... ({products?.length || 0} ürün)</option>
                               )}
                             </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductFromExpense(index)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Toplam Tutar (₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Toplam alış fiyatı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarih *
                      </label>
                      <input
                        type="date"
                        required
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Kaydet
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowExpenseForm(false)}>
                        İptal
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Henüz gider kaydı yok</div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {expense.expense_type === 'purchase'
                            ? 'Mal Alımı'
                            : expense.expense_type === 'paint'
                            ? 'Boya'
                            : expense.expense_type === 'repair'
                            ? 'Tamir'
                            : expense.expense_type === 'rent'
                            ? 'Kira'
                            : expense.expense_type === 'transport'
                            ? 'Nakliye'
                            : 'Diğer'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(expense.date).toLocaleDateString('tr-TR')}
                        </div>
                        {expense.description && (
                          <div className="text-sm text-gray-500 mt-1">{expense.description}</div>
                        )}
                        {expense.products_data && expense.products_data.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {expense.products_data.length} ürün
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-red-600">
                          {expense.amount.toLocaleString('tr-TR')} ₺
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
