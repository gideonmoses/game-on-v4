'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PaymentRequest } from '@/types/payment'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentRequest: PaymentRequest
  onSubmitSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, paymentRequest, onSubmitSuccess }: PaymentModalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState(paymentRequest.amount || '')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSubmitting(true)
      const token = await user.getIdToken()

      // Submit payment
      const response = await fetch(`/api/player/payments/${paymentRequest.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          referenceNumber: referenceNumber || undefined // Only send if provided
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit payment')
      }

      toast.success('Payment submitted successfully')
      onSubmitSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div 
          className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Submit Payment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md shadow-sm bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md shadow-sm bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white"
                placeholder="Enter reference number (optional)"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 
                  text-black font-medium rounded-lg transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}