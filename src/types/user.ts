export type UserRole = 'Player' | 'Manager' | 'Selector' | 'Admin'

export type UserStatus = 'approved' | 'pending' | 'suspended'

export interface User {
  id: string
  email: string
  displayName: string
  role: string[]
  phoneNumber?: string
  jerseyNumber?: string
  createdAt?: string
  updatedAt?: string
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