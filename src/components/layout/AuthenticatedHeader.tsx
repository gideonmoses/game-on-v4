'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'

export function AuthenticatedHeader() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Game On</h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="theme-toggle-icon" />
              ) : (
                <Moon className="theme-toggle-icon" />
              )}
            </button>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
} 