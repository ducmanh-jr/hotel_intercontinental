import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { ApiFinancialAccessSection } from './ApiFinancialAccessSection'

vi.mock('@/features/auth', () => ({ useCurrentUser: () => ({ isAdmin: true }) }))

it('renders one real access scope and the server history using the loaded version', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const client = new QueryClient()
  client.setQueryData(['finance', 'access-grant', 'api', id, id], {
    id, hotelId: id, userId: id, userName: 'Real representative', userEmail: null, isGranted: true,
    accessScope: 'FINANCE_READ', reason: null, grantedByUserId: id, grantedAt: '2026-11-09T00:00:00Z', currentVersion: 7,
    history: [{ id, version: 6, isGranted: false, accessScope: 'FINANCE_READ', reason: 'Server audit reason', changedByUserId: id, changedAt: '2026-11-08T00:00:00Z' }],
  })
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
    createElement(ApiFinancialAccessSection, { hotelId: id, defaultOwnerUserId: id })))
  expect(html).toContain('fin-detail-grid')
  expect(html).toContain('FINANCE_READ')
  expect(html).toContain('Server audit reason')
  expect(html).toContain('#7')
  expect(html).not.toContain('canExportReports')
  expect(html).not.toContain('Hợp đồng liên kết')
})
