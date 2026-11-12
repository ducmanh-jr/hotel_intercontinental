import { describe, expect, it } from 'vitest'
import { filterDiscoveryHotels } from './filter-hotels'
import { STAYVIBE_FEATURED_HOTELS } from '../mocks/stayvibe-mock-data'

const all = { vibe: 'ALL', cityId: 'ALL', keyword: '', petFriendlyOnly: false, sortOrder: 'POPULAR' } as const

describe('discovery filtering', () => {
  it('combines city, keyword and pet-friendly filters', () => {
    const result = filterDiscoveryHotels(STAYVIBE_FEATURED_HOTELS, {
      ...all, cityId: 'da-lat', keyword: ' CLOUD PINE ', petFriendlyOnly: true,
    })
    expect(result.map((hotel) => hotel.slug)).toEqual(['stayvibe-cloud-pine-glamping-da-lat'])
  })

  it('filters a vibe independently of other categories', () => {
    const result = filterDiscoveryHotels(STAYVIBE_FEATURED_HOTELS, { ...all, vibe: 'glamping' })
    expect(result.map((hotel) => hotel.slug)).toEqual([
      'stayvibe-cloud-pine-glamping-da-lat',
    ])
  })

  it('sorts by ascending price without mutating the source order', () => {
    const order = STAYVIBE_FEATURED_HOTELS.map((hotel) => hotel.id)
    const result = filterDiscoveryHotels(STAYVIBE_FEATURED_HOTELS, { ...all, sortOrder: 'PRICE_ASC' })
    expect(result[0].slug).toBe('stayvibe-cloud-pine-glamping-da-lat')
    expect(result.every((hotel, index) => index === 0 || result[index - 1].pricePerNight <= hotel.pricePerNight)).toBe(true)
    expect(STAYVIBE_FEATURED_HOTELS.map((hotel) => hotel.id)).toEqual(order)
  })
})
