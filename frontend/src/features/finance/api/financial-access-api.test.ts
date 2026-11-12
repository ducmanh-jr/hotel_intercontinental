import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const id = '11111111-1111-4111-8111-111111111111'
const fetcher = vi.fn<typeof fetch>()
const grant = { id, hotelId: id, userId: id, isGranted: true, accessScope: 'FINANCE_READ',
  reason: null, grantedByUserId: id, grantedAt: '2026-11-09T00:00:00Z' }
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetcher); fetcher.mockReset() })
afterEach(() => vi.unstubAllGlobals())
function respond(data: unknown) { fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data }))) }

it('reads currentVersion and complete server history without fabricating separate permissions', async () => {
  const history = [{ id, version: 2, isGranted: false, accessScope: 'FINANCE_READ', reason: 'revoked', changedByUserId: id, changedAt: grant.grantedAt }]
  respond({ ...grant, currentVersion: 3, userName: 'Owner', userEmail: 'owner@example.com', history })
  const { getFinancialAccess } = await import('./financial-access-api')
  const result = await getFinancialAccess({ hotelId: id, userId: id }, new AbortController().signal)
  expect(result).toMatchObject({ currentVersion: 3, history, userName: 'Owner' })
  expect(result).not.toHaveProperty('canExportReports')
  expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/admin/hotels/${id}/financial-access/${id}`)
  expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
})

it('sends the exact grant scope, reason and expected version and accepts the PUT version shape', async () => {
  respond({ ...grant, version: 4 })
  const { updateFinancialAccess } = await import('./financial-access-api')
  const payload = { isGranted: false, accessScope: 'FINANCE_READ', reason: 'Thu hồi theo quyết định', expectedVersion: 3 }
  const result = await updateFinancialAccess({ hotelId: id, userId: id }, payload)
  expect(result.version).toBe(4)
  expect(fetcher.mock.calls[0][1]?.method).toBe('PUT')
  expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual(payload)
})

it('preserves a version conflict without retrying or reporting success', async () => {
  fetcher.mockResolvedValue(new Response(JSON.stringify({ code: 'CONCURRENT_MODIFICATION_DETECTED', detail: 'Version changed' }), { status: 409 }))
  const { updateFinancialAccess } = await import('./financial-access-api')
  await expect(updateFinancialAccess({ hotelId: id, userId: id }, { isGranted: true, accessScope: 'FINANCE_READ', reason: 'reason', expectedVersion: 3 })).rejects.toMatchObject({ status: 409, code: 'CONCURRENT_MODIFICATION_DETECTED' })
  expect(fetcher).toHaveBeenCalledTimes(1)
})
