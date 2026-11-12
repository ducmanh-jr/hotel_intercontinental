import { describe, expect, it } from 'vitest'
import { buildHotelPatch } from './hotel-update'
import type { ManagementHotelDetail } from './hotel'
const hotel = { id: 'hotel', name: 'Hotel', description: null, address: 'Address', contactPhone: null, contactEmail: null, latitude: null, longitude: null, starRating: 3, checkInTime: '14:00:00', checkOutTime: '12:00:00', version: 8 } as ManagementHotelDetail

describe('hotel PATCH from actual changed fields', () => {
  it('updates policy hours with the observed version and omits immutable form fields', () => {
    expect(buildHotelPatch(hotel, { name: 'Hotel', checkInTime: '15:00', checkOutTime: '12:00', cityId: 'another city', ownerUserId: 'another owner' })).toEqual({ version: 8, checkInTime: '15:00' })
  })
  it('preserves an unchanged null description rather than submitting an unsupported blank', () => {
    expect(buildHotelPatch(hotel, { description: '', contactPhone: '+84901234567' })).toEqual({ version: 8, contactPhone: '+84901234567' })
  })
  it('rejects deleting existing content with an empty string', () => {
    expect(() => buildHotelPatch({ ...hotel, description: 'Existing' }, { description: '' })).toThrow()
  })
  it('sends both coordinates when moving a pin', () => {
    expect(buildHotelPatch({ ...hotel, latitude: 16, longitude: 108 }, { latitude: 17, longitude: 108 })).toEqual({ version: 8, latitude: 17, longitude: 108 })
  })
  it('rejects unknown versions, incomplete pins and empty patches', () => {
    expect(() => buildHotelPatch({ ...hotel, version: undefined }, { name: 'Changed' })).toThrow()
    expect(() => buildHotelPatch(hotel, { latitude: 17, longitude: null })).toThrow()
    expect(() => buildHotelPatch(hotel, { name: 'Hotel' })).toThrow()
  })
})
