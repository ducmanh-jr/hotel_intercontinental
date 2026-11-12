import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { ApiHotelContractsSection } from './ApiHotelContractsSection'

vi.mock('@/features/auth', () => ({ useCurrentUser: () => ({ isAdmin: false }) }))

it('keeps the existing two-column section and restricts real contract creation to admins', () => {
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client: new QueryClient() },
    createElement(ApiHotelContractsSection, { hotelId: '11111111-1111-4111-8111-111111111111', ownerUserId: '22222222-2222-4222-8222-222222222222' })))
  expect(html).toContain('detail-grid-layout')
  expect(html).toContain('Chỉ ADMIN được tạo hợp đồng')
  expect(html).toContain('22222222-2222-4222-8222-222222222222')
  expect(html).not.toContain('Đơn vị tiền tệ')
  expect(html).not.toContain('Tóm tắt điều khoản')
})
