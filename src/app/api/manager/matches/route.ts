import { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { db } from '@/lib/firebase/admin' // Use admin db instead of client db
import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET(request: Request) {
  try {
    // Get and verify auth token
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

    // Get matches with payment summaries
    const matchesSnapshot = await adminDB.collection('matches').get()
    const matches = await Promise.all(matchesSnapshot.docs.map(async (doc) => {
      const match = { id: doc.id, ...doc.data() }
      
      // Get payment summary for this match
      const summaryDoc = await adminDB
        .collection('match-payment-summaries')
        .doc(doc.id)
        .get()

      return {
        ...match,
        paymentSummary: summaryDoc.exists ? summaryDoc.data() : null
      }
    }))

    return NextResponse.json({ matches })

  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' }, 
      { status: 500 }
    )
  }
} 