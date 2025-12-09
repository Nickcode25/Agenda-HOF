export type UserRole = 'owner' | 'staff'

export type UserAddress = {
  country: string
  zipCode: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
  complement?: string
}

export type UserPhone = {
  countryCode: string
  areaCode: string
  number: string
}

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
  // Extended profile fields
  profilePhoto?: string
  socialName?: string
  fullName?: string
  username?: string
  address?: UserAddress
  phone?: UserPhone
  secondaryPhone?: UserPhone
}

export type CreateStaffData = {
  email: string
  password: string
  displayName: string
}
