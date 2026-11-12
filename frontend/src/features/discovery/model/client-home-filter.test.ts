import { describe, expect, it } from 'vitest'
import {
  CLIENT_HOME_HOTELS,
  CLIENT_HOME_DESTINATIONS,
} from '../mocks/client-home-data'
import {
  normalizeText,
  parseDateInput,
  formatPrice,
} from '../hooks/use-client-home'

describe('client-home discovery models and utilities', () => {
  it('provides the 6 curated editorial stays with valid fields', () => {
    expect(CLIENT_HOME_HOTELS).toHaveLength(6)
    for (const stay of CLIENT_HOME_HOTELS) {
      expect(stay.id).toBeTruthy()
      expect(stay.name).toBeTruthy()
      expect(stay.price).toBeGreaterThan(0)
      expect(stay.rating).toBeGreaterThan(0)
      expect(stay.amenities.length).toBeGreaterThan(0)
      expect(stay.image).toBeTruthy()
    }
  })

  it('provides the 4 editorial destinations', () => {
    expect(CLIENT_HOME_DESTINATIONS).toHaveLength(4)
    const cities = CLIENT_HOME_DESTINATIONS.map((d) => d.city)
    expect(cities).toContain('Đà Lạt')
    expect(cities).toContain('Đà Nẵng')
    expect(cities).toContain('Phú Quốc')
    expect(cities).toContain('Sa Pa')
  })

  it('normalizes Vietnamese text correctly removing diacritics', () => {
    expect(normalizeText('Đà Lạt')).toBe('da lat')
    expect(normalizeText('ĐÀ NẴNG')).toBe('da nang')
    expect(normalizeText('Phú Quốc')).toBe('phu quoc')
    expect(normalizeText('Mộc Garden')).toBe('moc garden')
  })

  it('parses valid DD/MM/YYYY date strings correctly', () => {
    const valid = parseDateInput('15/11/2026')
    expect(valid).not.toBeNull()
    expect(valid?.getDate()).toBe(15)
    expect(valid?.getMonth()).toBe(10) // 0-indexed November
    expect(valid?.getFullYear()).toBe(2026)

    expect(parseDateInput('invalid')).toBeNull()
    expect(parseDateInput('31/02/2026')).toBeNull()
  })

  it('formats Vietnamese currency with đ symbol', () => {
    expect(formatPrice(1390000)).toContain('1.390.000')
    expect(formatPrice(1390000)).toContain('₫')
  })

  it('filters stays by city and vibe', () => {
    const dalatStays = CLIENT_HOME_HOTELS.filter((s) => s.city === 'Đà Lạt')
    expect(dalatStays.length).toBeGreaterThan(0)
    expect(dalatStays[0].name).toBe('Cloud Pine Glamping & Resort')

    const beachStays = CLIENT_HOME_HOTELS.filter((s) => s.vibes.includes('beach'))
    expect(beachStays.length).toBeGreaterThan(0)
  })

  it('sorts stays by price ascending and rating descending', () => {
    const sortedPrice = [...CLIENT_HOME_HOTELS].sort((a, b) => a.price - b.price)
    expect(sortedPrice[0].price).toBeLessThanOrEqual(sortedPrice[1].price)

    const sortedRating = [...CLIENT_HOME_HOTELS].sort((a, b) => b.rating - a.rating)
    expect(sortedRating[0].rating).toBeGreaterThanOrEqual(sortedRating[1].rating)
  })
})
