'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !user.roles?.includes('Manager'))) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <AuthenticatedHeader />
      {children}
      <BottomNavigation />
    </div>
  )
} 