'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PaymentTabs } from '../components/PaymentTabs'
import { MatchPaymentSummary } from '../components/MatchPaymentSummary'
import { PaymentRequest, PaymentSummary } from '@/types/payment'
import { Match } from '@/types/match'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface PaymentPageProps {
  params: Promise<{ matchId: string }>
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    submitted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    verified: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${variants[status as keyof typeof variants]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PaymentRequestCard({ request, matchId }: { request: PaymentRequest; matchId: string }) {
  const { user } = useAuth()
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    if (!user) return

    try {
      setVerifying(true)
      const token = await user.getIdToken()
      
      const response = await fetch(`/api/manager/matches/${matchId}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: request.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to verify payment')
      }

      toast.success('Payment verified successfully')
      // Refresh the page to update the status
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to verify payment')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {request.playerName || 'Player Payment'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Due: {new Date(request.dueDate).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Requested Amount</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {request.amount || 'Not specified'}
          </p>
        </div>
        {request.status === 'submitted' && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Submitted Amount</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.amount}
            </p>
          </div>
        )}
        <div>
          <p className="text-gray-500 dark:text-gray-400">Payment Phone</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {request.paymentPhoneNumber}
          </p>
        </div>
        {request.referenceNumber && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Reference Number</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.referenceNumber}
            </p>
          </div>
        )}
      </div>

      {request.status === 'submitted' && (
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 
            text-white font-medium rounded-lg transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? 'Verifying...' : 'Verify Payment'}
        </button>
      )}
    </div>
  )
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { matchId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<Match | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/manager/matches/${matchId}/payment`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch payment details')
        }

        const data = await response.json()
        setMatch(data.match)
        setPaymentRequests(data.paymentRequests)
        setPaymentSummary(data.paymentSummary)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [matchId, user])

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        Match not found
      </div>
    )
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

        <PaymentTabs 
          paymentRequests={paymentRequests.map(request => ({
            ...request,
            component: <PaymentRequestCard request={request} matchId={matchId} />
          }))} 
        />
      </div>
    </main>
  )
} 