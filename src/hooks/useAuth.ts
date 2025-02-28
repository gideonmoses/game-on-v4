'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase-config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'

interface ExtendedUser extends User {
  roles?: string[]
}

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Only fetch roles if we have a user
            const userDocRef = doc(db, 'users', firebaseUser.email || '')
            const userDoc = await getDoc(userDocRef)
            const userData = userDoc.data()

            // Create extended user with roles
            const extendedUser = Object.assign(firebaseUser, {
              roles: userData?.roles || []
            })

            setUser(extendedUser)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setError(error as Error)
          setUser(null)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error('Auth error:', error)
        setError(error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  }
} 