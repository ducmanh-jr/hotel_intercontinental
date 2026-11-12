import { useQuery } from '@tanstack/react-query'
import { getPublicHotelDetail, getPublicRoomTypes } from '../api/public-hotel-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function usePublicHotelDetailQuery(hotelId: string | undefined) {
  const isEnabled = Boolean(hotelId)

  const hotelQuery = useQuery({
    queryKey: hotelManagementKeys.publicDetail(hotelId ?? ''),
    queryFn: ({ signal }) => getPublicHotelDetail(hotelId!, signal),
    enabled: isEnabled,
    retry: false,
  })

  const roomTypesQuery = useQuery({
    queryKey: hotelManagementKeys.publicRoomTypes(hotelId ?? ''),
    queryFn: ({ signal }) => getPublicRoomTypes(hotelId!, signal),
    enabled: isEnabled,
    retry: false,
  })

  return {
    hotel: hotelQuery.data,
    roomTypes: roomTypesQuery.data ?? [],
    isLoading: hotelQuery.isLoading || roomTypesQuery.isLoading,
    isError: hotelQuery.isError,
    error: hotelQuery.error,
    refetch: () => {
      void hotelQuery.refetch()
      void roomTypesQuery.refetch()
    },
  }
}
