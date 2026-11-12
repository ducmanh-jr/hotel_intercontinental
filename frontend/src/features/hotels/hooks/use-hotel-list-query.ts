import { useQuery } from '@tanstack/react-query'
import { getManagementHotels } from '../api/hotel-management-api'
import type { ManagementHotelListQuery } from '../model/hotel'
import { hotelManagementKeys } from './hotel-query-keys'

export function useManagementHotelsQuery(query: ManagementHotelListQuery) {
  const effectiveQuery = { page: query.page, size: query.size }
  return useQuery({ queryKey: hotelManagementKeys.list('api', effectiveQuery), queryFn: ({ signal }) => getManagementHotels(effectiveQuery, signal), retry: false })
}
