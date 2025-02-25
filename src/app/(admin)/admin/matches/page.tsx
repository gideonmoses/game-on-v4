'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Plus,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Pencil,
  Trophy
} from 'lucide-react'
import type { Match } from '@/types/match'

const iconStyles = {
  calendar: {
    default: 'text-orange-600 dark:text-orange-400',
    container: 'bg-orange-50 dark:bg-orange-900/20'
  },
  clock: {
    default: 'text-blue-600 dark:text-blue-400',
    container: 'bg-blue-50 dark:bg-blue-900/20'
  },
  location: {
    default: 'text-purple-600 dark:text-purple-400',
    container: 'bg-purple-50 dark:bg-purple-900/20'
  },
  trophy: {
    default: 'text-amber-600 dark:text-amber-400',
    container: 'bg-amber-50 dark:bg-amber-900/20'
  },
  action: {
    default: 'text-emerald-600 dark:text-emerald-400',
    container: 'bg-emerald-50 dark:bg-emerald-900/20'
  }
}

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/admin/matches')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch matches')
        }

        setMatches(data.matches)
      } catch (error) {
        console.error('Error fetching matches:', error)
        toast.error('Failed to load matches')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const handleEdit = (matchId: string) => {
    router.push(`/admin/matches/create?id=${matchId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Matches
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your matches
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 animate-pulse"
            >
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Back to Admin"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Matches
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your matches
            </p>
          </div>
        </div>
        <Link
          href="/admin/matches/create"
          className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Add Match"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight min-h-[3.5rem]">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                <div className={`mt-1 flex items-center text-sm ${iconStyles.trophy.default}`}>
                  <div className={`p-1 rounded ${iconStyles.trophy.container}`}>
                    <Trophy className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  </div>
                  <span className="truncate">{match.tournamentName}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className={`flex items-center text-sm ${iconStyles.calendar.default}`}>
                  <div className={`p-1 rounded ${iconStyles.calendar.container}`}>
                    <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  </div>
                  <span>{new Date(match.date.toString()).toLocaleDateString()}</span>
                </div>
                <div className={`flex items-center text-sm ${iconStyles.clock.default}`}>
                  <div className={`p-1 rounded ${iconStyles.clock.container}`}>
                    <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  </div>
                  <span>{match.time}</span>
                </div>
              </div>

              <div className={`mt-2 flex items-center text-sm ${iconStyles.location.default}`}>
                <div className={`p-1 rounded ${iconStyles.location.container}`}>
                  <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                </div>
                <span className="truncate">{match.venue}</span>
              </div>

              {match.score && (
                <div className="mt-3 flex justify-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {match.score.home} - {match.score.away}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${match.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    match.status === 'voting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                    match.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}
                >
                  {match.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => handleEdit(match.id)}
                  className={`p-1.5 rounded transition-colors ${iconStyles.action.container} ${iconStyles.action.default}`}
                  title="Edit Match"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 