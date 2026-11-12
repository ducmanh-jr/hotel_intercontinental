import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { CreateHotelForm } from './CreateHotelForm'

const auth = vi.hoisted(() => ({
  currentUser: { id: '22222222-2222-4222-8222-222222222222' },
  isAdmin: true, isOwner: false, isChecking: false, isAuthorized: true,
}))
vi.mock('@/features/auth', () => ({ useCurrentUser: () => auth }))

describe('CreateHotelForm component' , () => {
  it('renders all backend-required fields, photo gallery section, and excludes unsupported fields', () => {
    const qc = new QueryClient()
    qc.setQueryData(['hotels', 'catalog', 'cities', 'api'], [
      { id: '11111111-1111-4111-8111-111111111101', name: 'Đà Nẵng', slug: 'da-nang', countryCode: 'VN' },
      { id: '11111111-1111-4111-8111-111111111102', name: 'Hà Nội', slug: 'ha-noi', countryCode: 'VN' },
    ])

    const markup = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <AntApp>
          <CreateHotelForm />
        </AntApp>
      </QueryClientProvider>,
    )

    // Header & Titles
    expect(markup).toContain('Tạo hồ sơ khách sạn')
    expect(markup).toContain('Thông tin chung &amp; Nhận diện')
    expect(markup).toContain('Vị trí &amp; Tọa độ định vị GPS')
    expect(markup).toContain('Thư viện hình ảnh khách sạn')
    expect(markup).toContain('Quy định giờ lưu trú')

    // Backend-supported fields present
    expect(markup).toContain('Tên khách sạn chính thức')
    expect(markup).toContain('Tiêu chuẩn sao')
    expect(markup).toContain('Tỉnh / Thành phố')
    expect(markup).toContain('Mô tả &amp; Điểm nổi bật')
    expect(markup).toContain('Địa chỉ chi tiết')
    expect(markup).toContain('Vĩ độ (Latitude)')
    expect(markup).toContain('Kinh độ (Longitude)')
    expect(markup).toContain('Giờ nhận phòng (Check-in)')
    expect(markup).toContain('Giờ trả phòng (Check-out)')

    expect(markup).toContain('Chủ sở hữu (Owner User ID)')
    expect(markup).toContain('HOTEL_OWNER')
    expect(markup).not.toContain('dữ liệu mẫu')

    // Photo upload section present
    expect(markup).toContain('Kéo thả ảnh vào đây hoặc nhấp để chọn tệp')
    expect(markup).toContain('Tối đa 5MB mỗi ảnh')

    // Interactive Map and Design elements present
    expect(markup).toContain('map-frame')
    expect(markup).toContain('Bản đồ tương tác toàn quốc')
    expect(markup).toContain('Thu phóng:')
    expect(markup).toContain('Toàn quốc')
    expect(markup).toContain('Lăn chuột để phóng to/thu nhỏ')
    expect(markup).toContain('Định vị từ địa chỉ')

    // Approval Checklist and Progress bar
    expect(markup).toContain('Tiến độ hoàn thiện hồ sơ')
    expect(markup).toContain('Bản nháp (DRAFT)')
    expect(markup).toContain('Checklist thẩm định StayHub')

    // Excluded fields not supported or removed from UI
    expect(markup).not.toContain('Chủ sở hữu cơ sở lưu trú')
    expect(markup).not.toContain('Hợp đồng hoa hồng')
    expect(markup).not.toContain('Hotline / Số điện thoại')
    expect(markup).not.toContain('Email lễ tân')
    expect(markup).not.toContain('Tiện ích &amp; Dịch vụ khách sạn')
  })
})
