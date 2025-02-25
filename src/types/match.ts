import { Timestamp } from 'firebase/firestore'

export type MatchStatus = 'scheduled' | 'voting' | 'completed' | 'cancelled'
export type JerseyColor = 'whites' | 'colours'
export type VoteStatus = 'available' | 'not_available' | 'tentative'

export interface MatchVote {
  status: VoteStatus
  updatedAt: string
  userEmail?: string
}

export interface Match {
  id: string
  tournamentId: string
  tournamentName: string // For easy reference
  homeTeam: string
  awayTeam: string
  date: Timestamp | string
  time: string
  venue: string
  location: string // Added location field
  status: MatchStatus
  jerseyColor: JerseyColor
  score?: {
    home: number
    away: number
  }
  votingDeadline: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  votes?: {
    [uid: string]: MatchVote
  }
} 