'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, User, LogOut, Sun, Moon, Home } from 'lucide-react'
import { iconStyles } from '@/styles/iconStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useState } from 'react'
import { auth } from '@/lib/firebase/firebase-config'
import { signOut } from 'firebase/auth'

export function AuthenticatedHeader() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setIsMenuOpen(false)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center">
              <div className={`p-1.5 rounded-lg ${iconStyles.home.container} ${
                pathname === '/dashboard' ? 'bg-opacity-100' : 'bg-opacity-75'
              }`}>
                <Home className={`w-6 h-6 ${iconStyles.home.default}`} />
              </div>
            </Link>
            <Link 
              href="/dashboard"
              className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80"
            >
              Game On
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <Link 
            href="/profile"
            className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            <User className="h-5 w-5 mr-2" />
            Profile
          </Link>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  )
} 