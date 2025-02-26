import { NextResponse } from 'next/server'
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match } from '@/types/match'

export async function GET() {
  try {
    const matchesRef = collection(db, 'matches')
    
    // Create start of today timestamp
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfToday = Timestamp.fromDate(today)
    
    // Get all matches and filter by date
    const q = query(
      matchesRef,
      orderBy('date', 'asc')
    )

    const snapshot = await getDocs(q)
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Match[]

    // Filter matches after today
    const filteredMatches = matches.filter(match => {
      const matchDate = match.date?.toDate?.() || new Date(match.date)
      return matchDate >= startOfToday.toDate()
    })

    return NextResponse.json(filteredMatches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
} 