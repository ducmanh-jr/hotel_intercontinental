import { useQuery } from '@tanstack/react-query'
import { getManagementRooms } from '../api/room-api'
import type { ManagementRoomPage } from '../api/room-api'

export function useManagementRoomsQuery(
  hotelId: string,
  params?: { roomTypeId?: string; page?: number; size?: number },
  enabled = true,
) {
  return useQuery<ManagementRoomPage>({
    queryKey: ['rooms', 'management-list', hotelId, params],
    queryFn: ({ signal }) => getManagementRooms(hotelId, params, signal),
    enabled: Boolean(hotelId) && enabled,
  })
}
