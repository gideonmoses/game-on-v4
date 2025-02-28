import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(
  request: Request,
  context: { params: { requestId: string } }
) {
  try {
    const { requestId } = context.params
    const { amount, referenceNumber } = await request.json()

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token)

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
    if (requestData?.userEmail !== decodedToken.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update the payment request
    const updateData = {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      amount,
      updatedAt: Timestamp.now()
    }

    // Only add referenceNumber if it was provided
    if (referenceNumber) {
      updateData.referenceNumber = referenceNumber
    }

    await requestDoc.ref.update(updateData)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in submit payment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 