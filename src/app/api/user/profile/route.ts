import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

const updateProfileSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  phoneNumber: z.string().regex(/^[89][0-9]{7}$/),
  jerseyNumber: z.string(),
  dateOfBirth: z.string(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const userDoc = await adminDB.collection('users').doc(email).get()
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userDoc.data())
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
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