'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match, TeamSelection } from '@/types/match'
import { Vote, VoteType } from '@/types/vote'
import { Check, X, HelpCircle, Clock, MapPin, Loader2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { ViewTeamModal } from './ViewTeamModal'

interface VoteOption {
  type: VoteType
  icon: ReactElement
  label: string
  color: {
    bg: string
    text: string
    darkBg: string
    darkText: string
    hover: string
    darkHover: string
  }
}

const VoteStatusIndicator = ({ status }: { status: VoteType | null }) => {
  if (!status) return (
    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 
      flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
      <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" />
    </div>
  )

  const statusConfig = {
    available: {
      outerBg: 'bg-green-100 dark:bg-green-900/30',
      innerBg: 'bg-green-400 dark:bg-green-500',
      glow: 'shadow-[0_0_8px_rgba(34,197,94,0.6)] dark:shadow-[0_0_8px_rgba(34,197,94,0.4)]'
    },
    tentative: {
      outerBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      innerBg: 'bg-yellow-400 dark:bg-yellow-500',
      glow: 'shadow-[0_0_8px_rgba(234,179,8,0.6)] dark:shadow-[0_0_8px_rgba(234,179,8,0.4)]'
    },
    not_available: {
      outerBg: 'bg-red-100 dark:bg-red-900/30',
      innerBg: 'bg-red-400 dark:bg-red-500',
      glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)] dark:shadow-[0_0_8px_rgba(239,68,68,0.4)]'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${config.outerBg} 
      flex items-center justify-center border-2 border-white dark:border-gray-800 ${config.glow}`}>
      <div className={`w-4 h-4 rounded-full ${config.innerBg}`} />
    </div>
  )
}

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [loading, setLoading] = useState(true)
  const [votingMatchId, setVotingMatchId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<{ 
    match: Match; 
    teamSelection: TeamSelection | null; 
  } | null>(null)
  const { user } = useAuth()

  const voteOptions: VoteOption[] = [
    {
      type: 'available',
      icon: <Check className="w-5 h-5" />,
      label: 'Available',
      color: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        darkBg: 'dark:bg-green-900/30',
        darkText: 'dark:text-green-300',
        hover: 'hover:bg-green-50',
        darkHover: 'dark:hover:bg-green-900/40'
      }
    },
    {
      type: 'tentative',
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Maybe',
      color: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        darkBg: 'dark:bg-yellow-900/30',
        darkText: 'dark:text-yellow-300',
        hover: 'hover:bg-yellow-50',
        darkHover: 'dark:hover:bg-yellow-900/40'
      }
    },
    {
      type: 'not_available',
      icon: <X className="w-5 h-5" />,
      label: 'Not Available',
      color: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        darkBg: 'dark:bg-red-900/30',
        darkText: 'dark:text-red-300',
        hover: 'hover:bg-red-50',
        darkHover: 'dark:hover:bg-red-900/40'
      }
    }
  ]

  const fetchData = useCallback(async () => {
    if (!user?.email) return
    
    try {
      console.log('Fetching matches for user:', user.email)
      
      // Fetch matches using Firebase Timestamp
      const matchesRef = collection(db, 'matches')
      const now = new Date() // Use JavaScript Date for comparison
      console.log('Current date:', now)

      // First get all matches
      const matchesSnapshot = await getDocs(matchesRef)
      console.log('All matches in DB:', matchesSnapshot.size)

      const matchesData = matchesSnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Match:', {
          id: doc.id,
          date: data.date,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam
        })

        return {
          id: doc.id,
          ...data,
          date: data.date
        }
      }).filter(match => {
        // Filter future matches
        const matchDate = new Date(match.date)
        return matchDate >= now
      }) as Match[]

      // Sort matches by date
      const sortedMatches = matchesData.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

      console.log('Sorted future matches:', sortedMatches)
      setMatches(sortedMatches)

      // Only fetch votes if we have matches
      if (sortedMatches.length > 0) {
        const votesRef = collection(db, 'votes')
        const votesQuery = query(
          votesRef,
          where('matchId', 'in', sortedMatches.map(m => m.id))
        )
        const votesSnapshot = await getDocs(votesQuery)
        console.log('Found votes:', votesSnapshot.size)

        const votesData = votesSnapshot.docs.reduce((acc, doc) => {
          const vote = { id: doc.id, ...doc.data() } as Vote
          acc[vote.matchId] = vote
          return acc
        }, {} as Record<string, Vote>)

        setVotes(votesData)
      } else {
        console.log('No future matches found')
        setVotes({})
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    if (user?.email) fetchData()
  }, [user?.email, fetchData])

  useEffect(() => {
    let mounted = true

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted && user?.email) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.email, fetchData])

  // Add debug effect
  useEffect(() => {
    console.log('Current matches state:', matches)
    console.log('Current votes state:', votes)
  }, [matches, votes])

  const handleVote = async (matchId: string, voteType: VoteType) => {
    if (!user?.email || votingMatchId) return
    setVotingMatchId(matchId)
    
    try {
      const votesRef = collection(db, 'votes')
      const voteQuery = query(votesRef, where('matchId', '==', matchId))
      const voteSnapshot = await getDocs(voteQuery)

      const voteDoc = voteSnapshot.docs[0]
      let voteData: Vote

      if (voteDoc) {
        // Update existing vote document
        voteData = {
          id: voteDoc.id,
          matchId,
          votes: {
            ...(voteDoc.data() as Vote).votes,
            [user.email]: {
              status: voteType,
              updatedAt: new Date().toISOString()
            }
          }
        }
        await updateDoc(doc(db, 'votes', voteDoc.id), {
          votes: voteData.votes
        })
      } else {
        // Create new vote document
        voteData = {
          id: '',
          matchId,
          votes: {
            [user.email]: {
              status: voteType,
              updatedAt: new Date().toISOString()
            }
          }
        }
        const newVoteRef = doc(collection(db, 'votes'))
        voteData.id = newVoteRef.id
        await setDoc(newVoteRef, voteData)
      }

      // Update local state
      setVotes(prev => ({
        ...prev,
        [matchId]: voteData
      }))

      toast.success('Vote submitted')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    } finally {
      setVotingMatchId(null)
    }
  }

  const getUserVote = (matchId: string): VoteType | null => {
    const matchVotes = votes[matchId]?.votes
    if (!matchVotes || !user?.email) return null
    return matchVotes[user.email]?.status || null
  }

  const formatDateTime = (date: string | { seconds: number }) => {
    try {
      const dateObj = typeof date === 'string' 
        ? new Date(date)
        : new Date(date.seconds * 1000)
      return format(dateObj, 'EEE, MMM d')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const fetchTeamSelection = async (match: Match) => {
    try {
      const teamSelectionsRef = collection(db, 'teamSelections')
      const teamQuery = query(teamSelectionsRef, where('matchId', '==', match.id))
      const teamSnapshot = await getDocs(teamQuery)
      
      if (!teamSnapshot.empty) {
        const teamData = teamSnapshot.docs[0].data() as TeamSelection
        setSelectedTeam({
          match,
          teamSelection: teamData
        })
      }
    } catch (error) {
      console.error('Error fetching team selection:', error)
      toast.error('Failed to load team')
    }
  }

  const getStatusTag = (status: string) => {
    const statusStyles = {
      'voting': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'team-selected': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'team-announced': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    }[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'

    const statusText = {
      'voting': 'Voting Open',
      'team-selected': 'Team Selected',
      'team-announced': 'Team Announced'
    }[status] || status

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles}`}>
        {statusText}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const userVote = getUserVote(match.id)
        const isVoting = votingMatchId === match.id
        const isTeamAnnounced = match.status === 'team-announced'
        const canVote = match.status === 'scheduled' || match.status === 'voting'
        
        return (
          <div
            key={match.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 relative overflow-visible"
          >
            <VoteStatusIndicator status={userVote} />

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                    {formatDateTime(match.date)} at {match.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                    {match.venue}
                  </div>
                </div>
              </div>
              {getStatusTag(match.status)}
            </div>

            {isTeamAnnounced ? (
              <Button
                onClick={() => fetchTeamSelection(match)}
                variant="outline"
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                View Team
              </Button>
            ) : canVote ? (
              <div className="grid grid-cols-3 gap-3">
                {voteOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleVote(match.id, option.type)}
                    disabled={isVoting}
                    className={`flex items-center justify-center p-3 rounded transition-colors
                      ${userVote === option.type 
                        ? `${option.color.bg} ${option.color.text} ${option.color.darkBg} ${option.color.darkText}` 
                        : `${option.color.hover} ${option.color.text} ${option.color.darkHover} ${option.color.darkText}`
                      }
                      disabled:opacity-50`}
                  >
                    {isVoting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                    ) : (
                      option.icon
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                Voting is closed for this match
              </div>
            )}

            {!userVote && !isVoting && canVote && (
              <p className="text-center text-sm text-red-500 dark:text-red-400 mt-2">
                Please vote for this match
              </p>
            )}
          </div>
        )
      })}

      <ViewTeamModal 
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        teamSelection={selectedTeam?.teamSelection || null}
        matchTitle={selectedTeam ? `${selectedTeam.match.homeTeam} vs ${selectedTeam.match.awayTeam}` : ''}
      />
    </div>
  )
} 