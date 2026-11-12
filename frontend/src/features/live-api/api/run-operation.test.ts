import { afterEach, describe, expect, it, vi } from 'vitest'
import { operations, inputSchema } from '../model/operations'
import { runOperation } from './run-operation'
import { http } from '@/shared/api/http'
import { getSession, setSession } from '@/shared/api/session'
import { createHttpClient } from '@/shared/api/client'
const find = (id: string) => operations.find((o) => o.id === id)!
const id = '11111111-1111-4111-8111-111111111111'
afterEach(() => {
  vi.restoreAllMocks()
  setSession(null)
})
describe('develop integration', () => {
  it('covers exactly the 18 implemented endpoints with unique operation IDs', () => {
    expect(operations).toHaveLength(18)
    expect(new Set(operations.map((o) => o.id)).size).toBe(18)
  })

  it.each(['hotels', 'hotel', 'create-hotel'])('keeps raw backend hotel statuses readable in diagnostics %s', async (operationId) => {
    const hotel = {
      id, ownerId: id, cityId: id, name: 'Test', slug: 'test', description: null, address: 'Address',
      latitude: null, longitude: null, starRating: null, checkInTime: '14:00', checkOutTime: '12:00',
      status: 'UNDER_REVIEW', createdAt: '2026-11-04T00:00:00Z', updatedAt: '2026-11-04T00:00:00Z', version: 0,
    }
    const data = operationId === 'hotels'
      ? { content: [hotel], page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true }
      : hotel
    const client = createHttpClient({
      baseUrl: '/api/v1', timeoutMs: 1000,
      fetcher: async () => new Response(JSON.stringify({ message: 'ok', data })),
    })
    const operation = find(operationId)
    if (operation.kind !== 'http') throw new Error('Expected HTTP diagnostic operation')
    const result = await client.request(operation.path({ hotelId: id, page: '0', size: '20' }), { schema: operation.response })
    expect(result).toEqual(data)
  })
  it('validates password policy, UUIDs, pagination and timezone before requests', () => {
    expect(
      inputSchema(find('register')).safeParse({
        email: 'a@b.com',
        password: 'short',
        fullName: 'Test',
        phone: '123',
      }).success,
    ).toBe(false)
    expect(
      inputSchema(find('hotels')).safeParse({ page: '-1', size: '0' }).success,
    ).toBe(false)
    expect(
      inputSchema(find('hotel')).safeParse({ hotelId: 'fake' }).success,
    ).toBe(false)
    expect(
      inputSchema(find('room')).safeParse({
        hotelId: id,
        roomTypeId: id,
        roomNumber: '101',
        floor: '',
        operationalFrom: '2026-11-05T14:00:00',
        operationalUntil: '',
      }).success,
    ).toBe(false)
  })
  it('sends ownerId and numeric starRating without a fabricated slug', async () => {
    const spy = vi.spyOn(http, 'request').mockResolvedValue({})
    await runOperation(find('create-hotel'), {
      ownerId: id,
      cityId: id,
      name: 'Test Hotel',
      address: 'Address',
      description: '',
      starRating: '3',
      checkInTime: '14:00',
      checkOutTime: '12:00',
    })
    expect(spy).toHaveBeenCalledWith(
      '/management/hotels',
      expect.objectContaining({
        method: 'POST',
        body: {
          ownerId: id,
          cityId: id,
          name: 'Test Hotel',
          address: 'Address',
          description: '',
          starRating: 3,
          checkInTime: '14:00',
          checkOutTime: '12:00',
        },
      }),
    )
  })
  it('uses integer role IDs and puts hotel IDs only in room type paths', async () => {
    const spy = vi.spyOn(http, 'request').mockResolvedValue({})
    await runOperation(find('grant-role'), { userId: id, roleId: '2' })
    expect(spy).toHaveBeenLastCalledWith(
      '/admin/users/' + id + '/roles/2',
      expect.objectContaining({ method: 'PUT', body: undefined }),
    )
    await runOperation(find('room-type'), {
      hotelId: id,
      name: 'Deluxe',
      description: '',
      maxAdults: '2',
      maxChildren: '0',
    })
    expect(spy).toHaveBeenLastCalledWith(
      '/management/hotels/' + id + '/room-types',
      expect.objectContaining({
        body: { name: 'Deluxe', description: '', maxAdults: 2, maxChildren: 0 },
      }),
    )
  })
  it('stores rotating tokens in memory and removes tokens from displayed results', async () => {
    vi.spyOn(http, 'request').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: '2026-11-05T10:00:00Z',
      tokenType: 'Bearer',
      user: null,
    })
    const result = await runOperation(find('login'), {
      email: 'a@b.com',
      password: 'password',
    })
    expect(getSession()?.accessToken).toBe('access')
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('refreshToken')
    vi.mocked(http.request).mockResolvedValue({
      accessToken: 'next',
      refreshToken: 'rotated',
      expiresAt: '2026-11-05T11:00:00Z',
      tokenType: 'Bearer',
      user: null,
    })
    await runOperation(find('refresh'), {})
    expect(http.request).toHaveBeenLastCalledWith(
      '/auth/refresh',
      expect.objectContaining({ body: {} }),
    )
    expect(getSession()?.accessToken).toBe('next')
    vi.mocked(http.request).mockResolvedValue(null)
    await runOperation(find('logout'), {})
    expect(getSession()).toBeNull()
  })
  it('preserves session on failed logout and propagates permission errors', async () => {
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 'future',
    })
    vi.spyOn(http, 'request').mockRejectedValue(new Error('Forbidden'))
    await expect(runOperation(find('logout'), {})).rejects.toThrow('Forbidden')
    expect(getSession()).not.toBeNull()
  })
  it('attaches current Bearer only to authenticated business requests, not public auth or health', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ message: 'ok', data: null })),
    )
    const client = createHttpClient({
      baseUrl: '/api/v1',
      timeoutMs: 1000,
      getAccessToken: () => getSession()?.accessToken,
      fetcher,
    })
    setSession({
      accessToken: 'current',
      refreshToken: 'refresh',
      expiresAt: 'future',
    })
    await client.request('/users/me')
    expect(
      new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization'),
    ).toBe('Bearer current')
    await client.request('/auth/login')
    expect(
      new Headers(fetcher.mock.calls[1][1]?.headers).has('Authorization'),
    ).toBe(false)
    await client.requestRaw('/actuator/health')
    expect(
      new Headers(fetcher.mock.calls[2][1]?.headers).has('Authorization'),
    ).toBe(false)
    await client.request('/auth/logout')
    expect(
      new Headers(fetcher.mock.calls[3][1]?.headers).get('Authorization'),
    ).toBe('Bearer current')
    setSession(null)
    await client.request('/users/me')
    expect(
      new Headers(fetcher.mock.calls[4][1]?.headers).has('Authorization'),
    ).toBe(false)
  })
})
