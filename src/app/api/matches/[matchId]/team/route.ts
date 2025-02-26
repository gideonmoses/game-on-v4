import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'
import { db } from '@/lib/firebase/firebase-config'
import { doc, getDoc } from 'firebase/firestore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const teamSchema = z.object({
  starters: z.array(z.object({
    userId: z.string(),
    displayName: z.string(),
    jerseyNumber: z.string().optional(),
    role: z.literal('starter')
  })),
  substitutes: z.array(z.object({
    userId: z.string(),
    displayName: z.string(),
    jerseyNumber: z.string().optional(),
    role: z.literal('substitute')
  }))
})

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)

    const body = await request.json()
    const result = teamSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    await adminDB.collection('matches').doc(matchId).update({
      teamSelection: {
        ...result.data,
        updatedAt: new Date().toISOString(),
        updatedBy: decodedToken.email
      }
    })

    return NextResponse.json({ message: 'Team selection saved successfully' })
  } catch (error) {
    console.error('Error saving team selection:', error)
    return NextResponse.json({ error: 'Failed to save team selection' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = await params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current match data
    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    const matchData = matchDoc.data()

    // If match is already announced, we're unpublishing
    if (matchData?.status === 'team-announced') {
      await adminDB.collection('matches').doc(matchId).update({
        status: 'voting' // Change status back to voting instead of team-selected
      })
      return NextResponse.json({ message: 'Team unpublished successfully' })
    }

    // If match is not announced, we're publishing
    await adminDB.collection('matches').doc(matchId).update({
      status: 'team-announced'
    })
    return NextResponse.json({ message: 'Team published successfully' })
  } catch (error) {
    console.error('Error updating team status:', error)
    return NextResponse.json({ error: 'Failed to update team status' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    await auth.verifyIdToken(token)

    const { matchId } = params
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    
    if (!matchDoc.exists) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const matchData = matchDoc.data()
    if (!matchData?.teamSelection) {
      return NextResponse.json({ error: 'Team has not been selected yet' }, { status: 404 })
    }

    return NextResponse.json({
      starters: matchData.teamSelection.starters,
      substitutes: matchData.teamSelection.substitutes,
      updatedAt: matchData.teamSelection.updatedAt,
      updatedBy: matchData.teamSelection.updatedBy
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 