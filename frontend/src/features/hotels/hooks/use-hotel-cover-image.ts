import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getHotelImages, getMediaAccess } from '../api/hotel-media-api'
import { hotelManagementKeys } from './hotel-query-keys'
import type { HotelGalleryImageItem } from './use-hotel-images-query'

export function useHotelCoverImage(hotelId: string, initialUrl?: string | null) {
  const mode = 'api'
  const queryClient = useQueryClient()

  return useQuery<string | null>({
    queryKey: ['hotels', 'cover-image', mode, hotelId] as const,
    queryFn: async ({ signal }) => {
      if (initialUrl) return initialUrl

      // Check if full gallery images are already cached for this hotel
      const cachedGallery = queryClient.getQueryData<HotelGalleryImageItem[]>(
        hotelManagementKeys.images(mode, hotelId),
      )
      if (cachedGallery && cachedGallery.length > 0) {
        const cover = cachedGallery.find((img) => img.cover) ?? cachedGallery[0]
        if (cover?.url) return cover.url
      }

      try {
        const images = await getHotelImages(hotelId, signal)
        if (!images || images.length === 0) return null

        const coverItem = images.find((img) => img.cover) ?? images[0]
        if (!coverItem) return null

        const access = await getMediaAccess(coverItem.mediaId, signal)
        return access.url || null
      } catch (error) {
        if (signal?.aborted) throw error
        return null
      }
    },
    enabled: Boolean(hotelId) && !initialUrl && mode === 'api',
    staleTime: 5 * 60 * 1000,
  })
}
