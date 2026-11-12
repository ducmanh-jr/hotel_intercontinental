import { z } from 'zod'
import { http } from '@/shared/api/http'
import { managementRoomTypeSchema } from './room-type-api'

export interface RoomPaginationParams { page?: number; size?: number }

export const managementRoomSchema = z.object({
  id: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomNumber: z.string(),
  floor: z.string().nullable().optional(),
  readiness: z.enum(['READY', 'DIRTY', 'ready', 'dirty']).transform((value) => value.toLowerCase()),
  readinessUpdatedAt: z.string().nullable().optional(),
  operationalFrom: z.string(),
  operationalUntil: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.number().int().optional().default(0),
})
export type ManagementRoom = z.infer<typeof managementRoomSchema>

export const managementRoomPageSchema = z.object({
  content: z.array(managementRoomSchema),
  totalElements: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
}).transform(({ content, totalElements, ...page }) => ({ ...page, items: content, totalItems: totalElements }))
export type ManagementRoomPage = z.infer<typeof managementRoomPageSchema>

// PATCH returns RoomResponse without operational dates or version.
const updatedRoomSchema = z.object({
  id: z.string().uuid(),
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomNumber: z.string(),
  floor: z.number().int().nullable(),
  status: z.enum(['ready', 'cleaning', 'maintenance']),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).transform(({ floor, status, ...room }) => ({
  ...room,
  floor: floor === null ? null : String(floor),
  readiness: status === 'ready' ? 'ready' : 'dirty',
}))

export interface CreateRoomPayload {
  roomTypeId: string
  roomNumber: string
  floor?: string
  operationalFrom: string
  operationalUntil?: string
}
export interface UpdateRoomPayload {
  roomNumber?: string
  floor?: number
  status?: 'ready' | 'cleaning' | 'maintenance'
  active?: boolean
}
export interface UpdateRoomTypePayload {
  name?: string
  description?: string
  maxAdults?: number
  maxChildren?: number
  maxOccupancy?: number
  basePrice?: number
  active?: boolean
}

export async function getManagementRooms(
  hotelId: string,
  params?: { roomTypeId?: string } & RoomPaginationParams,
  signal?: AbortSignal,
): Promise<ManagementRoomPage> {
  const queryParams = new URLSearchParams()
  if (params?.roomTypeId) queryParams.set('roomTypeId', params.roomTypeId)
  if (params?.page !== undefined) queryParams.set('page', String(params.page))
  if (params?.size !== undefined) queryParams.set('size', String(params.size))
  const queryString = queryParams.toString()
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/rooms${queryString ? `?${queryString}` : ''}`, {
    method: 'GET', signal, schema: managementRoomPageSchema,
  })
}

export async function createManagementRoom(hotelId: string, payload: CreateRoomPayload, signal?: AbortSignal): Promise<ManagementRoom> {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/rooms`, {
    method: 'POST', body: payload, signal, schema: managementRoomSchema,
  })
}

export async function updateManagementRoom(hotelId: string, roomId: string, payload: UpdateRoomPayload, signal?: AbortSignal) {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH', body: payload, signal, schema: updatedRoomSchema,
  })
}

export async function updateManagementRoomType(hotelId: string, roomTypeId: string, payload: UpdateRoomTypePayload, signal?: AbortSignal) {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}`, {
    method: 'PATCH', body: payload, signal, schema: managementRoomTypeSchema,
  })
}

export function buildRoomEditPayload(
  room: Pick<ManagementRoom, 'roomNumber' | 'floor' | 'readiness'>,
  values: { roomNumber: string; floor?: string | null; status?: string; active?: boolean },
): UpdateRoomPayload {
  const payload: UpdateRoomPayload = {}
  if (values.roomNumber.trim() !== room.roomNumber) payload.roomNumber = values.roomNumber.trim()
  if ((values.floor ?? '') !== (room.floor ?? '')) {
    const floor = Number(values.floor)
    if (!values.floor?.trim() || !Number.isInteger(floor) || floor < -32768 || floor > 32767) {
      throw new Error('Tầng chỉnh sửa phải là số nguyên từ -32768 đến 32767; backend chưa hỗ trợ xóa tầng.')
    }
    payload.floor = floor
  }
  if (values.status !== undefined && values.status !== room.readiness) {
    if (values.status !== 'ready' && values.status !== 'cleaning' && values.status !== 'maintenance') {
      throw new Error('Trạng thái buồng phòng không hợp lệ.')
    }
    payload.status = values.status
  }
  if (values.active !== undefined) payload.active = values.active
  return payload
}
