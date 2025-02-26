import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

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
    const { matchId } = await params
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
        updatedBy: decodedToken.uid
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