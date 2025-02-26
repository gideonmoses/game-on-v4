'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getNavigationItems } from '@/config/navigationConfig'

export function BottomNavigation() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  const navigationItems = getNavigationItems(user?.roles || [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navigationItems.map((item) => {
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
                <span className={`text-xs mt-1 ${item.iconStyle.default}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 