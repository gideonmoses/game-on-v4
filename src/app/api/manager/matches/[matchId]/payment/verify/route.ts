import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/auth-admin'
import { db } from '@/lib/firebase/firestore-admin'
import { Timestamp } from 'firebase-admin/firestore'

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

    const { requestIds, action, notes } = await req.json()
    
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return Response.json({ error: 'Invalid request IDs' }, { status: 400 })
    }

    const batch = db.batch()
    const summaryRef = db.collection('match-payment-summaries').doc(params.matchId)
    let totalVerifiedAmount = 0
    let totalContributions = 0
    let verifiedCount = 0

    // Get all requests
    const requests = await Promise.all(
      requestIds.map(id => 
        db.collection('matches')
          .doc(params.matchId)
          .collection('payment-requests')
          .doc(id)
          .get()
      )
    )

    // Validate all requests exist and are in submitted status
    for (const doc of requests) {
      if (!doc.exists) {
        return Response.json({ error: `Request ${doc.id} not found` }, { status: 404 })
      }
      const data = doc.data()!
      if (data.status !== 'submitted') {
        return Response.json({ error: `Request ${doc.id} is not in submitted status` }, { status: 400 })
      }
    }

    // Process each request
    requests.forEach(doc => {
      const data = doc.data()!
      
      if (action === 'verify') {
        totalVerifiedAmount += data.submittedAmount || 0
        totalContributions += data.contribution || 0
        verifiedCount++
      }

      batch.update(doc.ref, {
        status: action === 'verify' ? 'verified' : 'rejected',
        verifiedAt: Timestamp.now(),
        verifiedBy: token.email,
        verificationNotes: notes
      })
    })

    // Update summary
    if (verifiedCount > 0) {
      batch.update(summaryRef, {
        lastUpdatedAt: Timestamp.now(),
        verifiedCount: db.FieldValue.increment(verifiedCount),
        submittedCount: db.FieldValue.increment(-verifiedCount),
        totalVerified: db.FieldValue.increment(totalVerifiedAmount),
        totalContributions: db.FieldValue.increment(totalContributions)
      })
    }

    await batch.commit()
    return Response.json({ success: true })

  } catch (error) {
    console.error('Error verifying payments:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 