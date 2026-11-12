import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { QuickCreateHotelForm } from './QuickCreateHotelForm'

describe('QuickCreateHotelForm component', () => {
  it('uses the complete API form so the user supplies a real address', () => {
    const qc = new QueryClient()
    qc.setQueryData(['hotels', 'cities'], [
      { id: '11111111-1111-4111-8111-111111111101', name: 'Đà Nẵng', slug: 'da-nang', countryCode: 'VN' },
      { id: '11111111-1111-4111-8111-111111111102', name: 'Hà Nội', slug: 'ha-noi', countryCode: 'VN' },
    ])

    const markup = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <AntApp>
          <QuickCreateHotelForm onSuccess={vi.fn()} onCancel={vi.fn()} />
        </AntApp>
      </QueryClientProvider>,
    )

    expect(markup).toContain('Tạo hồ sơ khách sạn')
    expect(markup).toContain('Địa chỉ chi tiết')
    expect(markup).toContain('Giờ nhận phòng (Check-in)')
    expect(markup).toContain('Giờ trả phòng (Check-out)')
    expect(markup).not.toContain('Chưa cập nhật địa chỉ')
    expect(markup).not.toContain('Quy trình tạo hồ sơ nhanh')
  })
})
