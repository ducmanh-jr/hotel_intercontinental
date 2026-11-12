import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateHotelAmenities } from '../api/hotel-management-api'
import type { UpdateHotelAmenitiesFormValues } from '../model/hotel-form-schemas'
import { hotelManagementKeys } from './hotel-query-keys'

export function useUpdateHotelAmenitiesMutation(hotelId: string) {
  const mode = 'api'
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateHotelAmenitiesFormValues) =>
      updateHotelAmenities(hotelId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: hotelManagementKeys.detail(mode, hotelId),
      })
    },
  })
}
