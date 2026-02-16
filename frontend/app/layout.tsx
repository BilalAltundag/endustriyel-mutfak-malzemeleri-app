import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Endüstriyel Mutfak Yönetim Sistemi',
  description: 'Endüstriyel mutfak malzemesi alım-satım yönetim sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  )
}

