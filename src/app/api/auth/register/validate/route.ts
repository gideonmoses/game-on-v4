import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^[89][0-9]{7}$/, 'Invalid phone number format'),
  jerseyNumber: z.string(),
  dateOfBirth: z.string()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.flatten()
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          fields: errors.fieldErrors,
          form: errors.formErrors
        }
      }, { status: 400 })
    }

    const { email, jerseyNumber } = result.data

    // Check if email exists in Firestore
    const userDoc = await adminDB.collection('users').doc(email).get()
    if (userDoc.exists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Check if jersey number is taken
    const jerseyQuery = await adminDB
      .collection('users')
      .where('jerseyNumber', '==', jerseyNumber)
      .get()
    
    if (!jerseyQuery.empty) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          fields: {
            jerseyNumber: ['This jersey number is already taken']
          }
        }
      }, { status: 400 })
    }

    return NextResponse.json({ message: 'Validation successful' })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
} 