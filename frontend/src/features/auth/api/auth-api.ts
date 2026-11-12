import { z } from 'zod'
import { http } from '@/shared/api/http'
import {
  acceptedResponseSchema, authUserSchema, changePasswordResponseSchema,
  currentUserSchema, loginResponseSchema, resetPasswordResponseSchema,
  verifyEmailResponseSchema,
  type ChangePasswordRequest, type ForgotPasswordRequest, type LoginRequest,
  type RegisterRequest, type ResetPasswordRequest, type VerifyEmailRequest,
  type VerifyEmailResponse,
} from './auth-contracts'

export async function login(payload: LoginRequest, signal?: AbortSignal) {
  return http.request('/auth/login', {
    method: 'POST',
    body: payload,
    signal,
    schema: loginResponseSchema,
  })
}

export async function register(payload: RegisterRequest, signal?: AbortSignal) {
  return http.request('/auth/register', {
    method: 'POST',
    body: payload,
    signal,
    schema: authUserSchema,
  })
}

export async function verifyEmail(payload: VerifyEmailRequest, signal?: AbortSignal): Promise<VerifyEmailResponse> {
  return http.request('/auth/email-verifications', {
    method: 'POST',
    body: payload,
    signal,
    schema: verifyEmailResponseSchema,
  })
}

export async function forgotPassword(payload: ForgotPasswordRequest, signal?: AbortSignal) {
  return http.request('/auth/forgot-password', {
    method: 'POST',
    body: payload,
    signal,
    schema: acceptedResponseSchema,
  })
}

export async function resetPassword(payload: ResetPasswordRequest, signal?: AbortSignal) {
  return http.request('/auth/reset-password', {
    method: 'POST',
    body: payload,
    signal,
    schema: resetPasswordResponseSchema,
  })
}

export async function refreshSession(refreshToken?: string, signal?: AbortSignal) {
  return http.request('/auth/refresh', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
    signal,
    schema: loginResponseSchema,
  })
}

export async function logout(refreshToken?: string, signal?: AbortSignal) {
  return http.request('/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
    signal,
    schema: z.null(),
  })
}

export async function getCurrentUser(signal?: AbortSignal) {
  return http.request('/users/me', {
    signal,
    schema: currentUserSchema,
  })
}

export async function changePassword(payload: ChangePasswordRequest, signal?: AbortSignal) {
  return http.request('/users/me/password', {
    method: 'POST',
    body: payload,
    signal,
    schema: changePasswordResponseSchema,
  })
}
