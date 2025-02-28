import { NextResponse } from 'next/server'
import { adminAuth, adminStorage } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    // Verify auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    await adminAuth.verifyIdToken(token)

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Firebase Storage
    const buffer = await file.arrayBuffer()
    const filename = `payment-screenshots/${Date.now()}-${file.name}`
    const fileRef = adminStorage.file(filename)
    
    await fileRef.save(Buffer.from(buffer))
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future expiration
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 