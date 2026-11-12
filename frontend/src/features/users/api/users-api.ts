import { http } from '@/shared/api/http'
import {
  adminUserPageSchema, adminUserSchema, rolesSchema, userRolesSchema,
  verificationRequestSchema, type AdminUsersQuery, type UpdateUserStatusRequest,
} from './user-contracts'

export function listAdminUsers(query: AdminUsersQuery, signal?: AbortSignal) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return http.request('/admin/users?' + params.toString(), {
    schema: adminUserPageSchema, signal,
  })
}

export function updateUserStatus(
  userId: string, payload: UpdateUserStatusRequest, signal?: AbortSignal,
) {
  return http.request('/admin/users/' + encodeURIComponent(userId) + '/status', {
    method: 'PUT', body: payload, schema: adminUserSchema, signal,
  })
}

export function resendUserVerificationEmail(userId: string, signal?: AbortSignal) {
  return http.request('/admin/users/' + encodeURIComponent(userId) + '/email-verification-requests', {
    method: 'POST', schema: verificationRequestSchema, signal,
  })
}

export function listAdminRoles(signal?: AbortSignal) {
  return http.request('/admin/roles', { schema: rolesSchema, signal })
}

export function getUserRoles(userId: string, signal?: AbortSignal) {
  return http.request('/admin/users/' + encodeURIComponent(userId) + '/roles', {
    schema: userRolesSchema, signal,
  })
}

export function grantUserRole(userId: string, roleId: number, signal?: AbortSignal) {
  return http.request('/admin/users/' + encodeURIComponent(userId) + '/roles/' + roleId, {
    method: 'PUT', schema: userRolesSchema, signal,
  })
}

export function revokeUserRole(userId: string, roleId: number, signal?: AbortSignal) {
  return http.request('/admin/users/' + encodeURIComponent(userId) + '/roles/' + roleId, {
    method: 'DELETE', schema: userRolesSchema, signal,
  })
}
