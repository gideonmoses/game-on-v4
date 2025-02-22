// Remove unused FirebaseUser import if not needed
export type UserRole = 'Player' | 'Manager' | 'Selector' | 'Admin'

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

// This is the Firestore user document type
export interface User {
  email: string
  displayName: string
  phoneNumber: string
  dateOfBirth: string
  jerseyNumber: string
  roles: UserRole[]
  userStatus: UserStatus
  createdAt: string
  updatedAt: string
}

// Type for registration form data
export interface CreateUserData {
  email: string
  password: string
  displayName: string
  phoneNumber: string
  dateOfBirth: string
  jerseyNumber: string
}

// Type for user document in Firestore
export interface UserDocument {
  email: string
  displayName: string
  phoneNumber: string
  dateOfBirth: string
  jerseyNumber: string
  roles: UserRole[]
  userStatus: UserStatus
  createdAt: string
  updatedAt: string
}

// Type for updating user data
export interface UpdateUserData {
  displayName?: string
  phoneNumber?: string
  dateOfBirth?: string
  jerseyNumber?: string
  userStatus?: UserStatus
  roles?: UserRole[]
} 