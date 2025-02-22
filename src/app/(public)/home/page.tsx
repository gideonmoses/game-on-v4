import Link from 'next/link'
import { Carousel } from '@/components/ui/Carousel'

const carouselItems = [
  {
    id: '1',
    title: 'Welcome to Game On',
    description: 'Join our sports community today',
    bgColor: 'bg-blue-500',
  },
  {
    id: '2',
    title: 'Upcoming Events',
    description: 'Check out our latest tournaments',
    bgColor: 'bg-green-500',
  },
  {
    id: '3',
    title: 'Player Highlights',
    description: 'See what our players are achieving',
    bgColor: 'bg-purple-500',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Carousel items={carouselItems} />
      
      <div className="flex items-center justify-center py-8">
        <div className="text-center max-w-3xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 text-black dark:text-white">
            Welcome to Your App
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Your app description goes here. Add a compelling message about what makes your app special.
          </p>
          <div className="flex justify-center gap-6">
            <Link 
              href="/login"
              className="px-8 py-4 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Log In
            </Link>
            <Link 
              href="/register"
              className="px-8 py-4 text-lg border-2 border-gray-300 text-gray-800 dark:text-white dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 