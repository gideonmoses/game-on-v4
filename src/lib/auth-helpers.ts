import { getAuth } from 'firebase/auth'

export async function verifyUserRole(req: Request, role: string) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) return null

    const auth = getAuth()
    const decodedToken = await auth.currentUser?.getIdTokenResult()
    
    if (!decodedToken?.claims?.roles?.includes(role)) {
      return null
    }

    return decodedToken
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
} 