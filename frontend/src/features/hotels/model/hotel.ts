import { z } from 'zod'

/** Enum hotel_status__t đúng theo nguồn business-rules.md */
export const hotelStatusValues = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'LOCKED',
] as const

export const hotelStatusSchema = z.enum(hotelStatusValues)
export type HotelStatus = z.infer<typeof hotelStatusSchema>

/** Enum amenity_category__t đúng theo nguồn business-rules.md */
export const amenityCategoryValues = ['HOTEL', 'ROOM'] as const
export const amenityCategorySchema = z.enum(amenityCategoryValues)
export type AmenityCategory = z.infer<typeof amenityCategorySchema>

/** HT01: GET /api/v1/cities */
export const citySchema = z.object({
  id: z.string().min(1),
  countryCode: z.string().length(2),
  name: z.string().min(1),
  slug: z.string().min(1),
})
export type CityItem = z.infer<typeof citySchema>

/** HT02: GET /api/v1/amenities */
export const amenitySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  category: amenityCategorySchema,
})
export type AmenityItem = z.infer<typeof amenitySchema>

/** Tóm tắt loại phòng thuộc khách sạn (phục vụ PR01 xem giá theo ngày) */
export const managementRoomTypeSummarySchema = z.object({
  id: z.string().min(1),
  hotelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  maxAdults: z.number().int().min(1),
  maxChildren: z.number().int().min(0),
  isActive: z.boolean(),
  basePrice: z.number().int().min(0).optional(),
  totalRooms: z.number().int().min(0).optional(),
})
export type ManagementRoomTypeSummary = z.infer<typeof managementRoomTypeSummarySchema>

/** HT07: GET /api/v1/management/hotels (Item trong danh sách phân trang) */
export const managementHotelSummarySchema = z.object({
  id: z.string().min(1),
  ownerUserId: z.string().min(1),
  ownerName: z.string().optional(),
  cityId: z.string().min(1),
  cityName: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  address: z.string().min(1),
  starRating: z.number().int().min(1).max(5).nullable(),
  checkInTime: z.string().min(4),
  checkOutTime: z.string().min(4),
  status: hotelStatusSchema,
  coverImageUrl: z.string().nullable().optional(),
  vibeTags: z.array(z.string()).optional(),
  roomTypeCount: z.number().int().min(0).optional(),
  updatedAt: z.string(),
  version: z.number().optional(),
})
export type ManagementHotelSummary = z.infer<typeof managementHotelSummarySchema>

/** Phân trang chuẩn PageResponse bắt đầu từ page = 0 */
export const managementHotelPageSchema = z.object({
  content: z.array(managementHotelSummarySchema),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  totalElements: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  first: z.boolean(),
  last: z.boolean(),
})
export type ManagementHotelPage = z.infer<typeof managementHotelPageSchema>

/** HT08: GET /api/v1/management/hotels/{hotelId} */
export const managementHotelDetailSchema = managementHotelSummarySchema.extend({
  description: z.string().nullable(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  // These resources are not included in the current backend hotel DTO.
  amenityIds: z.array(z.string()).optional(),
  roomTypes: z.array(managementRoomTypeSummarySchema).optional(),
  createdAt: z.string(),
  hasConfiguredRates: z.boolean().optional(),
  imageCount: z.number().int().nonnegative().optional(),
})
export type ManagementHotelDetail = z.infer<typeof managementHotelDetailSchema>

/** PR01: GET /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}/rates */
export const dailyRoomRateSchema = z.object({
  roomTypeId: z.string().min(1),
  rateDate: z.string().min(1),
  amount: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
  hasRate: z.boolean().optional(),
})
export type DailyRoomRate = z.infer<typeof dailyRoomRateSchema>

export interface ManagementHotelListQuery {
  page?: number
  size?: number
  cityId?: string
  status?: HotelStatus | 'ALL'
  keyword?: string
  vibe?: string
}
