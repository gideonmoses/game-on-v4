'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match, VoteStatus, SelectedPlayer, TeamSelection } from '@/types/match'
import { User } from '@/types/user'
import { Check, X, HelpCircle, ArrowLeft, Save, Send, RotateCcw, Users, UserPlus, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { iconStyles } from '@/styles/iconStyles'

interface PlayerVote {
  user: User
  status: VoteStatus
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

export default function SelectTeamPage({ params }: PageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { matchId } = use(params)
  const [match, setMatch] = useState<Match | null>(null)
  const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set())
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const fetchMatchAndVotes = async () => {
      try {
        setIsLoading(true)
        const matchDoc = await getDoc(doc(db, 'matches', matchId))
        if (!matchDoc.exists()) {
          setError('Match not found')
          return
        }

        const matchData = matchDoc.data() as Match
        setMatch(matchData)

        // If there's a team selection, set the initial selections
        if (matchData.teamSelection) {
          const starterIds = new Set(matchData.teamSelection.starters.map(p => p.userId))
          const subIds = new Set(matchData.teamSelection.substitutes.map(p => p.userId))
          setSelectedStarters(starterIds)
          setSelectedSubstitutes(subIds)
        }

        if (matchData.votes) {
          const userIds = Object.keys(matchData.votes)
          
          const userPromises = userIds.map(async (uid) => {
            try {
              // Query users collection by uid field
              const usersRef = collection(db, 'users')
              const q = query(usersRef, where('uid', '==', uid))
              const querySnapshot = await getDocs(q)
              
              if (querySnapshot.empty) {
                console.warn(`No user found with uid: ${uid}`)
                return null
              }

              const userDoc = querySnapshot.docs[0]
              const userData = userDoc.data()
              const userVote = matchData.votes![uid]
              
              return {
                user: {
                  id: userDoc.id,
                  email: userData.email,
                  displayName: userData.displayName,
                  role: userData.roles || [],
                  phoneNumber: userData.phoneNumber,
                  jerseyNumber: userData.jerseyNumber
                },
                status: userVote.status,
                updatedAt: userVote.updatedAt
              } as PlayerVote
            } catch (err) {
              console.error(`Error fetching user ${uid}:`, err)
              return null
            }
          })

          const results = await Promise.all(userPromises)
          const validVotes = results
            .filter((vote): vote is PlayerVote => vote !== null)
            .sort((a, b) => {
              const statusOrder = {
                available: 0,
                tentative: 1,
                not_available: 2
              }
              return statusOrder[a.status] - statusOrder[b.status]
            })

          setPlayerVotes(validVotes)
        }
      } catch (error) {
        console.error('Error fetching match:', error)
        setError('Failed to load match data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatchAndVotes()
  }, [matchId])

  useEffect(() => {
    if (match?.teamSelection) {
      setSelectedStarters(new Set(match.teamSelection.starters.map(p => p.userId)))
      setSelectedSubstitutes(new Set(match.teamSelection.substitutes.map(p => p.userId)))
      setHasUnsavedChanges(false)
    }
  }, [match?.teamSelection])

  useEffect(() => {
    if (match?.teamSelection) {
      const startersChanged = !setsAreEqual(
        new Set(match.teamSelection.starters.map(p => p.userId)),
        selectedStarters
      )
      const subsChanged = !setsAreEqual(
        new Set(match.teamSelection.substitutes.map(p => p.userId)),
        selectedSubstitutes
      )
      setHasUnsavedChanges(startersChanged || subsChanged)
    } else {
      setHasUnsavedChanges(selectedStarters.size > 0 || selectedSubstitutes.size > 0)
    }
  }, [selectedStarters, selectedSubstitutes, match?.teamSelection])

  const setsAreEqual = (a: Set<string>, b: Set<string>) => {
    return a.size === b.size && [...a].every(value => b.has(value))
  }

  const saveTeamSelection = async () => {
    if (!match || !user) return

    try {
      setIsSaving(true)
      const idToken = await user.getIdToken()
      const teamSelection = {
        starters: Array.from(selectedStarters).map(id => {
          const player = playerVotes.find(v => v.user.id === id)!
          return {
            userId: player.user.id,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'starter' as const
          }
        }),
        substitutes: Array.from(selectedSubstitutes).map(id => {
          const player = playerVotes.find(v => v.user.id === id)!
          return {
            userId: player.user.id,
            displayName: player.user.displayName,
            jerseyNumber: player.user.jerseyNumber,
            role: 'substitute' as const
          }
        })
      }

      const response = await fetch(`/api/matches/${matchId}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(teamSelection)
      })

      if (!response.ok) {
        throw new Error('Failed to save team selection')
      }

      // Update local match state with team-selected status
      setMatch(prev => prev ? { ...prev, status: 'team-selected' } : null)
      setHasUnsavedChanges(false)
      toast.success('Team saved successfully')
    } catch (error) {
      console.error('Error saving team selection:', error)
      toast.error('Failed to save team selection')
    } finally {
      setIsSaving(false)
    }
  }

  const publishTeam = async () => {
    if (!match || !user) return

    try {
      setIsPublishing(true)
      const idToken = await user.getIdToken()
      
      const response = await fetch(`/api/matches/${matchId}/team`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to publish team')
      }

      // Update local match state with team-announced status
      setMatch(prev => prev ? { ...prev, status: 'team-announced' } : null)
      toast.success('Team published successfully')
    } catch (error) {
      console.error('Error publishing team:', error)
      toast.error('Failed to publish team')
    } finally {
      setIsPublishing(false)
    }
  }

  const unpublishTeam = async () => {
    if (!match || !user) return

    try {
      setIsPublishing(true)
      const idToken = await user.getIdToken()
      
      const response = await fetch(`/api/matches/${matchId}/team`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to unpublish team')
      }

      // Update local match state with voting status
      setMatch(prev => prev ? { ...prev, status: 'voting' } : null)
      toast.success('Team unpublished successfully')
    } catch (error) {
      console.error('Error unpublishing team:', error)
      toast.error('Failed to unpublish team')
    } finally {
      setIsPublishing(false)
    }
  }

  const renderPlayerList = (type: 'starters' | 'substitutes') => {
    const availablePlayers = playerVotes.filter(vote => 
      (vote.status === 'available' || vote.status === 'tentative') &&
      // For substitutes, exclude players already selected as starters
      (type === 'starters' || !selectedStarters.has(vote.user.id))
    ).sort((a, b) => {
      // Sort available players first, then tentative
      if (a.status === 'available' && b.status === 'tentative') return -1
      if (a.status === 'tentative' && b.status === 'available') return 1
      // Then sort by name
      return a.user.displayName.localeCompare(b.user.displayName)
    })

    const selectedPlayers = type === 'starters' ? selectedStarters : selectedSubstitutes
    const setSelectedPlayers = type === 'starters' ? setSelectedStarters : setSelectedSubstitutes
    const maxPlayers = type === 'starters' ? 11 : 5

    const handlePlayerSelect = (playerId: string) => {
      setSelectedPlayers(prev => {
        const next = new Set(prev)
        if (next.has(playerId)) {
          next.delete(playerId)
        } else if (next.size < maxPlayers) {
          next.add(playerId)
        } else {
          toast.error(`Can only select ${maxPlayers} ${type}`)
          return prev
        }
        setHasUnsavedChanges(true)
        return next
      })
    }

    return (
      <div className="space-y-3">
        {availablePlayers.map(player => (
          <div 
            key={player.user.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base font-medium">
                {player.user.displayName.charAt(0)}
              </div>
              <div>
                <div className="font-medium">
                  {player.user.displayName}
                </div>
                <div className={`text-sm ${
                  player.status === 'available' 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {player.status === 'available' ? 'Available' : 'Tentative'}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlayerSelect(player.user.id)}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full p-0"
            >
              <div className={`
                p-2 rounded-full transition-all duration-300
                ${selectedPlayers.has(player.user.id) 
                  ? iconStyles.selectTeam.player.selected.container
                  : iconStyles.selectTeam.player.unselected.container
                }
              `}>
                {selectedPlayers.has(player.user.id) ? (
                  <Check className={`w-6 h-6 ${iconStyles.selectTeam.player.selected.default}`} />
                ) : (
                  <UserPlus className={`w-6 h-6 ${iconStyles.selectTeam.player.unselected.default}`} />
                )}
              </div>
            </Button>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return <SelectTeamSkeleton />
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

  const getStatusIcon = (status: VoteStatus) => {
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

  const handlePlayerToggle = (playerId: string) => {
    if (selectedStarters.has(playerId)) {
      setSelectedStarters(prev => {
        const next = new Set(prev)
        next.delete(playerId)
        return next
      })
    } else {
      setSelectedStarters(prev => {
        const next = new Set(prev)
        next.add(playerId)
        return next
      })
    }
  }

  const getAvailablePlayers = () => {
    return playerVotes
      .filter(vote => 
        // Include both available and tentative players
        (vote.status === 'available' || vote.status === 'tentative') &&
        // In substitutes mode, exclude players already selected as starters
        !selectedStarters.has(vote.user.id)
      )
      .sort((a, b) => {
        // Sort available players first, then tentative
        if (a.status === 'available' && b.status === 'tentative') return -1
        if (a.status === 'tentative' && b.status === 'available') return 1
        // Then sort by name
        return a.user.displayName.localeCompare(b.user.displayName)
      })
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirm) return
    }
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
    const getPlayerName = (id: string) => {
      const player = playerVotes.find(p => p.user.id === id)
      return player ? `${player.user.displayName}${player.user.jerseyNumber ? ` (${player.user.jerseyNumber})` : ''}` : 'Unknown'
    }

    return `*${match.homeTeam} vs ${match.awayTeam}*
${match.tournamentName}

*Starting XI:*
${Array.from(starters).map((id, i) => `${i + 1}. ${getPlayerName(id)}`).join('\n')}

*Substitutes:*
${Array.from(subs).map((id, i) => `${i + 1}. ${getPlayerName(id)}`).join('\n')}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-40">
        <div className="max-w-4xl mx-auto px-4 py-1.5">
          {/* Title and Tournament section */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {match?.homeTeam} vs {match?.awayTeam}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {match?.tournamentName}
              </p>
            </div>
            {getStatusTag(match.status)}
          </div>
          
          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className={`p-1.5 rounded-lg ${iconStyles.selectTeam.back.container}`}>
                <ArrowLeft className={`w-6 h-6 ${iconStyles.selectTeam.back.default}`} />
              </div>
            </button>

            <div className="flex-1 flex justify-end gap-2">
              <Button
                onClick={() => {
                  const text = formatTeamForWhatsApp(match, selectedStarters, selectedSubstitutes, playerVotes)
                  navigator.clipboard.writeText(text)
                  toast.success('Team list copied to clipboard')
                }}
                variant="ghost"
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl p-0 border-0"
                title="Export Team"
              >
                <div className={`p-2.5 rounded-lg ${iconStyles.selectTeam.export.container}`}>
                  <Share2 className={`w-7 h-7 ${iconStyles.selectTeam.export.default}`} />
                </div>
              </Button>

              <Button
                onClick={saveTeamSelection}
                variant="ghost"
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl p-0 border-0"
                title="Save"
              >
                {isSaving ? (
                  <LoadingSpinner />
                ) : (
                  <div className={`p-2.5 rounded-lg ${iconStyles.selectTeam.save.container}`}>
                    <Save className={`w-7 h-7 ${iconStyles.selectTeam.save.default}`} />
                  </div>
                )}
              </Button>

              <Button
                onClick={publishTeam}
                variant="ghost"
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl p-0 border-0"
                title="Publish Team"
              >
                {isPublishing ? (
                  <LoadingSpinner />
                ) : (
                  <div className={`p-2.5 rounded-lg ${iconStyles.selectTeam.publish.container}`}>
                    <Send className={`w-7 h-7 ${iconStyles.selectTeam.publish.default}`} />
                  </div>
                )}
              </Button>

              <Button
                onClick={unpublishTeam}
                variant="ghost"
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl p-0 border-0"
                title="Unpublish Team"
              >
                {isPublishing ? (
                  <LoadingSpinner />
                ) : (
                  <div className={`p-2.5 rounded-lg ${iconStyles.selectTeam.unpublish.container}`}>
                    <RotateCcw className={`w-7 h-7 ${iconStyles.selectTeam.unpublish.default}`} />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Increase top padding to show tabs */}
      <div className="pt-32 px-4 pb-20">
        <Tabs defaultValue="starters" className="w-full">
          <TabsList className="grid grid-cols-2 gap-2 bg-transparent p-2 rounded-xl sticky top-32 z-30">
            <TabsTrigger 
              value="starters" 
              className="relative py-3 px-4 rounded-lg transition-all duration-200
                         data-[state=active]:bg-transparent
                         hover:bg-gray-50/5 dark:hover:bg-gray-800/5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                  "data-[state=active]" 
                    ? iconStyles.selectTeam.tab.container.active 
                    : iconStyles.selectTeam.tab.container.inactive
                }`}>
                  <Users className={`w-6 h-6 ${
                    "data-[state=active]" 
                      ? iconStyles.selectTeam.tab.default.active 
                      : iconStyles.selectTeam.tab.default.inactive
                  }`} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`font-medium ${
                    "data-[state=active]" ? 'text-amber-500 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>Starters</span>
                  <span className={`text-sm ${
                    "data-[state=active]" ? 'text-amber-400 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    ({selectedStarters.size}/11)
                  </span>
                </div>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="substitutes"
              className="relative py-3 px-4 rounded-lg transition-all duration-200
                         data-[state=active]:bg-transparent
                         hover:bg-gray-50 dark:hover:bg-gray-800/5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                  "data-[state=active]" ? iconStyles.selectTeam.tab.container.active : iconStyles.selectTeam.tab.container.inactive
                }`}>
                  <Users className={`w-6 h-6 ${
                    "data-[state=active]" ? iconStyles.selectTeam.tab.default.active : iconStyles.selectTeam.tab.default.inactive
                  }`} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`font-medium ${
                    "data-[state=active]" ? 'text-amber-500 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>Subs</span>
                  <span className={`text-sm ${
                    "data-[state=active]" ? 'text-amber-400 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    ({selectedSubstitutes.size}/5)
                  </span>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Player Lists */}
          <TabsContent value="starters" className="mt-4">
            {renderPlayerList('starters')}
          </TabsContent>

          <TabsContent value="substitutes" className="mt-4">
            {renderPlayerList('substitutes')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SelectTeamSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
} 