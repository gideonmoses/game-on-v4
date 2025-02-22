import Link from 'next/link'
import { HomeIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'

export function BottomNavigation() {
  const pathname = usePathname()

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
          <Link 
            href="/settings" 
            className={`flex flex-col items-center p-2 ${
              pathname === '/settings' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  )
} 