import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Match, TeamSelection } from '@/types/match'
import { Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface TeamViewModalProps {
  match: Match
  isOpen: boolean
  onClose: () => void
}

export function TeamViewModal({ match, isOpen, onClose }: TeamViewModalProps) {
  const { user } = useAuth()
  const [teamData, setTeamData] = React.useState<TeamSelection | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchTeam = async () => {
      if (!isOpen || !user) return
      
      try {
        setIsLoading(true)
        const idToken = await user.getIdToken()
        
        const response = await fetch(`/api/matches/${match.id}/team`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch team')
        const data = await response.json()
        setTeamData(data)
      } catch (error) {
        console.error('Error fetching team:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeam()
  }, [match.id, isOpen, user])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            {match.homeTeam} vs {match.awayTeam}
          </DialogTitle>
          <DialogDescription>
          {match.tournamentName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Starting XI
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {teamData?.starters.map((player, index) => (
                    <div 
                      key={player.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {index + 1}. {player.displayName}
                      </span>
                      {player.jerseyNumber && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Substitutes
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {teamData?.substitutes.map((player, index) => (
                    <div 
                      key={player.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {index + 1}. {player.displayName}
                      </span>
                      {player.jerseyNumber && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 