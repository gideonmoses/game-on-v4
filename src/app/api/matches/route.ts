import { NextResponse } from 'next/server'
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'

export async function GET() {
  try {
    const now = Timestamp.now()
    const matchesRef = collection(db, 'matches')
    const q = query(
      matchesRef,
      where('date', '>=', now),
      orderBy('date', 'asc')
    )

    const snapshot = await getDocs(q)
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
} 