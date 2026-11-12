import type { HotelImageDto } from '../api/hotel-media-api'
import type { ManagementHotelDetail } from './hotel'

export interface HotelCreationSession {
  created?: ManagementHotelDetail
  mediaIds: Record<string, string>
}
interface CreationPhoto { id: string; file: File; isCover: boolean }
interface CreationDependencies {
  create: () => Promise<ManagementHotelDetail>
  upload: (params: { file: File; hotelId: string }) => Promise<{ id: string }>
  save: (hotelId: string, transform: (images: HotelImageDto[]) => HotelImageDto[]) => Promise<unknown>
}

/** A hotel POST is committed independently of its uploads and gallery PUT.
 * Retain the session on rejection; the next submission continues the same hotel. */
export async function completeHotelCreation(
  session: HotelCreationSession,
  photos: CreationPhoto[],
  deps: CreationDependencies,
): Promise<ManagementHotelDetail> {
  session.created ??= await deps.create()
  const created = session.created
  if (photos.length === 0) return created
  for (const photo of photos) {
    if (!session.mediaIds[photo.id]) {
      session.mediaIds[photo.id] = (await deps.upload({ file: photo.file, hotelId: created.id })).id
    }
  }
  await deps.save(created.id, (current) => {
    const added = photos.filter((photo) => !current.some((image) => image.mediaId === session.mediaIds[photo.id]))
    const coverId = photos.find((photo) => photo.isCover)?.id ?? added[0]?.id
    return [
      ...current,
      ...added.map((photo) => ({ mediaId: session.mediaIds[photo.id], sortOrder: 0, cover: !current.some((image) => image.cover) && photo.id === coverId })),
    ].map((image, sortOrder) => ({ ...image, sortOrder }))
  })
  return created
}
