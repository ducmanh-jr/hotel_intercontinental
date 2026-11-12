import { z } from 'zod'

const required = z.string().trim().min(1, 'Vui lòng nhập giá trị.')
const email = z.string().trim().email('Email không hợp lệ.').max(255)
const currentPassword = z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128, 'Mật khẩu không được quá 128 ký tự.')
const newPassword = z.string().min(15, 'Mật khẩu cần 15–128 ký tự.').max(128)

export const loginRequestSchema = z.object({
  email,
  password: currentPassword,
  rememberMe: z.boolean().default(false).optional(),
})
export const registerRequestSchema = z.object({
  email, password: newPassword, fullName: required.max(100), phone: required.max(20),
})
export const verifyEmailRequestSchema = z.object({ token: required })
export const forgotPasswordRequestSchema = z.object({ email })
export const resetPasswordRequestSchema = z.object({ token: required.max(128), newPassword })
export const changePasswordRequestSchema = z.object({ currentPassword, newPassword })

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  emailVerified: z.boolean(),
  version: z.number(),
})
export const loginResponseSchema = z.object({
  accessToken: required,
  refreshToken: z.string().nullable().optional(),
  tokenType: z.literal('Bearer'),
  expiresAt: z.string(),
  user: authUserSchema.nullable(),
})
export const currentUserSchema = authUserSchema.extend({ roles: z.array(z.string()) })
export const acceptedResponseSchema = z.object({ accepted: z.boolean() })
export const verifyEmailResponseSchema = z.object({
  accepted: z.boolean(),
  accessToken: z.string().nullable().optional(),
  tokenType: z.literal('Bearer').nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  user: authUserSchema.nullable().optional(),
})
export const resetPasswordResponseSchema = z.object({ reset: z.boolean() })
export const changePasswordResponseSchema = z.object({ changed: z.boolean() })

export type AuthUser = z.infer<typeof authUserSchema>
export type CurrentUser = z.infer<typeof currentUserSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>
export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
