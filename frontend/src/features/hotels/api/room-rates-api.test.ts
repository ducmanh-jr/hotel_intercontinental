import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetcher = vi.fn<typeof fetch>()
const hotelId = '11111111-1111-4111-8111-111111111111'
const roomTypeId = '22222222-2222-4222-8222-222222222222'
const response = {
  hotelId, roomTypeId, currency: 'VND', startDate: '2026-11-10', endDate: '2026-11-11',
  rates: [
    { date: '2026-11-10', price: 1200000, hasRate: true, updatedAt: '2026-11-09T00:00:00Z' },
    { date: '2026-11-11', price: null, hasRate: false, updatedAt: null },
  ],
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', fetcher)
  fetcher.mockReset()
  fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'Thành công.', data: response })))
})
afterEach(() => vi.unstubAllGlobals())

describe('backend room rates contract', () => {
  it('reads inclusive dates and preserves a missing price as null', async () => {
    const { getRoomTypeDailyRates } = await import('./hotel-management-api')
    const controller = new AbortController()
    const rates = await getRoomTypeDailyRates({ hotelId, roomTypeId, startDate: '2026-11-10', endDate: '2026-11-11' }, controller.signal)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/room-types/${roomTypeId}/rates?startDate=2026-11-10&endDate=2026-11-11`)
    expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(rates).toEqual([
      { roomTypeId, rateDate: '2026-11-10', amount: 1200000, currency: 'VND', hasRate: true },
      { roomTypeId, rateDate: '2026-11-11', amount: null, currency: 'VND', hasRate: false },
    ])
  })

  it('rejects a reversed date range without sending a request', async () => {
    const { getRoomTypeDailyRates } = await import('./hotel-management-api')
    await expect(getRoomTypeDailyRates({ hotelId, roomTypeId, startDate: '2026-11-11', endDate: '2026-11-10' })).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('writes an inclusive user range as an exclusive backend end, including month boundaries', async () => {
    const { setRoomTypeDailyRates } = await import('./hotel-management-api')
    const { exclusiveRateEndDate } = await import('../model/room-rates')
    expect(exclusiveRateEndDate('2028-02-29')).toBe('2028-03-01')
    await setRoomTypeDailyRates({ hotelId, roomTypeId }, {
      startDate: '2026-11-10', endDateExclusive: exclusiveRateEndDate('2026-11-11'), amount: 1200000,
    })
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/room-types/${roomTypeId}/rates`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PUT')
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({
      startDate: '2026-11-10', endDateExclusive: '2026-11-12', amount: 1200000, currency: 'VND',
    })
  })

  it('rejects a claimed configured rate whose price is missing', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data: {
      ...response, rates: [{ ...response.rates[1], hasRate: true }],
    } })))
    const { getRoomTypeDailyRates } = await import('./hotel-management-api')
    await expect(getRoomTypeDailyRates({ hotelId, roomTypeId, startDate: '2026-11-10', endDate: '2026-11-11' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})
