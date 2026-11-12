import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hotelId = '11111111-1111-4111-8111-111111111111'
const albumId = '22222222-2222-4222-8222-222222222222'
const hotel = { id: hotelId, ownerId: albumId, cityId: albumId, name: 'Hotel', slug: 'hotel', description: null, address: 'Address', latitude: null, longitude: null, starRating: 3, checkInTime: '14:00', checkOutTime: '12:00', status: 'DRAFT', createdAt: '2026-11-11T00:00:00Z', updatedAt: '2026-11-11T00:00:00Z', version: 7 }
const album = { id: albumId, hotelId, name: 'Phòng ngủ', description: null, sortOrder: 0, createdAt: hotel.createdAt, updatedAt: hotel.updatedAt }
const fetcher = vi.fn<typeof fetch>()
const response = (data: unknown) => new Response(JSON.stringify({ message: 'ok', data }))
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetcher); fetcher.mockReset() })
afterEach(() => vi.unstubAllGlobals())

describe('persisted hotel albums', () => {
  it('reads actual album ids and order from the backend', async () => {
    fetcher.mockResolvedValue(response([album]))
    const { getHotelAlbums } = await import('./hotel-albums-api')
    await expect(getHotelAlbums(hotelId)).resolves.toEqual([album])
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/image-albums`)
  })

  it.each([
    [{ kind: 'create', name: 'Phòng ngủ', description: 'Tầng 2' }, 'POST', '', { name: 'Phòng ngủ', description: 'Tầng 2', expectedVersion: 7 }],
    [{ kind: 'update', albumId, name: 'Phòng tắm', description: '' }, 'PATCH', `/${albumId}`, { name: 'Phòng tắm', description: '', expectedVersion: 7 }],
    [{ kind: 'order', albumIds: [albumId] }, 'PUT', '/order', { albumIds: [albumId], expectedVersion: 7 }],
    [{ kind: 'delete', albumId }, 'DELETE', `/${albumId}?expectedVersion=7`, undefined],
  ] as const)('reads a fresh hotel version before %s and sends the exact contract', async (change, method, suffix, body) => {
    fetcher.mockResolvedValueOnce(response(hotel)).mockResolvedValueOnce(response(change.kind === 'delete' ? { accepted: true } : change.kind === 'order' ? [album] : album))
    const { changeHotelAlbum } = await import('./hotel-albums-api')
    const request = change.kind === 'order' ? { ...change, albumIds: [...change.albumIds] } : change
    await changeHotelAlbum(hotelId, request)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}`)
    expect(fetcher.mock.calls[1][0]).toBe(`/api/v1/management/hotels/${hotelId}/image-albums${suffix}`)
    expect(fetcher.mock.calls[1][1]?.method).toBe(method)
    expect(fetcher.mock.calls[1][1]?.body ? JSON.parse(fetcher.mock.calls[1][1]?.body as string) : undefined).toEqual(body)
  })

  it('does not retry album creation when the version has changed', async () => {
    fetcher.mockResolvedValueOnce(response(hotel)).mockResolvedValueOnce(new Response(JSON.stringify({ code: 'CONCURRENT_UPDATE', detail: 'Version changed' }), { status: 409 }))
    const { changeHotelAlbum } = await import('./hotel-albums-api')
    await expect(changeHotelAlbum(hotelId, { kind: 'create', name: 'New album' })).rejects.toMatchObject({ status: 409 })
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  })
})
