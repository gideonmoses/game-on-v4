'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Trophy
} from 'lucide-react'
import { SelectField } from '@/components/ui/SelectField'
import { InputField } from '@/components/ui/InputField'
import { iconStyles } from '@/styles/iconStyles'
import type { TournamentStatus } from '@/types/tournament'

interface TournamentFormData {
  name: string
  format: string
  startDate: string
  endDate: string
  location: string
}

interface ValidationErrors {
  [key: string]: string[]
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tournamentId = searchParams.get('id')
  const isEditing = !!tournamentId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditing)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    format: 'League',
    startDate: '',
    endDate: '',
    location: ''
  })

  useEffect(() => {
    if (tournamentId) {
      const fetchTournament = async () => {
        try {
          setIsFetching(true)
          const response = await fetch(`/api/admin/tournaments/${tournamentId}`)
          const data = await response.json()
          
          setFormData({
            name: data.tournament.name || '',
            format: data.tournament.format || '',
            startDate: data.tournament.startDate.split('T')[0] || '',
            endDate: data.tournament.endDate.split('T')[0] || '',
            location: data.tournament.location || ''
          })
        } catch (error) {
          console.error('Error fetching tournament:', error)
          toast.error('Failed to load tournament')
          router.push('/admin/tournaments')
        } finally {
          setIsFetching(false)
        }
      }

      fetchTournament()
    }
  }, [tournamentId, router])

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
      const response = await fetch(
        isEditing ? `/api/admin/tournaments/${tournamentId}` : '/api/admin/tournaments',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          setErrors(data.details.fieldErrors)
          return
        }
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} tournament`)
      }

      toast.success(`Tournament ${isEditing ? 'updated' : 'created'} successfully`)
      router.push('/admin/tournaments')

    } catch (error) {
      console.error(`${isEditing ? 'Update' : 'Create'} tournament error:`, error)
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} tournament`)
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
            href="/admin/tournaments"
            className={`p-2 rounded-lg transition-colors ${iconStyles.back.container}`}
            title="Back to Tournaments"
          >
            <ArrowLeft className={`h-6 w-6 ${iconStyles.back.default}`} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Tournament' : 'Create Tournament'}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update tournament details' : 'Add a new tournament'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            <InputField
              label="Tournament Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name?.[0]}
              icon={
                <div className={`p-1 rounded ${iconStyles.trophy.container}`}>
                  <Trophy className={`h-4 w-4 ${iconStyles.trophy.default}`} />
                </div>
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                error={errors.startDate?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.calendar.container}`}>
                    <Calendar className={`h-4 w-4 ${iconStyles.calendar.default}`} />
                  </div>
                }
                required
              />

              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                error={errors.endDate?.[0]}
                icon={
                  <div className={`p-1 rounded ${iconStyles.calendar.container}`}>
                    <Calendar className={`h-4 w-4 ${iconStyles.calendar.default}`} />
                  </div>
                }
                required
              />
            </div>

            <InputField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={errors.location?.[0]}
              icon={
                <div className={`p-1 rounded ${iconStyles.location.container}`}>
                  <MapPin className={`h-4 w-4 ${iconStyles.location.default}`} />
                </div>
              }
              required
            />

            <SelectField
              label="Format"
              name="format"
              value={{ value: formData.format, label: formData.format }}
              onChange={handleSelectChange('format')}
              options={[
                { value: 'League', label: 'League' },
                { value: 'Knockout', label: 'Knockout' }
              ]}
              error={errors.format?.[0]}
              icon={
                <div className={`p-1 rounded ${iconStyles.tag.container}`}>
                  <Tag className={`h-4 w-4 ${iconStyles.tag.default}`} />
                </div>
              }
              required
            />
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
            {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Tournament' : 'Create Tournament')}
          </button>
        </div>
      </form>
    </div>
  )
} 