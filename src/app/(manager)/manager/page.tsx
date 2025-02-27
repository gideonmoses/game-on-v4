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
          throw new Error('Failed to fetch matches')
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

    if (user) {
      fetchMatches()
    }
  }, [user])

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Match Payments</h1>
      
      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))
        ) : matches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center text-gray-500">
            No matches found
          </div>
        ) : (
          matches.map(match => (
            <Link key={match.id} href={`/manager/${match.id}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{match.title}</h3>
                    <p className="text-sm text-gray-500">
                      {format(match.date.toDate(), 'PPP')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(match.paymentSummary?.status)}`}>
                    {formatPaymentStatus(match.paymentSummary?.status)}
                  </span>
                </div>
                
                {match.paymentSummary && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Expected</p>
                      <p className="font-medium">₹{match.paymentSummary.totalExpected}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Received</p>
                      <p className="font-medium">₹{match.paymentSummary.totalSubmitted}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Verified</p>
                      <p className="font-medium">₹{match.paymentSummary.totalVerified}</p>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
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