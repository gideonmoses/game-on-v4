'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Calendar, 
  MapPin, 
  Trophy,
  Check,
  X,
  HelpCircle
} from 'lucide-react'
import type { Match, VoteStatus } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { iconStyles } from '@/styles/iconStyles'
import { format } from 'date-fns'
import { InfoItem } from '@/components/ui/InfoItem'
import { Timestamp } from 'firebase/firestore'

export function UpcomingMatches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState<string | null>(null)

  useEffect(() => {
    console.log('VotingList mounted, user:', user?.id)
    fetchMatches()
  }, [user])

  const fetchMatches = async () => {
    try {
      console.log('Fetching matches...')
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to fetch matches')
      const data = await response.json()
      console.log('All matches received:', data)
      
      // Filter matches that are in voting state
      const votingMatches = data.filter((match: Match) => {
        console.log('Match status:', match.id, match.status)
        return match.status === 'voting'
      })
      console.log('Voting matches filtered:', votingMatches)
      setMatches(votingMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (matchId: string, status: VoteStatus) => {
    if (!user) {
      console.log('No user found for voting')
      return
    }
    setIsVoting(matchId)

    try {
      // Get the user's ID token
      const idToken = await user.getIdToken()
      
      const response = await fetch(`/api/matches/${matchId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Add the auth token
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Vote submission failed:', errorData)
        throw new Error('Failed to submit vote')
      }

      await fetchMatches()
      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Vote error:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsVoting(null)
    }
  }

  const formatMatchDate = (date: Timestamp | string | undefined) => {
    if (!date) return ''
    try {
      if (typeof date === 'object' && 'toDate' in date) {
        return format(date.toDate(), 'MMM d, yyyy')
      }
      return format(new Date(date), 'MMM d, yyyy')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const getUserVote = (match: Match) => {
    if (!user?.id || !match.votes) return null
    return match.votes[user.id]?.status
  }

  const getStatusDisplay = (status: VoteStatus) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'tentative':
        return 'Maybe'
      case 'not_available':
        return 'Not Available'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No matches currently require voting.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const userVote = getUserVote(match)
        const hasVoted = Boolean(userVote)

        return (
          <div
            key={match.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 
              ${!hasVoted ? 'border-2 border-red-500' : 'border border-gray-200 dark:border-gray-700'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {match.tournamentName}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote(match.id, 'available')}
                  disabled={isVoting === match.id}
                  className={`p-2 rounded-full transition-colors border-2 ${
                    userVote === 'available' 
                      ? 'bg-green-100 dark:bg-green-900/20 border-green-600' 
                      : 'hover:bg-green-100 dark:hover:bg-green-900/20 border-transparent hover:border-green-600'
                  } text-green-600 dark:text-green-400`}
                  title="Available"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleVote(match.id, 'tentative')}
                  disabled={isVoting === match.id}
                  className={`p-2 rounded-full transition-colors border-2 ${
                    userVote === 'tentative'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-600'
                      : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20 border-transparent hover:border-yellow-600'
                  } text-yellow-600 dark:text-yellow-400`}
                  title="Maybe"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleVote(match.id, 'not_available')}
                  disabled={isVoting === match.id}
                  className={`p-2 rounded-full transition-colors border-2 ${
                    userVote === 'not_available'
                      ? 'bg-red-100 dark:bg-red-900/20 border-red-600'
                      : 'hover:bg-red-100 dark:hover:bg-red-900/20 border-transparent hover:border-red-600'
                  } text-red-600 dark:text-red-400`}
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

            {userVote ? (
              <div className="mt-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Your response: </span>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    const nextStatus = {
                      'available': 'tentative',
                      'tentative': 'not_available',
                      'not_available': 'available'
                    }[userVote] as VoteStatus
                    handleVote(match.id, nextStatus)
                  }}
                  className={`
                    font-medium hover:underline
                    ${userVote === 'available' ? 'text-green-600 dark:text-green-400' : ''}
                    ${userVote === 'tentative' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                    ${userVote === 'not_available' ? 'text-red-600 dark:text-red-400' : ''}
                  `}
                >
                  {getStatusDisplay(userVote)}
                </a>
              </div>
            ) : (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400 font-medium">
                Please vote for your availability
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 