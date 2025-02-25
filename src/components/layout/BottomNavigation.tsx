'use client'

import Link from 'next/link'
import { Home, User, Settings } from 'lucide-react'
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
}

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        setIsLoadingAdmin(false)
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
        setIsLoadingAdmin(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  const isAdmin = userRoles.includes('Admin')

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
      href: '/profile',
      icon: User,
      label: 'Profile',
      iconStyle: iconStyles.user,
      matchPattern: (path) => path === '/profile'
    }
  ]

  // Memoize navigation items including admin if authorized
  const navItems = useMemo(() => {
    const items = [...baseNavItems]
    if (isAdmin) {
      items.push({
        href: '/admin',
        icon: Settings,
        label: 'Admin',
        iconStyle: iconStyles.settings,
        matchPattern: (path) => path.startsWith('/admin')
      })
    }
    return items
  }, [isAdmin])

  // Memoize the render function for each nav item
  const renderNavItem = useMemo(() => (item: NavItem) => {
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
  }, [pathname])

  if (isLoadingAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {baseNavItems.map((item) => (
              <div key={item.href} className="flex flex-col items-center p-2">
                <div className={`p-1.5 rounded-lg ${item.iconStyle.container} opacity-50`}>
                  <item.icon className={`w-6 h-6 ${item.iconStyle.default} opacity-50`} />
                </div>
                <span className={`text-xs mt-1 ${item.iconStyle.default} opacity-50`}>
                  {item.label}
                </span>
              </div>
            ))}
            <div className="flex flex-col items-center p-2">
              <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                <div className="w-6 h-6" />
              </div>
              <div className="mt-1 w-10 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map(renderNavItem)}
        </div>
      </div>
    </nav>
  )
} 