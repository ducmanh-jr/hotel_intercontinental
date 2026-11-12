import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { createManagementRoom, updateManagementRoom, updateManagementRoomType } from '../api/room-api'
import type { CreateRoomPayload, UpdateRoomPayload, UpdateRoomTypePayload } from '../api/room-api'
import { createManagementRoomType } from '../api/room-type-api'
import type { CreateRoomTypePayload } from '../api/room-type-api'

export async function invalidateManagementRooms(client: QueryClient, hotelId: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['rooms', 'management-list', hotelId] }),
    client.invalidateQueries({ queryKey: ['rooms', 'inventory', hotelId] }),
    client.invalidateQueries({ queryKey: ['hotels', hotelId, 'room-types'] }),
  ])
}

export function useManagementRoomMutations(hotelId: string) {
  const client = useQueryClient()
  const onSuccess = () => invalidateManagementRooms(client, hotelId)
  const createRoom = useMutation({ retry: false, mutationFn: (payload: CreateRoomPayload) => createManagementRoom(hotelId, payload), onSuccess })
  const updateRoom = useMutation({ retry: false, mutationFn: ({ roomId, payload }: { roomId: string; payload: UpdateRoomPayload }) => updateManagementRoom(hotelId, roomId, payload), onSuccess })
  const createRoomType = useMutation({ retry: false, mutationFn: (payload: CreateRoomTypePayload) => createManagementRoomType(hotelId, payload), onSuccess })
  const updateRoomType = useMutation({ retry: false, mutationFn: ({ roomTypeId, payload }: { roomTypeId: string; payload: UpdateRoomTypePayload }) => updateManagementRoomType(hotelId, roomTypeId, payload), onSuccess })
  return { createRoom, updateRoom, createRoomType, updateRoomType }
}
