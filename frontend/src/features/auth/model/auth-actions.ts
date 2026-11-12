import type { ZodObject, ZodRawShape } from 'zod'
import type { FormAction, FormField } from '@/shared/model/form-action'
import {
  changePasswordRequestSchema, forgotPasswordRequestSchema, loginRequestSchema,
  registerRequestSchema, resetPasswordRequestSchema, verifyEmailRequestSchema,
} from '../api/auth-contracts'

export type AuthActionId = 'login' | 'register' | 'email-verifications' | 'forgot-password'
  | 'reset-password' | 'refresh' | 'logout' | 'me' | 'password'

export interface AuthAction extends FormAction {
  id: AuthActionId
}

function fields(schema: ZodObject<ZodRawShape>, labels: Record<string, string>): FormField[] {
  return Object.entries(labels).map(([key, label]) => ({
    key, label,
    rule: schema.shape[key] as FormField['rule'],
    secret: /password|token/i.test(key),
  }))
}

export const authActions: AuthAction[] = [
  {
    id: 'login',
    title: 'Đăng nhập',
    group: 'Tài khoản',
    fields: fields(loginRequestSchema, { email: 'Email', password: 'Mật khẩu' })
    .map((field) => ({ ...field, autoComplete: field.key === 'password' ? 'current-password' : undefined })),
  },
  {
    id: 'register',
    title: 'Đăng ký',
    group: 'Tài khoản',
    fields: fields(registerRequestSchema, {
    email: 'Email', password: 'Mật khẩu (15–128 ký tự)', fullName: 'Họ tên', phone: 'Số điện thoại',
  }),
    success: 'Đăng ký thành công. Kiểm tra hộp thư để xác minh email.',
  },
  {
    id: 'email-verifications',
    title: 'Xác minh email',
    group: 'Tài khoản',
    fields: fields(verifyEmailRequestSchema, { token: 'Mã xác minh' }),
  },
  {
    id: 'forgot-password',
    title: 'Quên mật khẩu',
    group: 'Tài khoản',
    fields: fields(forgotPasswordRequestSchema, { email: 'Email' }),
    success: 'Nếu tài khoản đủ điều kiện, hệ thống sẽ gửi email đặt lại mật khẩu.',
  },
  {
    id: 'reset-password',
    title: 'Đặt lại mật khẩu',
    group: 'Tài khoản',
    fields: fields(resetPasswordRequestSchema, { token: 'Mã đặt lại mật khẩu', newPassword: 'Mật khẩu mới' }),
  },
  {
    id: 'refresh',
    title: 'Làm mới phiên',
    group: 'Tài khoản',
    fields: [],
    authenticated: true,
  },
  {
    id: 'logout',
    title: 'Đăng xuất',
    group: 'Tài khoản',
    fields: [],
    authenticated: true,
  },
  {
    id: 'me',
    title: 'Thông tin tài khoản',
    group: 'Tài khoản',
    fields: [],
    authenticated: true,
  },
  {
    id: 'password',
    title: 'Đổi mật khẩu',
    group: 'Tài khoản',
    fields: fields(changePasswordRequestSchema, {
    currentPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới',
  }),
    authenticated: true,
    success: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
  },
]

export function isAuthActionId(value: string): value is AuthActionId {
  return authActions.some((action) => action.id === value)
}

export function getAuthAction(id: AuthActionId): AuthAction {
  return authActions.find((action) => action.id === id)!
}
