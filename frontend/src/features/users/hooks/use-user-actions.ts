import { useRef } from 'react'
import { message } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, errorMessage } from '@/shared/api/api-error'
import { useAbortableMutation } from '@/shared/hooks/use-abortable-mutation'
import {
  getUserRoles, grantUserRole, listAdminRoles, resendUserVerificationEmail,
  revokeUserRole, updateUserStatus,
} from '../api/users-api'
import type { AdminUser, UserRole } from '../model/user'
import { nextUserStatus } from '../model/admin-user-mapping'
import { userKeys } from './user-query-keys'

type UserAction =
  | { kind: 'status'; user: AdminUser }
  | { kind: 'resend'; user: AdminUser }
  | { kind: 'role'; user: AdminUser; role: UserRole }
  | { kind: 'bulk-lock' | 'bulk-resend'; users: AdminUser[] }

interface Outcome {
  level: 'success' | 'warning' | 'error'
  text: string
}

function invalidAction(detail: string): never {
  throw new ApiError(detail, { kind: 'http', status: 400, code: 'INVALID_USER_ACTION' })
}

async function changePrimaryRole(
  user: AdminUser, selectedRole: UserRole, actorId: string | undefined, signal: AbortSignal,
) {
  const [catalog, current] = await Promise.all([
    listAdminRoles(signal), getUserRoles(user.id, signal),
  ])
  const next = catalog.find((role) => role.roleKey === selectedRole)
  if (!next) invalidAction('Vai trò không còn khả dụng. Vui lòng tải lại dữ liệu.')

  // Form hiện có chọn một vai trò chính. Giữ CUSTOMER và các quyền khác của backend.
  const removals = catalog.filter((role) =>
    (role.roleKey === 'ADMIN' || role.roleKey === 'HOTEL_OWNER')
    && role.roleKey !== selectedRole && current.roles.includes(role.roleKey))
  if (user.id === actorId && removals.some((role) => role.roleKey === 'ADMIN')) {
    invalidAction('Bạn không thể tự thu hồi quyền quản trị của mình.')
  }

  let changed = false
  try {
    if (!current.roles.includes(selectedRole)) {
      await grantUserRole(user.id, next.id, signal)
      changed = true
    }
    for (const role of removals) {
      await revokeUserRole(user.id, role.id, signal)
      changed = true
    }
  } catch (error) {
    if (!changed || signal.aborted) throw error
    // Backend có API cấp/thu hồi riêng, chưa có thao tác thay thế vai trò nguyên tử.
    throw new ApiError(
      'Vai trò đã cập nhật một phần. Vui lòng kiểm tra lại danh sách. ' + errorMessage(error),
      {
        kind: error instanceof ApiError ? error.kind : 'network',
        status: error instanceof ApiError ? error.status : 0,
        code: error instanceof ApiError ? error.code : undefined,
        traceId: error instanceof ApiError ? error.traceId : undefined,
      },
    )
  }
}

async function executeAction(action: UserAction, actorId: string | undefined, signal: AbortSignal): Promise<Outcome> {
  if (action.kind === 'role') {
    await changePrimaryRole(action.user, action.role, actorId, signal)
    return { level: 'success', text: 'Đã cập nhật vai trò người dùng.' }
  }
  if (action.kind === 'status') {
    if (action.user.id === actorId) invalidAction('Bạn không thể tự thay đổi trạng thái tài khoản của mình.')
    const status = nextUserStatus(action.user)
    await updateUserStatus(action.user.id, { status, expectedVersion: action.user.version }, signal)
    return {
      level: 'success',
      text: status === 'banned' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.',
    }
  }
  if (action.kind === 'resend') {
    await resendUserVerificationEmail(action.user.id, signal)
    return { level: 'success', text: 'Đã tiếp nhận yêu cầu gửi lại email xác minh.' }
  }

  let succeeded = 0
  let skipped = 0
  const failures: string[] = []
  for (const user of action.users) {
    signal.throwIfAborted()
    if (action.kind === 'bulk-lock'
      ? user.status === 'LOCKED' || user.id === actorId
      : user.emailVerified || user.status !== 'PENDING') {
      skipped++
      continue
    }
    try {
      if (action.kind === 'bulk-lock') {
        await updateUserStatus(user.id, { status: 'banned', expectedVersion: user.version }, signal)
      } else {
        await resendUserVerificationEmail(user.id, signal)
      }
      succeeded++
    } catch (error) {
      if (signal.aborted) throw error
      failures.push(user.fullName + ': ' + errorMessage(error))
    }
  }
  const operation = action.kind === 'bulk-lock' ? 'Khóa tài khoản' : 'Yêu cầu gửi email xác minh'
  return {
    level: failures.length ? (succeeded ? 'warning' : 'error') : succeeded ? 'success' : 'warning',
    text: `${operation}: ${succeeded} thành công, ${failures.length} thất bại, ${skipped} bỏ qua.`
      + (failures.length ? ' ' + failures[0] : ''),
  }
}

export function useUserActions(actorId: string | undefined) {
  const queryClient = useQueryClient()
  const busy = useRef(false)
  const mutation = useAbortableMutation<UserAction, Outcome>(
    ['users', 'action'], (action, signal) => executeAction(action, actorId, signal),
  )

  const runAction = async (action: UserAction) => {
    if (busy.current) return false
    busy.current = true
    try {
      const result = await mutation.mutateAsync(action)
      void message[result.level](result.text)
      return result.level !== 'error'
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        void message.error(errorMessage(error))
      }
      return false
    } finally {
      // Làm mới cả dữ liệu trang và số lượng tab, kể cả khi một phần thao tác thất bại.
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      busy.current = false
    }
  }

  return { runAction, isMutating: mutation.isPending }
}
