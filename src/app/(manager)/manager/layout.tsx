'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <ManagerLoadingState />
  }

  if (!user?.roles?.includes('Manager')) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen pb-20">
      <AuthenticatedHeader />
      <Suspense fallback={<ManagerLoadingState />}>
        {children}
      </Suspense>
      <BottomNavigation />
    </div>
  )
}

function ManagerLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
} 