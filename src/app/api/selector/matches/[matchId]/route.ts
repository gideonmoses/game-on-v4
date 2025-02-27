import { NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { authMiddleware } from '@/middleware/authMiddleware'

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const user = await authMiddleware(req, 'Selector')
    if (!('roles' in user)) return user // Error response

    const matchDoc = await adminDB
      .collection('matches')
      .doc(params.matchId)
      .get()

    if (!matchDoc.exists) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    // Get votes and other data...
    const votesSnapshot = await adminDB
      .collection('matches')
      .doc(params.matchId)
      .collection('votes')
      .get()

    return Response.json({
      match: { id: matchDoc.id, ...matchDoc.data() },
      votes: votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 