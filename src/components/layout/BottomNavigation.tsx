import Link from 'next/link'
import { HomeIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/firebase-config'
import { useEffect, useState } from 'react'
import type { UserRole } from '@/types/user'

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [userRoles, setUserRoles] = useState<UserRole[]>([])

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (user?.email) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.email))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserRoles(userData.roles || [])
          }
        } catch (error) {
          console.error('Error fetching user roles:', error)
          setUserRoles([])
        }
      }
    }

    fetchUserRoles()
  }, [user?.email])

  const isAdmin = userRoles.includes('Admin')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center p-2 ${
              pathname === '/dashboard' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            href="/profile" 
            className={`flex flex-col items-center p-2 ${
              pathname === '/profile' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <UserCircleIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`flex flex-col items-center p-2 ${
                pathname.startsWith('/admin')
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Cog6ToothIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
} 