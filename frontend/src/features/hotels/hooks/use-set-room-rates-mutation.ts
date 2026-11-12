import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setRoomTypeDailyRates } from '../api/room-rates-api'
import { exclusiveRateEndDate, type SetRoomRatesFormValues } from '../model/room-rates'
import { hotelManagementKeys } from './hotel-query-keys'
import type { ManagementHotelDetail } from '../model/hotel'

export interface SetRoomRateMutationInput {
  startDate: string
  endDate?: string
  amount: number
  currency?: string
}

export function useSetRoomRatesMutation(hotelId: string, roomTypeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: async (values: SetRoomRatesFormValues | SetRoomRateMutationInput) => {
      let endDateExclusive: string | undefined = undefined
      if (values.endDate && values.endDate !== values.startDate) {
        endDateExclusive = exclusiveRateEndDate(values.endDate)
      }
      return setRoomTypeDailyRates({ hotelId, roomTypeId }, {
        startDate: values.startDate,
        endDateExclusive,
        amount: values.amount,
        currency: ('currency' in values && values.currency) ? values.currency : 'VND',
      })
    },
    onSuccess: async () => {
      queryClient.setQueryData<ManagementHotelDetail>(hotelManagementKeys.detail('api', hotelId), (hotel) =>
        hotel ? { ...hotel, hasConfiguredRates: true } : hotel)
      await queryClient.invalidateQueries({ queryKey: ['hotels', 'room-rates', 'api'] })
    },
  })
}
