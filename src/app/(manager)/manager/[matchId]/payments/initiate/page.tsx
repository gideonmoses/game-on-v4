'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Match } from '@/types/match'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Phone } from 'lucide-react'

export default function InitiatePaymentPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading, error: authError } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlayerEmails, setSelectedPlayerEmails] = useState<string[]>([])
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('')

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

    // Set phone number from user data if available
    if (user?.phoneNumber) {
      setPaymentPhoneNumber(user.phoneNumber)
    }
  }, [user, authLoading, authError, router])

  useEffect(() => {
    async function fetchMatchDetails() {
      if (authLoading || !user) return

      try {
        const token = await user.getIdToken(true)
        const response = await fetch(`/api/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` }
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

        // Don't pre-select players anymore
        if (data.teamSelection) {
          setSelectedPlayerEmails([])
        }

        if (data.date) {
          const matchDate = new Date(data.date)
          setDueDate(format(matchDate, 'yyyy-MM-dd'))
        }
      } catch (error) {
        console.error('Error fetching match details:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load match details')
      } finally {
        setLoading(false)
      }
    }

    fetchMatchDetails()
  }, [matchId, user, authLoading])

  const handlePlayerToggle = (email: string) => {
    setSelectedPlayerEmails(current => 
      current.includes(email)
        ? current.filter(e => e !== email)
        : [...current, email]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (!match?.teamSelection) return

    if (checked) {
      const allEmails = [
        ...match.teamSelection.starters,
        ...match.teamSelection.substitutes
      ].map(player => player.email)
      setSelectedPlayerEmails(allEmails)
    } else {
      setSelectedPlayerEmails([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match?.teamSelection || selectedPlayerEmails.length === 0) {
      toast.error('Please select at least one player')
      return
    }

    if (!dueDate) {
      toast.error('Please set a due date')
      return
    }

    if (!paymentPhoneNumber) {
      toast.error('Please provide a payment phone number')
      return
    }

    try {
      setIsSubmitting(true)
      const token = await user?.getIdToken()

      const response = await fetch(`/api/manager/matches/${matchId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'initiate',
          data: {
            dueDate,
            players: selectedPlayerEmails,
            paymentPhoneNumber
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
    if (!match?.teamSelection) {
      return null
    }

    const allPlayers = [
      ...match.teamSelection.starters.map(p => ({ ...p, type: 'Starter' })),
      ...match.teamSelection.substitutes.map(p => ({ ...p, type: 'Substitute' }))
    ]

    const totalPlayers = allPlayers.length
    const allSelected = selectedPlayerEmails.length === totalPlayers

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          />
          <label htmlFor="select-all" className="font-medium cursor-pointer">
            Select All Players ({totalPlayers})
          </label>
        </div>

        <div className="space-y-2">
          {allPlayers.map((player) => (
            <div 
              key={player.email}
              className="flex items-center justify-between p-3 bg-gray-50 
                dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={player.email}
                  checked={selectedPlayerEmails.includes(player.email)}
                  onCheckedChange={() => handlePlayerToggle(player.email)}
                />
                <div>
                  <p className="font-medium">{player.displayName}</p>
                  <p className="text-sm text-gray-500">{player.type}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {player.jerseyNumber && `#${player.jerseyNumber}`}
              </div>
            </div>
          ))}
        </div>
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

          {loading ? (
            <div className="space-y-2">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : match?.teamSelection ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="tel"
                      value={paymentPhoneNumber}
                      onChange={e => setPaymentPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">
                  Select Players ({selectedPlayerEmails.length} selected)
                </h3>
                {renderPlayerList()}
              </div>

              <button 
                type="submit"
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSubmitting || !dueDate || selectedPlayerEmails.length === 0 || !paymentPhoneNumber
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
                }`}
                disabled={isSubmitting || !dueDate || selectedPlayerEmails.length === 0 || !paymentPhoneNumber}
              >
                {isSubmitting ? 'Initiating...' : 'Initiate Payment Requests'}
              </button>
            </form>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No team selection found for this match
            </div>
          )}
        </div>
      )}
    </main>
  )
} 