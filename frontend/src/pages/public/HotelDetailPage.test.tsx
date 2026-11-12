import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HotelDetailPage } from './HotelDetailPage'

describe('HotelDetailPage UI/UX', () => {
  const createMockQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

  it('renders default The Lagom Room with exact typography, price and sections', () => {
    const qc = createMockQueryClient()
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/hotels/the-lagom']}>
          <Routes>
            <Route path="hotels/:hotelId" element={<HotelDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Verify Title & Type
    expect(markup).toContain('The Lagom Room')
    expect(markup).toContain('Toàn bộ căn hộ studio · Co-living Kolab')
    expect(markup).toContain('Quận 1, TP. Hồ Chí Minh')

    // Verify Ratings & Award Lockup
    expect(markup).toContain('4.92')
    expect(markup).toContain('128 đánh giá')
    expect(markup).toContain('Được khách yêu thích')
    expect(markup).toContain('Chủ nhà siêu cấp')

    // Verify Price breakdown
    expect(markup).toContain('890.000₫')
    expect(markup).toContain('Đặt phòng')
    expect(markup).toContain('Bạn vẫn chưa bị trừ tiền')

    // Verify Amenities & Sections
    expect(markup).toContain('Nơi này có những gì cho bạn?')
    expect(markup).toContain('Wi-Fi tốc độ cao (150 Mbps)')
    expect(markup).toContain('Hiển thị tất cả 32 tiện nghi')
    expect(markup).toContain('Nơi bạn sẽ đến')
    expect(markup).toContain('Gặp gỡ chủ nhà của bạn')
    expect(markup).toContain('Những điều cần biết')
  })

  it('renders specific hotel like cloud-pine correctly', () => {
    const qc = createMockQueryClient()
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/hotels/cloud-pine']}>
          <Routes>
            <Route path="hotels/:hotelId" element={<HotelDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(markup).toContain('Cloud Pine Glamping')
    expect(markup).toContain('Đà Lạt, Lâm Đồng')
    expect(markup).toContain('1.390.000₫')
    expect(markup).toContain('Bảo Nam &amp; Thu Hà')
  })

  it('renders top switcher chips to easily switch between properties', () => {
    const qc = createMockQueryClient()
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/hotels/the-lagom']}>
          <Routes>
            <Route path="hotels/:hotelId" element={<HotelDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(markup).toContain('The Lagom (Q1 · Chuẩn StayHub)')
    expect(markup).toContain('Cloud Pine (Đà Lạt)')
    expect(markup).toContain('An Nhiên (Phú Quốc)')
    expect(markup).toContain('Mây Heritage (Đà Nẵng)')
  })
})
