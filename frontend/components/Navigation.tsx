'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Package, FolderTree, Calendar, DollarSign,
  ClipboardList, TrendingUp, Users, StickyNote,
  Menu, X, ChevronLeft, ChevronRight, Store
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Ana Sayfa', href: '/', icon: Home },
  { name: 'Ürünler', href: '/products', icon: Package },
  { name: 'Kategoriler', href: '/categories', icon: FolderTree },
  { name: 'Envanter', href: '/inventory', icon: ClipboardList },
  { name: 'Tedarikçiler', href: '/suppliers', icon: Users },
  { name: 'Notlar', href: '/notes', icon: StickyNote },
  { name: 'Takvim', href: '/calendar', icon: Calendar },
  { name: 'Finans', href: '/finance', icon: DollarSign },
  { name: 'Fiyat Aralıkları', href: '/price-ranges', icon: TrendingUp },
  { name: 'Marketplace Arama', href: '/marketplace-search', icon: Store },
]

const mobileMainNav = navigation.slice(0, 4)
const mobileMoreNav = navigation.slice(4)

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const moreActive = mobileMoreNav.some(item => isActive(pathname, item.href))

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
          ═══════════════════════════════════════════ */}
      <aside
        className={clsx(
          'hidden md:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <div className={clsx(
          'flex items-center h-16 border-b border-gray-100 flex-shrink-0',
          collapsed ? 'px-3 justify-center' : 'px-4'
        )}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-900 truncate">
                Ayhan Ticaret
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-all group',
                  collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={clsx(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                )} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-sm"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Daralt</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE TOP HEADER
          ═══════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">Ayhan Ticaret</span>
        </Link>
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
          ═══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileMainNav.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 rounded-xl transition-colors',
                  active ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 rounded-xl transition-colors',
              moreActive ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">Diğer</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          MOBILE "MORE" BOTTOM SHEET
          ═══════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up pb-[env(safe-area-inset-bottom)]">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Menü</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 py-2 space-y-0.5">
              {mobileMoreNav.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    )}
                  >
                    <Icon className={clsx(
                      'w-5 h-5',
                      active ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  )
}
