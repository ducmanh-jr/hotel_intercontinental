import { describe, expect, it } from 'vitest'
import { adminLoginDestination } from './admin-login-destination'

describe('admin login destination', () => {
  it.each([
    [undefined, '/admin/overview'],
    [null, '/admin/overview'],
    ['/admin', '/admin/overview'],
    ['/admin/', '/admin/overview'],
    ['/admin/users?page=2#roles', '/admin/users?page=2#roles'],
    ['/admin/overview', '/admin/overview'],
    ['https://evil.example/admin', '/admin/overview'],
    ['//evil.example/admin', '/admin/overview'],
    ['/management/hotels', '/admin/overview'],
    ['/administrator', '/admin/overview'],
    ['/admin/login?returnTo=/admin/users', '/admin/overview'],
    ['/admin/LOGIN/', '/admin/overview'],
    ['/admin/%6cogin', '/admin/overview'],
    ['/admin/../login', '/admin/overview'],
    ['/admin/%ZZ', '/admin/overview'],
  ])('returns a safe admin page for %s', (input, expected) => {
    expect(adminLoginDestination(input)).toBe(expected)
  })

  it('supports management destinations and owner fallback options', () => {
    expect(adminLoginDestination('/management/hotels', { allowManagement: true })).toBe('/management/hotels')
    expect(adminLoginDestination('/management/hotels?tab=create', { allowManagement: true })).toBe('/management/hotels?tab=create')
    expect(adminLoginDestination(undefined, { isOwnerOnly: true })).toBe('/management/hotels')
    expect(adminLoginDestination('/admin/users', { isOwnerOnly: true })).toBe('/management/hotels')
  })
})
