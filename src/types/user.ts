export type UserRole = 'Player' | 'Manager' | 'Selector' | 'Admin'

export type UserStatus = 'approved' | 'pending' | 'suspended'

export interface User {
  id: string
  displayName: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  getIdToken: () => Promise<string>
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