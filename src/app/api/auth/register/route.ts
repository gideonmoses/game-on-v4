import { NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/admin';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^[89][0-9]{7}$/, 'Invalid phone number format'),
  jerseyNumber: z.string(),
  dateOfBirth: z.string()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, ...userData } = body;

    const result = registerSchema.safeParse(userData);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          fields: result.error.flatten().fieldErrors,
        }
      }, { status: 400 });
    }

    const { email, displayName, phoneNumber, jerseyNumber, dateOfBirth } = result.data;

    try {
      // Create user document in Firestore
      await adminDB.collection('users').doc(email).set({
        uid,
        email,
        displayName,
        phoneNumber,
        jerseyNumber,
        dateOfBirth,
        roles: ['Player'],
        userStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        message: 'Registration successful',
        user: {
          email,
          displayName,
          userStatus: 'pending'
        }
      });

    } catch (error) {
      console.error('Firestore error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: 'Registration failed',
        details: {
          form: ['An unexpected error occurred. Please try again later.']
        }
      },
      { status: 500 }
    );
  }
} 