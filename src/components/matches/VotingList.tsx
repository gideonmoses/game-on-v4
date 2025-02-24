'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Users
} from 'lucide-react'
import type { Match, VoteStatus } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { iconStyles } from '@/styles/iconStyles'

const voteOptions: { 
  value: VoteStatus
  icon: (selected: boolean) => React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  label: string
}[] = [
  { 
    value: 'available', 
    label: 'Available',
    icon: (selected) => (
      <CheckCircle 
        className={`w-8 h-8 ${
          selected 
            ? 'text-[var(--color-available)]' 
            : 'text-[var(--color-default)]'
        }`}
      />
    ),
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500 dark:border-green-400'
  },
  { 
    value: 'not_available', 
    label: 'Not Available',
    icon: (selected) => (
      <XCircle 
        className={`w-8 h-8 ${
          selected 
            ? 'text-[var(--color-not-available)]' 
            : 'text-[var(--color-default)]'
        }`}
      />
    ),
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-500 dark:border-red-400'
  },
  { 
    value: 'tentative', 
    label: 'Maybe',
    icon: (selected) => (
      <HelpCircle 
        className={`w-8 h-8 ${
          selected 
            ? 'text-[var(--color-tentative)]' 
            : 'text-[var(--color-default)]'
        }`}
      />
    ),
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-500 dark:border-amber-400'
  }
]

// Helper function to format the deadline
const formatDeadline = (deadline: string | null): string => {
  if (!deadline) return 'No deadline set'
  
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffHours = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 24) {
    return `Ends in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  }
  
  return deadlineDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Reuse the LabeledData component pattern from tournaments
const LabeledData = ({ 
  icon, 
  label, 
  value, 
  iconStyle,
  className = "" 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  iconStyle: { default: string, container: string }
  className?: string
}) => (
  <div className={`flex items-center text-sm ${className}`}>
    <div className={`p-1 rounded ${iconStyle.container}`}>
      <div className={iconStyle.default}>
        {icon}
      </div>
    </div>
    <div className="ml-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className={`text-sm ${iconStyle.default}`}>{value}</p>
    </div>
  </div>
)

export function VotingList() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [votedMatches, setVotedMatches] = useState<string[]>([])

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches/voting')
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

  const handleVote = async (matchId: string, status: VoteStatus) => {
    if (!user?.id) return

    setIsVoting(matchId)
    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/matches/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId,
          status
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote')
      }

      // Update local state
      setMatches(prev => prev.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            votes: {
              ...match.votes,
              [user.id]: {
                status,
                updatedAt: new Date().toISOString()
              }
            }
          }
        }
        return match
      }))

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Vote error:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsVoting(null)
    }
  }

  const getUserVote = (match: Match) => {
    if (!user?.id || !match.votes) return null
    return match.votes[user.id]?.status
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No matches available for voting at this time.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => {
        const userVote = getUserVote(match)
        const selectedOption = voteOptions.find(opt => opt.value === userVote)

        return (
          <div 
            key={match.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          >
            <div className="p-4">
              {/* Match Header with Vote Status Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded ${iconStyles.trophy.container}`}>
                    <Users className={`h-5 w-5 ${iconStyles.trophy.default}`} />
                  </div>
                  <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {`${match.homeTeam} vs ${match.awayTeam}`}
                  </h3>
                </div>
                {userVote && (
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full
                    ${userVote === 'available' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : userVote === 'tentative'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {userVote === 'available' ? 'Yes' 
                      : userVote === 'tentative' ? 'Maybe' 
                      : 'No'}
                  </span>
                )}
              </div>

              {/* Match Details in 2 columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <LabeledData
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date"
                  value={new Date(match.date).toLocaleDateString()}
                  iconStyle={iconStyles.calendar}
                />

                <LabeledData
                  icon={<MapPin className="h-4 w-4" />}
                  label="Venue"
                  value={match.venue}
                  iconStyle={iconStyles.location}
                />
              </div>

              {/* Updated Voting Section with Borders */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleVote(match.id, 'available')}
                    disabled={isVoting === match.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border ${
                      userVote === 'available'
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    } ${
                      isVoting === match.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className={`p-1 rounded ${iconStyles.check.container}`}>
                      <ThumbsUp className={`h-4 w-4 ${iconStyles.check.default}`} />
                    </div>
                    <span className={`text-sm ${iconStyles.check.default}`}>Yes</span>
                  </button>

                  <button
                    onClick={() => handleVote(match.id, 'tentative')}
                    disabled={isVoting === match.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border ${
                      userVote === 'tentative'
                        ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-transparent hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    } ${
                      isVoting === match.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className={`p-1 rounded ${iconStyles.question.container}`}>
                      <HelpCircle className={`h-4 w-4 ${iconStyles.question.default}`} />
                    </div>
                    <span className={`text-sm ${iconStyles.question.default}`}>Maybe</span>
                  </button>

                  <button
                    onClick={() => handleVote(match.id, 'not_available')}
                    disabled={isVoting === match.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border ${
                      userVote === 'not_available'
                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'border-transparent hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    } ${
                      isVoting === match.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className={`p-1 rounded ${iconStyles.cross.container}`}>
                      <ThumbsDown className={`h-4 w-4 ${iconStyles.cross.default}`} />
                    </div>
                    <span className={`text-sm ${iconStyles.cross.default}`}>No</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 