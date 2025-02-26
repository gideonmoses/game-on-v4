import { Timestamp } from 'firebase/firestore'

export type MatchStatus = 'scheduled' | 'voting' | 'team-announced' | 'completed' | 'cancelled'
export type JerseyColor = 'whites' | 'colours'
export type VoteStatus = 'available' | 'not_available' | 'tentative'

export interface MatchVote {
  status: VoteStatus
  updatedAt: string
  userEmail?: string
}

export interface SelectedPlayer {
  userId: string
  displayName: string
  jerseyNumber?: string
  role: 'starter' | 'substitute'
}

export interface TeamSelection {
  starters: SelectedPlayer[]
  substitutes: SelectedPlayer[]
  updatedAt: Timestamp
  updatedBy: string // admin/selector who made the selection
}

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  tournamentName: string
  date: Timestamp
  time: string
  venue: string
  status: 'scheduled' | 'voting' | 'team-announced' | 'completed'
  votes?: Record<string, {
    status: VoteStatus
    updatedAt: string
    userEmail: string
  }>
  teamSelection?: TeamSelection
} 