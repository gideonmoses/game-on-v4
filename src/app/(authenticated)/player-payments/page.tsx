'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { PaymentRequest } from '@/types/payment'
import { Match } from '@/types/match'
import { PaymentModal } from '@/components/payments/PaymentModal'

interface PaymentSummary {
  totalRequested: number
  totalSubmitted: number
  totalVerified: number
}

export default function PlayerPaymentsHome() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({
    totalRequested: 0,
    totalSubmitted: 0,
    totalVerified: 0
  })

  useEffect(() => {
    async function fetchPayments() {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/player/payments', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch payments')
        }

        const data = await response.json()
        setPaymentRequests(data.paymentRequests)
        setSummary(data.summary)
        setError(null)
      } catch (error) {
        console.error('Error:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [user])

  if (loading) {
    return <PaymentsLoadingState />
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">My Payments</h1>

      {/* Payment Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Requested</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalRequested}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Submitted</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalSubmitted}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Verified</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalVerified}</p>
          </div>
        </div>
      </div>

      {/* Payment Requests List */}
      <div className="space-y-4">
        {paymentRequests.map((request) => (
          <PaymentRequestCard 
            key={request.id} 
            request={request} 
          />
        ))}
      </div>
    </main>
  )
}

function PaymentRequestCard({ request }: { request: PaymentRequest }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Match Payment</h3>
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
        <div>
          <p className="text-gray-500 dark:text-gray-400">Payment Phone</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {request.paymentPhoneNumber}
          </p>
        </div>
      </div>

      {request.status === 'pending' && (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 
              text-black font-medium rounded-lg transition-colors"
          >
            Submit Payment
          </button>

          <PaymentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            paymentRequest={request}
            onSubmitSuccess={() => {
              // Refresh the payments list
              window.location.reload()
            }}
          />
        </>
      )}
    </div>
  )
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

function PaymentsLoadingState() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>

        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  )
}