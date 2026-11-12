import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getHotelImages, getMediaAccess, updateHotelGallery, type HotelImageDto } from '../api/hotel-media-api'
import { hotelManagementKeys } from './hotel-query-keys'

export interface HotelGalleryImageItem {
  mediaId: string
  albumId?: string | null
  sortOrder: number
  cover: boolean
  url?: string
  expiresAt?: string
}

export function useHotelImagesQuery(hotelId: string, enabled = true) {
  const mode = 'api'
  const queryClient = useQueryClient()
  const query = useQuery<HotelGalleryImageItem[]>({
    queryKey: hotelManagementKeys.images(mode, hotelId),
    queryFn: async ({ signal }) => {
      const images = await getHotelImages(hotelId, signal)
      const resolved = await Promise.all(images.map(async (img) => {
        try {
          const access = await getMediaAccess(img.mediaId, signal)
          return { ...img, url: access.url, expiresAt: access.expiresAt }
        } catch (error) {
          if (signal.aborted) throw error
          return { ...img, url: undefined }
        }
      }))
      return resolved.sort((a, b) => a.sortOrder - b.sortOrder)
    },
    enabled: Boolean(hotelId) && enabled,
    retry: 1,
    // Private access URLs expire even while this screen stays mounted.
    refetchInterval: (current) => {
      if (mode !== 'api' || !current.state.data?.length) return false
      const expirations = current.state.data.flatMap((img) => {
        const expiry = Date.parse(img.expiresAt ?? '')
        return Number.isFinite(expiry) ? [expiry] : []
      })
      return expirations.length ? Math.max(1_000, Math.min(...expirations) - Date.now() - 30_000) : 60_000
    },
  })

  const saveGallery = async (transform: (images: HotelImageDto[]) => HotelImageDto[] | Promise<HotelImageDto[]>) => {
    if (!query.isSuccess) throw new Error('Cần tải thư viện ảnh thành công trước khi thay đổi.')
    return updateHotelGallery(hotelId, transform, () => queryClient.invalidateQueries({ queryKey: hotelManagementKeys.all }))
  }

  return { ...query, saveGallery, canWrite: mode === 'api' && query.isSuccess }
}
