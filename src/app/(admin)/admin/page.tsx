'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  TrophyIcon, 
  CalendarIcon,
  UsersIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

const adminLinks = [
  {
    href: '/admin/tournaments',
    icon: TrophyIcon,
    title: 'Tournaments',
    description: 'Manage tournaments and competitions'
  },
  {
    href: '/admin/matches',
    icon: CalendarIcon,
    title: 'Matches',
    description: 'Schedule and manage matches'
  },
  {
    href: '/admin/users',
    icon: UsersIcon,
    title: 'Users',
    description: 'Manage user accounts and roles'
  },
  {
    href: '/admin/stats',
    icon: ChartBarIcon,
    title: 'Statistics',
    description: 'View system statistics'
  }
]

export default function AdminPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Welcome to the admin dashboard. Manage your application here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <link.icon className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {link.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Active Tournaments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming Matches</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
          </div>
        </div>
      </div>
    </div>
  )
} 