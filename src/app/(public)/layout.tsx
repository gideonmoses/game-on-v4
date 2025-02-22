'use client'

import { useEffect } from 'react'
import { useRouter, redirect } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Use useEffect for client-side navigation
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <PublicHeader />
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  )
} 