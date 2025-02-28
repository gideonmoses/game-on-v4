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
  { params }: { params: { matchId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    if (!decodedToken.roles?.includes('Manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case 'initiate': {
        const { baseAmount, dueDate, players } = data
        const batch = adminDB.batch()

        // Validate input
        if (!Array.isArray(players) || players.length === 0) {
          return NextResponse.json({ error: 'No players selected' }, { status: 400 })
        }

        if (!baseAmount || !dueDate) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Create match payment summary
        const summaryRef = adminDB.collection('match-payment-summaries').doc(params.matchId)
        batch.set(summaryRef, {
          id: params.matchId,
          matchId: params.matchId,
          status: 'initiated',
          baseAmount,
          dueDate: Timestamp.fromDate(new Date(dueDate)),
          initiatedAt: Timestamp.now(),
          initiatedBy: decodedToken.email,
          lastUpdatedAt: Timestamp.now(),
          totalPlayers: players.length,
          pendingCount: players.length,
          submittedCount: 0,
          verifiedCount: 0,
          totalExpected: baseAmount * players.length,
          totalSubmitted: 0,
          totalVerified: 0,
          totalContributions: 0
        })

        // Create payment requests for each player
        players.forEach(email => {
          const requestRef = adminDB
            .collection('matches')
            .doc(params.matchId)
            .collection('payment-requests')
            .doc()

          batch.set(requestRef, {
            id: requestRef.id,
            matchId: params.matchId,
            userEmail: email,
            amount: baseAmount,
            status: 'pending',
            requestedAt: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(dueDate)),
            requestedBy: decodedToken.email
          })
        })

        await batch.commit()
        return NextResponse.json({ success: true })
      }

      case 'verify': {
        const { requestId, verified, notes } = data
        const requestRef = adminDB.collection('matches')
          .doc(params.matchId)
          .collection('payment-requests')
          .doc(requestId)

        const request = await requestRef.get()
        if (!request.exists) {
          return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
        }

        const requestData = request.data()!
        const newStatus: PaymentStatus = verified ? 'verified' : 'rejected'

        // Update request
        await requestRef.update({
          status: newStatus,
          verifiedAt: Timestamp.now(),
          verifiedBy: decodedToken.email,
          verificationNotes: notes
        })

        // Update summary counters
        const summaryRef = adminDB.collection('match-payment-summaries').doc(params.matchId)
        await summaryRef.update({
          lastUpdatedAt: Timestamp.now(),
          verifiedCount: verified ? FieldValue.increment(1) : FieldValue.increment(0),
          submittedCount: verified ? FieldValue.increment(-1) : FieldValue.increment(0),
          totalVerified: verified ? FieldValue.increment(requestData.submittedAmount || 0) : FieldValue.increment(0),
          totalContributions: verified ? FieldValue.increment(requestData.contribution || 0) : FieldValue.increment(0)
        })

        return NextResponse.json({ success: true })
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in payment management:', error)
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