import { useQuery } from '@tanstack/react-query'
import { getManagementHotelDetail } from '../api/hotel-management-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function useManagementHotelDetailQuery(hotelId: string) {
  return useQuery({ queryKey: hotelManagementKeys.detail('api', hotelId), queryFn: ({ signal }) => getManagementHotelDetail(hotelId, signal), enabled: Boolean(hotelId), retry: false })
}
