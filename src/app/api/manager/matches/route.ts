import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { db } from '@/lib/firebase/admin' // Use admin db instead of client db

export async function GET(req: NextRequest) {
  try {
    // Get token from header
    const token = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token with admin SDK
    const decodedToken = await auth.verifyIdToken(token)
    if (!decodedToken.roles?.includes('Manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get matches with team-announced status using admin SDK
    const matchesSnapshot = await db
      .collection('matches')
      .where('status', '==', 'team-announced')
      .orderBy('date', 'desc')
      .get()

    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return Response.json({ matches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 