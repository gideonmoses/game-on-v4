import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import type { Match } from '@/types/match'

export async function GET() {
  try {
    // Get matches in voting state
    const matchesSnapshot = await adminDB
      .collection('matches')
      .where('status', '==', 'voting')
      .get()
    
    const now = new Date()
    const matches = matchesSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          votingDeadline: data.votingDeadline || null
        } as Match
      })
      .filter(match => {
        if (!match.votingDeadline) return true
        return new Date(match.votingDeadline) > now
      })

    return NextResponse.json({ matches })

  } catch (error) {
    console.error('Error fetching voting matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
} 