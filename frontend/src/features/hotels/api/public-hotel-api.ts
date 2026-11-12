import { z } from 'zod'
import { http } from '@/shared/api/http'
import { amenitySchema } from '../model/hotel'

export const publicHotelResponseSchema = z.object({
  id: z.string().uuid(),
  cityId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  starRating: z.number().nullable(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  amenities: z.array(amenitySchema).optional(),
})

export type PublicHotel = z.infer<typeof publicHotelResponseSchema>

export const publicRoomTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  maxAdults: z.number(),
  maxChildren: z.number(),
  amenities: z.array(amenitySchema).optional(),
})

export type PublicRoomType = z.infer<typeof publicRoomTypeSchema>

export const publicHotelPageResponseSchema = z.object({
  content: z.array(publicHotelResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
})

export type PublicHotelPage = z.infer<typeof publicHotelPageResponseSchema>

/** GET /api/v1/hotels — Danh sách khách sạn công khai */
export async function getPublicHotels(
  params?: { cityId?: string; keyword?: string; page?: number; size?: number },
  signal?: AbortSignal,
): Promise<PublicHotelPage> {
  const searchParams = new URLSearchParams()
  if (params?.cityId) searchParams.set('cityId', params.cityId)
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  if (params?.page !== undefined) searchParams.set('page', String(params.page))
  if (params?.size !== undefined) searchParams.set('size', String(params.size))

  const qs = searchParams.toString()
  return http.request(`/hotels${qs ? '?' + qs : ''}`, {
    signal,
    schema: publicHotelPageResponseSchema,
  })
}

/** GET /api/v1/hotels/{hotelId} — Chi tiết khách sạn công khai */
export async function getPublicHotelDetail(
  hotelId: string,
  signal?: AbortSignal,
): Promise<PublicHotel> {
  return http.request(`/hotels/${encodeURIComponent(hotelId)}`, {
    signal,
    schema: publicHotelResponseSchema,
  })
}

/** GET /api/v1/hotels/{hotelId}/room-types — Danh sách loại phòng công khai */
export async function getPublicRoomTypes(
  hotelId: string,
  signal?: AbortSignal,
): Promise<PublicRoomType[]> {
  return http.request(`/hotels/${encodeURIComponent(hotelId)}/room-types`, {
    signal,
    schema: z.array(publicRoomTypeSchema),
  })
}
