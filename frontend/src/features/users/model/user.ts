
export type UserRole = 'CUSTOMER' | 'HOTEL_OWNER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'LOCKED'
export type UserFilterTab = 'all' | 'active' | 'pending' | 'inactive' | 'locked'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  phone: string
  role: UserRole | null
  roles: string[]
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  version: number
  status: UserStatus
  joinedDate: string
  avatarInitials: string
  avatarBg: string
  avatarColor: string
}
