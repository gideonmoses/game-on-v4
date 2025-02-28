'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Match } from '@/types/match'
import { PaymentSummaryWithDetails } from '@/types/payment'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<(Match & { 
    paymentSummary: PaymentSummaryWithDetails | null 
  })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatches() {
      try {
        if (!user) return

        // Force token refresh to get latest claims
        await user.getIdToken(true)
        const token = await user.getIdToken()
        
        const response = await fetch('/api/manager/matches', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch matches')
        }

        const data = await response.json()
        setMatches(data.matches)
      } catch (error) {
        toast.error('Failed to load matches')
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [user])

  if (loading) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Match Payments</h1>
        
        {matches.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No matches found</p>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/manager/${match.id}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="mb-2">
                  <h2 className="font-semibold">
                    {match.homeTeam} vs {match.awayTeam}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(match.date), 'PPP')}
                  </p>
                </div>
                
                {match.paymentSummary && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Expected</p>
                      <p className="font-medium">₹{match.paymentSummary.totalExpected}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Received</p>
                      <p className="font-medium">₹{match.paymentSummary.totalSubmitted}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Verified</p>
                      <p className="font-medium">₹{match.paymentSummary.totalVerified}</p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusStyle(status?: string) {
  switch (status) {
    case 'draft': 
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    case 'initiated': 
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    case 'in-progress': 
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    case 'completed': 
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    default: 
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }
}

function formatPaymentStatus(status?: string) {
  if (!status) return 'Not Initiated'
  return status.charAt(0).toUpperCase() + status.slice(1)
} 