'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMemo, memo } from 'react'
import { 
  HomeIcon, 
  CreditCardIcon, 
  CalculatorIcon 
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid, 
  CreditCardIcon as CreditCardIconSolid, 
  CalculatorIcon as CalculatorIconSolid 
} from '@heroicons/react/24/solid'

// Export as named export
export const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Memoize navigation items
  const navigationItems = useMemo(() => {
    const baseItems = [
      {
        label: 'Home',
        href: '/',
        icon: pathname === '/' ? HomeIconSolid : HomeIcon,
        isActive: pathname === '/',
        activeColor: 'text-blue-500'
      },
      {
        label: 'Payment',
        href: '/player-payments',
        icon: pathname.startsWith('/player-payments') ? CreditCardIconSolid : CreditCardIcon,
        isActive: pathname.startsWith('/player-payments'),
        activeColor: 'text-amber-500'
      }
    ]

    // Add manager item if user has manager role
    if (user?.roles?.includes('Manager')) {
      baseItems.push({
        label: 'Manage',
        href: '/manager',
        icon: pathname.startsWith('/manager') ? CalculatorIconSolid : CalculatorIcon,
        isActive: pathname.startsWith('/manager'),
        activeColor: 'text-green-500'
      })
    }

    return baseItems
  }, [pathname, user?.roles])

  // Memoize the navigation JSX
  const navigationContent = useMemo(() => {
    if (loading) {
      return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center p-2">
                  <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
                    <div className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-3 mt-1 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </nav>
      )
    }

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative flex flex-col items-center p-2"
                >
                  <div className={`p-2.5 rounded-lg ${
                    item.isActive ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      item.isActive ? item.activeColor : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`} />
                  </div>
                  <span className={`text-xs mt-1 ${
                    item.isActive ? item.activeColor : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                  {item.isActive && (
                    <div className={`absolute -bottom-3 left-0 right-0 h-0.5 ${item.activeColor}`} />
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