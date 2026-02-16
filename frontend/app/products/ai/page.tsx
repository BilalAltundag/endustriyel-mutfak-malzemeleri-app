'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// AI ürün girişi artık /products/new sayfasına entegre edildi
export default function AiProductRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/products/new')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Yönlendiriliyor...</p>
    </div>
  )
}
