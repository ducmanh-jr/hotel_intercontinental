import { describe, expect, it } from 'vitest'
import { calculateHotelCompletion } from './hotel-workspace-context'

describe('hotel completion based on available server data', () => {
  it('does not infer configured prices merely from the existence of a room type', () => {
    const completion = calculateHotelCompletion({ roomTypes: [{ id: 'type', hotelId: 'hotel', name: 'Double', maxAdults: 2, maxChildren: 0, isActive: true }] })
    expect(completion.sections.rooms).toBe(true)
    expect(completion.sections.pricing).toBe(false)
  })

  it('counts stored images even if a private URL could not be resolved', () => {
    expect(calculateHotelCompletion({ imageCount: 2, coverImageUrl: null }).sections.photos).toBe(true)
    expect(calculateHotelCompletion({ imageCount: 0, coverImageUrl: 'stale-url' }).sections.photos).toBe(false)
  })
})
