import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetcher = vi.fn<typeof fetch>()
function respond(data: unknown, status = 200) {
  fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data }), { status }))
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', fetcher)
  fetcher.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('management room API client', () => {
  const hotelId = '11111111-1111-4111-8111-111111111111'
  const roomId = '22222222-2222-4222-8222-222222222222'
  const roomTypeId = '33333333-3333-4333-8333-333333333333'

  it('gets management rooms via GET /management/hotels/{hotelId}/rooms', async () => {
    respond({
      content: [
        {
          id: roomId,
          roomTypeId,
          roomNumber: '101',
          floor: '1',
          readiness: 'READY',
          readinessUpdatedAt: null,
          operationalFrom: '2026-11-09T00:00:00Z',
          operationalUntil: null,
          createdAt: '2026-11-09T00:00:00Z',
          updatedAt: '2026-11-09T00:00:00Z',
          version: 0,
        },
      ],
      totalElements: 61,
      first: false,
      last: false,
      page: 1,
      size: 20,
      totalPages: 4,
    })

    const { getManagementRooms } = await import('./room-api')
    const result = await getManagementRooms(hotelId, { roomTypeId, page: 1, size: 20 })

    expect(fetcher.mock.calls[0][0]).toContain(`/management/hotels/${hotelId}/rooms?`)
    expect(fetcher.mock.calls[0][0]).toContain(`roomTypeId=${roomTypeId}`)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].roomNumber).toBe('101')
    expect(result.items[0].readiness).toBe('ready')
    expect(result.totalItems).toBe(61)
    expect(result.page).toBe(1)
    expect(fetcher.mock.calls[0][0]).toContain('page=1&size=20')
  })

  it('creates physical room via POST /management/hotels/{hotelId}/rooms', async () => {
    respond(
      {
        id: roomId,
        roomTypeId,
        roomNumber: '102',
        floor: '1',
        readiness: 'ready',
        readinessUpdatedAt: null,
        operationalFrom: '2026-11-09T00:00:00Z',
        operationalUntil: null,
        createdAt: '2026-11-09T00:00:00Z',
        updatedAt: '2026-11-09T00:00:00Z',
        version: 0,
      },
      201,
    )

    const { createManagementRoom } = await import('./room-api')
    const result = await createManagementRoom(hotelId, {
      roomTypeId,
      roomNumber: '102',
      floor: '1',
      operationalFrom: '2026-11-09T00:00:00Z',
    })

    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/rooms`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('POST')
    expect(result.roomNumber).toBe('102')
  })

  it('updates physical room via PATCH /management/hotels/{hotelId}/rooms/{roomId}', async () => {
    respond({
      id: roomId,
      roomTypeId,
      roomNumber: '102-Renovated',
      hotelId,
      floor: 0,
      status: 'cleaning',
      active: false,
      createdAt: '2026-11-09T00:00:00Z',
      updatedAt: '2026-11-09T01:00:00Z',
    })

    const { updateManagementRoom } = await import('./room-api')
    const result = await updateManagementRoom(hotelId, roomId, {
      roomNumber: '102-Renovated',
      status: 'maintenance',
    })

    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/rooms/${roomId}`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PATCH')
    expect(result.roomNumber).toBe('102-Renovated')
    expect(result).toMatchObject({ floor: '0', readiness: 'dirty', active: false })
    expect(result).not.toHaveProperty('operationalFrom')
  })
})


describe('room edit payloads', () => {
  it('keeps DIRTY and nonnumeric floor out of unrelated PATCHes', async () => {
    const { buildRoomEditPayload } = await import('./room-api')
    expect(buildRoomEditPayload(
      { roomNumber: '101', floor: 'Tầng trệt', readiness: 'dirty' },
      { roomNumber: '102', floor: 'Tầng trệt', status: 'dirty' },
    )).toEqual({ roomNumber: '102' })
  })

  it('accepts floor zero and explicit active/status changes', async () => {
    const { buildRoomEditPayload } = await import('./room-api')
    expect(buildRoomEditPayload(
      { roomNumber: '101', floor: '1', readiness: 'dirty' },
      { roomNumber: '101', floor: '0', status: 'ready', active: false },
    )).toEqual({ floor: 0, status: 'ready', active: false })
  })

  it('rejects clearing or nonnumeric floor instead of silently dropping it', async () => {
    const { buildRoomEditPayload } = await import('./room-api')
    for (const floor of ['', 'Tầng trệt', '32768']) {
      expect(() => buildRoomEditPayload(
        { roomNumber: '101', floor: '1', readiness: 'ready' },
        { roomNumber: '101', floor, status: 'ready' },
      )).toThrow(/Tầng/)
    }
  })
})
