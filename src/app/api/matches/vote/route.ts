import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

const voteSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  status: z.enum(['available', 'not_available', 'tentative'])
})

export async function POST(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const result = voteSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const { matchId, status } = result.data

    // Check if match exists and is in voting state
    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    if (!matchDoc.exists) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const matchData = matchDoc.data()
    if (matchData?.status !== 'voting') {
      return NextResponse.json(
        { error: 'Match is not in voting state' },
        { status: 400 }
      )
    }

    if (new Date(matchData.votingDeadline) < new Date()) {
      return NextResponse.json(
        { error: 'Voting deadline has passed' },
        { status: 400 }
      )
    }

    // Update the vote
    await adminDB.collection('matches').doc(matchId).update({
      [`votes.${userId}`]: {
        status,
        updatedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({ 
      message: 'Vote recorded successfully'
    })

  } catch (error) {
    console.error('Error recording vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
} 