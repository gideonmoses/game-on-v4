export type VoteType = 'available' | 'not_available' | 'tentative'

export interface Vote {
  id?: string
  matchId: string
  votes: {
    [userEmail: string]: {
      status: VoteType
      updatedAt: string
    }
  }
} 