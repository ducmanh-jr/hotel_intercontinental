import { z } from 'zod'
import { http } from '@/shared/api/http'
import type { UpdateRoomTypePayload } from './room-api'

export const managementRoomTypeSchema = z.object({
  id: z.string(),
  hotelId: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  maxAdults: z.number().int(),
  maxChildren: z.number().int(),
  maxOccupancy: z.number().int().positive().optional(),
  basePrice: z.number().nonnegative().optional(),
  active: z.boolean(),
})

export type ManagementRoomType = z.infer<typeof managementRoomTypeSchema>

export interface CreateRoomTypePayload {
  name: string
  description?: string
  maxAdults: number
  maxChildren: number
}

/** GET /api/v1/management/hotels/{hotelId}/room-types — HT15 */
export async function getManagementRoomTypes(
  hotelId: string,
  signal?: AbortSignal,
): Promise<ManagementRoomType[]> {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/room-types`, {
    signal,
    schema: z.array(managementRoomTypeSchema),
  })
}

/** POST /api/v1/management/hotels/{hotelId}/room-types — HT16 */
export async function createManagementRoomType(
  hotelId: string,
  payload: CreateRoomTypePayload,
  signal?: AbortSignal,
): Promise<ManagementRoomType> {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/room-types`, {
    method: 'POST',
    body: payload,
    signal,
    schema: managementRoomTypeSchema,
  })
}

export interface EditRoomTypeValues {
  name: string
  description?: string | null
  maxAdults: number
  maxChildren: number
  maxOccupancy?: number | null
  basePrice?: number | null
  active: boolean
}

/**
 * Xây dựng payload PATCH cho loại phòng:
 * - Chỉ gửi các trường thực sự thay đổi.
 * - Sức chứa: Khi maxAdults hoặc maxChildren thay đổi, tự động áp dụng quy tắc đã duyệt
 *   (maxOccupancy = maxAdults + maxChildren) hoặc giá trị maxOccupancy hợp lệ được truyền vào.
 * - Khi không đổi sức chứa, không gửi và không làm thay đổi sức chứa đã lưu trên backend.
 * - Giá cơ bản: Phân biệt rõ ràng giữa giá 0 (gửi 0) và chưa nhập / để trống (không gửi).
 */
export function buildRoomTypeEditPayload(
  original: Pick<
    ManagementRoomType,
    'name' | 'description' | 'maxAdults' | 'maxChildren' | 'active' | 'maxOccupancy' | 'basePrice'
  >,
  values: EditRoomTypeValues,
): UpdateRoomTypePayload {
  const payload: UpdateRoomTypePayload = {}

  // 1. Tên loại phòng
  if (values.name.trim() !== original.name) {
    payload.name = values.name.trim()
  }

  // 2. Mô tả loại phòng
  const originalDesc = original.description ?? ''
  const newDesc = values.description?.trim() ?? ''
  if (newDesc !== originalDesc) {
    payload.description = newDesc
  }

  // 3. Trạng thái mở bán
  if (values.active !== original.active) {
    payload.active = values.active
  }

  // 4. Sức chứa
  const capacityChanged =
    values.maxAdults !== original.maxAdults ||
    values.maxChildren !== original.maxChildren ||
    (values.maxOccupancy != null && values.maxOccupancy !== original.maxOccupancy)

  if (capacityChanged) {
    const totalOccupancy = values.maxOccupancy ?? values.maxAdults + values.maxChildren

    if (!Number.isInteger(totalOccupancy) || totalOccupancy < values.maxAdults) {
      throw new Error('Sức chứa tối đa phải là số nguyên và ít nhất bằng số người lớn tối đa.')
    }
    if (totalOccupancy > 32767) {
      throw new Error('Tổng sức chứa không được vượt quá 32.767 người.')
    }

    payload.maxAdults = values.maxAdults
    payload.maxChildren = values.maxChildren
    payload.maxOccupancy = totalOccupancy
  }

  // 5. Giá cơ bản mỗi đêm
  if (values.basePrice !== null && values.basePrice !== undefined) {
    if (original.basePrice === undefined || values.basePrice !== original.basePrice) {
      payload.basePrice = values.basePrice
    }
  }

  return payload
}
