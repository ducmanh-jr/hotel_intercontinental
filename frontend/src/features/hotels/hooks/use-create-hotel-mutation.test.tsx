import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataModeContext } from '@/shared/lib/data-mode-context'
import { useCreateAdminHotelMutation } from './use-create-hotel-mutation'
import { useCitiesQuery } from './use-cities-query'
import { hotelManagementKeys } from './hotel-query-keys'

const fetcher = vi.hoisted(() => {
  const fn = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fn)
  return fn
})

const id = '11111111-1111-4111-8111-111111111111'
const ownerId = '22222222-2222-4222-8222-222222222222'
const cityId = '33333333-3333-4333-8333-333333333333'
const hotel = {
  id, ownerId, cityId, name: 'Khách sạn thật', slug: 'server-generated',
  description: null, address: '12 Nguyễn Văn Linh', latitude: null, longitude: null,
  starRating: 3, checkInTime: '14:00:00', checkOutTime: '12:00:00', status: 'DRAFT',
  createdAt: '2026-11-11T00:00:00Z', updatedAt: '2026-11-11T00:00:00Z', version: 0,
}
const payload = {
  name: hotel.name, slug: '', ownerUserId: ownerId, cityId, address: hotel.address,
  starRating: 3, checkInTime: '14:00', checkOutTime: '12:00', latitude: null, longitude: null,
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 3 } } })
  const setMode = vi.fn()
  let mutation!: ReturnType<typeof useCreateAdminHotelMutation>
  let cities!: ReturnType<typeof useCitiesQuery>
  function Probe() {
    mutation = useCreateAdminHotelMutation()
    cities = useCitiesQuery()
    return null
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DataModeContext.Provider value={{ mode: 'mock', setMode }}><Probe /></DataModeContext.Provider>
    </QueryClientProvider>,
  )
  return { client, setMode, mutation, cities }
}

beforeEach(() => fetcher.mockReset())

describe('real hotel creation regardless of legacy preview mode', () => {
  it('uses the actual cities endpoint, creates through POST and switches the destination to API data', async () => {
    fetcher.mockImplementation(async (url) => new Response(JSON.stringify({
      message: 'ok', data: String(url).endsWith('/cities')
        ? [{ id: cityId, name: 'Đà Nẵng', slug: 'da-nang', countryCode: 'VN' }] : hotel,
    })))
    const { client, setMode, mutation, cities } = setup()
    const catalog = await cities.refetch({ throwOnError: true })
    expect(catalog.data?.map((city) => city.id)).toEqual([cityId])
    const created = await mutation.mutateAsync(payload)
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['/api/v1/cities', '/api/v1/management/hotels'])
    expect(fetcher.mock.calls[1][1]?.method).toBe('POST')
    expect(JSON.parse(fetcher.mock.calls[1][1]?.body as string)).toMatchObject({ ownerId, cityId, address: hotel.address })
    expect(created).toMatchObject({ id, ownerUserId: ownerId, slug: hotel.slug })
    expect(setMode).toHaveBeenCalledWith('api')
    expect(client.getQueryData(hotelManagementKeys.detail('api', id))).toMatchObject({ id })
    client.clear()
  })

  it('propagates a backend failure without retrying POST or producing a sample hotel', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({
      status: 422, code: 'OWNER_NOT_ELIGIBLE', detail: 'Chủ sở hữu chưa đủ điều kiện.',
    }), { status: 422 }))
    const { client, setMode, mutation } = setup()
    await expect(mutation.mutateAsync(payload)).rejects.toMatchObject({ status: 422, code: 'OWNER_NOT_ELIGIBLE' })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(setMode).not.toHaveBeenCalled()
    expect(client.getQueryData(hotelManagementKeys.detail('api', id))).toBeUndefined()
    client.clear()
  })

  it('keeps a catalog failure visible without returning sample cities', async () => {
    fetcher.mockResolvedValue(new Response('{}', { status: 503 }))
    const { client, cities } = setup()
    await expect(cities.refetch({ throwOnError: true })).rejects.toMatchObject({ status: 503 })
    expect(client.getQueryState(hotelManagementKeys.cities('api'))?.status).toBe('error')
    expect(client.getQueryData(hotelManagementKeys.cities('api'))).toBeUndefined()
    client.clear()
  })
})
