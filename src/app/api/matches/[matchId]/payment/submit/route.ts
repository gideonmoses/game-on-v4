import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/auth-admin'
import { db } from '@/lib/firebase/firestore-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Verify auth
    const token = await auth.verifyIdToken(req.headers.get('Authorization')?.split('Bearer ')[1] || '')
    
    const { amount, contribution = 0, paymentProof, notes } = await req.json()

    // Get the payment request
    const requestsSnapshot = await db.collection('matches')
      .doc(params.matchId)
      .collection('payment-requests')
      .where('userId', '==', token.email)
      .limit(1)
      .get()

    if (requestsSnapshot.empty) {
      return Response.json({ error: 'No payment request found' }, { status: 404 })
    }

    const requestDoc = requestsSnapshot.docs[0]
    const request = requestDoc.data()

    if (request.status !== 'pending') {
      return Response.json({ error: 'Payment already submitted or verified' }, { status: 400 })
    }

    // Update the payment request
    const batch = db.batch()
    
    batch.update(requestDoc.ref, {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      submittedAmount: amount,
      contribution,
      paymentProof,
      paymentNotes: notes
    })

    // Update summary counters
    const summaryRef = db.collection('match-payment-summaries').doc(params.matchId)
    batch.update(summaryRef, {
      lastUpdatedAt: Timestamp.now(),
      pendingCount: db.FieldValue.increment(-1),
      submittedCount: db.FieldValue.increment(1),
      totalSubmitted: db.FieldValue.increment(amount)
    })

    await batch.commit()
    return Response.json({ success: true })

  } catch (error) {
    console.error('Error submitting payment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 