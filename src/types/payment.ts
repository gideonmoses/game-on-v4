import { Timestamp } from 'firebase/firestore'
import { User } from './user'
import { Match } from './match'

export type PaymentStatus = 
  | 'pending'
  | 'submitted'
  | 'verified'
  | 'rejected'

// Main payment request record
export interface PaymentRequest {
  id: string
  matchId: string
  userEmail: string
  amount: number
  status: PaymentStatus
  requestedAt: string
  dueDate: string
  submittedAt?: string
  verifiedAt?: string
  requestedBy: string
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
  id: string
  matchId: string
  totalAmount: number
  paidAmount: number
  dueDate: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
} 