import { z } from 'zod'

export const backendUserStatusSchema = z.enum(['active', 'inactive', 'pending', 'banned'])
export type BackendUserStatus = z.infer<typeof backendUserStatusSchema>

export const adminUserSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  roles: z.array(z.string()),
  status: backendUserStatusSchema,
  emailVerified: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  version: z.number().int().nonnegative(),
})
export type AdminUserDto = z.infer<typeof adminUserSchema>

export const adminUserPageSchema = z.object({
  content: z.array(adminUserSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
})

export const roleSchema = z.object({
  id: z.number().int().positive(),
  roleKey: z.string(),
  roleName: z.string(),
})
export const rolesSchema = z.array(roleSchema)
export type RoleDto = z.infer<typeof roleSchema>
export const userRolesSchema = z.object({ userId: z.uuid(), roles: z.array(z.string()) })
export const verificationRequestSchema = z.object({ accepted: z.literal(true) })

export interface AdminUsersQuery {
  search?: string
  status?: BackendUserStatus
  role?: string
  createdFrom?: string
  createdTo?: string
  sort?: 'createdAt,desc' | 'createdAt,asc'
  page: number
  size: number
}

export interface UpdateUserStatusRequest {
  status: BackendUserStatus
  expectedVersion: number
  reason?: string
}
