import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPublicHotelDetail, getPublicRoomTypes } from '../api/public-hotel-api'
import { updateHotelAmenities, updateRoomTypeAmenities } from '../api/hotel-management-api'

export function useAmenityAssignment(hotelId: string, roomTypeId?: string, readable = false) {
  const client = useQueryClient()
  const queryKey = ['hotels', 'assigned-amenities', hotelId, roomTypeId ?? 'hotel']
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const amenities = roomTypeId
        ? (await getPublicRoomTypes(hotelId, signal)).find((room) => room.id === roomTypeId)?.amenities
        : (await getPublicHotelDetail(hotelId, signal)).amenities
      return { ids: amenities?.map((amenity) => amenity.id) ?? null }
    },
    enabled: Boolean(hotelId) && readable, retry: false,
  })
  const mutation = useMutation({
    mutationFn: (amenityIds: string[]) => roomTypeId
      ? updateRoomTypeAmenities(hotelId, roomTypeId, { amenityIds })
      : updateHotelAmenities(hotelId, { amenityIds }),
    retry: false,
    onSuccess: async (ids) => {
      client.setQueryData(queryKey, { ids })
      await Promise.all([
        client.invalidateQueries({ queryKey: ['hotels', 'public-detail', hotelId] }),
        client.invalidateQueries({ queryKey: ['hotels', 'public-room-types', hotelId] }),
        ...(readable ? [client.invalidateQueries({ queryKey })] : []),
      ])
    },
  })
  return { query, mutation }
}
