import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    // Wait for params to be resolved
    const { matchId } = await context.params

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' }, 
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token)
      if (!decodedToken?.uid) {
        return NextResponse.json(
          { error: 'Invalid authentication token' }, 
          { status: 401 }
        )
      }
    } catch (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' }, 
        { status: 401 }
      )
    }

    // Get match document
    const matchDoc = await adminDB
      .collection('matches')
      .doc(matchId)
      .get()
      .catch(error => {
        console.error('Error fetching match:', error)
        throw new Error('Failed to fetch match')
      })

    if (!matchDoc.exists) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const matchData = matchDoc.data()
    if (!matchData) {
      return NextResponse.json({ error: 'Match data is empty' }, { status: 404 })
    }

    try {
      // Get team selection if it exists
      const teamSelectionDoc = await adminDB
        .collection('matches')
        .doc(matchId)
        .collection('team-selections')
        .where('status', '==', 'final')
        .orderBy('version', 'desc')
        .limit(1)
        .get()

      let teamSelection = null
      if (!teamSelectionDoc.empty) {
        const teamSelectionData = teamSelectionDoc.docs[0].data()
        teamSelection = {
          ...teamSelectionData,
          updatedAt: teamSelectionData.updatedAt instanceof Timestamp 
            ? teamSelectionData.updatedAt.toDate().toISOString()
            : teamSelectionData.updatedAt
        }
      }

      // Construct match object with all required data
      const match = {
        id: matchDoc.id,
        ...matchData,
        date: matchData.date instanceof Timestamp 
          ? matchData.date.toDate().toISOString() 
          : matchData.date,
        teamSelection: teamSelection
      }

      return NextResponse.json(match)
    } catch (error) {
      console.error('Error processing team selection:', error)
      // Return match data even if team selection fails
      return NextResponse.json({
        id: matchDoc.id,
        ...matchData,
        date: matchData.date instanceof Timestamp 
          ? matchData.date.toDate().toISOString() 
          : matchData.date
      })
    }
  } catch (error) {
    console.error('Error in match details API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 