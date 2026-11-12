import { useQuery } from '@tanstack/react-query'
import { getAmenities } from '../api/catalog-api'
import type { AmenityCategory } from '../model/hotel'
import { hotelManagementKeys } from './hotel-query-keys'

export function useAmenitiesQuery(category?: AmenityCategory) {
  return useQuery({
    queryKey: hotelManagementKeys.amenities(category ? `api:${category}` : 'api'),
    queryFn: ({ signal }) => (category ? getAmenities(category, signal) : getAmenities(signal)),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

