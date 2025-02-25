'use client'

import { useEffect, useState, use } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match, VoteStatus } from '@/types/match'
import { User } from '@/types/user'
import { Check, X, HelpCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PlayerVote {
  user: User
  status: VoteStatus
  updatedAt: string
}

interface PageProps {
  params: Promise<{ matchId: string }>
}

export default function SelectTeamPage({ params }: PageProps) {
  const router = useRouter()
  const { matchId } = use(params)
  const [match, setMatch] = useState<Match | null>(null)
  const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                  id: userDoc.id, // This will be the email
                  email: userData.email,
                  displayName: userData.displayName,
                  roles: userData.roles || [],
                  phoneNumber: userData.phoneNumber,
                  jerseyNumber: userData.jerseyNumber,
                  uid: userData.uid // Store the uid as well
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

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {match.homeTeam} vs {match.awayTeam}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {match.tournamentName}
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Player Responses ({playerVotes.length})
          </h2>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {playerVotes.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 py-4 text-center">
                No responses yet
              </p>
            ) : (
              playerVotes.map((vote) => (
                <div
                  key={vote.user.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {vote.user.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(vote.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(vote.status)}
                  </div>
                </div>
              ))
            )}
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