'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, FolderTree, Calendar, DollarSign, ClipboardList, TrendingUp, Users, StickyNote } from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Ana Sayfa', href: '/', icon: Home },
  { name: 'Ürünler', href: '/products', icon: Package },
  { name: 'Kategoriler', href: '/categories', icon: FolderTree },
  { name: 'Tedarikçiler', href: '/suppliers', icon: Users },
  { name: 'Notlar', href: '/notes', icon: StickyNote },
  { name: 'Takvim', href: '/calendar', icon: Calendar },
  { name: 'Finans', href: '/finance', icon: DollarSign },
  { name: 'Envanter', href: '/inventory', icon: ClipboardList },
  { name: 'Fiyat Aralıkları', href: '/price-ranges', icon: TrendingUp },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Mutfak Yönetim
            </Link>
          </div>
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

