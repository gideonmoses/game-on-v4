'use client'

import { useState, useEffect } from 'react'
import { PaymentSummaryWithDetails, PaymentRequest } from '@/types/payment'
import { Match } from '@/types/match'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface PaymentRequestWithUser extends PaymentRequest {
  user: {
    name: string
    email: string
  }
}

export default function MatchPaymentPage({ 
  params 
}: { 
  params: { matchId: string } 
}) {
  const { user } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentSummaryWithDetails | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestWithUser[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'verified'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatchDetails() {
      try {
        const token = await user?.getIdToken()
        const response = await fetch(`/api/manager/matches/${params.matchId}/payment`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch match details')
        }

        const data = await response.json()
        setMatch(data.match)
        setPaymentDetails(data.summary)
        setPaymentRequests(data.requests)
      } catch (error) {
        toast.error('Failed to load match details')
        console.error('Error fetching match details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMatchDetails()
    }
  }, [user, params.matchId])

  const handleVerifyPayments = async (requestIds: string[], verify: boolean) => {
    try {
      const token = await user?.getIdToken()
      const response = await fetch(`/api/manager/matches/${params.matchId}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestIds,
          action: verify ? 'verify' : 'reject',
          notes: ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to verify payments')
      }

      toast.success(`Payments ${verify ? 'verified' : 'rejected'} successfully`)
      // Refresh data
      fetchMatchDetails()
    } catch (error) {
      toast.error('Failed to update payment status')
      console.error('Error verifying payments:', error)
    }
  }

  const filteredRequests = paymentRequests.filter(request => {
    switch (activeTab) {
      case 'pending':
        return request.status === 'pending'
      case 'submitted':
        return request.status === 'submitted'
      case 'verified':
        return request.status === 'verified'
      default:
        return false
    }
  })

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">{match?.title}</h1>
            <p className="text-sm text-gray-500 mb-4">
              {match?.date && format(match.date.toDate(), 'PPP')}
            </p>
            {!paymentDetails && (
              <Link 
                href={`/manager/${params.matchId}/payments/initiate`}
                className="inline-flex items-center px-4 py-2 bg-amber-100 dark:bg-amber-900/30 
                  text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 
                  dark:hover:bg-amber-900/50 transition-colors"
              >
                Initiate Payment Request
              </Link>
            )}
            {paymentDetails && (
              <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Players</p>
                  <p className="font-medium">{paymentDetails.totalPlayers}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expected</p>
                  <p className="font-medium">₹{paymentDetails.totalExpected}</p>
                </div>
                <div>
                  <p className="text-gray-500">Received</p>
                  <p className="font-medium">₹{paymentDetails.totalSubmitted}</p>
                </div>
                <div>
                  <p className="text-gray-500">Verified</p>
                  <p className="font-medium">₹{paymentDetails.totalVerified}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['pending', 'submitted', 'verified'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === tab 
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {paymentRequests.filter(r => r.status === tab).length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                  {paymentRequests.filter(r => r.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map(request => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 
                    dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{request.user.name}</h3>
                    <p className="text-sm text-gray-500">{request.user.email}</p>
                    {request.submittedAmount && (
                      <p className="text-sm mt-1">
                        Amount: ₹{request.submittedAmount}
                        {request.contribution > 0 && (
                          <span className="text-green-600 dark:text-green-400 ml-2">
                            +₹{request.contribution} contribution
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {activeTab === 'submitted' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyPayments([request.id], true)}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 
                          dark:text-green-400 rounded-lg hover:bg-green-200 text-sm"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleVerifyPayments([request.id], false)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 
                          dark:text-red-400 rounded-lg hover:bg-red-200 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 