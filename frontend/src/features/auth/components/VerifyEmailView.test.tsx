import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VerifyEmailView } from './VerifyEmailView'
import type { VerifyEmailStatus } from '../hooks/use-verify-email'

function renderView(overrideStatus?: VerifyEmailStatus, overrideToken?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderToStaticMarkup(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <VerifyEmailView overrideStatus={overrideStatus} overrideToken={overrideToken} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('VerifyEmailView component', () => {
  it('renders verifying state with accessible loading indicator and disabled button', () => {
    const html = renderView('verifying')

    expect(html).toContain('StayHub')
    expect(html).toContain('Đang xác minh email')
    expect(html).toContain('Hệ thống đang kiểm tra liên kết xác minh')
    expect(html).toContain('Đang xử lý...')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('Kết quả từ máy chủ')
    expect(html).not.toContain('Làm mới phiên')
  })

  it('renders success state with clear title and login action link', () => {
    const html = renderView('success')

    expect(html).toContain('Xác minh email thành công')
    expect(html).toContain('Email của bạn đã được xác minh thành công')
    expect(html).toContain('href="/login"')
    expect(html).toContain('Đăng nhập')
    expect(html).toContain('Khám phá chỗ nghỉ')
    expect(html).not.toContain('token=')
    expect(html).not.toContain('<input')
  })

  it('renders countdown indicator and immediate navigation action when countdown is active', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <VerifyEmailView overrideStatus="success" countdown={3} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(html).toContain('Xác minh email thành công')
    expect(html).toContain('Đăng ký &amp; kích hoạt tài khoản thành công')
    expect(html).toContain('Tự động chuyển về trang chủ sau')
    expect(html).toContain('3')
    expect(html).toContain('Đến trang chủ ngay')
    expect(html).toContain('Khám phá chỗ nghỉ')
  })

  it('renders missing-token state when no verification token is provided', () => {
    const html = renderView('missing-token')

    expect(html).toContain('Liên kết xác minh không hợp lệ')
    expect(html).toContain('Không tìm thấy mã xác minh trong đường dẫn')
    expect(html).toContain('href="/"')
    expect(html).toContain('Về trang chủ')
  })

  it('renders expired state with appropriate explanation', () => {
    const html = renderView('expired')

    expect(html).toContain('Liên kết xác minh đã hết hạn')
    expect(html).toContain('Liên kết xác minh này đã hết hiệu lực')
    expect(html).toContain('href="/login"')
  })

  it('renders invalid state when verification token is malformed or invalid', () => {
    const html = renderView('invalid')

    expect(html).toContain('Liên kết không hợp lệ')
    expect(html).toContain('Mã xác minh không tồn tại hoặc sai định dạng')
    expect(html).toContain('href="/"')
  })

  it('renders already-used state and directs customer to login', () => {
    const html = renderView('already-used')

    expect(html).toContain('Liên kết đã được sử dụng')
    expect(html).toContain('Liên kết xác minh này đã được sử dụng trước đó')
    expect(html).toContain('href="/login"')
    expect(html).toContain('Đăng nhập')
  })

  it('renders error state with retry action button', () => {
    const html = renderView('error')

    expect(html).toContain('Không thể hoàn tất xác minh')
    expect(html).toContain('Thử lại')
    expect(html).toContain('Về trang chủ')
  })

  it('renders clean header and footer without exposing internal diagnostics', () => {
    const html = renderView('success')

    // Clean header
    expect(html).toContain('Bộ sưu tập lưu trú')
    expect(html).toContain('Về trang chủ')

    // Clean footer
    expect(html).toContain('© 2026 StayHub · Nền tảng đặt phòng nghỉ dưỡng. Mọi quyền được bảo lưu.')

    // Diagnostics / workbench must NEVER leak into customer view
    expect(html).not.toContain('Thực hiện các chức năng tài khoản đã có trên máy chủ')
    expect(html).not.toContain('Trạng thái hệ thống')
    expect(html).not.toContain('JSON')
    expect(html).not.toContain('raw payload')
  })
})
