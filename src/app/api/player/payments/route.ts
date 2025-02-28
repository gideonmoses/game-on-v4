import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(request: Request) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify token and get user info
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get payment requests for the user
    const requestsSnapshot = await adminDB
      .collection('paymentRequests')
      .where('userEmail', '==', decodedToken.email)
      .orderBy('createdAt', 'desc')
      .get()

    const paymentRequests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt instanceof Timestamp ? 
            data.requestedAt.toDate().toISOString() : data.requestedAt,
          submittedAt: data.submittedAt instanceof Timestamp ? 
            data.submittedAt.toDate().toISOString() : data.submittedAt,
          verifiedAt: data.verifiedAt instanceof Timestamp ? 
            data.verifiedAt.toDate().toISOString() : data.verifiedAt,
          dueDate: data.dueDate instanceof Timestamp ? 
            data.dueDate.toDate().toISOString() : data.dueDate,
          createdAt: data.createdAt instanceof Timestamp ? 
            data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? 
            data.updatedAt.toDate().toISOString() : data.updatedAt,
        }
      })
    )

    // Calculate summary
    const summary = paymentRequests.reduce((acc, req) => ({
      totalRequested: acc.totalRequested + (req.amount || 0),
      totalSubmitted: acc.totalSubmitted + (req.status === 'submitted' ? (req.amount || 0) : 0),
      totalVerified: acc.totalVerified + (req.status === 'verified' ? (req.amount || 0) : 0),
    }), {
      totalRequested: 0,
      totalSubmitted: 0,
      totalVerified: 0
    })

    return NextResponse.json({
      paymentRequests,
      summary
    })

  } catch (error) {
    console.error('Error in player payments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 