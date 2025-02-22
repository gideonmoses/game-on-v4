'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user?.email) {
      router.replace('/login')
      return
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AuthenticatedHeader />
      <main className="pt-16 pb-20 px-4 max-w-7xl mx-auto">
        <div className="py-6">
          {children}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
} 