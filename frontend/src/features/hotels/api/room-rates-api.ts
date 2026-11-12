import { z } from 'zod'
import { ApiError } from '@/shared/api/api-error'
import { http } from '@/shared/api/http'
import type { DailyRoomRate } from '../model/hotel'
import { roomRatesRangeSchema } from '../model/room-rates'

const roomRatesResponseSchema = z.object({
  hotelId: z.string().uuid(), roomTypeId: z.string().uuid(), currency: z.string().length(3),
  startDate: z.iso.date(), endDate: z.iso.date(),
  rates: z.array(z.object({
    date: z.iso.date(), price: z.number().int().nonnegative().safe().nullable(),
    hasRate: z.boolean(), updatedAt: z.string().nullable(),
  }).refine((rate) => rate.hasRate === (rate.price !== null))),
})

export interface RoomRatesQuery {
  hotelId: string; roomTypeId: string; startDate: string; endDate: string
}
export interface SetRoomRatesPayload {
  startDate: string; endDateExclusive?: string; amount: number; currency?: string
}

function ratesPath(hotelId: string, roomTypeId: string) {
  return `/management/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/rates`
}

function toDailyRates(response: z.infer<typeof roomRatesResponseSchema>): DailyRoomRate[] {
  return response.rates.map((rate) => ({
    roomTypeId: response.roomTypeId, rateDate: rate.date, amount: rate.price,
    currency: response.currency, hasRate: rate.hasRate,
  }))
}

export async function getRoomTypeDailyRates(params: RoomRatesQuery, signal?: AbortSignal): Promise<DailyRoomRate[]> {
  if (!roomRatesRangeSchema.safeParse(params).success) {
    throw new ApiError('Chọn khoảng ngày hợp lệ, tối đa 90 ngày.', { kind: 'http', status: 400, code: 'INVALID_DATE_RANGE' })
  }
  const query = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate })
  const response = await http.request(`${ratesPath(params.hotelId, params.roomTypeId)}?${query}`, {
    signal, schema: roomRatesResponseSchema,
  })
  return toDailyRates(response)
}

export async function setRoomTypeDailyRates(
  params: { hotelId: string; roomTypeId: string }, payload: SetRoomRatesPayload, signal?: AbortSignal,
): Promise<DailyRoomRate[]> {
  const response = await http.request(ratesPath(params.hotelId, params.roomTypeId), {
    method: 'PUT', body: { ...payload, currency: payload.currency ?? 'VND' },
    signal, schema: roomRatesResponseSchema,
  })
  return toDailyRates(response)
}
