'use client'

import { useState } from 'react'
import { PaymentRequest } from '@/types/payment'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface PaymentTabsProps {
  paymentRequests: PaymentRequest[]
}

type TabCategory = 'all' | 'pending' | 'submitted' | 'verified'

export function PaymentTabs({ paymentRequests }: PaymentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('all')

  const categories: Record<TabCategory, PaymentRequest[]> = {
    all: paymentRequests,
    pending: paymentRequests.filter(r => r.status === 'pending'),
    submitted: paymentRequests.filter(r => r.status === 'submitted'),
    verified: paymentRequests.filter(r => r.status === 'verified')
  }

  return (
    <div>
      {/* Tab List */}
      <div className="flex space-x-1 rounded-xl bg-gray-700/20 p-1">
        {(Object.keys(categories) as TabCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`
              w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${activeTab === category 
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
              }
            `}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)} ({categories[category].length})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4 space-y-4">
        {categories[activeTab].length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No payment requests in this category
          </div>
        ) : (
          categories[activeTab].map(request => (
            <PaymentRequestCard key={request.id} request={request} />
          ))
        )}
      </div>
    </div>
  )
}

function PaymentRequestCard({ request }: { request: PaymentRequest }) {
  const { user } = useAuth()
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    if (!user) return

    try {
      setVerifying(true)
      const token = await user.getIdToken()
      
      const response = await fetch(`/api/manager/matches/${request.matchId}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: request.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment')
      }

      toast.success('Payment verified successfully')
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
        {request.status !== 'pending' && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Submitted Amount</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.submittedAmount || request.amount}
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