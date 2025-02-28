'use client'

import { useEffect, useState, use } from 'react'
import { Match } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { MatchPaymentSummary } from './components/MatchPaymentSummary'
import { PaymentTabs } from './components/PaymentTabs'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PaymentRequest, PaymentSummary } from '@/types/payment'

export default function MatchDetailsPage({ 
  params 
}: { 
  params: Promise<{ matchId: string }> 
}) {
  const { matchId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatchDetails() {
      if (!user) return

      try {
        const token = await user.getIdToken()
        
        // Fetch match details
        const matchResponse = await fetch(`/api/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!matchResponse.ok) throw new Error('Failed to fetch match details')
        const matchData = await matchResponse.json()
        setMatch(matchData.match)

        // Fetch payment details
        const paymentResponse = await fetch(`/api/matches/${matchId}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!paymentResponse.ok) throw new Error('Failed to fetch payment details')
        const paymentData = await paymentResponse.json()
        setPaymentSummary(paymentData.paymentSummary)
        setPaymentRequests(paymentData.paymentRequests)

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatchDetails()
  }, [matchId, user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!match) {
    return <div>Match not found</div>
  }

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <MatchPaymentSummary match={match} />

      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Payment Requests</h2>
          <Button
            onClick={() => router.push(`/manager/${matchId}/payments/initiate`)}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Initiate Payment Request
          </Button>
        </div>

        {paymentSummary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Requested</p>
              <p className="text-2xl font-bold">{paymentSummary.totalRequested}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Submitted</p>
              <p className="text-2xl font-bold">{paymentSummary.totalSubmitted}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Verified</p>
              <p className="text-2xl font-bold">{paymentSummary.totalVerified}</p>
            </div>
          </div>
        )}

        <PaymentTabs paymentRequests={paymentRequests} />
      </div>
    </main>
  )
} 