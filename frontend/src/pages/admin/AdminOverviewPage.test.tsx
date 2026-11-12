import { describe, expect, it, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminOverviewPage } from './AdminOverviewPage'
import { setSession } from '@/shared/api/session'

const adminTokens = {
  accessToken: 'overview-test-token',
  refreshToken: 'overview-test-refresh',
  expiresAt: '2026-11-05T10:00:00Z',
}

describe('AdminOverviewPage component', () => {
  beforeEach(() => {
    setSession(null)
  })

  it('renders overview header and operational tasks with truthful data boundaries', () => {
    setSession(adminTokens)
    const qc = new QueryClient()
    qc.setQueryData(['auth', 'current-user', 'overview-test-token'], {
      id: '88888888-8888-4888-8888-888888888888',
      email: 'lead.admin@stayhub.vn',
      fullName: 'Vũ Quản Trị Hệ Thống',
      phone: null,
      status: 'ACTIVE',
      emailVerified: true,
      version: 1,
      roles: ['ADMIN'],
    })

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <AdminOverviewPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    // Heading
    expect(markup).toContain('Tổng quan')
    expect(markup).toContain('Theo dõi nhu cầu, doanh thu và vận hành StayHub trong một màn hình.')

    // Live verified user data
    expect(markup).toContain('Vũ Quản Trị Hệ Thống')
    expect(markup).toContain('lead.admin@stayhub.vn')

    // Operational shortcuts
    expect(markup).toContain('Quản lý tài khoản')
    expect(markup).toContain('Khách sạn')
    expect(markup).toContain('Trạng thái máy chủ')

    // Explicit truthful mock labels per design.md
    expect(markup).toContain('Phiên demo')
    expect(markup).toContain('Dữ liệu minh họa')
    expect(markup).toContain('Chưa kết nối')

    // Work queue and analytics visualizations from design.md
    expect(markup).toContain('Công việc cần xử lý')
    expect(markup).toContain('Hiệu suất kinh doanh')
    expect(markup).toContain('Lượng đặt phòng theo thời gian')
    expect(markup).toContain('Doanh thu nền tảng theo thời gian')
  })
})

