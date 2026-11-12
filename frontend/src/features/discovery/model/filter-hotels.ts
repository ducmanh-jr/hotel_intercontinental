import type { StayVibeHotelItem, VibeIconKey } from './discovery'

export type SortOrder = 'POPULAR' | 'PRICE_ASC' | 'RATING_DESC'
export interface DiscoveryFilters {
  vibe: VibeIconKey | 'ALL'
  cityId: string
  keyword: string
  petFriendlyOnly: boolean
  sortOrder: SortOrder
}

export function filterDiscoveryHotels(hotels: readonly StayVibeHotelItem[], filters: DiscoveryFilters) {
  const keyword = filters.keyword.trim().toLowerCase()
  const matched = hotels.filter((hotel) => {
    if (filters.vibe !== 'ALL' && !hotel.vibeIds.includes(filters.vibe)) return false
    if (filters.cityId !== 'ALL' && hotel.cityId !== filters.cityId) return false
    if (filters.petFriendlyOnly && !hotel.vibeIds.includes('pet-friendly')) return false
    if (keyword && ![hotel.name, hotel.cityName, hotel.distanceLabel]
      .some((text) => text.toLowerCase().includes(keyword))) return false
    return true
  })
  if (filters.sortOrder === 'PRICE_ASC') return matched.sort((a, b) => a.pricePerNight - b.pricePerNight)
  if (filters.sortOrder === 'RATING_DESC') return matched.sort((a, b) => b.rating - a.rating)
  return matched
}
