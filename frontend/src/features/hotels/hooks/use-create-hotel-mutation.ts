import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { createAdminHotel } from '../api/hotel-management-api'
import type { CreateAdminHotelFormValues } from '../model/hotel-form-schemas'
import { hotelManagementKeys } from './hotel-query-keys'

export function useCreateAdminHotelMutation() {
  const queryClient = useQueryClient()
  const { setMode } = useDataMode()

  return useMutation({
    mutationFn: (payload: CreateAdminHotelFormValues) =>
      createAdminHotel(payload),
    retry: false,
    onSuccess: (hotel) => {
      setMode('api')
      queryClient.setQueryData(hotelManagementKeys.detail('api', hotel.id), hotel)
      void queryClient.invalidateQueries({ queryKey: hotelManagementKeys.all })
    },
  })
}
