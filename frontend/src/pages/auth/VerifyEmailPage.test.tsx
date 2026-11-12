import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VerifyEmailPage } from './VerifyEmailPage'

describe('VerifyEmailPage', () => {
  it('renders dedicated verification screen with clean layout and no technical workbench', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/verify-email']}>
        <QueryClientProvider client={queryClient}>
          <VerifyEmailPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    // Dedicated brand header
    expect(html).toContain('StayHub')
    expect(html).toContain('Bộ sưu tập lưu trú')

    // Missing token message rendered by default when no query param is present
    expect(html).toContain('Liên kết xác minh không hợp lệ')
    expect(html).toContain('Không tìm thấy mã xác minh trong đường dẫn')

    // Actions
    expect(html).toContain('Về trang chủ')
    expect(html).toContain('Đăng nhập')

    // Diagnostics / workbench completely absent
    expect(html).not.toContain('Thực hiện các chức năng tài khoản đã có trên máy chủ')
    expect(html).not.toContain('workbench')
    expect(html).not.toContain('Trạng thái hệ thống')
  })

  it('renders verifying state when a token is provided in the query params', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/verify-email?token=valid-token-123']}>
        <QueryClientProvider client={queryClient}>
          <VerifyEmailPage overrideToken="valid-token-123" />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(html).toContain('Đang xác minh email')
    expect(html).toContain('Hệ thống đang kiểm tra liên kết xác minh tài khoản của bạn')
    expect(html).toContain('Đang xử lý...')
    expect(html).toContain('disabled=""')
  })
})
