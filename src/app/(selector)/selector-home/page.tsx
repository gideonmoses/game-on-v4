'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match } from '@/types/match'
import Link from 'next/link'
import { Calendar, MapPin, Clock, Check, X, HelpCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface VoteSummary {
  available: number
  not_available: number
  tentative: number
  total: number
}

export default function SelectorHomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesRef = collection(db, 'matches')
        const matchQuery = query(
          matchesRef,
          where('status', '==', 'voting')
        )
        
        const querySnapshot = await getDocs(matchQuery)
        const matchesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[]

        setMatches(matchesData)
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const formatMatchDate = (date: string | { seconds: number }) => {
    try {
      if (typeof date === 'string') {
        return format(parseISO(date), 'PPP')
      } else if (typeof date === 'object' && 'seconds' in date) {
        return format(new Date(date.seconds * 1000), 'PPP')
      }
      return 'Invalid date'
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const getVoteSummary = (votes: Match['votes']): VoteSummary => {
    if (!votes) return { available: 0, not_available: 0, tentative: 0, total: 0 }
    
    const summary = Object.values(votes).reduce((acc, vote) => {
      acc[vote.status]++
      acc.total++
      return acc
    }, {
      available: 0,
      not_available: 0,
      tentative: 0,
      total: 0
    } as VoteSummary)

    return summary
  }

  if (isLoading) {
    return <MatchListSkeleton />
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Open for Selection
      </h1>

      {matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No matches currently open for selection
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/select-team/${match.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {match.homeTeam} vs {match.awayTeam}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {match.tournamentName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatMatchDate(match.date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      {match.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {match.venue}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    {(() => {
                      const summary = getVoteSummary(match.votes)
                      return (
                        <>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {summary.total} Responses
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center text-sm text-green-600">
                              <Check className="w-4 h-4 mr-1" />
                              {summary.available}
                            </div>
                            <div className="flex items-center text-sm text-yellow-600">
                              <HelpCircle className="w-4 h-4 mr-1" />
                              {summary.tentative}
                            </div>
                            <div className="flex items-center text-sm text-red-600">
                              <X className="w-4 h-4 mr-1" />
                              {summary.not_available}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchListSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 