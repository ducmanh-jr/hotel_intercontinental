import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveHotel } from '../api/hotel-management-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function useApproveHotelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (hotelId: string) => approveHotel(hotelId),
    onSuccess: async (updatedHotel) => {
      queryClient.setQueryData(
        hotelManagementKeys.detail('api', updatedHotel.id),
        updatedHotel,
      )
      await queryClient.invalidateQueries({ queryKey: hotelManagementKeys.all })
    },
  })
}
