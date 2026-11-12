import { z } from 'zod'
import { http } from '@/shared/api/http'

export const roomBlockSchema = z.object({
  id: z.uuid(), hotelId: z.uuid(), roomTypeId: z.uuid(), roomId: z.uuid(), startDate: z.iso.date(), endDate: z.iso.date(), reason: z.string(), status: z.enum(['ACTIVE', 'RELEASED']),
  releasedAt: z.string().nullable(), releaseReason: z.string().nullable(),
})
export type RoomBlock = z.infer<typeof roomBlockSchema>
const assignment = z.object({ id: z.uuid(), bookingId: z.uuid(), roomId: z.uuid(), startDate: z.iso.date(), endDate: z.iso.date(), status: z.string() })
const physicalRoom = z.object({ roomId: z.uuid(), roomNumber: z.string(), floor: z.string().nullable(), readiness: z.enum(['READY', 'DIRTY']), operationalFrom: z.string(), operationalUntil: z.string().nullable(), activeBlocks: z.array(roomBlockSchema), activeAssignments: z.array(assignment) })
const summary = z.object({ date: z.iso.date(), operationalRooms: z.number().int(), blockedRooms: z.number().int(), reservedRooms: z.number().int(), availableRooms: z.number().int() })
export const roomCalendarSchema = z.object({ hotelId: z.uuid(), startDate: z.iso.date(), endDate: z.iso.date(), roomTypes: z.array(z.object({ roomTypeId: z.uuid(), roomTypeName: z.string(), rooms: z.array(physicalRoom), dailySummaries: z.array(summary) })) })
export interface CalendarQuery { startDate: string; endDate: string; roomTypeId?: string }
export interface RoomBlockPayload { roomId: string; startDate: string; endDate: string; reason: string }
export type InventoryChange = { kind: 'create'; payload: RoomBlockPayload } | { kind: 'update'; blockId: string; payload: Omit<RoomBlockPayload, 'roomId'> } | { kind: 'release'; blockId: string; reason: string } | { kind: 'readiness'; roomId: string; readiness: 'READY' | 'DIRTY' }
const base = (hotelId: string) => `/management/hotels/${encodeURIComponent(hotelId)}`
function params(query: CalendarQuery) {
  const search = new URLSearchParams({ startDate: query.startDate, endDate: query.endDate })
  if (query.roomTypeId) search.set('roomTypeId', query.roomTypeId)
  return search
}
export function getRoomCalendar(hotelId: string, query: CalendarQuery, signal?: AbortSignal) {
  return http.request(`${base(hotelId)}/room-calendar?${params(query)}`, { signal, schema: roomCalendarSchema })
}
export function getRoomBlocks(hotelId: string, query: CalendarQuery, signal?: AbortSignal) {
  return http.request(`${base(hotelId)}/room-blocks?${params(query)}`, { signal, schema: z.array(roomBlockSchema) })
}
export async function changeInventory(hotelId: string, change: InventoryChange, signal?: AbortSignal) {
  if (change.kind === 'readiness') return http.request(`${base(hotelId)}/rooms/${encodeURIComponent(change.roomId)}/readiness`, { method: 'PATCH', body: { readiness: change.readiness }, signal, schema: z.object({ hotelId: z.uuid(), roomId: z.uuid(), roomTypeId: z.uuid(), roomNumber: z.string(), floor: z.string().nullable(), readiness: z.enum(['READY', 'DIRTY']), updatedAt: z.string() }) })
  if (change.kind === 'release') return http.request(`${base(hotelId)}/room-blocks/${encodeURIComponent(change.blockId)}/release`, { method: 'POST', body: { reason: change.reason }, signal, schema: roomBlockSchema })
  return http.request(`${base(hotelId)}/room-blocks${change.kind === 'update' ? '/' + encodeURIComponent(change.blockId) : ''}`, { method: change.kind === 'create' ? 'POST' : 'PATCH', body: change.payload, signal, schema: roomBlockSchema })
}
