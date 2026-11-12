import { useQuery } from '@tanstack/react-query'
import { getRoomTypeDailyRates } from '../api/hotel-management-api'
import { hotelManagementKeys } from './hotel-query-keys'
import { roomRatesRangeSchema } from '../model/room-rates'

export function useRoomTypeDailyRatesQuery(params: {
  hotelId: string
  roomTypeId: string
  startDate: string
  endDate: string
}, enabled = true) {
  const mode = 'api'
  return useQuery({
    queryKey: hotelManagementKeys.rates(mode, params),
    queryFn: ({ signal }) =>
      getRoomTypeDailyRates(params, signal),
    enabled: Boolean(
      enabled && params.hotelId && params.roomTypeId && roomRatesRangeSchema.safeParse(params).success,
    ),
    retry: false,
  })
}
