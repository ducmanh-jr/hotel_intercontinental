import { z } from 'zod'
import { http } from '@/shared/api/http'
import {
  amenitySchema,
  citySchema,
  type AmenityCategory,
  type AmenityItem,
  type CityItem,
} from '../model/hotel'

const cityListResponseSchema = z.array(citySchema)
const amenityListResponseSchema = z.array(amenitySchema)

/** HT01: GET /api/v1/cities — Lấy danh mục thành phố đã được kích hoạt */
export async function getCities(signal?: AbortSignal): Promise<CityItem[]> {
  return http.request('/cities', {
    method: 'GET',
    signal,
    schema: cityListResponseSchema,
  })
}

/** HT02: GET /api/v1/amenities — Lấy danh mục tiện ích khách sạn/phòng */
export async function getAmenities(
  categoryOrSignal?: AmenityCategory | AbortSignal,
  maybeSignal?: AbortSignal,
): Promise<AmenityItem[]> {
  const isSignal = categoryOrSignal instanceof AbortSignal
  const category = isSignal ? undefined : categoryOrSignal
  const signal = isSignal ? categoryOrSignal : maybeSignal

  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return http.request(`/amenities${query}`, {
    method: 'GET',
    signal,
    schema: amenityListResponseSchema,
  })
}
