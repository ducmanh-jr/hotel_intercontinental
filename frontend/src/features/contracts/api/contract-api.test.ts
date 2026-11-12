import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const fetcher = vi.fn<typeof fetch>()
const id = '11111111-1111-4111-8111-111111111111'
const contract = {
  id, hotelId: id, ownerUserId: id, contractCode: 'a', commissionRate: 0,
  commissionBasis: 'AFTER_HOTEL_DISCOUNT', startsAt: '2027-01-01T00:00:00Z',
  endsAt: '2028-01-01T00:00:00Z', status: 'DRAFT', createdByUserId: id,
  createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z',
}
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetcher); fetcher.mockReset() })
afterEach(() => vi.unstubAllGlobals())
function respond(data: unknown) { fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data }))) }

it('reads the real paginated contracts and backend status filter without inventing currency or terms', async () => {
  respond({ content: [contract], page: 1, size: 5, totalElements: 6, totalPages: 2, first: false, last: true })
  const { getHotelContracts } = await import('./contract-api')
  const result = await getHotelContracts(id, { page: 1, size: 5, status: 'DRAFT' }, new AbortController().signal)
  expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/finance/hotels/${id}/contracts?page=1&size=5&status=DRAFT`)
  expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  expect(result).toMatchObject({ content: [contract], totalElements: 6 })
  expect(result.content[0]).not.toHaveProperty('currency')
})

it('creates only the supported draft contract fields and serializes dates as instants', async () => {
  respond(contract)
  const { createHotelContractDraft } = await import('./contract-api')
  await createHotelContractDraft(id, {
    contractCode: 'a', ownerUserId: id, commissionRate: 0, commissionBasis: 'AFTER_HOTEL_DISCOUNT',
    startsAt: '2027-01-01T07:00', endsAt: '2028-01-01T07:00',
  })
  const body = JSON.parse(fetcher.mock.calls[0][1]?.body as string)
  expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/admin/hotels/${id}/contracts`)
  expect(body).toEqual({ contractCode: 'a', ownerUserId: id, commissionRate: 0, commissionBasis: 'AFTER_HOTEL_DISCOUNT',
    startsAt: new Date('2027-01-01T07:00').toISOString(), endsAt: new Date('2028-01-01T07:00').toISOString(), status: 'DRAFT' })
})

it('rejects equal contract instants before sending the request', async () => {
  const { createHotelContractDraft } = await import('./contract-api')
  await expect(createHotelContractDraft(id, { contractCode: 'a', ownerUserId: id, commissionRate: 100,
    commissionBasis: 'BEFORE_DISCOUNT', startsAt: '2027-01-01T00:00', endsAt: '2027-01-01T00:00' })).rejects.toMatchObject({ name: 'ZodError' })
  expect(fetcher).not.toHaveBeenCalled()
})
