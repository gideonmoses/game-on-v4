'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match } from '@/types/match'
import { Vote, VoteType } from '@/types/vote'
import { MapPin, Clock, Check, HelpCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface VoteSummary {
  available: number;
  tentative: number;
  not_available: number;
  total: number;
}

const VoteStatusIndicator = ({ status }: { status: VoteType | null }) => {
  if (!status) return (
    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 
      flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm z-20">
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
    <div className={`absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 rounded-full ${config.outerBg} 
      flex items-center justify-center border-2 border-white dark:border-gray-800 ${config.glow} z-20`}>
      <div className={`w-4 h-4 rounded-full ${config.innerBg}`} />
    </div>
  )
}

export default function SelectorHomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  const fetchMatches = async () => {
    try {
      setIsLoading(true)
      const matchesRef = collection(db, 'matches')
      const matchesSnapshot = await getDocs(matchesRef)
      
      console.log('Fetching all matches...')
      const matchesData = matchesSnapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
          }
        })
        .filter(match => {
          const matchDate = new Date(match.date)
          const now = new Date()
          return matchDate >= now
        })
        .sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        }) as Match[]

      console.log('Found matches:', matchesData.length)
      setMatches(matchesData)

      if (matchesData.length > 0) {
        const votesRef = collection(db, 'votes')
        const votesSnapshot = await getDocs(votesRef)
        const votesData = votesSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data() as Vote
          if (matchesData.some(m => m.id === data.matchId)) {
            acc[data.matchId] = {
              ...data,
              id: doc.id,
              votes: data.votes || {}
            }
          }
          return acc
        }, {} as Record<string, Vote>)

        console.log('Found votes:', Object.keys(votesData).length)
        setVotes(votesData)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && !user.roles?.includes('Selector')) {
      toast.error('You are not authorized to access this page')
      router.push('/')
      return
    }
  }, [user, router])

  useEffect(() => {
    fetchMatches()
  }, [])

  const formatMatchDate = (date: string) => {
    try {
      return format(new Date(date), 'PPP')
    } catch {
      return 'Invalid date'
    }
  }

  const getUserVote = (matchId: string): VoteType | null => {
    if (!user?.email) return null
    const matchVotes = votes[matchId]?.votes || {}
    return matchVotes[user.email]?.status || null
  }

  const getVoteSummary = (votes: Record<string, { status: string }>) => {
    const summary = {
      available: 0,
      tentative: 0,
      not_available: 0,
      total: Object.keys(votes).length
    }

    Object.values(votes).forEach(vote => {
      summary[vote.status as keyof typeof summary]++
    })

    return summary
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No upcoming matches found
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-4">Select Team for matches</h2>
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            onClick={() => router.push(`/select-team/${match.id}`)}
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="absolute inset-0 overflow-visible">
              <VoteStatusIndicator status={getUserVote(match.id)} />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                      {formatMatchDate(match.date)} at {match.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                      {match.venue}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    match.status === 'team-announced' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : match.status === 'team-selected'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {match.status === 'team-announced' 
                      ? 'Team Announced' 
                      : match.status === 'team-selected'
                      ? 'Team Selected'
                      : 'Voting Open'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getVoteSummary(votes[match.id]?.votes || {}).available}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getVoteSummary(votes[match.id]?.votes || {}).tentative}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getVoteSummary(votes[match.id]?.votes || {}).not_available}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  of {getVoteSummary(votes[match.id]?.votes || {}).total}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 