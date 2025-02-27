import { collection } from 'firebase/firestore'
import { db } from './firebase-config'
import type { PaymentRequest, MatchPaymentSummary } from '@/types/payment'

// Collection references
export const matchesCollection = collection(db, 'matches')
export const matchPaymentSummariesCollection = collection(db, 'match-payment-summaries')

// Helper functions for subcollections
export const getMatchPaymentRequestsCollection = (matchId: string) => 
  collection(db, 'matches', matchId, 'payment-requests')

export const getUserPaymentRequestsCollection = (userId: string) => 
  collection(db, 'users', userId, 'payment-requests') 