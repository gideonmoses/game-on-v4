'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { TeamSelection } from "@/types/match"
import { Users } from "lucide-react"

interface ViewTeamModalProps {
  isOpen: boolean
  onClose: () => void
  teamSelection: TeamSelection | null
  matchTitle: string
}

export function ViewTeamModal({ isOpen, onClose, teamSelection, matchTitle }: ViewTeamModalProps) {
  if (!teamSelection) return null

  const PlayerList = ({ players, title }: { players: any[], title: string }) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Users className="w-4 h-4" />
        {title} ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player, index) => (
          <div 
            key={player.email}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
              {index + 1}.
            </span>
            <span className="text-gray-900 dark:text-white">
              {player.displayName}
            </span>
            {player.jerseyNumber && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({player.jerseyNumber})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{matchTitle}</DialogTitle>
          <DialogDescription>
            Selected team for this match
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <PlayerList players={teamSelection.starters} title="Starting XI" />
          <PlayerList players={teamSelection.substitutes} title="Substitutes" />
        </div>
      </DialogContent>
    </Dialog>
  )
} 