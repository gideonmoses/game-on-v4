'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy
} from 'lucide-react'
import { SelectField } from '@/components/ui/SelectField'
import { InputField } from '@/components/ui/InputField'
import { iconStyles } from '@/styles/iconStyles'
import type { Tournament } from '@/types/tournament'
import type { MatchStatus, JerseyColor } from '@/types/match'

interface MatchFormData {
  tournamentId: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  venue: string
  status: MatchStatus
  jerseyColor: JerseyColor
  votingDeadline?: string
}

interface ValidationErrors {
  [key: string]: string[]
}

export default function CreateMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = searchParams.get('id')
  const isEditing = !!matchId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditing)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<MatchFormData>({
    tournamentId: '',
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    status: 'scheduled',
    jerseyColor: 'whites'
  })

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/admin/tournaments')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tournaments')
        }

        setTournaments(data.tournaments)
        if (!isEditing && data.tournaments.length > 0) {
          setFormData(prev => ({
            ...prev,
            tournamentId: data.tournaments[0].id
          }))
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error('Failed to load tournaments')
      }
    }

    fetchTournaments()
  }, [isEditing])

  useEffect(() => {
    if (matchId) {
      const fetchMatch = async () => {
        try {
          setIsFetching(true)
          const response = await fetch(`/api/admin/matches?id=${matchId}`)
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch match')
          }

          setFormData({
            tournamentId: data.match.tournamentId || '',
            homeTeam: data.match.homeTeam || '',
            awayTeam: data.match.awayTeam || '',
            date: data.match.date.split('T')[0] || '',
            time: data.match.time || '',
            venue: data.match.venue || '',
            status: data.match.status || 'scheduled',
            jerseyColor: data.match.jerseyColor || 'whites',
            votingDeadline: data.match.votingDeadline 
              ? new Date(data.match.votingDeadline).toISOString().slice(0, 16)
              : '',
          })
        } catch (error) {
          console.error('Error fetching match:', error)
          toast.error('Failed to load match')
          router.push('/admin/matches')
        } finally {
          setIsFetching(false)
        }
      }

      fetchMatch()
    }
  }, [matchId, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const handleSelectChange = (name: string) => (option: { value: string; label: string } | null) => {
    if (option) {
      setFormData(prev => ({ ...prev, [name]: option.value }))
      if (errors[name]) {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const submitData = {
        ...formData,
        votingDeadline: formData.status === 'voting' && formData.votingDeadline
          ? new Date(formData.votingDeadline).toISOString()
          : null
      }

      const url = isEditing 
        ? `/api/admin/matches?id=${matchId}`
        : '/api/admin/matches'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          setErrors(data.details.fieldErrors)
          return
        }
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} match`)
      }

      toast.success(`Match ${isEditing ? 'updated' : 'created'} successfully`)
      router.push('/admin/matches')

    } catch (error) {
      console.error(`${isEditing ? 'Update' : 'Create'} match error:`, error)
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} match`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="mt-8 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/matches"
            className={`p-2 rounded-lg transition-colors ${iconStyles.back.container}`}
            title="Back to Matches"
          >
            <ArrowLeft className={`h-6 w-6 ${iconStyles.back.default}`} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Match' : 'Create Match'}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update match details' : 'Schedule a new match'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            <SelectField
              label="Tournament"
              name="tournamentId"
              value={{ 
                value: formData.tournamentId,
                label: tournaments.find(t => t.id === formData.tournamentId)?.name || ''
              }}
              onChange={handleSelectChange('tournamentId')}
              options={tournaments.map(t => ({ value: t.id, label: t.name }))}
              error={errors.tournamentId?.[0]}
              icon={
                <div className={`p-1 rounded ${iconStyles.trophy.container}`}>
                  <Trophy className={`h-4 w-4 ${iconStyles.trophy.default}`} />
                </div>
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.calendar.container}`}>
                    <Calendar className={`h-4 w-4 ${iconStyles.calendar.default}`} />
                  </div>
                }
                required
              />

              <InputField
                label="Time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.clock.container}`}>
                    <Clock className={`h-4 w-4 ${iconStyles.clock.default}`} />
                  </div>
                }
                required
              />
            </div>

            <InputField
              label="Venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              error={errors.venue?.[0]}
              icon={
                <div className={`p-1 rounded ${iconStyles.location.container}`}>
                  <MapPin className={`h-4 w-4 ${iconStyles.location.default}`} />
                </div>
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Home Team"
                name="homeTeam"
                value={formData.homeTeam}
                onChange={handleChange}
                error={errors.homeTeam?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.tag.container}`}>
                    <Users className={`h-4 w-4 ${iconStyles.tag.default}`} />
                  </div>
                }
                required
              />

              <InputField
                label="Away Team"
                name="awayTeam"
                value={formData.awayTeam}
                onChange={handleChange}
                error={errors.awayTeam?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.tag.container}`}>
                    <Users className={`h-4 w-4 ${iconStyles.tag.default}`} />
                  </div>
                }
                required
              />
            </div>

            <SelectField
              label="Jersey Color"
              name="jerseyColor"
              value={{ value: formData.jerseyColor, label: formData.jerseyColor.charAt(0).toUpperCase() + formData.jerseyColor.slice(1) }}
              onChange={handleSelectChange('jerseyColor')}
              options={[
                { value: 'whites', label: 'Whites' },
                { value: 'colours', label: 'Colours' }
              ]}
              error={errors.jerseyColor?.[0]}
            />

            <SelectField
              label="Status"
              name="status"
              value={{ value: formData.status, label: formData.status.charAt(0).toUpperCase() + formData.status.slice(1) }}
              onChange={handleSelectChange('status')}
              options={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'voting', label: 'Voting' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              error={errors.status?.[0]}
            />

            {formData.status === 'voting' && (
              <InputField
                label="Voting Deadline"
                name="votingDeadline"
                type="datetime-local"
                value={formData.votingDeadline || ''}
                onChange={handleChange}
                error={errors.votingDeadline?.[0]}
                required
              />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Match' : 'Create Match')}
          </button>
        </div>
      </form>
    </div>
  )
} 