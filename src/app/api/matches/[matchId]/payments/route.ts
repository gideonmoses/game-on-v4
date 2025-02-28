import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(
  request: Request,
  context: { params: { matchId: string } }
) {
  try {
    const { matchId } = context.params

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

    // Check if user is a manager
    const userDoc = await adminDB.collection('users').doc(decodedToken.email || '').get()
    const userData = userDoc.data()

    if (!userData?.roles?.includes('Manager')) {
      return NextResponse.json(
        { error: 'Unauthorized. Manager role required.' },
        { status: 403 }
      )
    }

    // Get payment summary
    const summaryDoc = await adminDB
      .collection('match-payment-summaries')
      .doc(matchId)
      .get()

    // Update: Get payment requests from the correct collection path
    const requestsSnapshot = await adminDB
      .collection('paymentRequests')  // Changed from matches/{matchId}/payment-requests
      .where('matchId', '==', matchId)
      .get()

    console.log('Payment requests found:', requestsSnapshot.size) // Debug log

    const paymentRequests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const requestData = doc.data()
        console.log('Request data:', requestData) // Debug log

        // Get user details for each request
        const userDoc = await adminDB
          .collection('users')
          .doc(requestData.userEmail)
          .get()

        return {
          id: doc.id,
          ...requestData,
          requestedAt: requestData.requestedAt instanceof Timestamp ? 
            requestData.requestedAt.toDate().toISOString() : requestData.requestedAt,
          submittedAt: requestData.submittedAt instanceof Timestamp ? 
            requestData.submittedAt.toDate().toISOString() : requestData.submittedAt,
          verifiedAt: requestData.verifiedAt instanceof Timestamp ? 
            requestData.verifiedAt.toDate().toISOString() : requestData.verifiedAt,
          dueDate: requestData.dueDate instanceof Timestamp ? 
            requestData.dueDate.toDate().toISOString() : requestData.dueDate,
          user: userDoc.exists ? userDoc.data() : null
        }
      })
    )

    console.log('Processed payment requests:', paymentRequests) // Debug log

    return NextResponse.json({
      paymentSummary: summaryDoc.exists ? {
        ...summaryDoc.data(),
        initiatedAt: summaryDoc.data()?.initiatedAt instanceof Timestamp ? 
          summaryDoc.data()?.initiatedAt.toDate().toISOString() : summaryDoc.data()?.initiatedAt,
        lastUpdatedAt: summaryDoc.data()?.lastUpdatedAt instanceof Timestamp ? 
          summaryDoc.data()?.lastUpdatedAt.toDate().toISOString() : summaryDoc.data()?.lastUpdatedAt,
        dueDate: summaryDoc.data()?.dueDate instanceof Timestamp ? 
          summaryDoc.data()?.dueDate.toDate().toISOString() : summaryDoc.data()?.dueDate
      } : null,
      paymentRequests
    })

  } catch (error) {
    console.error('Error in payment details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 