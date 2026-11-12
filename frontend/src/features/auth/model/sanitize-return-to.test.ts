import { describe, expect, it } from 'vitest'
import { sanitizeReturnTo } from './sanitize-return-to'

describe('sanitizeReturnTo', () => {
  it('allows valid internal paths', () => {
    expect(sanitizeReturnTo('/admin')).toBe('/admin')
    expect(sanitizeReturnTo('/admin/overview')).toBe('/admin/overview')
    expect(sanitizeReturnTo('/admin/users?page=1&status=active')).toBe('/admin/users?page=1&status=active')
    expect(sanitizeReturnTo('/explore#section')).toBe('/explore#section')
  })

  it('rejects external absolute URLs', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBeNull()
    expect(sanitizeReturnTo('http://evil.com/admin')).toBeNull()
    expect(sanitizeReturnTo('//evil.com')).toBeNull()
    expect(sanitizeReturnTo('///evil.com')).toBeNull()
  })

  it('rejects backslash and protocol evasion vectors', () => {
    expect(sanitizeReturnTo('/\\evil.com')).toBeNull()
    expect(sanitizeReturnTo('\\evil.com')).toBeNull()
    expect(sanitizeReturnTo('/javascript:alert(1)')).toBeNull()
    expect(sanitizeReturnTo('javascript:alert(1)')).toBeNull()
    expect(sanitizeReturnTo('data:text/html,evil')).toBeNull()
  })

  it('rejects empty, non-string or whitespace-only inputs', () => {
    expect(sanitizeReturnTo('')).toBeNull()
    expect(sanitizeReturnTo('   ')).toBeNull()
    expect(sanitizeReturnTo(null)).toBeNull()
    expect(sanitizeReturnTo(undefined)).toBeNull()
    expect(sanitizeReturnTo(123)).toBeNull()
    expect(sanitizeReturnTo({})).toBeNull()
  })
})

