import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changeHotelAlbum, getHotelAlbums, type AlbumChange } from '../api/hotel-albums-api'
import { hotelManagementKeys } from './hotel-query-keys'

export function useHotelAlbums(hotelId: string) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['hotels', 'albums', hotelId], queryFn: ({ signal }) => getHotelAlbums(hotelId, signal), enabled: Boolean(hotelId), retry: false })
  const mutation = useMutation({ mutationFn: (change: AlbumChange) => changeHotelAlbum(hotelId, change), retry: false, onSettled: () => client.invalidateQueries({ queryKey: hotelManagementKeys.all }) })
  return { query, mutation }
}
