'use client'

import { useState } from 'react'
import { Match } from '@/types/match'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  name: string
  email: string
  role: string
}

export default function InitiatePaymentPage({
  params
}: {
  params: { matchId: string }
}) {
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Initiate Payment Request</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Amount per player</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
              onChange={e => setDueDate(e.target.value ? new Date(e.target.value) : null)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Select Players</h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Player selection list */}
              </div>
            )}
          </div>

          <button 
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              !amount || !dueDate || selectedPlayers.size === 0
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
            }`}
            disabled={!amount || !dueDate || selectedPlayers.size === 0}
          >
            Initiate Payment Requests
          </button>
        </div>
      </div>
    </main>
  )
} 