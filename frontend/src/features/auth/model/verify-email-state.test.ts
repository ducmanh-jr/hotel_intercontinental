import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/api-error'
import {
  clearTokenVerification,
  executeEmailVerification,
  mapVerifyEmailError,
  resetVerifyEmailRegistry,
} from './verify-email-state'

describe('verify-email-state logic', () => {
  beforeEach(() => {
    resetVerifyEmailRegistry()
  })

  afterEach(() => {
    resetVerifyEmailRegistry()
  })

  it('returns missing-token and does NOT call api when token is empty or whitespace', async () => {
    const apiMock = vi.fn()
    const result1 = await executeEmailVerification('', apiMock)
    const result2 = await executeEmailVerification('   ', apiMock)

    expect(result1).toEqual({ status: 'missing-token', errorMessage: null })
    expect(result2).toEqual({ status: 'missing-token', errorMessage: null })
    expect(apiMock).not.toHaveBeenCalled()
  })

  it('verifies token successfully and caches result to avoid duplicate calls', async () => {
    const apiMock = vi.fn().mockResolvedValue({ accepted: true })
    const result = await executeEmailVerification('token-abc-123', apiMock)

    expect(result).toEqual({ status: 'success', errorMessage: null })
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledWith('token-abc-123')

    // Second call with same verified token returns success immediately without re-calling api
    const secondResult = await executeEmailVerification('token-abc-123', apiMock)
    expect(secondResult).toEqual({ status: 'success', errorMessage: null })
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('returns session and user when response includes tokens and user profile', async () => {
    const apiResponse = {
      accepted: true,
      accessToken: 'access-jwt-token',
      tokenType: 'Bearer' as const,
      expiresAt: '2026-11-07T12:00:00Z',
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'customer@stayhub.test',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        status: 'ACTIVE',
        emailVerified: true,
        version: 1,
      },
    }
    const apiMock = vi.fn().mockResolvedValue(apiResponse)
    const result = await executeEmailVerification('jwt-token-val', apiMock)

    expect(result).toEqual({
      status: 'success',
      errorMessage: null,
      session: {
        accessToken: 'access-jwt-token',
        expiresAt: '2026-11-07T12:00:00Z',
      },
      user: apiResponse.user,
    })

    // Cached result also retains session and user
    const secondCall = await executeEmailVerification('jwt-token-val', apiMock)
    expect(secondCall).toEqual(result)
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('prevents concurrent / StrictMode duplicate requests by reusing the in-flight promise', async () => {
    let resolvePromise: (value: { accepted: boolean }) => void
    const pendingPromise = new Promise<{ accepted: boolean }>((resolve) => {
      resolvePromise = resolve
    })
    const apiMock = vi.fn().mockImplementation(() => pendingPromise)

    // Two simultaneous calls (e.g. React StrictMode mount 1 and mount 2)
    const p1 = executeEmailVerification('strict-mode-token', apiMock)
    const p2 = executeEmailVerification('strict-mode-token', apiMock)

    expect(apiMock).toHaveBeenCalledTimes(1)

    resolvePromise!({ accepted: true })

    const [res1, res2] = await Promise.all([p1, p2])
    expect(res1).toEqual({ status: 'success', errorMessage: null })
    expect(res2).toEqual({ status: 'success', errorMessage: null })
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('maps TOKEN_EXPIRED error to expired status', async () => {
    const error = new ApiError('Liên kết đã hết hạn.', {
      kind: 'http',
      status: 422,
      code: 'TOKEN_EXPIRED',
    })
    const apiMock = vi.fn().mockRejectedValue(error)

    const result = await executeEmailVerification('expired-tok', apiMock)
    expect(result).toEqual({ status: 'expired', errorMessage: null })
  })

  it('maps TOKEN_INVALID error to invalid status', async () => {
    const error = new ApiError('Mã không hợp lệ.', {
      kind: 'http',
      status: 422,
      code: 'TOKEN_INVALID',
    })
    const apiMock = vi.fn().mockRejectedValue(error)

    const result = await executeEmailVerification('invalid-tok', apiMock)
    expect(result).toEqual({ status: 'invalid', errorMessage: null })
  })

  it('maps TOKEN_ALREADY_USED error to already-used status and does not infer success', async () => {
    const error = new ApiError('Mã đã dùng.', {
      kind: 'http',
      status: 422,
      code: 'TOKEN_ALREADY_USED',
    })
    const apiMock = vi.fn().mockRejectedValue(error)

    const result = await executeEmailVerification('used-tok', apiMock)
    expect(result).toEqual({ status: 'already-used', errorMessage: null })
  })

  it('maps network or timeout error cleanly and allows retry', async () => {
    const netErr = new ApiError('Lỗi kết nối mạng.', {
      kind: 'network',
      code: 'NETWORK_ERROR',
    })
    const apiMock = vi.fn()
      .mockRejectedValueOnce(netErr)
      .mockResolvedValueOnce({ accepted: true })

    const res1 = await executeEmailVerification('net-tok', apiMock)
    expect(res1.status).toBe('error')
    expect(res1.errorMessage).toBe('Lỗi kết nối mạng.')
    expect(apiMock).toHaveBeenCalledTimes(1)

    // User initiates retry: clear token and call again
    clearTokenVerification('net-tok')
    const res2 = await executeEmailVerification('net-tok', apiMock)
    expect(res2).toEqual({ status: 'success', errorMessage: null })
    expect(apiMock).toHaveBeenCalledTimes(2)
  })

  it('rejects response if accepted is false', async () => {
    const apiMock = vi.fn().mockResolvedValue({ accepted: false })
    const result = await executeEmailVerification('rejected-tok', apiMock)

    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('không hợp lệ')
  })

  it('mapVerifyEmailError handles non-ApiError instances gracefully', () => {
    const result = mapVerifyEmailError(new Error('Unknown generic error'))
    expect(result.status).toBe('error')
    expect(result.errorMessage).toContain('Không thể kết nối đến máy chủ')
  })
})
