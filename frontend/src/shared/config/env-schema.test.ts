import { describe, expect, it } from 'vitest'
import { parseProxyTarget, parsePublicEnv } from './env-schema'

describe('public environment contract', () => {
  it('has same-origin defaults so CI builds without a local env file', () => {
    expect(parsePublicEnv({})).toEqual({
      appName: 'Hotel Booking', apiBaseUrl: '/api/v1', apiTimeoutMs: 10_000,
    })
  })
  it('normalizes a trailing slash', () => {
    expect(parsePublicEnv({ VITE_API_BASE_URL: '/api/v1/' }).apiBaseUrl).toBe('/api/v1')
  })
  it('rejects an absolute API domain that would break image promotion', () => {
    expect(() => parsePublicEnv({ VITE_API_BASE_URL: 'https://staging.example/api/v1' })).toThrow()
  })
  it('rejects a timeout outside the supported range', () => {
    expect(() => parsePublicEnv({ VITE_API_TIMEOUT_MS: '0' })).toThrow()
  })
  it('keeps proxy configuration server-side and validates its protocol', () => {
    expect(parseProxyTarget(undefined)).toBe('http://localhost:8080')
    expect(() => parseProxyTarget('ftp://localhost')).toThrow()
    expect(() => parseProxyTarget('https://user:password@example.com')).toThrow()
  })
})
