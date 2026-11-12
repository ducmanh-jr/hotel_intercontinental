import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RoomTypeDailyRatesPanel } from './RoomTypeDailyRatesPanel'
import { hotelManagementKeys } from '../hooks/hotel-query-keys'
import { localRateDate } from '../model/room-rates'

describe('real room rate rendering', () => {
  it.each(['ACTIVE', 'DRAFT', 'SUSPENDED'])('renders real rates and allows preparing them while hotel is %s', (hotelStatus) => {
    const date = localRateDate()
    const client = new QueryClient()
    client.setQueryData(hotelManagementKeys.rates('api', { hotelId: 'hotel', roomTypeId: 'type', startDate: date, endDate: date }), [
      { roomTypeId: 'type', rateDate: date, amount: null, hasRate: false, currency: 'VND' },
    ])
    const markup = renderToStaticMarkup(<QueryClientProvider client={client}><AntApp>
      <RoomTypeDailyRatesPanel hotelId="hotel" hotelStatus={hotelStatus} roomTypes={[{ id: 'type', hotelId: 'hotel', name: 'Double', maxAdults: 2, maxChildren: 0, isActive: true }]} />
    </AntApp></QueryClientProvider>)
    expect(markup).toContain('Chưa đặt giá')
    expect(markup).toContain('Lưu giá')
    expect(markup).not.toContain('Backend hiện chưa hỗ trợ danh sách hạng phòng')
    expect(markup).not.toContain('Infinity')
    expect(markup).not.toContain('NaN')
  })
})
