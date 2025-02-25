import { NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase/admin'
import { z } from 'zod'
import type { UserDocument, UpdateUserData } from '@/types/user'

const updateUserSchema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  roles: z.array(z.enum(['Player', 'Manager', 'Selector', 'Admin'])),
  userStatus: z.enum(['approved', 'pending', 'suspended'])
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  try {
    if (userId) {
      // Fetch single user
      const userDoc = await adminDB.collection('users').doc(userId).get()
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: {
          id: userDoc.id,
          ...userDoc.data()
        } as UserDocument
      })
    }

    // Fetch all users
    const usersSnapshot = await adminDB.collection('users').get()
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserDocument[]

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    
    const result = updateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.flatten()
      }, { status: 400 })
    }

    const userDoc = await adminDB.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentUser = userDoc.data() as UserDocument
    
    // Prepare update data
    const updateData: UpdateUserData = {
      displayName: result.data.displayName,
      roles: result.data.roles,
      userStatus: result.data.userStatus,
      updatedAt: new Date().toISOString()
    }

    await adminDB.collection('users').doc(userId).update(updateData)

    // Return the updated user
    const updatedUser: UserDocument = {
      ...currentUser,
      ...updateData,
      id: userId
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 