import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

const voteSchema = z.object({
  status: z.enum(['available', 'not_available', 'tentative'])
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
    const userId = decodedToken.uid

    const body = await request.json()
    const result = voteSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const { status } = result.data

    await adminDB.collection('matches').doc(matchId).update({
      [`votes.${userId}`]: {
        status,
        updatedAt: new Date().toISOString(),
        userEmail: decodedToken.email
      }
    })

    return NextResponse.json({ message: 'Vote recorded successfully' })
  } catch (error) {
    console.error('Error recording vote:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
} 