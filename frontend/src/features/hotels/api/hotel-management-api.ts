import { ApiError } from '@/shared/api/api-error'
import { http } from '@/shared/api/http'
import { z } from 'zod'
import { amenitySchema } from '../model/hotel'
import { validateHotelPatch } from '../model/hotel-update'
import type { CreateAdminHotelFormValues, UpdateHotelAmenitiesFormValues } from '../model/hotel-form-schemas'
import type { ManagementHotelDetail, ManagementHotelListQuery, ManagementHotelPage } from '../model/hotel'
import { managementHotelPageResponseSchema, managementHotelResponseSchema, toManagementHotel } from './hotel-contract'

/** GET /api/v1/management/hotels — BE currently supports pagination only. */
export async function getManagementHotels(
  query: ManagementHotelListQuery = {},
  signal?: AbortSignal,
): Promise<ManagementHotelPage> {
  const params = new URLSearchParams({
    page: String(query.page ?? 0),
    size: String(query.size ?? 6),
  })
  const page = await http.request(`/management/hotels?${params}`, {
    signal,
    schema: managementHotelPageResponseSchema,
  })
  return { ...page, content: page.content.map(toManagementHotel) }
}

/** POST /api/v1/management/hotels — ownerId may be omitted for self-creation. */
export async function createAdminHotel(
  payload: CreateAdminHotelFormValues,
  signal?: AbortSignal,
): Promise<ManagementHotelDetail> {
  try {
    const hotel = await http.request('/management/hotels', {
      method: 'POST',
      body: {
        ownerId: payload.ownerUserId ? payload.ownerUserId : undefined,
        cityId: payload.cityId,
        name: payload.name,
        description: payload.description,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        starRating: payload.starRating,
        checkInTime: payload.checkInTime,
        checkOutTime: payload.checkOutTime,
      },
      signal,
      schema: managementHotelResponseSchema,
    })
    return toManagementHotel(hotel)
  } catch (error) {
    if (error instanceof ApiError && error.errors.some((item) => item.field === 'ownerId')) {
      throw new ApiError(error.message, {
        kind: error.kind, status: error.status, code: error.code, traceId: error.traceId,
        errors: error.errors.map((item) => ({
          ...item, field: item.field === 'ownerId' ? 'ownerUserId' : item.field,
        })),
      })
    }
    throw error
  }
}

/** GET /api/v1/management/hotels/{hotelId}. */
export async function getManagementHotelDetail(
  hotelId: string,
  signal?: AbortSignal,
): Promise<ManagementHotelDetail> {
  const hotel = await http.request(`/management/hotels/${encodeURIComponent(hotelId)}`, {
    signal,
    schema: managementHotelResponseSchema,
  })
  return toManagementHotel(hotel)
}

/** PATCH /api/v1/management/hotels/{hotelId}/approve — Admin duyệt khách sạn */
export async function approveHotel(
  hotelId: string,
  signal?: AbortSignal,
): Promise<ManagementHotelDetail> {
  const hotel = await http.request(`/management/hotels/${encodeURIComponent(hotelId)}/approve`, {
    method: 'PATCH',
    signal,
    schema: managementHotelResponseSchema,
  })
  return toManagementHotel(hotel)
}

export interface UpdateHotelPayload {
  version: number
  name?: string
  description?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  latitude?: number
  longitude?: number
  starRating?: number
  checkInTime?: string
  checkOutTime?: string
}

export async function updateManagementHotel(hotelId: string, payload: UpdateHotelPayload, signal?: AbortSignal): Promise<ManagementHotelDetail> {
  const result = await http.request(`/management/hotels/${encodeURIComponent(hotelId)}`, {
    method: 'PATCH', body: validateHotelPatch(payload), signal, schema: managementHotelResponseSchema,
  })
  return toManagementHotel(result)
}

export async function updateHotelAmenities(hotelId: string, payload: UpdateHotelAmenitiesFormValues, signal?: AbortSignal): Promise<string[]> {
  const result = await http.request(`/management/hotels/${encodeURIComponent(hotelId)}/amenities`, {
    method: 'PUT', body: payload, signal, schema: z.array(amenitySchema),
  })
  return result.map((amenity) => amenity.id)
}

export async function updateRoomTypeAmenities(hotelId: string, roomTypeId: string, payload: UpdateHotelAmenitiesFormValues, signal?: AbortSignal): Promise<string[]> {
  const result = await http.request(`/management/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/amenities`, {
    method: 'PUT', body: payload, signal, schema: z.array(amenitySchema),
  })
  return result.map((amenity) => amenity.id)
}

export { getRoomTypeDailyRates, setRoomTypeDailyRates } from './room-rates-api'
