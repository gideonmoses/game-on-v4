import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  uid: z.string()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const { email, uid } = result.data

    try {
      // Get user document from Firestore
      const userDoc = await adminDB.collection('users').doc(email).get()
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 404 }
        )
      }

      const userData = userDoc.data()

      // Verify UID matches
      if (userData?.uid !== uid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

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

      return NextResponse.json({
        user: {
          email: userData?.email,
          displayName: userData?.displayName,
          roles: userData?.roles,
          userStatus: userData?.userStatus
        }
      })

    } catch (error) {
      console.error('Auth error:', error)
      throw error
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        error: 'Login failed',
        details: {
          form: ['An unexpected error occurred. Please try again later.']
        }
      },
      { status: 500 }
    )
  }
} 