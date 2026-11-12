import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetcher = vi.fn<typeof fetch>()
const tokens = {
  accessToken: 'access', refreshToken: 'refresh', tokenType: 'Bearer',
  expiresAt: '2026-11-05T10:00:00Z', user: null,
}
function respond(data: unknown, status = 200) {
  fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data }), { status }))
}
beforeEach(() => {
  vi.resetModules()
  fetcher.mockReset()
  vi.stubGlobal('fetch', fetcher)
})
afterEach(() => vi.unstubAllGlobals())

describe('independent authentication feature', () => {
  it('logs in through real HTTP handling, clears private cache and redacts displayed tokens', async () => {
    respond(tokens)
    const { runAuthAction } = await import('../hooks/use-auth-action')
    const { getSession } = await import('@/shared/api/session')
    const { queryClient } = await import('@/shared/lib/query-client')
    queryClient.setQueryData(['private-before-login'], { private: true })
    const result = await runAuthAction('login', { email: 'a@b.com', password: 'password' })
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/auth/login')
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ email: 'a@b.com', password: 'password', rememberMe: false })
    expect(getSession()).toMatchObject({ accessToken: 'access' })
    expect(queryClient.getQueryData(['private-before-login'])).toBeUndefined()
    expect(result).toEqual({ user: null, expiresAt: tokens.expiresAt })
  })

  it('sends rememberMe flag when provided in login request', async () => {
    respond(tokens)
    const { runAuthAction } = await import('../hooks/use-auth-action')
    await runAuthAction('login', { email: 'a@b.com', password: 'password', rememberMe: true })
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ email: 'a@b.com', password: 'password', rememberMe: true })
  })

  it('rotates the in-memory refresh token and sends no stale access token to refresh', async () => {
    respond({ ...tokens, accessToken: 'next', refreshToken: null })
    const { runAuthAction } = await import('../hooks/use-auth-action')
    const { getSession, setSession } = await import('@/shared/api/session')
    setSession(tokens)
    await runAuthAction('refresh', {})
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({})
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has('Authorization')).toBe(false)
    expect(getSession()?.accessToken).toBe('next')
  })

  it('retains session and cache when logout is rejected', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ detail: 'Forbidden', code: 'ACCESS_DENIED' }), { status: 403 }))
    const { runAuthAction } = await import('../hooks/use-auth-action')
    const { getSession, setSession } = await import('@/shared/api/session')
    const { queryClient } = await import('@/shared/lib/query-client')
    setSession(tokens)
    queryClient.setQueryData(['private'], 'retained')
    await expect(runAuthAction('logout', {})).rejects.toMatchObject({ status: 403 })
    expect(getSession()?.accessToken).toBe('access')
    expect(queryClient.getQueryData(['private'])).toBe('retained')
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer access')
    queryClient.clear()
  })

  it.each([
    ['logout', {}, null, '/api/v1/auth/logout'],
    ['password', { currentPassword: 'old', newPassword: 'a-long-new-password' }, { changed: true }, '/api/v1/users/me/password'],
    ['reset-password', { token: 'email-token', newPassword: 'a-long-new-password' }, { reset: true }, '/api/v1/auth/reset-password'],
  ] as const)('clears the session and private cache after successful %s', async (action, values, response, path) => {
    respond(response)
    const { runAuthAction } = await import('../hooks/use-auth-action')
    const { getSession, setSession } = await import('@/shared/api/session')
    const { queryClient } = await import('@/shared/lib/query-client')
    setSession(tokens)
    queryClient.setQueryData(['private'], true)
    await runAuthAction(action, values)
    expect(fetcher.mock.calls[0][0]).toBe(path)
    expect(getSession()).toBeNull()
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })

  it('rejects invalid registration input before contacting the backend', async () => {
    const { runAuthAction } = await import('../hooks/use-auth-action')
    await expect(runAuthAction('register', { email: 'a@b.com', password: 'short', fullName: 'Test', phone: '123' })).rejects.toBeDefined()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    ['email-verifications', { token: 'verify-token' }, { accepted: true }, '/api/v1/auth/email-verifications'],
    ['forgot-password', { email: 'a@b.com' }, { accepted: true }, '/api/v1/auth/forgot-password'],
    ['register', { email: 'a@b.com', password: 'a-long-new-password', fullName: 'Test', phone: '123' }, {
      id: '11111111-1111-4111-8111-111111111111', email: 'a@b.com', fullName: 'Test', phone: '123',
      status: 'PENDING_VERIFICATION', emailVerified: false, version: 0,
    }, '/api/v1/auth/register'],
  ] as const)('preserves the backend contract for %s', async (action, values, response, path) => {
    respond(response)
    const { runAuthAction } = await import('../hooks/use-auth-action')
    expect(await runAuthAction(action, values)).toEqual(response)
    expect(fetcher.mock.calls[0][0]).toBe(path)
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual(values)
  })

  it('reads the current account with its roles and Bearer token', async () => {
    const account = {
      id: '11111111-1111-4111-8111-111111111111', email: 'a@b.com', fullName: 'Test', phone: null,
      status: 'ACTIVE', emailVerified: true, version: 1, roles: ['ADMIN'],
    }
    respond(account)
    const { getCurrentUser } = await import('./auth-api')
    const { setSession } = await import('@/shared/api/session')
    setSession(tokens)
    expect(await getCurrentUser()).toEqual(account)
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/users/me')
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer access')
  })

  it('rejects with ApiError 401 when fetching /users/me with invalid token', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ detail: 'Unauthorized', code: 'UNAUTHORIZED' }), { status: 401 }))
    const { getCurrentUser } = await import('./auth-api')
    const { setSession } = await import('@/shared/api/session')
    setSession(tokens)
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })
  })

  it('preserves the session when /users/me fails with 500 internal server error', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ detail: 'Server Error', code: 'INTERNAL_ERROR' }), { status: 500 }))
    const { getCurrentUser } = await import('./auth-api')
    const { getSession, setSession } = await import('@/shared/api/session')
    setSession(tokens)
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 500 })
    expect(getSession()).toMatchObject({ accessToken: 'access' })
  })

  it('keeps verification tokens out of the URL while preserving other parameters and hash', async () => {
    const { readAuthLinkToken } = await import('../model/auth-link-token')
    expect(readAuthLinkToken('https://example.test/reset-password?token=a%2Bb&next=account#form')).toEqual({
      token: 'a+b', cleanPath: '/reset-password?next=account#form',
    })
    expect(readAuthLinkToken('https://example.test/login')).toEqual({ token: '', cleanPath: '/login' })
  })
})
