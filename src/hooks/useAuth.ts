'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase/firebase-config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          // Use email as the document ID
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.email))
          const userData = userDoc.data()

          setUser({
            id: firebaseUser.email, // Use email as ID
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            roles: userData?.roles || [], // Get roles array from Firestore
            getIdToken: () => firebaseUser.getIdToken()
          })
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
} 