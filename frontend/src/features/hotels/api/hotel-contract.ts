import { z } from 'zod'
import { hotelStatusSchema, type ManagementHotelDetail } from '../model/hotel'

/** Current BE ManagementHotelResponse and CreateHotelResponse wire format. */
export const hotelResponseSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  cityId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  starRating: z.number().nullable(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
})

export const hotelPageResponseSchema = z.object({
  content: z.array(hotelResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
})

/** Management UI renders known status badges; diagnostics retain the raw wire string. */
export const managementHotelResponseSchema = hotelResponseSchema.extend({ status: hotelStatusSchema })
export const managementHotelPageResponseSchema = hotelPageResponseSchema.extend({
  content: z.array(managementHotelResponseSchema),
})

/** Keep existing UI field names; absent related resources remain unknown. */
export function toManagementHotel(
  { ownerId, ...hotel }: z.infer<typeof managementHotelResponseSchema>,
): ManagementHotelDetail {
  return { ...hotel, ownerUserId: ownerId }
}
