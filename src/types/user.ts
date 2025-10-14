export type UserRole = 'owner' | 'staff'

export type UserProfile = {
  id: string
  role: UserRole
  clinicId: string
  parentUserId?: string
  displayName: string
  isActive: boolean
  email?: string
  createdAt: string
  updatedAt: string
}

export type CreateStaffData = {
  email: string
  password: string
  displayName: string
}
