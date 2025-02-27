import { NextRequest } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { authMiddleware } from '@/middleware/authMiddleware'
import { z } from 'zod'

const updateProfileSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  phoneNumber: z.string().regex(/^[89][0-9]{7}$/),
  jerseyNumber: z.string(),
  dateOfBirth: z.string(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await authMiddleware(req)
    if (!('uid' in user)) return user // Error response

    const userDoc = await adminDB
      .collection('users')
      .doc(user.uid)
      .get()

    if (!userDoc.exists) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({
      profile: { id: userDoc.id, ...userDoc.data() }
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const { email, ...updateData } = result.data

    await adminDB.collection('users').doc(email).update({
      ...updateData,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 