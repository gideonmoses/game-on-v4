'use client'

import Link from 'next/link'
import { Home, User, Settings, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { iconStyles } from '@/styles/iconStyles'

interface NavItem {
  href: string
  icon: typeof Home
  label: string
  iconStyle: { default: string, container: string }
  matchPattern: (pathname: string) => boolean
  roles?: string[] // Add roles to restrict visibility
}

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        setIsLoadingRoles(false)
        return
      }

      try {
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('uid', '==', user.id))
        const querySnapshot = await getDocs(userQuery)
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          setUserRoles(userData.roles || [])
        }
      } catch (error) {
        console.error('Error fetching user roles:', error)
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  // Base navigation items that are always shown
  const baseNavItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
      iconStyle: iconStyles.home,
      matchPattern: (path) => path === '/dashboard'
    },
    {
      href: '/selector-home',
      icon: Users,
      label: 'Selector',
      iconStyle: iconStyles.selector,
      matchPattern: (path) => path.startsWith('/selector-home') || path.startsWith('/select-team'),
      roles: ['Admin', 'Selector'] // Only visible to Admin and Selector roles
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      iconStyle: iconStyles.user,
      matchPattern: (path) => path === '/profile'
    }
  ]

  // Memoize navigation items including admin if authorized
  const navItems = useMemo(() => {
    const items = baseNavItems.filter(item => {
      if (!item.roles) return true // Show items without role restrictions
      return item.roles.some(role => userRoles.includes(role)) // Show items where user has required role
    })

    // Add admin item if user has Admin role
    if (userRoles.includes('Admin')) {
      items.push({
        href: '/admin',
        icon: Settings,
        label: 'Admin',
        iconStyle: iconStyles.settings,
        matchPattern: (path) => path.startsWith('/admin')
      })
    }

    return items
  }, [userRoles])

  if (isLoadingRoles) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {baseNavItems.map((item) => (
              <div key={item.href} className="flex flex-col items-center p-2">
                <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                  <div className="w-6 h-6" />
                </div>
                <div className="mt-1 w-10 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const isActive = item.matchPattern(pathname)
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className="flex flex-col items-center p-2"
              >
                <div className={`p-1.5 rounded-lg ${item.iconStyle.container} ${
                  isActive ? 'bg-opacity-100' : 'bg-opacity-75'
                }`}>
                  <item.icon className={`w-6 h-6 ${item.iconStyle.default}`} />
                </div>
                <span className={`text-xs mt-1 ${item.iconStyle.default}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 