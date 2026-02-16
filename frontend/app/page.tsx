'use client'

import { useEffect, useState } from 'react'
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
import { inventoryApi, financeApi } from '@/lib/api'

export default function Home() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    available: 0,
    totalRevenue: 0,
    totalExpenses: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [inventory, finance] = await Promise.all([
          inventoryApi.getSummary(),
          financeApi.getSummary(),
        ])
        setStats({
          totalProducts: inventory.data.total_products || 0,
          available: inventory.data.available || 0,
          totalRevenue: finance.data.total_revenue || 0,
          totalExpenses: finance.data.total_expenses || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  const netProfit = stats.totalRevenue - stats.totalExpenses

  const menuItems = [
    {
      title: 'Ürünler',
      description: 'Ürün yönetimi ve stok takibi',
      icon: Package,
      href: '/products',
      color: 'bg-blue-500',
    },
    {
      title: 'Kategoriler',
      description: 'Kategori yönetimi',
      icon: FolderTree,
      href: '/categories',
      color: 'bg-green-500',
    },
    {
      title: 'Takvim',
      description: 'Günlük hareketler ve özetler',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-purple-500',
    },
    {
      title: 'Finans',
      description: 'Gelir-gider takibi',
      icon: DollarSign,
      href: '/finance',
      color: 'bg-yellow-500',
    },
    {
      title: 'Envanter',
      description: 'Stok durumu ve dağılım',
      icon: ClipboardList,
      href: '/inventory',
      color: 'bg-orange-500',
    },
    {
      title: 'Fiyat Aralıkları',
      description: 'Piyasa fiyat referansları',
      icon: TrendingUp,
      href: '/price-ranges',
      color: 'bg-pink-500',
    },
    {
      title: 'Tedarikçiler',
      description: 'Satın aldığınız yerler',
      icon: Users,
      href: '/suppliers',
      color: 'bg-indigo-500',
    },
    {
      title: 'Notlar',
      description: 'Genel notlar ve hatırlatıcılar',
      icon: StickyNote,
      href: '/notes',
      color: 'bg-teal-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Endüstriyel Mutfak Yönetim Sistemi
          </h1>
          <p className="text-gray-600">
            Ürün, stok, finans ve günlük hareket takibi
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Toplam Ürün</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Mevcut Stok</div>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Toplam Gelir</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalRevenue.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Net Kâr</div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString('tr-TR')} ₺
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

