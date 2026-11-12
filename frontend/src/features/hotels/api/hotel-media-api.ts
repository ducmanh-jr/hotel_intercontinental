import { z } from 'zod'
import { http } from '@/shared/api/http'
import { getManagementHotelDetail } from './hotel-management-api'

export const mediaResponseSchema = z.object({
  id: z.string().uuid(),
  purpose: z.string(),
  status: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  createdAt: z.string().optional(),
})

export type MediaDto = z.infer<typeof mediaResponseSchema>

export const hotelImageResponseSchema = z.object({
  mediaId: z.string().uuid(),
  albumId: z.string().uuid().nullable().optional(),
  sortOrder: z.number(),
  cover: z.boolean(),
})

export const hotelImageListResponseSchema = z.array(hotelImageResponseSchema)

export type HotelImageDto = z.infer<typeof hotelImageResponseSchema>

export interface ReplaceHotelImagesPayload {
  images: Array<{
    mediaId: string
    albumId?: string | null
    sortOrder: number
    cover: boolean
  }>
  expectedVersion: number
}

/**
 * Upload hotel image to Cloudflare R2 via Backend media service.
 * POST /api/v1/media (multipart/form-data)
 */
export async function uploadHotelMedia(
  params: { file: File; hotelId: string },
  signal?: AbortSignal,
): Promise<MediaDto> {
  const form = new FormData()
  form.append('file', params.file)
  form.append('hotelId', params.hotelId)
  form.append('purpose', 'HOTEL_IMAGE')

  return http.request('/media', {
    method: 'POST',
    body: form,
    signal,
    schema: mediaResponseSchema,
  })
}

/**
 * Replace and link gallery images to a specific hotel.
 * PUT /api/v1/management/hotels/{hotelId}/images
 */
export async function replaceHotelImages(
  hotelId: string,
  payload: ReplaceHotelImagesPayload,
  signal?: AbortSignal,
): Promise<HotelImageDto[]> {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/images`, {
    method: 'PUT',
    body: payload,
    signal,
    schema: hotelImageListResponseSchema,
  })
}

/**
 * Get active gallery images for a specific hotel.
 * GET /api/v1/management/hotels/{hotelId}/images
 */
export async function getHotelImages(
  hotelId: string,
  signal?: AbortSignal,
): Promise<HotelImageDto[]> {
  return http.request(`/management/hotels/${encodeURIComponent(hotelId)}/images`, {
    method: 'GET',
    signal,
    schema: hotelImageListResponseSchema,
  })
}

export const mediaAccessResponseSchema = z.object({
  mediaId: z.string().uuid(),
  url: z.string(),
  expiresAt: z.string().optional(),
})

export type MediaAccessDto = z.infer<typeof mediaAccessResponseSchema>

/**
 * Get direct/presigned access URL for a media item.
 * GET /api/v1/media/{mediaId}/access
 */
export async function getMediaAccess(
  mediaId: string,
  signal?: AbortSignal,
): Promise<MediaAccessDto> {
  return http.request(`/media/${encodeURIComponent(mediaId)}/access`, {
    method: 'GET',
    signal,
    schema: mediaAccessResponseSchema,
  })
}

const galleryWrites = new Map<string, Promise<unknown>>()

export async function withHotelMediaWrite<T>(hotelId: string, write: () => Promise<T>): Promise<T> {
  const previous = galleryWrites.get(hotelId)
  const operation = (async () => { await previous?.catch(() => undefined); return write() })()
  galleryWrites.set(hotelId, operation)
  try { return await operation } finally {
    if (galleryWrites.get(hotelId) === operation) galleryWrites.delete(hotelId)
  }
}

export async function updateHotelGallery(
  hotelId: string,
  transform: (images: HotelImageDto[]) => HotelImageDto[] | Promise<HotelImageDto[]>,
  refresh: () => Promise<unknown> = async () => undefined,
  signal?: AbortSignal,
): Promise<HotelImageDto[]> {
  return withHotelMediaWrite(hotelId, async () => {
    try {
      const hotel = await getManagementHotelDetail(hotelId, signal)
      const version = hotel.version
      if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
        throw new Error('Chưa đọc được phiên bản khách sạn. Vui lòng tải lại trước khi lưu ảnh.')
      }
      const current = (await getHotelImages(hotelId, signal)).sort((a, b) => a.sortOrder - b.sortOrder)
      const images = await transform(current)
      return await replaceHotelImages(hotelId, { images, expectedVersion: version }, signal)
    } finally { await refresh() }
  })
}
