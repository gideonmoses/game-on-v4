import { NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase/admin';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  jerseyNumber: z.string().min(1, 'Jersey number is required'),
  phoneNumber: z.string()
    .regex(/^[89][0-9]{7}$/, 'Must be a valid Singapore phone number (8 digits starting with 8 or 9)'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registration request received:', { ...body, password: '***' });

    // Validate request body
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten();
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          fields: errors.fieldErrors,
          form: errors.formErrors
        }
      }, { status: 400 });
    }

    const { email, password, displayName, jerseyNumber, phoneNumber, dateOfBirth } = body;

    // Check if jersey number is already taken
    const jerseyNumberDoc = await adminDB
      .collection('users')
      .where('jerseyNumber', '==', jerseyNumber)
      .get();

    if (!jerseyNumberDoc.empty) {
      return NextResponse.json(
        { error: 'Jersey number already taken' },
        { status: 409 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      roles: ['Player'],
      status: 'pending'
    });

    // Create user document in Firestore
    const timestamp = new Date().toISOString();
    await adminDB.collection('users').doc(email).set({
      email,
      displayName,
      jerseyNumber,
      phoneNumber,
      dateOfBirth,
      roles: ['Player'],
      userStatus: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return NextResponse.json({
      message: 'Registration successful',
      uid: userRecord.uid
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 