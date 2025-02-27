import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

const teamSchema = z.object({
  starters: z.array(z.object({
    email: z.string().email(),
    displayName: z.string(),
    jerseyNumber: z.string().optional(),
    role: z.literal('starter')
  })),
  substitutes: z.array(z.object({
    email: z.string().email(),
    displayName: z.string(),
    jerseyNumber: z.string().optional(),
    role: z.literal('substitute')
  }))
})

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Auth check
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    
    // Get user data to check roles
    if (!decodedToken.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const userDoc = await adminDB.collection('users').doc(decodedToken.email).get()
    const userData = userDoc.data()
    console.log('User Document Data:', userDoc.data())
    
    // Debug logs
    console.log('API: Checking authorization for user:', {
      email: decodedToken.email,
      uid: decodedToken.uid,
      roles: userData?.roles
    })

    // Check if user has Selector role
    if (!userDoc.exists || !userData?.roles) {
      return NextResponse.json({ 
        error: 'User is not authorized as selector',
        debug: {
          roles: userData?.roles,
          exists: userDoc.exists,
          hasRoles: false
        }
      }, { status: 403 })
    }

    // Convert roles object to array if needed
    const userRoles = Array.isArray(userData.roles) 
      ? userData.roles 
      : Object.values(userData.roles)

    // Check if user has Selector role
    if (!userRoles.includes('Selector')) {
      console.log('API: Unauthorized user:', {
        email: decodedToken.email,
        roles: userRoles,
        exists: userDoc.exists,
        hasRoles: true,
        rolesArray: Array.isArray(userRoles)
      })
      return NextResponse.json({ 
        error: 'User is not authorized as selector',
        debug: {
          roles: userRoles,
          exists: userDoc.exists,
          hasRoles: true
        }
      }, { status: 403 })
    }

    const { matchId } = params
    const body = await request.json()
    const { action, teamSelection } = body

    // Common function to save team selection
    const saveTeamSelection = async (teamData: any) => {
      await adminDB.collection('teamSelections').doc(matchId).set({
        ...teamData,
        updatedAt: new Date().toISOString(),
        updatedBy: decodedToken.email,
        version: (teamData.version || 0) + 1
      })
    }

    if (action === 'recall') {
      await adminDB.collection('matches').doc(matchId).update({
        status: 'voting'
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'save') {
      const result = teamSchema.safeParse(teamSelection)
      
      if (!result.success) {
        return NextResponse.json({
          error: 'Validation failed',
          details: result.error.flatten()
        }, { status: 400 })
      }

      // Get existing team selection or create new
      const teamDoc = await adminDB.collection('teamSelections').doc(matchId).get()
      const existingData = teamDoc.exists ? teamDoc.data() : {}

      const teamData = {
        ...existingData,
        matchId,
        starters: result.data.starters,
        substitutes: result.data.substitutes,
        status: existingData.status || 'draft' // Maintain existing status or default to draft
      }

      await saveTeamSelection(teamData)
      return NextResponse.json({ success: true, data: teamData })
    }

    if (action === 'publish') {
      const result = teamSchema.safeParse(teamSelection)
      
      if (!result.success) {
        return NextResponse.json({
          error: 'Validation failed',
          details: result.error.flatten()
        }, { status: 400 })
      }

      // Save team selection first
      const teamDoc = await adminDB.collection('teamSelections').doc(matchId).get()
      const existingData = teamDoc.exists ? teamDoc.data() : {}

      const teamData = {
        ...existingData,
        matchId,
        starters: result.data.starters,
        substitutes: result.data.substitutes,
        status: 'final'
      }

      await saveTeamSelection(teamData)

      // Then update match status
      await adminDB.collection('matches').doc(matchId).update({
        status: 'team-announced'
      })

      return NextResponse.json({ success: true, data: teamData })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in team API:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)

    // Get current team selection
    const teamDoc = await adminDB.collection('teamSelections').doc(params.matchId).get()
    if (!teamDoc.exists) {
      return NextResponse.json({ error: 'Team selection not found' }, { status: 404 })
    }

    const teamData = teamDoc.data()
    const newStatus = teamData?.status === 'final' ? 'draft' : 'final'

    // Update team selection status
    await adminDB.collection('teamSelections').doc(params.matchId).update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedToken.email,
      version: (teamData?.version || 0) + 1
    })

    // Update match status
    await adminDB.collection('matches').doc(params.matchId).update({
      status: newStatus === 'final' ? 'team-announced' : 'voting'
    })

    return NextResponse.json({ 
      success: true, 
      status: newStatus 
    })
  } catch (error) {
    console.error('Error updating team status:', error)
    return NextResponse.json({ error: 'Failed to update team status' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const auth = getAuth()
    await auth.verifyIdToken(token)

    const { matchId } = params
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    const matchDoc = await adminDB.collection('matches').doc(matchId).get()
    
    if (!matchDoc.exists) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const matchData = matchDoc.data()
    if (!matchData?.teamSelection) {
      return NextResponse.json({ error: 'Team has not been selected yet' }, { status: 404 })
    }

    return NextResponse.json({
      starters: matchData.teamSelection.starters,
      substitutes: matchData.teamSelection.substitutes,
      updatedAt: matchData.teamSelection.updatedAt,
      updatedBy: matchData.teamSelection.updatedBy
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 