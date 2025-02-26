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
    const { matchId } = await params
    console.log('Vote request received for match:', matchId)
    
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Unauthorized request - no valid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('Vote request from user:', userId)

    const body = await request.json()
    const result = voteSchema.safeParse(body)
    
    if (!result.success) {
      console.log('Vote validation failed:', result.error.flatten())
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const { status } = result.data

    // Check if match exists and is in voting state
    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    console.log('Match status:', matchDoc.data()?.status)

    await adminDB.collection('matches').doc(matchId).update({
      [`votes.${userId}`]: {
        status,
        updatedAt: new Date().toISOString(),
        userEmail: decodedToken.email
      }
    })

    console.log('Vote recorded successfully')
    return NextResponse.json({ message: 'Vote recorded successfully' })
  } catch (error) {
    console.error('Error recording vote:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
} 