'use client'

import { useState, useEffect } from 'react'
import { User, UserRole } from '@/types/user'
import { onAuthStateChange } from '@/lib/firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole: (role: string) => user?.roles.includes(role as UserRole) ?? false
  }
} 