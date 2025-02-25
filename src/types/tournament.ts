import { Timestamp } from 'firebase/firestore'

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  format: string
  startDate: string
  endDate: string
  location: string
  status: TournamentStatus
  createdAt?: string
  updatedAt?: string
} 