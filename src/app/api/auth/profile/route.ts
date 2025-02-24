import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

const updateProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^[89][0-9]{7}$/, 'Invalid phone number format'),
  jerseyNumber: z.string(),
  dateOfBirth: z.string()
}).strict()

// Get profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const uid = searchParams.get('uid')

    if (!email || !uid) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    const userData = userDoc.data()

    // Verify UID matches
    if (userData?.uid !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: userData })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// Update profile
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

    const { email, uid, ...updateData } = result.data

    const userDoc = await adminDB.collection('users').doc(email).get()
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Verify UID matches
    if (userData?.uid !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update user document, preserving email and roles
    await adminDB.collection('users').doc(email).update({
      ...updateData,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 