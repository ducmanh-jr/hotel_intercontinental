import { useQuery } from '@tanstack/react-query'
import { getCities } from '../api/catalog-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function useCitiesQuery() {
  return useQuery({
    queryKey: hotelManagementKeys.cities('api'),
    queryFn: ({ signal }) => getCities(signal),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
