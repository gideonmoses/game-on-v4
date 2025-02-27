'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getNavigationItems } from '@/config/navigationConfig'
import { useMemo, memo } from 'react'

// Export as named export
export const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Memoize navigation items
  const navigationItems = useMemo(() => 
    getNavigationItems(user?.roles || []),
    [user?.roles]
  )

  // Memoize the navigation JSX
  const navigationContent = useMemo(() => {
    if (loading) {
      return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center p-2">
                  <div className="p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                    <div className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-3 mt-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </nav>
      )
    }

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {navigationItems.map((item) => {
              const isActive = item.matchPattern(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center p-2"
                >
                  <div className={`p-2.5 rounded-lg ${item.iconStyle.container} ${
                    isActive ? 'bg-opacity-100' : 'bg-opacity-75'
                  }`}>
                    <item.icon className={`w-6 h-6 ${item.iconStyle.default}`} />
                  </div>
                  <span className={`text-xs mt-1 ${item.iconStyle.default}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current
                      shadow-[0_0_8px_currentColor]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    )
  }, [navigationItems, pathname, loading])

  return navigationContent
}) 