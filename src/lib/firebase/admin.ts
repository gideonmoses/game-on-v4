import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables')
}

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    
    initializeApp({
      credential: cert(serviceAccount)
    })
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    throw new Error('Invalid service account key format')
  }
}

export const adminAuth = getAuth()
export const adminDB = getFirestore() 