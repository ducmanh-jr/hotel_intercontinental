import { describe, expect, it, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './AppLayout'
import { DataModeProvider } from '@/shared/lib/data-mode'
import { setSession } from '@/shared/api/session'

const tokens = {
  accessToken: 'nav-test-token',
  refreshToken: 'nav-test-refresh',
  expiresAt: '2026-11-05T10:00:00Z',
}

describe('AppLayout navigation', () => {
  beforeEach(() => {
    setSession(null)
  })

  it('hides "StayHub Admin" link for guest users', () => {
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <DataModeProvider>
            <AppLayout />
          </DataModeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('StayHub Admin')
  })

  it('hides "StayHub Admin" link for regular non-admin users', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'nav-test-token'], {
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
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <DataModeProvider>
            <AppLayout />
          </DataModeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('StayHub Admin')
  })

  it('hides "StayHub Admin" link while checking user account', () => {
    setSession(tokens)
    const qc = new QueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <DataModeProvider>
            <AppLayout />
          </DataModeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).not.toContain('StayHub Admin')
  })

  it('shows "StayHub Admin" link on desktop and mobile drawer for ADMIN users', () => {
    setSession(tokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'nav-test-token'], {
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
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <DataModeProvider>
            <AppLayout />
          </DataModeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).toContain('StayHub Admin')
    expect(markup).toContain('href="/admin/users"')
  })
})

