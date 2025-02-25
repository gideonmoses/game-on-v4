'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Carousel } from '@/components/ui/Carousel'
import { VotingList } from '@/components/matches/VotingList'

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
    <div className="max-w-7xl mx-auto p-4">
      <div className="space-y-6">
        <Carousel items={carouselItems} />

        {/* Match Availability section moved here */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Match Availability
            </h2>
            <VotingList />
          </div>
        </section>

      </div>
    </div>
  )
} 