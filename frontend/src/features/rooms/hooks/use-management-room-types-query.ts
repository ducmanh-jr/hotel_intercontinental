import { useQuery } from '@tanstack/react-query'
import { getManagementRoomTypes, type ManagementRoomType } from '../api/room-type-api'

export function useManagementRoomTypesQuery(hotelId: string, enabled = true) {
  return useQuery<ManagementRoomType[]>({
    queryKey: ['hotels', hotelId, 'room-types'],
    queryFn: ({ signal }) => getManagementRoomTypes(hotelId, signal),
    enabled: Boolean(hotelId) && enabled,
  })
}
