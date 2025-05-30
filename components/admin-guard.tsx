'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, profile, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Kullanıcı giriş yapmamış
        router.push('/auth/login')
        return
      }

      if (!isAdmin) {
        // Kullanıcı admin değil
        router.push('/unauthorized')
        return
      }
    }
  }, [user, profile, loading, isAdmin, router])

  // Yükleniyor
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Yetki kontrol ediliyor...</p>
          </div>
        </div>
      )
    )
  }

  // Kullanıcı giriş yapmamış veya admin değil
  if (!user || !isAdmin) {
    return null
  }

  // Her şey tamam, içeriği göster
  return <>{children}</>
}

// Higher Order Component versiyonu
export function withAdminGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminGuardedComponent(props: P) {
    return (
      <AdminGuard>
        <WrappedComponent {...props} />
      </AdminGuard>
    )
  }
} 