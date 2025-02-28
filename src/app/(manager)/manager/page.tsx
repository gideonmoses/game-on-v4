'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Match } from '@/types/match'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function ManagerHomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatches() {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/manager/matches', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Failed to fetch matches')

        const data = await response.json()
        setMatches(data.matches)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [user])

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Matches</h1>
      
      <div className="space-y-4">
        {matches.map(match => (
          <MatchCard 
            key={match.id} 
            match={match}
            onClick={() => router.push(`/manager/${match.id}`)}
          />
        ))}
      </div>
    </main>
  )
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-900 p-6 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">
            {match.homeTeam} vs {match.awayTeam}
          </h2>
          <p className="text-gray-400 mt-1">
            {format(new Date(match.date), 'MMMM do, yyyy')}
          </p>
        </div>
        <PaymentStatusBadge status={match.paymentStatus} />
      </div>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-800'
  }

  const displayStatus = status || 'Not Started'
  const className = variants[status as keyof typeof variants] || variants.default

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${className}`}>
      {displayStatus}
    </span>
  )
} 