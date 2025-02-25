import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'

// Move schema outside of route handlers to be used by both
const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  format: z.string().min(2, 'Format must be at least 2 characters'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
  location: z.string().min(3, 'Location must be at least 3 characters')
})

type Props = {
  params: {
    id: string | undefined
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  // Create a new scope for params.id
  //const id = await params.id
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }
  
  try {
    const doc = await adminDB.collection('tournaments').doc(id).get()
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json({
      tournament: {
        id: doc.id,
        ...doc.data()
      }
    })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }
  
  try {
    const data = await request.json()
    
    const result = tournamentSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    await adminDB.collection('tournaments').doc(id).update(result.data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
} 