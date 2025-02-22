'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase-config'

export default function PendingApprovalPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')

  useEffect(() => {
    // Clear auth state when landing on this page
    signOut(auth)
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 bg-white dark:bg-gray-900">
      <div className="max-w-2xl w-full text-center space-y-8 p-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {from === 'register' 
              ? 'Registration Pending Approval'
              : 'Account Pending Approval'
            }
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {from === 'register'
              ? 'Thank you for registering! Your account is currently pending approval from our administrators.'
              : 'Your account is still pending approval from our administrators.'
            }
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            You will receive an email notification once your account has been approved.
            Please check your email and spam folder.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            You can close this page and log in again once you receive the approval email.
          </p>
        </div>
      </div>
    </div>
  )
} 