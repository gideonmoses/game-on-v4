'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Carousel } from '@/components/ui/Carousel'

const carouselItems = [
  {
    id: '1',
    title: 'Latest Updates',
    description: 'Check out what\'s new this week',
    bgColor: 'bg-blue-500',
  },
  {
    id: '2',
    title: 'Your Next Game',
    description: 'Upcoming matches and practice sessions',
    bgColor: 'bg-green-500',
  },
  {
    id: '3',
    title: 'Team Announcements',
    description: 'Important information for all players',
    bgColor: 'bg-purple-500',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <Carousel items={carouselItems} />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.displayName}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Your account is active and ready to use.
        </p>
      </div>

      {/* Add your dashboard content here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example dashboard cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Profile
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              Email: {user?.email}
            </p>
            {/* Add more user details */}
          </div>
        </div>
      </div>
    </div>
  )
} 