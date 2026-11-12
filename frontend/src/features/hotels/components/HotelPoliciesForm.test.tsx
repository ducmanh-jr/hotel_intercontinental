import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { App } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HotelPoliciesForm } from './HotelPoliciesForm'
import type { ManagementHotelDetail } from '../model/hotel'

it('edits actual policy hours and exposes the backend limit without sample cancellation rules', () => {
  const hotel = { id: '11111111-1111-4111-8111-111111111111', checkInTime: '15:00:00', checkOutTime: '11:00:00', version: 4 } as ManagementHotelDetail
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><App><HotelPoliciesForm hotel={hotel} /></App></QueryClientProvider>)
  expect(html).toContain('value="15:00"')
  expect(html).toContain('value="11:00"')
  expect(html).toContain('Lưu giờ nhận/trả phòng')
  expect(html).toContain('chưa có API')
  expect(html).not.toContain('Miễn phí hủy trước')
})
