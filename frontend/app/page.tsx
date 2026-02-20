'use client'

import Link from 'next/link'
import { 
  Package, 
  FolderTree, 
  Calendar, 
  DollarSign, 
  ClipboardList,
  TrendingUp,
  Users,
  StickyNote
} from 'lucide-react'
import { useInventorySummary, useFinanceSummary } from '@/lib/hooks'

export default function Home() {
  const { data: inventory } = useInventorySummary()
  const { data: finance } = useFinanceSummary()

  const stats = {
    totalProducts: inventory?.total_products || 0,
    available: inventory?.available || 0,
    totalRevenue: finance?.total_revenue || 0,
    totalExpenses: finance?.total_expenses || 0,
  }

  const netProfit = stats.totalRevenue - stats.totalExpenses

  const menuItems = [
    {
      title: 'Ürünler',
      description: 'Ürün yönetimi ve stok takibi',
      icon: Package,
      href: '/products',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      title: 'Kategoriler',
      description: 'Kategori yönetimi',
      icon: FolderTree,
      href: '/categories',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
    },
    {
      title: 'Takvim',
      description: 'Günlük hareketler ve özetler',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
    },
    {
      title: 'Finans',
      description: 'Gelir-gider takibi',
      icon: DollarSign,
      href: '/finance',
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
    },
    {
      title: 'Envanter',
      description: 'Stok durumu ve dağılım',
      icon: ClipboardList,
      href: '/inventory',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
    },
    {
      title: 'Fiyat Aralıkları',
      description: 'Piyasa fiyat referansları',
      icon: TrendingUp,
      href: '/price-ranges',
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
    },
    {
      title: 'Tedarikçiler',
      description: 'Satın aldığınız yerler',
      icon: Users,
      href: '/suppliers',
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
    },
    {
      title: 'Notlar',
      description: 'Genel notlar ve hatırlatıcılar',
      icon: StickyNote,
      href: '/notes',
      color: 'bg-teal-500',
      lightColor: 'bg-teal-50',
    },
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Yönetim Paneli
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Ürün, stok, finans ve günlük hareket takibi
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Toplam Ürün</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Mevcut Stok</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.available}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Toplam Gelir</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {stats.totalRevenue.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Net Kâr</div>
            <div className={`text-lg sm:text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString('tr-TR')} ₺
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className={`${item.color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">{item.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
