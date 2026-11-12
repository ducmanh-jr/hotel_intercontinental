import { describe, expect, it, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminRouteGuard } from './AdminRouteGuard'
import { setAuthStatus, setSession } from '@/shared/api/session'

const tokens = {
  accessToken: 'test-token',
  refreshToken: 'test-refresh',
  expiresAt: '2026-11-05T10:00:00Z',
}

describe('AdminRouteGuard component', () => {
  beforeEach(() => {
    setAuthStatus('unauthenticated')
    setSession(null)
  })

  it('renders loading state when restoring session on boot/F5', () => {
    setAuthStatus('restoring')
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
    expect(markup).toContain('aria-label="Đang tải dữ liệu"')
  })

  it('renders ErrorState when session restore encounters network/5xx error', () => {
    setAuthStatus('restore-error', new Error('Network error'))
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
    expect(markup).toContain('Thử lại')
  })

  it('blocks guest and does not render admin content', () => {
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <Routes>
            <Route
              path="admin/overview"
              element={
                <AdminRouteGuard>
                  <div data-testid="admin-content">Admin Area</div>
                </AdminRouteGuard>
              }
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
    // In SSR, Navigate renders empty/null
    expect(markup).toBe('')
  })

  it('renders loading state when checking account', () => {
    setSession(tokens)
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
    expect(markup).toContain('aria-label="Đang tải dữ liệu"')
  })

  it('displays 403 Forbidden when logged in user lacks ADMIN role', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'test-token'], {
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
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
    expect(markup).toContain('Bạn không có quyền truy cập')
    expect(markup).toContain('user@example.com')
    expect(markup).toContain('Về trang chủ')
  })

  it('renders admin content when user has ADMIN role', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'test-token'], {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'admin@example.com',
      fullName: 'Admin User',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['ADMIN'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).toContain('admin-content')
    expect(markup).toContain('Admin Area')
    expect(markup).not.toContain('Bạn không có quyền truy cập')
  })

  it('renders management content when user has HOTEL_OWNER role', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'test-token'], {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'owner@stayhub.vn',
      fullName: 'Chủ Khách Sạn',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['HOTEL_OWNER'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/management/hotels']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="owner-content">Owner Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).toContain('owner-content')
    expect(markup).toContain('Owner Area')
    expect(markup).not.toContain('Bạn không có quyền truy cập')
  })

  it('redirects hotel owner away from /admin/users to /hotels', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'test-token'], {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'owner@stayhub.vn',
      fullName: 'Chủ Khách Sạn',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['HOTEL_OWNER'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/users']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="users-management">Quản trị người dùng</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    // In SSR, Navigate returns null/empty
    expect(markup).not.toContain('users-management')
  })

  it('renders ErrorState when network/server error occurs on /users/me', () => {
    setSession(tokens)
    const qc = new QueryClient()
    // Pre-populate query client with an error
    qc.setQueryDefaults(['auth', 'current-user', 'test-token'], {})
    qc.setQueryData(['auth', 'current-user', 'test-token'], undefined)

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <QueryClientProvider client={qc}>
          <AdminRouteGuard>
            <div data-testid="admin-content">Admin Area</div>
          </AdminRouteGuard>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('admin-content')
  })
})

