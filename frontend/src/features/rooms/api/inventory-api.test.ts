import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hotelId = '11111111-1111-4111-8111-111111111111'
const roomId = '22222222-2222-4222-8222-222222222222'
const typeId = '33333333-3333-4333-8333-333333333333'
const block = { id: roomId, hotelId, roomTypeId: typeId, roomId, startDate: '2026-11-12', endDate: '2026-11-12', reason: 'Bảo trì', status: 'ACTIVE', releasedAt: null, releaseReason: null }
const range = { startDate: block.startDate, endDate: block.endDate, roomTypeId: typeId }
const payload = { roomId, startDate: block.startDate, endDate: block.endDate, reason: block.reason }
const fetcher = vi.fn<typeof fetch>()
const respond = (data: unknown) => fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data })))
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetcher); fetcher.mockReset() })
afterEach(() => vi.unstubAllGlobals())

describe('inventory API contracts', () => {
  it('reads backend availability counts without recalculating them in FE', async () => {
    respond({ hotelId, ...range, roomTypes: [{ roomTypeId: typeId, roomTypeName: 'Double', rooms: [], dailySummaries: [{ date: block.startDate, operationalRooms: 10, blockedRooms: 2, reservedRooms: 3, availableRooms: 4 }] }] })
    const { getRoomCalendar } = await import('./inventory-api')
    const result = await getRoomCalendar(hotelId, range)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/room-calendar?startDate=${range.startDate}&endDate=${range.endDate}&roomTypeId=${typeId}`)
    expect(result.roomTypes[0].dailySummaries[0].availableRooms).toBe(4)
  })
  it('lists actual room blocks in the chosen inclusive range', async () => {
    respond([block])
    const { getRoomBlocks } = await import('./inventory-api')
    await expect(getRoomBlocks(hotelId, range)).resolves.toEqual([block])
    expect(fetcher.mock.calls[0][0]).toContain('/room-blocks?')
  })
  it.each([
    [{ kind: 'create', payload }, 'POST', '/room-blocks', payload],
    [{ kind: 'update', blockId: roomId, payload: { startDate: block.startDate, endDate: block.endDate, reason: 'Sửa lịch' } }, 'PATCH', `/room-blocks/${roomId}`, { startDate: block.startDate, endDate: block.endDate, reason: 'Sửa lịch' }],
    [{ kind: 'release', blockId: roomId, reason: 'Bảo trì xong' }, 'POST', `/room-blocks/${roomId}/release`, { reason: 'Bảo trì xong' }],
    [{ kind: 'readiness', roomId, readiness: 'READY' }, 'PATCH', `/rooms/${roomId}/readiness`, { readiness: 'READY' }],
  ] as const)('persists %s through the backend contract', async (change, method, suffix, body) => {
    respond(change.kind === 'readiness' ? { hotelId, roomId, roomTypeId: typeId, roomNumber: '101', floor: null, readiness: 'READY', updatedAt: '2026-11-11T00:00:00Z' } : block)
    const { changeInventory } = await import('./inventory-api')
    await changeInventory(hotelId, change)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}${suffix}`)
    expect(fetcher.mock.calls[0][1]?.method).toBe(method)
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual(body)
  })
  it('preserves an overlap failure instead of reporting a saved room block', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ code: 'ROOM_BLOCK_OVERLAP' }), { status: 409 }))
    const { changeInventory } = await import('./inventory-api')
    await expect(changeInventory(hotelId, { kind: 'create', payload })).rejects.toMatchObject({ status: 409, code: 'ROOM_BLOCK_OVERLAP' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
