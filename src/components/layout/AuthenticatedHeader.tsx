'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AuthenticatedHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/dashboard"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Game On
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {user?.displayName}
            </div>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
} 