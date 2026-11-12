import { describe, expect, it, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from './LoginPage'
import { setAuthStatus, setSession } from '@/shared/api/session'

const tokens = {
  accessToken: 'login-test-token',
  refreshToken: 'login-test-refresh',
  expiresAt: '2026-11-05T10:00:00Z',
}

describe('LoginPage returnTo and admin access protection', () => {
  beforeEach(() => {
    setAuthStatus('unauthenticated')
    setSession(null)
  })

  it('renders login form cleanly without warning when guest', () => {
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/login']}>
        <QueryClientProvider client={qc}>
          <LoginPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).toContain('Đăng nhập')
    expect(markup).not.toContain('Tài khoản không có quyền quản trị viên')
  })

  it('displays warning alert when non-admin attempts admin returnTo', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'login-test-token'], {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      fullName: 'Regular User',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['USER'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: '/admin/overview' },
          },
        ]}
      >
        <QueryClientProvider client={qc}>
          <LoginPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(markup).toContain('Tài khoản không có quyền quản trị viên')
    expect(markup).toContain('/admin/overview')
    expect(markup).toContain('user@example.com')
  })

  it('does not display warning when returnTo is an open redirect attempt', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'login-test-token'], {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      fullName: 'Regular User',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['USER'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: '//evil.com/admin' },
          },
        ]}
      >
        <QueryClientProvider client={qc}>
          <LoginPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(markup).not.toContain('Tài khoản không có quyền quản trị viên')
  })
})

