'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match, VoteStatus, SelectedPlayer, TeamSelection } from '@/types/match'
import { User } from '@/types/user'
import { Check, X, HelpCircle, ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

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
  const [selectionMode, setSelectionMode] = useState<'starters' | 'substitutes'>('starters')
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set())
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const fetchMatchAndVotes = async () => {
      if (!matchId) return

      try {
        const matchDoc = await getDoc(doc(db, 'matches', matchId))
        if (!matchDoc.exists()) {
          setError('Match not found')
          return
        }
        
        const matchData = { id: matchDoc.id, ...matchDoc.data() } as Match
        setMatch(matchData)

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
        console.error('Error fetching match and votes:', error)
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

      setHasUnsavedChanges(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving team selection:', error)
      setError('Failed to save team selection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleModeChange = useCallback((newMode: 'starters' | 'substitutes') => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Would you like to save before continuing?')
      if (confirm) {
        saveTeamSelection().then(() => {
          setSelectionMode(newMode)
        })
      } else {
        setSelectionMode(newMode)
      }
    } else {
      setSelectionMode(newMode)
    }
  }, [hasUnsavedChanges, saveTeamSelection])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

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
            <ArrowLeft className="w-5 h-5 mr-2" />
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
    if (selectionMode === 'starters') {
      setSelectedStarters(prev => {
        const next = new Set(prev)
        if (next.has(playerId)) {
          next.delete(playerId)
        } else {
          next.add(playerId)
        }
        return next
      })
    } else {
      setSelectedSubstitutes(prev => {
        const next = new Set(prev)
        if (next.has(playerId)) {
          next.delete(playerId)
        } else {
          next.add(playerId)
        }
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
        (selectionMode === 'starters' || !selectedStarters.has(vote.user.id))
      )
      .sort((a, b) => {
        // Sort available players first, then tentative
        if (a.status === 'available' && b.status === 'tentative') return -1
        if (a.status === 'tentative' && b.status === 'available') return 1
        // Then sort by name
        return a.user.displayName.localeCompare(b.user.displayName)
      })
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

      setSelectedStarters(new Set())
      setSelectedSubstitutes(new Set())
      router.refresh()
    } catch (error) {
      console.error('Error publishing team:', error)
      setError('Failed to publish team')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirm) return
    }
    router.back()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Matches
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {match.homeTeam} vs {match.awayTeam}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {match.tournamentName}
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Team Selection
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {match?.status === 'team-announced' ? (
                  <span className="text-green-600 dark:text-green-400">Team Published</span>
                ) : selectionMode === 'starters' ? (
                  'Step 1: Select Starters'
                ) : (
                  'Step 2: Select Substitutes'
                )}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected Starters: {selectedStarters.size}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected Substitutes: {selectedSubstitutes.size}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2 min-w-[160px]">
              {hasUnsavedChanges && (
                <button
                  onClick={saveTeamSelection}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-full justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}

              {selectionMode === 'starters' ? (
                <button
                  onClick={() => handleModeChange('substitutes')}
                  disabled={selectedStarters.size === 0}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-full justify-center"
                >
                  <span>Select Sub&apos;s</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 ml-2" />
                </button>
              ) : (
                <>
                  {match?.teamSelection && !hasUnsavedChanges && match.status !== 'team-announced' && (
                    <button
                      onClick={publishTeam}
                      disabled={isPublishing}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-full justify-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isPublishing ? 'Publishing...' : 'Publish Team'}
                    </button>
                  )}
                  <button
                    onClick={() => handleModeChange('starters')}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 w-full justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Starters
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectionMode === 'starters' ? 'Select Starters' : 'Select Substitutes'} ({getAvailablePlayers().length})
          </h2>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {getAvailablePlayers().map((vote) => (
              <div
                key={vote.user.id}
                className={`py-3 flex items-center justify-between ${
                  vote.status === 'tentative' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={
                      selectionMode === 'starters' 
                        ? selectedStarters.has(vote.user.id)
                        : selectedSubstitutes.has(vote.user.id)
                    }
                    onChange={() => handlePlayerToggle(vote.user.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {vote.user.displayName}
                        {vote.user.jerseyNumber && ` (${vote.user.jerseyNumber})`}
                      </p>
                      {vote.status === 'tentative' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Tentative
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Last updated: {formatDateTime(vote.updatedAt)}
                    </p>
                  </div>
                </div>
                {(selectedStarters.has(vote.user.id) || selectedSubstitutes.has(vote.user.id)) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedStarters.has(vote.user.id) ? 'Starter' : 'Substitute'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Show not available players in a separate section */}
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Not Available Players ({playerVotes.filter(v => v.status === 'not_available').length})
            </h2>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {playerVotes
                .filter(vote => vote.status === 'not_available')
                .map((vote) => (
                  <div
                    key={vote.user.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {vote.user.displayName}
                        {vote.user.jerseyNumber && ` (${vote.user.jerseyNumber})`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {formatDateTime(vote.updatedAt)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getStatusIcon(vote.status)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
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