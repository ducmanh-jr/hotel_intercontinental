import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthPanel } from './AuthPanel'

describe('auth screen composition', () => {
  it.each([
    ['login', 'Đăng nhập'],
    ['register', 'Đăng ký'],
    ['email-verifications', 'Xác minh email'],
    ['forgot-password', 'Quên mật khẩu'],
    ['reset-password', 'Đặt lại mật khẩu'],
  ] as const)('renders the existing form for auth route %s', (initialAction, label) => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <AuthPanel initialAction={initialAction} />
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(markup).toMatch(new RegExp(`<h2[^>]*>${label}</h2>`))
    if (initialAction === 'login') {
      expect(markup).toContain('href="/register"')
      expect(markup).toContain('href="/forgot-password"')
      expect(markup).toContain('autoComplete="current-password"')
    }
  })
})
