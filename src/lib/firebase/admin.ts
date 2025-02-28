// This file should only be imported in server-side code
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
}

// Initialize Firebase Admin
const apps = getApps()
const app = apps.length === 0 ? initializeApp(firebaseAdminConfig) : apps[0]

export const adminAuth = getAuth(app)
export const adminDB = getFirestore(app) 