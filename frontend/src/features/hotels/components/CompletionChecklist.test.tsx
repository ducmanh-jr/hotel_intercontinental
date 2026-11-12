import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { CompletionChecklist } from './CompletionChecklist'
import type { ManagementHotelDetail } from '../model/hotel'
import type { HotelCompletionStatus } from '../context/hotel-workspace-context'

const roles = vi.hoisted(() => ({ isAdmin: false }))
vi.mock('@/features/auth', () => ({ useCurrentUser: () => roles }))

const mockHotel: ManagementHotelDetail = {
  id: 'h101',
  ownerUserId: 'u101',
  name: 'StayHub Seaside Resort',
  slug: 'stayhub-seaside',
  cityName: 'Đà Nẵng',
  cityId: 'c1',
  address: '100 Đường Biển, Đà Nẵng',
  description: 'Khu nghỉ dưỡng view biển đẹp.',
  starRating: 5,
  latitude: null,
  longitude: null,
  status: 'DRAFT',
  checkInTime: '14:00:00',
  checkOutTime: '12:00:00',
  amenityIds: ['wifi', 'pool'],
  roomTypes: [],
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
}

describe('CompletionChecklist component', () => {
  afterEach(() => { roles.isAdmin = false })
  it('renders all 5 checklist criteria, progress stats, and disabled approval button when incomplete', () => {
    const qc = new QueryClient()
    const partialCompletion: HotelCompletionStatus = {
      percent: 40,
      sections: {
        info: true,
        photos: false,
        amenities: true,
        rooms: false,
        pricing: false,
        policies: true,
        bookings: false,
        reviews: false,
      },
    }

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <AntApp>
            <CompletionChecklist hotel={mockHotel} completion={partialCompletion} />
          </AntApp>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    // Heading & Progress
    expect(markup).toContain('Checklist hoàn thiện hồ sơ')
    expect(markup).toContain('40% hoàn tất')
    expect(markup).toContain('Còn 3 mục chưa xác minh hoặc hoàn tất')

    // 5 criteria present
    expect(markup).toContain('Thông tin cơ bản')
    expect(markup).toContain('Ảnh đại diện khách sạn')
    expect(markup).toContain('Chọn tiện ích khách sạn')
    expect(markup).toContain('Có ít nhất 1 loại phòng')
    expect(markup).toContain('Thiết lập giá bán theo đêm')

    // Action buttons for subpages present
    expect(markup).toContain('Cập nhật')
    expect(markup).toContain('Thêm ảnh')
    expect(markup).toContain('Chọn tiện ích')
    expect(markup).toContain('Tạo phòng')
    expect(markup).toContain('Đặt giá')

    // Submit for approval button present
    expect(markup).toContain('Gửi kiểm duyệt')
    expect(markup).toContain('Backend chưa hỗ trợ gửi hồ sơ kiểm duyệt')
  })

  it('does not enable an unsupported owner submission even when all criteria are complete', () => {
    const qc = new QueryClient()
    const fullCompletion: HotelCompletionStatus = {
      percent: 100,
      sections: {
        info: true,
        photos: true,
        amenities: true,
        rooms: true,
        pricing: true,
        policies: true,
        bookings: false,
        reviews: false,
      },
    }

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <AntApp>
            <CompletionChecklist hotel={mockHotel} completion={fullCompletion} />
          </AntApp>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(markup).toContain('100% hoàn tất')
    expect(markup).toContain('Đã hoàn thiện các mục kiểm tra')
    expect(markup).toContain('Gửi kiểm duyệt')
    const button = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)?.find((item) => item.includes('Gửi kiểm duyệt'))
    expect(button).toContain('disabled')
  })

  it('allows the real admin approval of a draft without unsupported checklist prerequisites', () => {
    roles.isAdmin = true
    const completion: HotelCompletionStatus = {
      percent: 0,
      sections: { info: false, photos: false, amenities: false, rooms: false, pricing: false, policies: false, bookings: false, reviews: false },
    }
    const markup = renderToStaticMarkup(
      <MemoryRouter><QueryClientProvider client={new QueryClient()}><AntApp>
        <CompletionChecklist hotel={mockHotel} completion={completion} />
      </AntApp></QueryClientProvider></MemoryRouter>,
    )
    const button = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)?.find((item) => item.includes('Duyệt khách sạn'))
    expect(button).toBeDefined()
    expect(button).not.toContain('disabled')
  })
})
