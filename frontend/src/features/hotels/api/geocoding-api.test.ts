import { afterEach, describe, expect, it, vi } from 'vitest'
import { geocodeAddress, isCityMatch, normalizeCityName } from './geocoding-api'

describe('geocoding-api utilities', () => {
  it('normalizes Vietnamese city names correctly', () => {
    expect(normalizeCityName('Đà Nẵng')).toBe('danang')
    expect(normalizeCityName('Thành phố Đà Nẵng')).toBe('danang')
    expect(normalizeCityName('TP. Đà Nẵng')).toBe('danang')
    expect(normalizeCityName('Hà Nội')).toBe('hanoi')
    expect(normalizeCityName('Thành phố Hà Nội')).toBe('hanoi')
    expect(normalizeCityName('TP. Hồ Chí Minh')).toBe('hochiminh')
  })

  it('detects city match correctly', () => {
    expect(isCityMatch('Đà Nẵng', 'Thành phố Đà Nẵng')).toBe(true)
    expect(isCityMatch('Hà Nội', 'Thành phố Hà Nội')).toBe(true)
    expect(isCityMatch('Hà Nội', 'Đà Nẵng')).toBe(false)
    expect(isCityMatch('Hồ Chí Minh', 'Hà Nội')).toBe(false)
    expect(isCityMatch(undefined, 'Đà Nẵng')).toBe(true)
  })
})

afterEach(() => vi.unstubAllGlobals())

it('ignores geocoding results without valid coordinates instead of inventing a hotel location', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ features: [
    { geometry: {}, properties: { name: 'Missing coordinates' } },
    { geometry: { coordinates: [181, 20] } },
    { geometry: { coordinates: [105.12345678, 21.12345678] }, properties: { city: 'Hà Nội' } },
  ] }))))
  const result = await geocodeAddress('12 Nguyễn Văn Linh')
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({ lat: 21.123457, lng: 105.123457, detectedCityName: 'Hà Nội' })
})
