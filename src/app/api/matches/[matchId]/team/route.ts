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
    const { matchId } = params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await adminDB.collection('matches').doc(matchId).update({
      status: 'team-announced'
    })

    return NextResponse.json({ message: 'Team published successfully' })
  } catch (error) {
    console.error('Error publishing team:', error)
    return NextResponse.json({ error: 'Failed to publish team' }, { status: 500 })
  }
} 