import { NextResponse } from 'next/server'
import { adminAuth, adminDB } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(
  request: Request,
  context: { params: { matchId: string } }
) {
  try {
    const { matchId } = context.params
    const { requestId } = await request.json()

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify token and get user
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Get user data to check role
    const userDoc = await adminDB
      .collection('users')  // This is correct - matches the Firebase structure
      .doc(decodedToken.email)
      .get()

    const userData = userDoc.data()
    console.log('User data:', userData) // Debug log

    // Check if user has roles array and includes 'Manager'
    if (!userData?.roles?.includes('Manager')) {
      return NextResponse.json(
        { error: 'Unauthorized. Manager role required.' },
        { status: 403 }
      )
    }

    // Get the payment request
    const requestDoc = await adminDB
      .collection('paymentRequests')
      .doc(requestId)
      .get()

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    const requestData = requestDoc.data()
    if (requestData?.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Payment request does not belong to this match' },
        { status: 400 }
      )
    }

    // Update the payment request
    await requestDoc.ref.update({
      status: 'verified',
      verifiedAt: Timestamp.now(),
      verifiedBy: decodedToken.email,
      updatedAt: Timestamp.now()
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in verify payment API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 