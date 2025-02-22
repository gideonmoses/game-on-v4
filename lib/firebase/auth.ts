import { auth } from './firebase-config'
import { getAuth as getFirebaseAuth } from 'firebase/auth'

export async function getAuth() {
  const firebaseAuth = getFirebaseAuth()
  const currentUser = firebaseAuth.currentUser
  
  if (!currentUser) {
    return null
  }
  
  return currentUser
} 