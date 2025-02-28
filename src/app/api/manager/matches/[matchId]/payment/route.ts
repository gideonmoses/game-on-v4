import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/auth-admin'
import { db } from '@/lib/firebase/firestore-admin'
import { 
  matchPaymentSummariesCollection, 
  getMatchPaymentRequestsCollection 
} from '@/lib/firebase/collections'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { PaymentStatus } from '@/types/payment'
import { verifyUserRole } from '@/lib/auth-helpers'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { matchesCollection } from '@/lib/firebase/collections'
import { NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'

interface PaymentRequest {
  id: string
  requestedAt: Timestamp
  submittedAt: Timestamp | null
  verifiedAt: Timestamp | null
  userEmail: string
}

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params

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

    // Check if user is a manager - case insensitive check
    const userDoc = await adminDB.collection('users').doc(decodedToken.email || '').get()
    const userData = userDoc.data()

    if (!userData?.roles?.some(role => role.toLowerCase() === 'manager')) {
      console.log('User roles:', userData?.roles) // Debug log
      return NextResponse.json(
        { error: 'Unauthorized. Manager role required.' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { action, data } = body

    if (action !== 'initiate') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const { dueDate, players, paymentPhoneNumber } = data

    if (!dueDate || !players?.length || !paymentPhoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment requests for each player
    const batch = adminDB.batch()
    const paymentRequestsRef = adminDB.collection('paymentRequests')

    for (const playerEmail of players) {
      const paymentRequestRef = paymentRequestsRef.doc()
      batch.set(paymentRequestRef, {
        id: paymentRequestRef.id,
        matchId,
        userEmail: playerEmail,
        status: 'pending',
        requestedAt: Timestamp.now(),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        requestedBy: decodedToken.email,
        paymentPhoneNumber,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    }

    await batch.commit()

    return NextResponse.json({ 
      success: true, 
      message: `Created ${players.length} payment requests` 
    })

  } catch (error) {
    console.error('Error in payment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params

    // Verify auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)

    // Verify user has manager role
    const userDoc = await adminDB.collection('users').doc(decodedToken.email!).get()
    const userData = userDoc.data()
    
    if (!userData?.roles?.includes('Manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get match details
    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    if (!matchDoc.exists) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const matchData = matchDoc.data()
    const match = {
      id: matchDoc.id,
      ...matchData,
      date: matchData?.date instanceof Timestamp 
        ? matchData.date.toDate().toISOString() 
        : matchData?.date
    }

    // Get payment summary
    const summaryDoc = await adminDB
      .collection('match-payment-summaries')
      .doc(matchId)
      .get()

    const summaryData = summaryDoc.data()
    // Convert timestamps in summary
    const paymentSummary = summaryDoc.exists ? {
      ...summaryData,
      initiatedAt: summaryData?.initiatedAt instanceof Timestamp ? 
        summaryData.initiatedAt.toDate().toISOString() : summaryData?.initiatedAt,
      lastUpdatedAt: summaryData?.lastUpdatedAt instanceof Timestamp ? 
        summaryData.lastUpdatedAt.toDate().toISOString() : summaryData?.lastUpdatedAt,
      dueDate: summaryData?.dueDate instanceof Timestamp ? 
        summaryData.dueDate.toDate().toISOString() : summaryData?.dueDate
    } : null

    // Get payment requests with user details
    const requestsSnapshot = await adminDB
      .collection('matches')
      .doc(matchId)
      .collection('payment-requests')
      .get()

    const paymentRequests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const requestData = doc.data()
        // Convert timestamps in request
        const request = {
          id: doc.id,
          ...requestData,
          requestedAt: requestData?.requestedAt instanceof Timestamp ? 
            requestData.requestedAt.toDate().toISOString() : requestData?.requestedAt,
          submittedAt: requestData?.submittedAt instanceof Timestamp ? 
            requestData.submittedAt.toDate().toISOString() : requestData?.submittedAt,
          verifiedAt: requestData?.verifiedAt instanceof Timestamp ? 
            requestData.verifiedAt.toDate().toISOString() : requestData?.verifiedAt
        }
        
        // Get user details
        const userDoc = await adminDB
          .collection('users')
          .doc(request.userEmail)
          .get()

        return {
          ...request,
          user: userDoc.exists ? userDoc.data() : null
        }
      })
    )

    return NextResponse.json({
      match,
      paymentSummary,
      paymentRequests
    })

  } catch (error) {
    console.error('Error fetching match payment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    )
  }
} 