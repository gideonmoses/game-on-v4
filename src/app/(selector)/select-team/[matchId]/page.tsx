'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match, VoteStatus, SelectedPlayer, TeamSelection } from '@/types/match'
import { User } from '@/types/user'
import { Check, X, HelpCircle, ArrowLeft, Save, Send, RotateCcw, Users, UserPlus, Share2, Clock, MapPin, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { iconStyles } from '@/styles/iconStyles'
import { Vote, VoteType } from '@/types/vote'
import type { LucideIcon } from 'lucide-react'

interface PlayerVote {
  user: User
  status: VoteType
  updatedAt: string
  isSelected?: boolean
  selectionRole?: 'starter' | 'substitute'
}

interface PageProps {
  params: Promise<{ matchId: string }>
}

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
)

const PlayerCard = ({ player, isSelected, onSelect }: { 
  player: PlayerVote
  isSelected: boolean
  onSelect: () => void 
}) => {
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg transition-all
        ${isSelected 
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500/50' 
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center
          ${getStatusColorClass(player.status)}`}>
          {player.user.jerseyNumber || '#'}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {player.user.displayName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
              ${getStatusBadgeClass(player.status)}`}>
              {player.status === 'available' ? 'Available' : 
               player.status === 'tentative' ? 'Maybe' : 'Not Available'}
            </span>
            {player.user.jerseyNumber && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{player.user.jerseyNumber}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        onClick={onSelect}
        variant="ghost"
        size="icon"
        className={`rounded-full transition-colors
          ${isSelected 
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </Button>
    </div>
  )
}

const ActionButton = ({ 
  icon: Icon, 
  onClick, 
  label, 
  loading, 
  disabled 
}: { 
  icon: LucideIcon
  onClick: () => void
  label: string
  loading?: boolean
  disabled?: boolean
}) => (
  <Button
    onClick={onClick}
    variant="ghost"
    disabled={loading || disabled}
    className={`relative group inline-flex items-center justify-center w-14 h-14 rounded-xl p-0
      ${disabled 
        ? 'opacity-50' 
        : 'hover:bg-gradient-to-br hover:from-amber-500/10 hover:to-amber-600/10 dark:hover:from-amber-400/10 dark:hover:to-amber-500/10'
      }`}
  >
    {loading ? (
      <LoadingSpinner />
    ) : (
      <>
        <div className={`p-2.5 rounded-lg transition-all duration-300
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-800' 
            : 'bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40'
          }`}
        >
          <Icon className={`w-7 h-7 transition-colors duration-300
            ${disabled
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300'
            }`}
          />
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 scale-0 opacity-0 
          text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap
          group-hover:scale-100 group-hover:opacity-100 transition-all">
          {label}
        </span>
      </>
    )}
  </Button>
)

const getStatusColorClass = (status: VoteType) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'tentative':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'not_available':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

const getStatusBadgeClass = (status: VoteType) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'tentative':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'not_available':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

const SelectTeamSkeleton = () => (
  <div className="max-w-4xl mx-auto animate-pulse">
    {/* Header Skeleton */}
    <div className="fixed top-16 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="pt-40 px-4 pb-20">
      <div className="sticky top-40 z-50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
)

export default function SelectTeamPage({ params }: PageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { matchId } = use(params)
  const [match, setMatch] = useState<Match | null>(null)
  const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([])
  const [teamSelection, setTeamSelection] = useState<TeamSelection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set())
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Set<string>>(new Set())

  const fetchMatchAndVotes = useCallback(async () => {
    try {
      setIsLoading(true)
      // Fetch match
      const matchDoc = await getDoc(doc(db, 'matches', matchId))
      if (!matchDoc.exists()) {
        setError('Match not found')
        return
      }
      const matchData = { id: matchDoc.id, ...matchDoc.data() } as Match
      setMatch(matchData)

      // Fetch votes for this match
      const votesRef = collection(db, 'votes')
      const voteQuery = query(votesRef, where('matchId', '==', matchId))
      const voteSnapshot = await getDocs(voteQuery)
      
      if (!voteSnapshot.empty) {
        const voteDoc = voteSnapshot.docs[0].data() as Vote
        const userEmails = Object.keys(voteDoc.votes)

        // Query users by email instead of uid
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('email', 'in', userEmails))
        const usersSnapshot = await getDocs(userQuery)
        
        // Create a map of email to user data
        const userMap = new Map(
          usersSnapshot.docs.map(doc => [
            doc.data().email,
            {
              id: doc.id,
              ...doc.data()
            } as User
          ])
        )

        // Map votes to players
        const votes = Object.entries(voteDoc.votes).map(([email, vote]) => {
          const userData = userMap.get(email)
          if (!userData) {
            console.warn(`No user found for email: ${email}`)
            return null
          }

          return {
            user: {
              id: userData.id,
              email: userData.email,
              displayName: userData.displayName,
              role: userData.role || [],
              phoneNumber: userData.phoneNumber,
              jerseyNumber: userData.jerseyNumber
            },
            status: vote.status,
            updatedAt: vote.updatedAt
          } as PlayerVote
        })
        .filter((vote): vote is PlayerVote => vote !== null)
        .sort((a, b) => {
          const statusOrder = {
            available: 0,
            tentative: 1,
            not_available: 2
          }
          return statusOrder[a.status] - statusOrder[b.status]
        })

        setPlayerVotes(votes)
      }

      // Fetch team selection if exists
      const teamSelectionsRef = collection(db, 'teamSelections')
      const teamQuery = query(teamSelectionsRef, where('matchId', '==', matchId))
      const teamSnapshot = await getDocs(teamQuery)
      const teamData = teamSnapshot.docs[0]?.data() as TeamSelection | undefined

      if (teamData) {
        setTeamSelection(teamData)
        setSelectedStarters(new Set(teamData.starters.map(p => p.email)))
        setSelectedSubstitutes(new Set(teamData.substitutes.map(p => p.email)))
      }

    } catch (error) {
      console.error('Error fetching match:', error)
      setError('Failed to load match data')
    } finally {
      setIsLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    fetchMatchAndVotes()
  }, [fetchMatchAndVotes])

  useEffect(() => {
    if (match?.teamSelection) {
      setSelectedStarters(new Set(match.teamSelection.starters.map(p => p.email)))
      setSelectedSubstitutes(new Set(match.teamSelection.substitutes.map(p => p.email)))
    }
  }, [match?.teamSelection])

  const handlePlayerSelect = (email: string) => {
    if (selectedStarters.has(email)) {
      const newSelected = new Set(selectedStarters)
      newSelected.delete(email)
      setSelectedStarters(newSelected)
    } else if (selectedStarters.size < 11) {
      setSelectedStarters(new Set([...selectedStarters, email]))
    }
  }

  const handleSubstituteSelect = (email: string) => {
    if (selectedSubstitutes.has(email)) {
      const newSelected = new Set(selectedSubstitutes)
      newSelected.delete(email)
      setSelectedSubstitutes(newSelected)
    } else if (selectedSubstitutes.size < 5) {
      setSelectedSubstitutes(new Set([...selectedSubstitutes, email]))
    }
  }

  const validateSelection = () => {
    const duplicates = new Set(
      [...selectedStarters].filter(email => selectedSubstitutes.has(email))
    );

    if (duplicates.size > 0) {
      const duplicateNames = [...duplicates]
        .map(email => playerVotes.find(p => p.user.email === email)?.user.displayName)
        .filter(Boolean);
      
      toast.error(`Players cannot be in both starters and substitutes: ${duplicateNames.join(', ')}`);
      return false;
    }

    return true;
  }

  const saveTeamSelection = async () => {
    if (!validateSelection()) return;
    if (!match || !user) {
      toast.error('Please sign in to save team')
      return
    }

    try {
      setIsSaving(true)
      const idToken = await user.getIdToken(true)

      const teamSelection = {
        starters: Array.from(selectedStarters).map(email => {
          const player = playerVotes.find(v => v.user.email === email)!
          return {
            email: player.user.email,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'starter' as const
          }
        }),
        substitutes: Array.from(selectedSubstitutes).map(email => {
          const player = playerVotes.find(v => v.user.email === email)!
          return {
            email: player.user.email,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'substitute' as const
          }
        })
      }

      const response = await fetch(`/api/matches/${match.id}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          action: 'save',
          teamSelection 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server response:', errorData) // Debug log
        throw new Error(errorData.error || 'Failed to save team selection')
      }

      toast.success('Team saved successfully')
    } catch (error) {
      console.error('Error saving team selection:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save team selection')
    } finally {
      setIsSaving(false)
    }
  }

  const publishTeam = async () => {
    if (!match || !user) {
      toast.error('Please sign in to publish team')
      return
    }

    if (!user.roles?.includes('Selector')) {
      toast.error('You are not authorized to publish team')
      return
    }

    // Validate team selection
    if (selectedStarters.size !== 11) {
      toast.error('Please select exactly 11 starters')
      return
    }

    if (selectedSubstitutes.size > 5) {
      toast.error('Maximum 5 substitutes allowed')
      return
    }

    if (!validateSelection()) return;

    try {
      setIsPublishing(true)
      const idToken = await user.getIdToken()

      // Include the current team selection in the publish request
      const teamSelection = {
        starters: Array.from(selectedStarters).map(email => {
          const player = playerVotes.find(v => v.user.email === email)!
          return {
            email: player.user.email,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'starter' as const
          }
        }),
        substitutes: Array.from(selectedSubstitutes).map(email => {
          const player = playerVotes.find(v => v.user.email === email)!
          return {
            email: player.user.email,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'substitute' as const
          }
        })
      }

      const response = await fetch(`/api/matches/${match.id}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          action: 'publish',
          teamSelection // Include the team selection
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to publish team')
      }

      // Update local state
      setMatch(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: 'team-announced'
        }
      })

      toast.success('Team published successfully')
    } catch (error) {
      console.error('Error publishing team:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to publish team')
    } finally {
      setIsPublishing(false)
    }
  }

  const recallTeam = async () => {
    if (!match || !user) {
      toast.error('Please sign in to recall team')
      return
    }

    // Check if user has selector role
    if (!user.roles?.includes('Selector')) {
      toast.error('You are not authorized to recall team')
      return
    }

    try {
      setIsPublishing(true)
      const idToken = await user.getIdToken(true) // Force refresh token

      const response = await fetch(`/api/matches/${match.id}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ action: 'recall' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to recall team')
      }

      // Update local state
      setMatch(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: 'voting'
        }
      })

      toast.success('Team announcement recalled')
    } catch (error) {
      console.error('Error recalling team:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to recall team')
    } finally {
      setIsPublishing(false)
    }
  }

  const renderPlayerList = (type: 'starters' | 'substitutes') => {
    const availablePlayers = playerVotes.filter(vote => {
      const isAvailable = vote.status === 'available' || vote.status === 'tentative';
      const isInStarters = selectedStarters.has(vote.user.email);
      const isInSubs = selectedSubstitutes.has(vote.user.email);
      
      if (type === 'starters') {
        return isAvailable && !isInSubs; // Don't show players in subs
      } else {
        return isAvailable && !isInStarters; // Don't show players in starters
      }
    }).sort((a, b) => {
      // Sort available players first, then tentative
      if (a.status === 'available' && b.status === 'tentative') return -1;
      if (a.status === 'tentative' && b.status === 'available') return 1;
      return a.user.displayName.localeCompare(b.user.displayName);
    });

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {type === 'starters' ? 'Starting XI' : 'Substitutes'} List
        </h2>
        
        {availablePlayers.map(player => (
          <PlayerCard
            key={player.user.email}
            player={player}
            isSelected={type === 'starters' 
              ? selectedStarters.has(player.user.email) 
              : selectedSubstitutes.has(player.user.email)}
            onSelect={() => {
              if (type === 'starters') {
                handlePlayerSelect(player.user.email);
              } else {
                handleSubstituteSelect(player.user.email);
              }
            }}
          />
        ))}
      </div>
    );
  }

  useEffect(() => {
    if (user && !user.roles?.includes('Selector')) {
      toast.error('You are not authorized to access this page')
      router.push('/')
      return
    }
  }, [user, router])

  useEffect(() => {
    async function fetchData() {
      try {
        const idToken = await user?.getIdToken()
        const response = await fetch(`/api/selector/matches/${matchId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        })
        // ...
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }, [user])

  if (authLoading || isLoading) {
    return <SelectTeamSkeleton />
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please sign in to access this page
        </p>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className={iconStyles.selectTeam.back.container} />
            Back to Matches
          </button>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400">
          {error || 'Match not found'}
        </p>
      </div>
    )
  }

  const getStatusIcon = (status: VoteType) => {
    switch (status) {
      case 'available':
        return <Check className="w-5 h-5 text-green-500" />
      case 'not_available':
        return <X className="w-5 h-5 text-red-500" />
      case 'tentative':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return format(date, 'MMM d, yyyy h:mm a')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const handleBack = () => {
    router.back()
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles}`}>
        {statusText}
      </span>
    )
  }

  const formatTeamForWhatsApp = (match: Match, starters: Set<string>, subs: Set<string>, playerVotes: PlayerVote[]) => {
    const getPlayerName = (email: string) => {
      const player = playerVotes.find(p => p.user.email === email)
      return player ? `${player.user.displayName}${player.user.jerseyNumber ? ` (${player.user.jerseyNumber})` : ''}` : 'Unknown'
    }

    return `*${match.homeTeam} vs ${match.awayTeam}*
${match.tournamentName}

*Starting XI:*
${Array.from(starters).map((email, i) => `${i + 1}. ${getPlayerName(email)}`).join('\n')}

*Substitutes:*
${Array.from(subs).map((email, i) => `${i + 1}. ${getPlayerName(email)}`).join('\n')}`
  }

  const formatMatchDate = (date: string | { seconds: number }) => {
    try {
      const dateObj = typeof date === 'string' 
        ? new Date(date) 
        : new Date(date.seconds * 1000)
      
      return format(dateObj, 'PPP')
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="fixed top-16 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </button>
            <div className="flex items-center gap-3">
              <ActionButton
                icon={Share2}
                onClick={() => {
                  const text = formatTeamForWhatsApp(match, selectedStarters, selectedSubstitutes, playerVotes)
                  navigator.clipboard.writeText(text)
                  toast.success('Team list copied to clipboard')
                }}
                label="Export"
              />
              <ActionButton
                icon={Save}
                onClick={saveTeamSelection}
                label="Save"
                loading={isSaving}
              />
              {match.status === 'team-announced' ? (
                <ActionButton
                  icon={RotateCcw}
                  onClick={recallTeam}
                  label="Recall"
                  loading={isPublishing}
                />
              ) : (
                <ActionButton
                  icon={Send}
                  onClick={publishTeam}
                  label="Publish"
                  loading={isPublishing}
                />
              )}
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {match?.homeTeam} vs {match?.awayTeam}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span>{match?.tournamentName}</span>
                <span>•</span>
                <span>{formatMatchDate(match?.date)}</span>
              </div>
            </div>
            {getStatusTag(match.status)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-40 px-4 pb-20">
        <Tabs defaultValue="starters" className="w-full">
          <div className="sticky top-40 z-50">
            <TabsList className="grid grid-cols-2 gap-4 bg-transparent p-0 m-0 h-auto">
              <TabsTrigger 
                value="starters" 
                className="relative py-4 px-6 rounded-t-xl transition-colors duration-200
                           [&[data-state=active]]:bg-amber-500/10 dark:[&[data-state=active]]:bg-amber-900/20
                           [&[data-state=active]]:border-2 [&[data-state=active]]:border-amber-500/50
                           [&[data-state=active]]:border-b-0
                           [&[data-state=inactive]]:bg-gray-100/80 dark:[&[data-state=inactive]]:bg-gray-900/50
                           hover:bg-gray-50 dark:hover:bg-gray-800/80
                           z-10"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    "[&[data-state=active]]" 
                      ? 'bg-amber-500/20 dark:bg-amber-400/20 scale-110' 
                      : 'bg-gray-200/50 dark:bg-gray-700/50'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      "[&[data-state=active]]" 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-medium ${
                      "[&[data-state=active]]" 
                        ? 'text-amber-500 dark:text-amber-400 scale-105' 
                        : 'text-gray-700 dark:text-gray-400'
                    }`}>Starters</span>
                    <span className={`text-sm ${
                      "[&[data-state=active]]" 
                        ? 'text-amber-400/90 dark:text-amber-400/90' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      ({selectedStarters.size}/11)
                    </span>
                  </div>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="substitutes"
                className="relative py-4 px-6 rounded-t-xl transition-colors duration-200
                           [&[data-state=active]]:bg-amber-500/10 dark:[&[data-state=active]]:bg-amber-900/20
                           [&[data-state=active]]:border-2 [&[data-state=active]]:border-amber-500/50
                           [&[data-state=active]]:border-b-0
                           [&[data-state=inactive]]:bg-gray-100/80 dark:[&[data-state=inactive]]:bg-gray-900/50
                           hover:bg-gray-50 dark:hover:bg-gray-800/80
                           z-10"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    "[&[data-state=active]]" ? 'bg-amber-500/20 dark:bg-amber-400/20 scale-110' : 'bg-gray-200/50 dark:bg-gray-700/50'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      "[&[data-state=active]]" ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-medium ${
                      "[&[data-state=active]]" ? 'text-amber-500 dark:text-amber-400 scale-105' : 'text-gray-700 dark:text-gray-400'
                    }`}>Subs</span>
                    <span className={`text-sm ${
                      "[&[data-state=active]]" ? 'text-amber-400/90 dark:text-amber-400/90' : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      ({selectedSubstitutes.size}/5)
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <TabsContent 
                value="starters" 
                className="m-0 animate-none"
              >
                <div className="bg-amber-500/10 dark:bg-amber-900/20 border-2 border-amber-500/50 
                                rounded-b-xl rounded-tr-xl p-6">
                  <div className="grid gap-3">
                    {renderPlayerList('starters')}
                  </div>
                </div>
              </TabsContent>

              <TabsContent 
                value="substitutes" 
                className="m-0 animate-none"
              >
                <div className="bg-amber-500/10 dark:bg-amber-900/20 border-2 border-amber-500/50 
                                rounded-b-xl rounded-tr-xl p-6">
                  <div className="grid gap-3">
                    {renderPlayerList('substitutes')}
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 