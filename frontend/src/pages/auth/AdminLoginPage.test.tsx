import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/api-error'
import { setAuthStatus, setSession } from '@/shared/api/session'
import { AdminLoginPage } from './AdminLoginPage'

const session = { accessToken: 'admin-entry-test', refreshToken: 'refresh-test', expiresAt: '2099-01-01T00:00:00Z' }
const key = ['auth', 'current-user', session.accessToken]
const account = {
  id: '11111111-1111-4111-8111-111111111111', email: 'member@example.com',
  fullName: 'Người dùng', phone: null, status: 'ACTIVE', emailVerified: true, version: 1,
}

describe('admin login screen', () => {
  let client: QueryClient
  beforeEach(() => {
    setAuthStatus('unauthenticated')
    setSession(null)
    client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } })
  })
  afterEach(() => { setAuthStatus('unauthenticated'); setSession(null); client.clear() })

  function render() {
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/login']}>
        <QueryClientProvider client={client}><AdminLoginPage /></QueryClientProvider>
      </MemoryRouter>,
    )
  }

  it('offers only the credential form, with accessible labels and password manager support', () => {
    const html = render()
    expect(html).toContain('Đăng nhập quản trị')
    expect(html).toContain('type="email"')
    expect(html).toContain('autoComplete="username"')
    expect(html).toContain('autoComplete="current-password"')
    expect(html).toContain('type="submit"')
    expect(html).toContain('Quên mật khẩu?')
    expect(html).not.toContain('Kết quả từ máy chủ')
    expect(html).not.toContain('Làm mới phiên')
  })

  it('shows verifying state while session restoration is in flight', () => {
    setAuthStatus('restoring')
    const html = render()
    expect(html).toContain('Đang xác minh quyền truy cập')
    expect(html).not.toContain('type="password"')
  })

  it('does not offer another credential submission while verifying a session', () => {
    setSession(session)
    const html = render()
    expect(html).toContain('Đang xác minh quyền truy cập')
    expect(html).not.toContain('type="password"')
  })

  it('denies a verified non-admin and offers another account without exposing dashboard content', () => {
    setSession(session)
    client.setQueryData(key, { ...account, roles: ['USER'] })
    const html = render()
    expect(html).toContain('Tài khoản chưa có quyền quản trị')
    expect(html).toContain('member@example.com')
    expect(html).toContain('Đăng nhập bằng tài khoản khác')
    expect(html).not.toContain('type="password"')
  })

  it('allows a verified hotel owner to proceed without denial warning', () => {
    setSession(session)
    client.setQueryData(key, { ...account, roles: ['HOTEL_OWNER'] })
    const html = render()
    expect(html).not.toContain('Tài khoản chưa có quyền quản trị')
    expect(html).toContain('Đang xác minh quyền truy cập')
  })

  it('offers verification retry after server failure without requesting credentials again', async () => {
    setSession(session)
    await client.fetchQuery({ queryKey: key, queryFn: () => Promise.reject(new ApiError('Dịch vụ tạm thời không phản hồi.', { kind: 'http', status: 503 })) }).catch(() => {})
    const html = render()
    expect(html).toContain('Chưa xác minh được tài khoản')
    expect(html).toContain('Thử lại')
    expect(html).toContain('Đăng nhập bằng tài khoản khác')
    expect(html).not.toContain('type="password"')
  })
})
