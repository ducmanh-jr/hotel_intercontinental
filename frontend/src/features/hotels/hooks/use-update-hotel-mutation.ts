import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateManagementHotel, type UpdateHotelPayload } from '../api/hotel-management-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function useUpdateManagementHotelMutation(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateHotelPayload) => updateManagementHotel(hotelId, payload),
    retry: false,
    onSuccess: (hotel) => { client.setQueryData(hotelManagementKeys.detail('api', hotelId), hotel) },
    onSettled: () => client.invalidateQueries({ queryKey: hotelManagementKeys.all }),
  })
}
