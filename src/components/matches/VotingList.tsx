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
  Users,
  Check,
  X
} from 'lucide-react'
import type { Match, VoteStatus } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { iconStyles } from '@/styles/iconStyles'
import { format } from 'date-fns'
import { InfoItem } from '@/components/ui/InfoItem'

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

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to fetch matches')
      const data = await response.json()
      setMatches(data)
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (matchId: string, status: VoteStatus) => {
    if (!user) return
    setIsVoting(matchId)

    try {
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/matches/${matchId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to submit vote')
      }

      // Refresh matches after voting
      await fetchMatches()
      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Vote error:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsVoting(null)
    }
  }

  const formatMatchDate = (date: any) => {
    if (!date) return ''
    const timestamp = date.toDate ? date.toDate() : new Date(date)
    return format(timestamp, 'MMM d, yyyy')
  }

  const getUserVote = (match: Match) => {
    return match.votes?.[user?.id || '']?.status
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {match.homeTeam} vs {match.awayTeam}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voting buttons */}
              <button
                onClick={() => handleVote(match.id, 'available')}
                disabled={isVoting === match.id}
                className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                title="Available"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleVote(match.id, 'tentative')}
                disabled={isVoting === match.id}
                className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                title="Maybe"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleVote(match.id, 'not_available')}
                disabled={isVoting === match.id}
                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                title="Not Available"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem
              icon={<Trophy className="h-4 w-4" />}
              label="Tournament"
              value={match.tournamentName}
              iconStyle={iconStyles.trophy.default}
            />
            <InfoItem
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={formatMatchDate(match.date)}
              iconStyle={iconStyles.calendar.default}
            />
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Venue"
              value={match.venue}
              iconStyle={iconStyles.location.default}
            />
          </div>

          {getUserVote(match) && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Your response: {getUserVote(match)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 