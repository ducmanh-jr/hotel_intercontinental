import { describe, expect, it } from 'vitest'
import { BENTO_DESTINATIONS, STAYVIBE_FEATURED_HOTELS, VIBE_CATEGORIES } from './stayvibe-mock-data'

describe('stayvibe-mock-data (UI Skeleton Dataset)', () => {
  it('provides style vibe category matching design.md', () => {
    expect(VIBE_CATEGORIES).toHaveLength(1)
    expect(VIBE_CATEGORIES[0].icon).toBe('glamping')
  })

  it('configures Bento Grid item', () => {
    expect(BENTO_DESTINATIONS).toHaveLength(1)
    expect(BENTO_DESTINATIONS[0].spanClass).toBe('featured')
  })

  it('ensures featured hotel has valid pricing, 3 amenities, and carousel images', () => {
    expect(STAYVIBE_FEATURED_HOTELS).toHaveLength(1)
    for (const hotel of STAYVIBE_FEATURED_HOTELS) {
      expect(hotel.pricePerNight).toBeGreaterThan(0)
      expect(hotel.amenities).toHaveLength(3)
      expect(hotel.images.length).toBeGreaterThan(0)
    }
  })
})
