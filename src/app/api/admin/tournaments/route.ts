import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  format: z.string().min(2, 'Format must be at least 2 characters'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
})

export async function GET() {
  try {
    const snapshot = await adminDB.collection('tournaments').get()
    const tournaments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const result = tournamentSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const docRef = await adminDB.collection('tournaments').add({
      ...result.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id: docRef.id,
      ...result.data
    })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
} 