'use client'

import { useAuth } from '@/components/providers/AuthProvider'

export function SignOutButton() {
  const { signOut } = useAuth()

  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
    >
      Sign Out
    </button>
  )
} 