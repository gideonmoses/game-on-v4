import { NextResponse } from 'next/server'
import { adminAuth, adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

interface AuthError extends Error {
  code?: string;
}

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const result = loginSchema.safeParse(body)
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

    const { email } = result.data

    try {
      // Get user from Admin SDK
      const userRecord = await adminAuth.getUserByEmail(email)
      
      if (!userRecord) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Get user document from Firestore
      const userDoc = await adminDB.collection('users').doc(email).get()
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 404 }
        )
      }

      const userData = userDoc.data()

      // Check user status
      if (userData?.userStatus === 'pending') {
        return NextResponse.json(
          { 
            error: 'Account pending approval',
            userStatus: 'pending'
          },
          { status: 403 }
        )
      }

      if (userData?.userStatus === 'suspended') {
        return NextResponse.json(
          { error: 'Account suspended' },
          { status: 403 }
        )
      }

      // Create custom token for client
      const customToken = await adminAuth.createCustomToken(userRecord.uid, {
        roles: userData?.roles || ['Player'],
        status: userData?.userStatus
      })

      return NextResponse.json({
        token: customToken,
        user: {
          email: userData?.email,
          displayName: userData?.displayName,
          roles: userData?.roles,
          userStatus: userData?.userStatus
        }
      })

    } catch (authError: unknown) {
      const error = authError as AuthError
      console.error('Auth error:', error)

      if (error.code?.includes('auth/user-not-found')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      throw error
    }

  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
} 