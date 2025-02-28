import { Timestamp } from 'firebase/firestore'

export type MatchStatus = 
  | 'scheduled'   // Initial state when match is created
  | 'voting'      // Voting is open for players
  | 'team-selected'  // Team has been selected but not announced
  | 'team-announced' // Team has been announced
  | 'completed'   // Match is finished
  | 'cancelled'   // Match has been cancelled

export type JerseyColor = 'whites' | 'colours'
export type VoteStatus = 'available' | 'not_available' | 'tentative'

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: string | Timestamp
  time: string
  venue: string
  tournamentName?: string
  status: MatchStatus
  votes?: {
    [email: string]: Vote
  }
  teamSelection?: {
    starters: SelectedPlayer[]
    substitutes: SelectedPlayer[]
    version: number
    status: 'draft' | 'final'
    updatedAt: string
    updatedBy: string
  }
}

export interface Vote {
  status: VoteStatus
  updatedAt: string
  userEmail: string
}

export interface SelectedPlayer {
  email: string
  displayName: string
  jerseyNumber?: string
  role: 'starter' | 'substitute'
}

export interface TeamSelection {
  id: string
  matchId: string
  starters: SelectedPlayer[]
  substitutes: SelectedPlayer[]
  version: number
  status: 'draft' | 'final'
  updatedAt: string
  updatedBy: string
} 