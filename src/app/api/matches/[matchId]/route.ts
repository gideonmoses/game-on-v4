import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(
  request: Request,
  context: { params: { matchId: string } }
) {
  try {
    const { matchId } = context.params

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify token and get user info
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get match details
    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    if (!matchDoc.exists) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const matchData = matchDoc.data()

    return NextResponse.json({
      match: {
        id: matchId,
        ...matchData,
        date: matchData?.date instanceof Timestamp ? 
          matchData.date.toDate().toISOString() : matchData?.date
      }
    })

  } catch (error) {
    console.error('Error in match details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 