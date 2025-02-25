'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { auth, db } from '@/lib/firebase/firebase-config'
import { collection, getDocs, query, where } from 'firebase/firestore'
import type { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_PATHS = [
  '/login', 
  '/register', 
  '/home', 
  '/about',
  '/pending-approval'
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Use existing login API to check status
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: user.email,
              uid: user.uid 
            }),
          })

          const data = await response.json()

          if (response.status === 403 && data.userStatus === 'pending') {
            // If status is pending, sign out and redirect
            await signOut(auth)
            router.replace('/pending-approval?from=login')
            return
          }

          if (!response.ok) {
            // If any other error, sign out
            await signOut(auth)
            return
          }
        } catch (error) {
          console.error('Error checking user status:', error)
          await signOut(auth)
          return
        }
      }

      setUser(user)
      setLoading(false)

      // Handle route protection
      if (!user && !PUBLIC_PATHS.includes(pathname)) {
        router.replace('/home')
      }
    })

    return () => unsubscribe()
  }, [pathname, router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 