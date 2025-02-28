'use client'

import { Match } from '@/types/match'
import { format } from 'date-fns'

interface MatchPaymentSummaryProps {
  match: Match
}

export function MatchPaymentSummary({ match }: MatchPaymentSummaryProps) {
  return (
    <div className="bg-gray-900 p-6 rounded-lg mb-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-xl font-semibold">
          {match.homeTeam} vs {match.awayTeam}
        </h1>
        <p className="text-gray-400">
          {format(new Date(match.date), 'MMMM do, yyyy')}
        </p>
      </div>
    </div>
  )
} 