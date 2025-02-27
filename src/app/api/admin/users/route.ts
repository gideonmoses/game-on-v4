import { NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { authMiddleware } from '@/middleware/authMiddleware'

export async function GET(req: NextRequest) {
  try {
    const user = await authMiddleware(req, 'Admin')
    if (!('roles' in user)) return user // Error response

    const usersSnapshot = await adminDB
      .collection('users')
      .get()

    return Response.json({
      users: usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 