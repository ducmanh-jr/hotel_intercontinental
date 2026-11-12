import type { AdminUserDto, BackendUserStatus } from '../api/user-contracts'
import type { AdminUser, UserFilterTab, UserRole } from './user'

const primaryRoles: UserRole[] = ['ADMIN', 'HOTEL_OWNER', 'CUSTOMER']
const statuses = { active: 'ACTIVE', inactive: 'INACTIVE', pending: 'PENDING', banned: 'LOCKED' } as const

export function toAdminUser(user: AdminUserDto): AdminUser {
  const initials = user.fullName.trim().split(/\s+/).filter(Boolean)
    .slice(-2).map((part) => part[0].toLocaleUpperCase('vi-VN')).join('')
  return {
    ...user,
    role: primaryRoles.find((role) => user.roles.includes(role)) ?? null,
    status: statuses[user.status],
    joinedDate: new Intl.DateTimeFormat('vi-VN').format(new Date(user.createdAt)),
    avatarInitials: initials,
    avatarBg: '#E2E8F0',
    avatarColor: '#334155',
  }
}

export const tabStatuses: Record<UserFilterTab, BackendUserStatus | undefined> = {
  all: undefined, active: 'active', pending: 'pending', inactive: 'inactive', locked: 'banned',
}

export function dateRange(filter: string, now: Date) {
  if (filter === 'ALL') return {}
  const start = filter === 'YTD'
    ? new Date(now.getFullYear(), 0, 1)
    : new Date(now.getTime() - (filter === '7D' ? 7 : 30) * 86_400_000)
  return { createdFrom: start.toISOString(), createdTo: now.toISOString() }
}

export function nextUserStatus(user: AdminUser): BackendUserStatus {
  if (user.status === 'LOCKED' || user.status === 'INACTIVE') {
    return user.emailVerified ? 'active' : 'pending'
  }
  return 'banned'
}

export function pageNumbers(page: number, totalPages: number) {
  const start = Math.max(0, Math.min(page - 1, totalPages - 3))
  return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index)
}
