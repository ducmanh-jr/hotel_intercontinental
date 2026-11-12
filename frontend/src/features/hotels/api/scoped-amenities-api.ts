import { z } from 'zod'
import { ApiError } from '@/shared/api/api-error'
import { http } from '@/shared/api/http'
import { amenitySchema, type AmenityItem } from '../model/hotel'
import {
  customAmenitySchema,
  managementAmenitiesResponseSchema,
  type CustomAmenity,
  type ManagementAmenities,
} from '../model/scoped-amenity-schemas'

export interface AmenityScope {
  hotelId: string
  roomId?: string | null
}

function buildScopeUrl(scope: AmenityScope, suffix = ''): string {
  const base = scope.roomId
    ? `/management/hotels/${encodeURIComponent(scope.hotelId)}/rooms/${encodeURIComponent(scope.roomId)}/amenities`
    : `/management/hotels/${encodeURIComponent(scope.hotelId)}/amenities`
  return `${base}${suffix}`
}

/**
 * GET H hoặc GET R
 * Đọc tiện ích của đối tượng đang quản lý (kể cả khi hotel còn DRAFT).
 */
export async function getScopedAmenities(
  scope: AmenityScope,
  signal?: AbortSignal,
): Promise<ManagementAmenities> {
  const url = buildScopeUrl(scope)
  return http.request(url, {
    method: 'GET',
    signal,
    schema: managementAmenitiesResponseSchema,
  })
}

/**
 * PUT H hoặc PUT R
 * Thay thế toàn bộ danh mục có sẵn gắn trực tiếp.
 * PUT H trả mảng tiện ích có sẵn đã gắn (AmenityItem[]).
 * PUT R trả object ManagementAmenities.
 */
export async function replaceScopedCatalogAmenities(
  scope: AmenityScope,
  amenityIds: string[],
  signal?: AbortSignal,
): Promise<AmenityItem[] | ManagementAmenities> {
  const url = buildScopeUrl(scope)
  if (scope.roomId) {
    return http.request(url, {
      method: 'PUT',
      body: { amenityIds },
      signal,
      schema: managementAmenitiesResponseSchema,
    })
  }

  return http.request(url, {
    method: 'PUT',
    body: { amenityIds },
    signal,
    schema: z.array(amenitySchema),
  })
}

export interface CreateCustomAmenityPayload {
  name: string
  description?: string
}

/**
 * POST H hoặc POST R
 * Tạo và gắn ngay tiện ích riêng cho đối tượng trong URL.
 */
export async function createCustomAmenity(
  scope: AmenityScope,
  payload: CreateCustomAmenityPayload,
  signal?: AbortSignal,
): Promise<CustomAmenity> {
  const url = buildScopeUrl(scope)
  const body: { name: string; description?: string } = {
    name: payload.name.trim(),
  }
  if (payload.description !== undefined) {
    body.description = payload.description.trim()
  }

  return http.request(url, {
    method: 'POST',
    body,
    signal,
    schema: customAmenitySchema,
  })
}

export interface UpdateCustomAmenityPayload {
  name?: string
  description?: string
  attached?: boolean
  expectedVersion: number
}

/**
 * PATCH H/{amenityId} hoặc PATCH R/{amenityId}
 * Sửa tên/mô tả hoặc gắn lại tiện ích riêng theo phiên bản đã đọc.
 */
export async function updateCustomAmenity(
  scope: AmenityScope,
  amenityId: string,
  payload: UpdateCustomAmenityPayload,
  signal?: AbortSignal,
): Promise<CustomAmenity> {
  const url = buildScopeUrl(scope, `/${encodeURIComponent(amenityId)}`)
  const body: Record<string, unknown> = {
    expectedVersion: payload.expectedVersion,
  }
  if (payload.name !== undefined) {
    body.name = payload.name.trim()
  }
  if (payload.description !== undefined) {
    body.description = payload.description.trim()
  }
  if (payload.attached !== undefined) {
    body.attached = payload.attached
  }

  return http.request(url, {
    method: 'PATCH',
    body,
    signal,
    schema: customAmenitySchema,
  })
}

/**
 * DELETE H/{amenityId}?expectedVersion=N hoặc DELETE R/{amenityId}?expectedVersion=N
 * Tháo mềm tiện ích riêng, trả về bản ghi với attached=false.
 */
export async function detachCustomAmenity(
  scope: AmenityScope,
  amenityId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<CustomAmenity> {
  const url = buildScopeUrl(
    scope,
    `/${encodeURIComponent(amenityId)}?expectedVersion=${encodeURIComponent(expectedVersion)}`,
  )
  return http.request(url, {
    method: 'DELETE',
    signal,
    schema: customAmenitySchema,
  })
}

/**
 * GET /management/hotels/{hotelId}/room-types/{roomTypeId}/amenities
 * Đọc tiện ích hạng phòng để quản lý, không yêu cầu khách sạn ACTIVE hay hạng phòng đang bán.
 */
export async function getRoomTypeAmenities(
  hotelId: string,
  roomTypeId: string,
  signal?: AbortSignal,
): Promise<AmenityItem[]> {
  const url = `/management/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/amenities`
  return http.request(url, {
    method: 'GET',
    signal,
    schema: z.array(amenitySchema),
  })
}

/**
 * PUT /management/hotels/{hotelId}/room-types/{roomTypeId}/amenities
 * Cập nhật tiện ích có sẵn gắn vào hạng phòng.
 */
export async function replaceRoomTypeAmenities(
  hotelId: string,
  roomTypeId: string,
  amenityIds: string[],
  signal?: AbortSignal,
): Promise<AmenityItem[]> {
  const url = `/management/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/amenities`
  return http.request(url, {
    method: 'PUT',
    body: { amenityIds },
    signal,
    schema: z.array(amenitySchema),
  })
}

/**
 * Helper chuyển đổi lỗi API sang thông báo tiếng Việt dễ hiểu cho người dùng,
 * không lộ tên class DTO, tên bảng hay thuật ngữ backend.
 */
export function getAmenityErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'DUPLICATE_CUSTOM_AMENITY') {
      return 'Tiện ích này đã có. Bạn có thể sửa hoặc gắn lại mục đã tháo.'
    }
    if (error.code === 'AMENITY_CONCURRENT_UPDATE') {
      return 'Tiện ích đã được thay đổi bởi một thao tác khác. Vui lòng làm mới dữ liệu để kiểm tra lại.'
    }
    if (error.code === 'AMENITY_CATEGORY_MISMATCH') {
      return 'Danh mục tiện ích không khớp với đối tượng đang quản lý.'
    }
    if (error.status === 403) {
      return 'Bạn không có đủ quyền thực hiện thao tác trên tiện ích này.'
    }
    if (error.status === 404) {
      return 'Không tìm thấy đối tượng hoặc bạn không có quyền quản lý.'
    }
    if (error.status === 400 && error.errors.length > 0) {
      return error.errors.map((e) => e.message).join(' ')
    }
    if (error.kind === 'timeout') {
      return 'Yêu cầu quá thời gian chờ. Thao tác có thể chưa hoàn tất, vui lòng tải lại trang để kiểm tra.'
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}
