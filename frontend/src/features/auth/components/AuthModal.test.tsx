import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { AuthModal } from './AuthModal'
import { ClientLoginForm } from './ClientLoginForm'
import { ClientRegisterForm } from './ClientRegisterForm'
import { setSession } from '@/shared/api/session'

function renderWithProviders(element: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderToStaticMarkup(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {element}
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('AuthModal and Client Auth Forms', () => {
  beforeEach(() => {
    setSession(null)
  })

  it('renders login form with exact 2 fields and proper labels when mode is login', () => {
    const markup = renderWithProviders(
      <AuthModal
        isOpen={true}
        initialMode="login"
        onClose={() => {}}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Đăng nhập tài khoản')

    // 2 fields: Email and Password
    expect(markup).toContain('id="')
    expect(markup).toContain('type="email"')
    expect(markup).toContain('autoComplete="username"')
    expect(markup).toContain('autoComplete="current-password"')

    // Buttons and switch line
    expect(markup).toContain('Đăng nhập')
    expect(markup).toContain('Chưa có tài khoản?')
    expect(markup).toContain('Đăng ký')
  })

  it('renders register form with exact 4 fields when mode is register', () => {
    const markup = renderWithProviders(
      <AuthModal
        isOpen={true}
        initialMode="register"
        onClose={() => {}}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('Tạo tài khoản mới')

    // 4 fields: Họ tên, Email, Số điện thoại, Mật khẩu
    expect(markup).toContain('Họ và tên')
    expect(markup).toContain('autoComplete="name"')
    expect(markup).toContain('autoComplete="email"')
    expect(markup).toContain('autoComplete="tel"')
    expect(markup).toContain('autoComplete="new-password"')

    // Primary action and switch line
    expect(markup).toContain('Đã có tài khoản?')
    expect(markup).toContain('Mật khẩu cần tối thiểu 15 ký tự theo quy định bảo mật hệ thống.')
  })

  it('does not render modal content when isOpen is false', () => {
    const markup = renderWithProviders(
      <AuthModal
        isOpen={false}
        initialMode="login"
        onClose={() => {}}
      />,
    )

    expect(markup).toBe('')
  })

  it('renders ClientLoginForm standalone with prefilled email', () => {
    const markup = renderWithProviders(
      <ClientLoginForm defaultEmail="guest@stayhub.vn" />,
    )

    expect(markup).toContain('value="guest@stayhub.vn"')
    expect(markup).toContain('autoComplete="current-password"')
    expect(markup).toContain('Chưa có tài khoản?')
  })

  it('renders ClientRegisterForm standalone with prefilled email', () => {
    const markup = renderWithProviders(
      <ClientRegisterForm defaultEmail="guest@stayhub.vn" />,
    )

    expect(markup).toContain('value="guest@stayhub.vn"')
    expect(markup).toContain('autoComplete="new-password"')
    expect(markup).toContain('Đã có tài khoản?')
  })
})
