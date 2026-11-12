import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

it('refreshes the active contract page and invalidates other pages after creation', async () => {
  vi.resetModules()
  const id = '11111111-1111-4111-8111-111111111111'
  const contract = { id, hotelId: id, ownerUserId: id, contractCode: 'created', commissionRate: 100,
    commissionBasis: 'BEFORE_DISCOUNT', startsAt: '2027-01-01T00:00:00Z', endsAt: '2028-01-01T00:00:00Z',
    status: 'DRAFT', createdByUserId: id, createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z' }
  const emptyPage = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true }
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => new Response(JSON.stringify({ message: 'ok', data: init?.method === 'POST' ? contract : { ...emptyPage, content: [contract], totalElements: 1, totalPages: 1 } })))
  vi.stubGlobal('fetch', fetcher)
  const { apiContractMutationOptions } = await import('./use-api-hotel-contracts')
  const { getHotelContracts } = await import('../api/contract-api')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const queryKey = ['contracts', 'by-hotel', 'api', id, 'page', { page: 0, size: 10 }]
  const secondPageKey = ['contracts', 'by-hotel', 'api', id, 'page', { page: 1, size: 10 }]
  client.setQueryData(queryKey, emptyPage)
  client.setQueryData(secondPageKey, emptyPage)
  const query = new QueryObserver(client, { queryKey, queryFn: () => getHotelContracts(id), staleTime: Infinity })
  const unsubscribe = query.subscribe(() => undefined)
  const mutation = new MutationObserver(client, apiContractMutationOptions(client, id))
  await mutation.mutate({ contractCode: 'created', ownerUserId: id, commissionRate: 100, commissionBasis: 'BEFORE_DISCOUNT', startsAt: contract.startsAt, endsAt: contract.endsAt })
  expect(client.getQueryData(queryKey)).toMatchObject({ totalElements: 1, content: [contract] })
  expect(client.getQueryState(secondPageKey)?.isInvalidated).toBe(true)
  unsubscribe()
  client.clear()
})
