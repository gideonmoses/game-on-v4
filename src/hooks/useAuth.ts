'use client'

import { useState, useEffect } from 'react'
import type { User } from '@/types/user'
import { auth } from '@/lib/firebase/firebase-config'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: 'Player',
          status: 'pending',
          createdAt: '',
          updatedAt: '',
          getIdToken: () => firebaseUser.getIdToken()
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
} 