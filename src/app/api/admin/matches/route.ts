import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'

const matchSchema = z.object({
  tournamentId: z.string().min(1, 'Tournament is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date',
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  }),
  venue: z.string().min(1, 'Venue is required'),
  status: z.enum(['scheduled', 'voting', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid match status' })
  }),
  jerseyColor: z.enum(['whites', 'colours'], {
    errorMap: () => ({ message: 'Please select a valid jersey color' })
  })
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const result = matchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    // Get tournament name
    const tournamentDoc = await adminDB.collection('tournaments').doc(body.tournamentId).get()
    if (!tournamentDoc.exists) {
      return NextResponse.json({
        error: 'Tournament not found',
      }, { status: 404 })
    }

    const match = {
      ...result.data,
      tournamentName: tournamentDoc.data()?.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await adminDB.collection('matches').add(match)
    
    return NextResponse.json({ 
      id: docRef.id,
      ...match
    })

  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('id')

  try {
    if (matchId) {
      // Fetch single match
      const matchDoc = await adminDB.collection('matches').doc(matchId).get()
      
      if (!matchDoc.exists) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        match: {
          id: matchDoc.id,
          ...matchDoc.data()
        }
      })
    }

    // Fetch all matches (existing functionality)
    const matchesSnapshot = await adminDB.collection('matches').get()
    
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
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

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('id')

  if (!matchId) {
    return NextResponse.json(
      { error: 'Match ID is required' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    
    const result = matchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    
    if (!matchDoc.exists) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Get tournament name for the update
    const tournamentDoc = await adminDB.collection('tournaments').doc(body.tournamentId).get()
    if (!tournamentDoc.exists) {
      return NextResponse.json({
        error: 'Tournament not found',
      }, { status: 404 })
    }

    const matchData = {
      tournamentId: body.tournamentId,
      tournamentName: tournamentDoc.data()?.name || '',
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      date: body.date,
      time: body.time,
      venue: body.venue,
      status: body.status,
      jerseyColor: body.jerseyColor,
      // Only include votingDeadline if status is voting
      ...(body.status === 'voting' ? { votingDeadline: body.votingDeadline } : { votingDeadline: null }),
      updatedAt: FieldValue.serverTimestamp()
    }

    await adminDB.collection('matches').doc(matchId).update(matchData)

    return NextResponse.json({ 
      message: 'Match updated successfully',
      match: {
        id: matchId,
        ...matchData,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
} 