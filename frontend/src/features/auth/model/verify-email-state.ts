import { ApiError } from '@/shared/api/api-error'
import type { Session } from '@/shared/api/session'
import { verifyEmail } from '../api/auth-api'
import type { AuthUser, VerifyEmailResponse } from '../api/auth-contracts'

export type VerifyEmailStatus =
  | 'idle'
  | 'verifying'
  | 'success'
  | 'missing-token'
  | 'expired'
  | 'invalid'
  | 'already-used'
  | 'error'

export interface VerifyEmailResult {
  status: VerifyEmailStatus
  errorMessage: string | null
  session?: Session
  user?: AuthUser | null
}

export function mapVerifyEmailError(err: unknown): VerifyEmailResult {
  if (err instanceof ApiError) {
    const code = err.code?.toUpperCase()
    if (code === 'TOKEN_EXPIRED') {
      return { status: 'expired', errorMessage: null }
    }
    if (code === 'TOKEN_INVALID') {
      return { status: 'invalid', errorMessage: null }
    }
    if (code === 'TOKEN_ALREADY_USED') {
      return { status: 'already-used', errorMessage: null }
    }
    return {
      status: 'error',
      errorMessage: err.message || 'Không thể hoàn tất xác minh. Vui lòng thử lại.',
    }
  }
  return {
    status: 'error',
    errorMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền và thử lại.',
  }
}

// In-memory registries for in-flight requests and successfully verified tokens
const inFlightRequests = new Map<string, Promise<VerifyEmailResponse>>()
const verifiedResults = new Map<string, VerifyEmailResult>()

export function resetVerifyEmailRegistry() {
  inFlightRequests.clear()
  verifiedResults.clear()
}

export function isTokenVerified(token: string): boolean {
  return verifiedResults.has(token)
}

export function hasInFlightRequest(token: string): boolean {
  return inFlightRequests.has(token)
}

export function clearTokenVerification(token: string): void {
  inFlightRequests.delete(token)
  verifiedResults.delete(token)
}

export async function executeEmailVerification(
  token: string,
  onCallApi: (token: string) => Promise<VerifyEmailResponse> = (t) => verifyEmail({ token: t }),
): Promise<VerifyEmailResult> {
  if (!token || token.trim() === '') {
    return { status: 'missing-token', errorMessage: null }
  }

  const cached = verifiedResults.get(token)
  if (cached) {
    return cached
  }

  let promise = inFlightRequests.get(token)
  if (!promise) {
    promise = onCallApi(token)
    inFlightRequests.set(token, promise)
  }

  try {
    const res = await promise
    inFlightRequests.delete(token)
    if (res && res.accepted === true) {
      const session: Session | undefined =
        res.accessToken && res.expiresAt
          ? {
              accessToken: res.accessToken,
              expiresAt: res.expiresAt,
            }
          : undefined
      const successResult: VerifyEmailResult = {
        status: 'success',
        errorMessage: null,
        ...(session ? { session } : {}),
        ...(res.user ? { user: res.user } : {}),
      }
      verifiedResults.set(token, successResult)
      return successResult
    }
    return { status: 'error', errorMessage: 'Kết quả xác nhận không hợp lệ từ máy chủ.' }
  } catch (err) {
    inFlightRequests.delete(token)
    return mapVerifyEmailError(err)
  }
}
