import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Endüstriyel Mutfak Yönetim Sistemi',
  description: 'Endüstriyel mutfak malzemesi alım-satım yönetim sistemi',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-gray-50">
        <Providers>
          <Navigation />
          <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:pl-60 min-h-screen transition-all">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
