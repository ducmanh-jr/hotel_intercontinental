import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { hotelManagementKeys } from '@/features/hotels/hooks/hotel-query-keys'
import { HotelManagementListPage } from './HotelManagementListPage'

const mockHotels = [
  {
    id: 'h1',
    ownerUserId: 'u1',
    name: 'Khách sạn Mây Heritage',
    slug: 'may-heritage',
    cityName: 'Đà Nẵng',
    cityId: 'c1',
    address: '123 Võ Nguyên Giáp',
    starRating: 5,
    status: 'ACTIVE' as const,
    checkInTime: '14:00:00',
    checkOutTime: '12:00:00',
    roomTypeCount: 3,
    coverImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'h2',
    ownerUserId: 'u1',
    name: 'An Nhiên Retreat',
    slug: 'an-nhien-retreat',
    cityName: 'Phú Quốc',
    cityId: 'c2',
    address: 'Bãi Trường',
    starRating: 4,
    status: 'DRAFT' as const,
    checkInTime: '14:00:00',
    checkOutTime: '12:00:00',
    roomTypeCount: 1,
    coverImageUrl: null,
    updatedAt: '2026-11-01T00:00:00Z',
  },
]

describe('HotelManagementListPage component', () => {
  const createMockQueryClient = (hotels = mockHotels) => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    qc.setQueryData(hotelManagementKeys.cities('api'), [
      { id: 'c1', name: 'Đà Nẵng', slug: 'da-nang', countryCode: 'VN' },
      { id: 'c2', name: 'Phú Quốc', slug: 'phu-quoc', countryCode: 'VN' },
    ])
    qc.setQueryData(
      hotelManagementKeys.list('api', { page: 0, size: 12 }),
      {
        content: hotels,
        page: 0,
        size: 12,
        totalElements: hotels.length,
        totalPages: 1,
        first: true,
        last: true,
      },
    )
    return qc
  }

  it('renders header, toolbar, cards, and action buttons', () => {
    const qc = createMockQueryClient()
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/hotels']}>
        <QueryClientProvider client={qc}>
          <AntApp>
            <HotelManagementListPage />
          </AntApp>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    // Header & CTA
    expect(markup).toContain('Khách sạn')
    expect(markup).toContain('Thêm khách sạn')

    // Toolbar elements
    expect(markup).toContain('Tìm kiếm theo tên khách sạn...')
    expect(markup).toContain('Tất cả trạng thái')
    expect(markup).toContain('Thẻ')
    expect(markup).toContain('Bảng')

    // Card Items
    expect(markup).toContain('Khách sạn Mây Heritage')
    expect(markup).toContain('An Nhiên Retreat')
    expect(markup).toContain('3 loại phòng')
    expect(markup).toContain('1 loại phòng')
    expect(markup).toContain('Quản lý')
  })

  it('renders empty state with primary creation CTA when no hotels exist', () => {
    const qc = createMockQueryClient([])
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/hotels']}>
        <QueryClientProvider client={qc}>
          <AntApp>
            <HotelManagementListPage />
          </AntApp>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(markup).toContain('Chưa có khách sạn nào')
    expect(markup).toContain('Tạo khách sạn đầu tiên')
  })
})
