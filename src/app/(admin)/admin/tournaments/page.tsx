'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Plus,
  Calendar,
  MapPin,
  ArrowLeft,
  Pencil,
  Trophy,
  Tag
} from 'lucide-react'
import { iconStyles } from '@/styles/iconStyles'
import { getTournamentStatus } from '@/utils/dateHelpers'
import type { Tournament } from '@/types/tournament'

// Add this helper component for labeled data
const LabeledData = ({ 
  icon, 
  label, 
  value, 
  iconStyle,
  className = "" 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  iconStyle: { default: string, container: string }
  className?: string
}) => (
  <div className={`flex items-center text-sm ${className}`}>
    <div className={`p-1 rounded ${iconStyle.container}`}>
      <div className={iconStyle.default}>
        {icon}
      </div>
    </div>
    <div className="ml-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className={`text-sm ${iconStyle.default}`}>{value}</p>
    </div>
  </div>
)

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/admin/tournaments')
        const data = await response.json()
        setTournaments(data.tournaments)
      } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error('Failed to load tournaments')
      }
    }

    fetchTournaments()
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
      <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Back to Admin"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tournaments</h1>
        <Link
          href="/admin/tournaments/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => {
          const currentStatus = getTournamentStatus(tournament.startDate, tournament.endDate)
          
          return (
            <div key={tournament.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-4">
                {/* Header with Name and Edit */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <div className={`p-2 rounded ${iconStyles.trophy.container}`}>
                      <Trophy className={`h-5 w-5 ${iconStyles.trophy.default}`} />
                    </div>
                    <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {tournament.name}
                    </h3>
                  </div>
                  <Link
                    href={`/admin/tournaments/create?id=${tournament.id}`}
                    className={`p-2 rounded-lg transition-colors ${iconStyles.edit.container} ml-2`}
                  >
                    <Pencil className={`h-5 w-5 ${iconStyles.edit.default}`} />
                  </Link>
                </div>

                {/* Tournament Details in 2 columns */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <LabeledData
                    icon={<Tag className="h-4 w-4" />}
                    label="Format"
                    value={tournament.format}
                    iconStyle={iconStyles.tag}
                  />

                  <LabeledData
                    icon={<MapPin className="h-4 w-4" />}
                    label="Location"
                    value={tournament.location}
                    iconStyle={iconStyles.location}
                  />

                  <LabeledData
                    icon={<Calendar className="h-4 w-4" />}
                    label="Start Date"
                    value={new Date(tournament.startDate.toString()).toLocaleDateString()}
                    iconStyle={iconStyles.calendar}
                  />

                  <LabeledData
                    icon={<Calendar className="h-4 w-4" />}
                    label="End Date"
                    value={new Date(tournament.endDate.toString()).toLocaleDateString()}
                    iconStyle={iconStyles.calendar}
                  />
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${currentStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      currentStatus === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}`}
                  >
                    {currentStatus}
                  </span>
                  
                  {/* You can add additional information here in the future */}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 