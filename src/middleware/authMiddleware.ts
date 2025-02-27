import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function authMiddleware(req: NextRequest, requiredRole?: string) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decodedToken = await adminAuth.verifyIdToken(token)
    
    if (requiredRole && !decodedToken.roles?.includes(requiredRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return decodedToken
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
} 