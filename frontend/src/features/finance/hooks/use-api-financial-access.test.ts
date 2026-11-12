import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const id = '11111111-1111-4111-8111-111111111111'
const fetcher = vi.fn<typeof fetch>()
const detail = { id, hotelId: id, userId: id, isGranted: true, accessScope: 'FINANCE_READ', reason: null,
  userName: 'Owner', userEmail: 'owner@example.com', grantedByUserId: id, grantedAt: '2026-11-09T00:00:00Z', currentVersion: 3, history: [] }
function response(data: unknown) { return new Response(JSON.stringify({ message: 'ok', data })) }
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetcher); fetcher.mockReset() })
afterEach(() => vi.unstubAllGlobals())

it.each([false, true])('refreshes cached detail after PUT (conflict=%s) and never retries the mutation', async (conflict) => {
  fetcher.mockImplementation(async (_url, init) => {
    if (init?.method === 'PUT') return conflict
      ? new Response(JSON.stringify({ code: 'CONCURRENT_MODIFICATION_DETECTED' }), { status: 409 })
      : response({ ...detail, version: 3 })
    return response({ ...detail, currentVersion: 4 })
  })
  const { apiFinancialAccessMutationOptions } = await import('./use-api-financial-access')
  const { getFinancialAccess } = await import('../api/financial-access-api')
  const { financialAccessKeys } = await import('./financial-access-query-keys')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const queryKey = financialAccessKeys.grant('api', id, id)
  client.setQueryData(queryKey, detail)
  const query = new QueryObserver(client, { queryKey, queryFn: () => getFinancialAccess({ hotelId: id, userId: id }), staleTime: Infinity })
  const unsubscribe = query.subscribe(() => undefined)
  const mutation = new MutationObserver(client, apiFinancialAccessMutationOptions(client, id, id))
  const result = mutation.mutate({ isGranted: false, accessScope: 'FINANCE_READ', reason: 'Thu hồi', expectedVersion: 3 })
  if (conflict) await expect(result).rejects.toMatchObject({ status: 409 })
  else await expect(result).resolves.toMatchObject({ version: 3 })
  expect(client.getQueryData(queryKey)).toMatchObject({ currentVersion: 4 })
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1)
  unsubscribe()
  client.clear()
})
