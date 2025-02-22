'use client'

import Link from 'next/link'
import { HomeIcon } from '@heroicons/react/24/outline'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function PublicHeader() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              href="/home"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              aria-label="Home"
            >
              <HomeIcon className="w-6 h-6" />
            </Link>
            <Link 
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Game On
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
} 