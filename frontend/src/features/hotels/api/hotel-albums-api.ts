import { z } from 'zod'
import { http } from '@/shared/api/http'
import { getManagementHotelDetail } from './hotel-management-api'
import { withHotelMediaWrite } from './hotel-media-api'

const albumSchema = z.object({ id: z.uuid(), hotelId: z.uuid(), name: z.string(), description: z.string().nullable(), sortOrder: z.number().int().nonnegative(), createdAt: z.string(), updatedAt: z.string() })
export type HotelAlbum = z.infer<typeof albumSchema>
export type AlbumChange = { kind: 'create'; name: string; description?: string } | { kind: 'update'; albumId: string; name: string; description?: string } | { kind: 'order'; albumIds: string[] } | { kind: 'delete'; albumId: string }
const path = (hotelId: string) => `/management/hotels/${encodeURIComponent(hotelId)}/image-albums`
export function getHotelAlbums(hotelId: string, signal?: AbortSignal) {
  return http.request(path(hotelId), { schema: z.array(albumSchema), signal })
}
export function changeHotelAlbum(hotelId: string, change: AlbumChange, signal?: AbortSignal) {
  return withHotelMediaWrite(hotelId, async () => {
    const hotel = await getManagementHotelDetail(hotelId, signal)
    if (!Number.isInteger(hotel.version) || hotel.version! < 0) throw new Error('Chưa đọc được phiên bản khách sạn.')
    const expectedVersion = hotel.version!
    if (change.kind === 'delete') return http.request(`${path(hotelId)}/${encodeURIComponent(change.albumId)}?expectedVersion=${expectedVersion}`, { method: 'DELETE', schema: z.object({ accepted: z.literal(true) }), signal })
    if (change.kind === 'order') return http.request(`${path(hotelId)}/order`, { method: 'PUT', body: { albumIds: change.albumIds, expectedVersion }, schema: z.array(albumSchema), signal })
    return http.request(`${path(hotelId)}${change.kind === 'update' ? '/' + encodeURIComponent(change.albumId) : ''}`, {
      method: change.kind === 'create' ? 'POST' : 'PATCH', body: { name: change.name, description: change.description, expectedVersion }, schema: albumSchema, signal,
    })
  })
}
