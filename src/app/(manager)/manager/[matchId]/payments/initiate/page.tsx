'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Match } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

export default function InitiatePaymentPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading, error: authError } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [baseAmount, setBaseAmount] = useState(200)
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlayerEmails, setSelectedPlayerEmails] = useState<string[]>([])

  useEffect(() => {
    if (authError) {
      console.error('Auth error:', authError)
      toast.error('Authentication error. Please sign in again.')
      router.push('/login')
      return
    }

    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, authError, router])

  useEffect(() => {
    async function fetchMatchDetails() {
      if (authLoading || !user) return

      try {
        const token = await user.getIdToken(true) // Force refresh token
        const response = await fetch(`/api/matches/${matchId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch match details')
        }

        const data = await response.json()
        if (!data) {
          throw new Error('No data received')
        }

        setMatch(data)

        // Pre-select all players
        if (data.teamSelection) {
          const allPlayers = [
            ...data.teamSelection.starters,
            ...data.teamSelection.substitutes
          ].map(player => player.email)
          setSelectedPlayerEmails(allPlayers)
        }

        // Set default due date to match date
        if (data.date) {
          const matchDate = new Date(data.date)
          setDueDate(format(matchDate, 'yyyy-MM-dd'))
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load match details')
      } finally {
        setLoading(false)
      }
    }

    fetchMatchDetails()
  }, [matchId, user, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match?.teamSelection) {
      toast.error('No team selection found')
      return
    }

    try {
      setIsSubmitting(true)
      const token = await user?.getIdToken()

      // Get all players (starters and substitutes)
      const allPlayers = [
        ...match.teamSelection.starters,
        ...match.teamSelection.substitutes
      ].map(player => player.email)

      const response = await fetch(`/api/manager/matches/${matchId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'initiate',
          data: {
            baseAmount,
            dueDate,
            players: allPlayers
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to initiate payments')
      }

      toast.success('Payment requests initiated')
      router.push(`/manager/${matchId}/payments`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to initiate payments')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPlayerList = () => {
    if (!match?.teamSelection) return null

    const allPlayers = [
      ...match.teamSelection.starters.map(p => ({ ...p, type: 'Starter' })),
      ...match.teamSelection.substitutes.map(p => ({ ...p, type: 'Substitute' }))
    ]

    return (
      <div className="space-y-2">
        {allPlayers.map((player) => (
          <div 
            key={player.email}
            className="flex items-center justify-between p-3 bg-gray-50 
              dark:bg-gray-800 rounded-lg"
          >
            <div>
              <p className="font-medium">{player.displayName}</p>
              <p className="text-sm text-gray-500">{player.type}</p>
            </div>
            <div className="text-sm text-gray-500">
              {player.jerseyNumber && `#${player.jerseyNumber}`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Initiate Payment Request</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amount per player</label>
              <input
                type="number"
                value={baseAmount}
                onChange={e => setBaseAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Selected Players</h3>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                renderPlayerList()
              )}
            </div>

            <button 
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                !baseAmount || !dueDate || !match?.teamSelection
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
              }`}
              disabled={!baseAmount || !dueDate || !match?.teamSelection}
              onClick={handleSubmit}
            >
              Initiate Payment Requests
            </button>
          </div>
        </div>
      )}
    </main>
  )
} 