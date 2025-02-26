'use client'

import Link from 'next/link'
import { Calendar, MapPin, Clock, Check, X, HelpCircle } from 'lucide-react'
import { Match } from '@/types/match'
import { format, parseISO } from 'date-fns'

interface MatchCardProps {
  match: Match
  href: string
}

interface VoteSummary {
  available: number
  not_available: number
  tentative: number
  total: number
}

export function MatchCard({ match, href }: MatchCardProps) {
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
    <Link
      href={href}
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
          {getStatusTag(match.status)}
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
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4 mr-1" />
                      {summary.available}
                    </div>
                    <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                      <HelpCircle className="w-4 h-4 mr-1" />
                      {summary.tentative}
                    </div>
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
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
  )
} 