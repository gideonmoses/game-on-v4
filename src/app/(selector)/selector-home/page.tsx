'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase-config'
import { Match } from '@/types/match'
import { MatchCard } from '@/components/matches/MatchCard'

export default function SelectorHomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Create a Firestore timestamp for now
        const now = Timestamp.now()
        const matchesRef = collection(db, 'matches')
        
        // First get all matches and filter client-side
        const matchQuery = query(
          matchesRef,
          orderBy('date', 'asc')
        )
        
        const querySnapshot = await getDocs(matchQuery)
        const matchData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[]

        // Filter future matches client-side
        const futureMatches = matchData.filter(match => {
          // Handle both string dates and Firestore timestamps
          if (typeof match.date === 'string') {
            return new Date(match.date) >= new Date()
          }
          // Handle Firestore timestamp
          if ('seconds' in match.date) {
            return match.date.seconds >= now.seconds
          }
          return false
        })

        setMatches(futureMatches)
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-blue-600" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            No Upcoming Matches
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            There are no matches scheduled for the future.
          </p>
        </div>
      </div>
    )
  }

  // Add getStatusTag helper function
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Upcoming Matches
      </h1>
      
      <div className="space-y-4">
        {matches.map(match => (
          <div key={match.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {match.tournamentName}
                </p>
              </div>
              {getStatusTag(match.status)}
            </div>

            <MatchCard 
              match={match}
              href={`/select-team/${match.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 