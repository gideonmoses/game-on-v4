import { Timestamp } from 'firebase/firestore'
import { User } from './user'
import { Match } from './match'

export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected'

// Main payment request record
export interface PaymentRequest {
  id: string
  matchId: string
  userId: string // user.email
  amount: number
  status: PaymentStatus
  requestedAt: Timestamp
  dueDate: Timestamp
  requestedBy: string // manager's email
  
  // Payment submission details
  submittedAt?: Timestamp
  submittedAmount?: number
  contribution?: number
  paymentProof?: string // URL to payment screenshot
  paymentNotes?: string
  
  // Verification details
  verifiedAt?: Timestamp
  verifiedBy?: string // manager's email
  verificationNotes?: string
}

// Match level payment summary
export interface MatchPaymentSummary {
  id: string
  matchId: string
  status: 'draft' | 'initiated' | 'in-progress' | 'completed'
  
  // Basic info
  baseAmount: number
  dueDate: Timestamp
  initiatedAt: Timestamp
  initiatedBy: string // manager's email
  lastUpdatedAt: Timestamp
  
  // Counters
  totalPlayers: number
  pendingCount: number
  submittedCount: number
  verifiedCount: number
  
  // Financial summary
  totalExpected: number
  totalSubmitted: number
  totalVerified: number
  totalContributions: number
  
  notes?: string
}

// For the manager's dashboard view
export interface PaymentSummaryWithDetails extends MatchPaymentSummary {
  match: Match
  requests: (PaymentRequest & {
    user: User
  })[]
} 