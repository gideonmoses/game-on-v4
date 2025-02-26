import { Carousel } from '@/components/ui/Carousel'
import { UpcomingMatches } from '@/components/matches/UpcomingMatches'


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

export default async function DashboardPage() {

  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Carousel items={carouselItems} />
      </div>


        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upcoming Matches
          </h2>
          <UpcomingMatches />
        </div>
      </div>
  )
} 