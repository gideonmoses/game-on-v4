// This file should only be imported in server-side code
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const apps = getApps()

if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const adminDB = getFirestore()

export { adminDB } 