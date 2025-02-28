import { Timestamp } from 'firebase/firestore'
import { User } from './user'
import { Match } from './match'

export type PaymentStatus = 'pending' | 'submitted' | 'verified'

// Main payment request record
export interface PaymentRequest {
  id: string
  matchId: string
  userEmail: string
  status: PaymentStatus
  requestedAt: string | Timestamp
  submittedAt: string | Timestamp | null
  verifiedAt: string | Timestamp | null
  dueDate: string | Timestamp
  requestedBy: string
  paymentPhoneNumber: string
  createdAt?: string | Timestamp
  updatedAt?: string | Timestamp
  amount?: number
  paymentScreenshot?: string
  user?: {
    displayName: string
    email: string
    phoneNumber?: string
  }
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
export interface PaymentSummaryWithDetails {
  totalExpected: number
  totalSubmitted: number
  totalVerified: number
  lastUpdated: string
}

export interface PaymentSummary {
  matchId: string
  totalRequested: number
  totalSubmitted: number
  totalVerified: number
  initiatedAt: string | Timestamp
  lastUpdatedAt: string | Timestamp
  dueDate: string | Timestamp
  paymentPhoneNumber: string
  requestedBy: string
} 