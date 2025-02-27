import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/auth-admin'
import { db } from '@/lib/firebase/firestore-admin'
import { 
  matchPaymentSummariesCollection, 
  getMatchPaymentRequestsCollection 
} from '@/lib/firebase/collections'
import { Timestamp } from 'firebase-admin/firestore'
import { PaymentStatus } from '@/types/payment'
import { verifyUserRole } from '@/lib/auth-helpers'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { matchesCollection } from '@/lib/firebase/collections'

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Verify auth and manager role
    const token = await auth.verifyIdToken(req.headers.get('Authorization')?.split('Bearer ')[1] || '')
    if (!token.roles?.includes('Manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { action, data } = await req.json()

    switch (action) {
      case 'initiate': {
        const { baseAmount, dueDate, players } = data
        const batch = db.batch()

        // Create match payment summary
        const summaryRef = db.collection('match-payment-summaries').doc(params.matchId)
        batch.set(summaryRef, {
          id: params.matchId,
          matchId: params.matchId,
          status: 'initiated',
          baseAmount,
          dueDate: Timestamp.fromDate(new Date(dueDate)),
          initiatedAt: Timestamp.now(),
          initiatedBy: token.email,
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
        const requestsCollection = getMatchPaymentRequestsCollection(params.matchId)
        players.forEach(playerId => {
          const requestRef = requestsCollection.doc()
          batch.set(requestRef, {
            id: requestRef.id,
            matchId: params.matchId,
            userId: playerId,
            amount: baseAmount,
            status: 'pending' as PaymentStatus,
            requestedAt: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(dueDate)),
            requestedBy: token.email
          })
        })

        await batch.commit()
        return Response.json({ success: true })
      }

      case 'verify': {
        const { requestId, verified, notes } = data
        const requestRef = db.collection('matches')
          .doc(params.matchId)
          .collection('payment-requests')
          .doc(requestId)

        const request = await requestRef.get()
        if (!request.exists) {
          return Response.json({ error: 'Payment request not found' }, { status: 404 })
        }

        const requestData = request.data()!
        const newStatus: PaymentStatus = verified ? 'verified' : 'rejected'

        // Update request
        await requestRef.update({
          status: newStatus,
          verifiedAt: Timestamp.now(),
          verifiedBy: token.email,
          verificationNotes: notes
        })

        // Update summary counters
        const summaryRef = db.collection('match-payment-summaries').doc(params.matchId)
        await summaryRef.update({
          lastUpdatedAt: Timestamp.now(),
          verifiedCount: verified ? db.FieldValue.increment(1) : db.FieldValue.increment(0),
          submittedCount: verified ? db.FieldValue.increment(-1) : db.FieldValue.increment(0),
          totalVerified: verified ? db.FieldValue.increment(requestData.submittedAmount || 0) : db.FieldValue.increment(0),
          totalContributions: verified ? db.FieldValue.increment(requestData.contribution || 0) : db.FieldValue.increment(0)
        })

        return Response.json({ success: true })
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in payment management:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const user = await verifyUserRole(req, 'Manager')
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get match details
    const matchDoc = await getDoc(doc(matchesCollection, params.matchId))
    if (!matchDoc.exists()) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    // Get payment summary
    const summaryDoc = await getDoc(doc(matchPaymentSummariesCollection, params.matchId))

    // Get payment requests
    const requestsSnapshot = await getDocs(
      collection(matchesCollection, params.matchId, 'payment-requests')
    )

    return Response.json({
      match: { id: matchDoc.id, ...matchDoc.data() },
      summary: summaryDoc.exists() ? { id: summaryDoc.id, ...summaryDoc.data() } : null,
      requests: requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  } catch (error) {
    console.error('Error fetching payment data:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 