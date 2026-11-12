import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetcher = vi.fn<typeof fetch>()
function respond(data: unknown, status = 200) {
  fetcher.mockResolvedValue(new Response(JSON.stringify({ message: 'ok', data }), { status }))
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', fetcher)
  fetcher.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('hotel media API client', () => {
  const hotelId = '11111111-1111-4111-8111-111111111111'
  const mediaId = '22222222-2222-4222-8222-222222222222'

  it('uploads a hotel image via multipart/form-data to /media', async () => {
    respond({
      id: mediaId,
      purpose: 'HOTEL_IMAGE',
      status: 'READY',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      createdAt: '2026-11-08T00:00:00Z',
    }, 201)

    const { uploadHotelMedia } = await import('./hotel-media-api')
    const file = new File(['dummy-content'], 'test.jpg', { type: 'image/jpeg' })
    const result = await uploadHotelMedia({ file, hotelId })

    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/media')
    expect(fetcher.mock.calls[0][1]?.method).toBe('POST')
    expect(fetcher.mock.calls[0][1]?.body).toBeInstanceOf(FormData)
    expect(result.id).toBe(mediaId)
    expect(result.purpose).toBe('HOTEL_IMAGE')
  })

  it('replaces hotel gallery images via PUT /management/hotels/{hotelId}/images', async () => {
    respond([
      { mediaId, albumId: '33333333-3333-4333-8333-333333333333', sortOrder: 0, cover: true },
    ])

    const { replaceHotelImages } = await import('./hotel-media-api')
    const result = await replaceHotelImages(hotelId, {
      images: [{ mediaId, albumId: '33333333-3333-4333-8333-333333333333', sortOrder: 0, cover: true }],
      expectedVersion: 0,
    })

    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/images`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PUT')
    expect(result).toHaveLength(1)
    expect(result[0].mediaId).toBe(mediaId)
    expect(result[0].cover).toBe(true)
    expect(result[0].albumId).toBe('33333333-3333-4333-8333-333333333333')
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string).images[0].albumId).toBe(result[0].albumId)
  })

  it('gets hotel gallery images via GET /management/hotels/{hotelId}/images', async () => {
    respond([
      { mediaId, albumId: '33333333-3333-4333-8333-333333333333', sortOrder: 0, cover: true },
    ])

    const { getHotelImages } = await import('./hotel-media-api')
    const result = await getHotelImages(hotelId)

    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${hotelId}/images`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('GET')
    expect(result[0].mediaId).toBe(mediaId)
  })

  it('gets media access URL via GET /media/{mediaId}/access', async () => {
    respond({
      mediaId,
      url: 'https://example.com/photo.jpg',
      expiresAt: '2026-11-09T00:00:00Z',
    })

    const { getMediaAccess } = await import('./hotel-media-api')
    const result = await getMediaAccess(mediaId)

    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/media/${mediaId}/access`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('GET')
    expect(result.url).toBe('https://example.com/photo.jpg')
  })
})

// Regression: whole-gallery updates must read a coherent version before replacing.
describe('safe gallery writes', () => {
  const hotelId = '11111111-1111-4111-8111-111111111111'
  it('never PUTs if the current gallery cannot be read', async () => {
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'ok', data: {
      id: hotelId, ownerId: hotelId, cityId: hotelId, name: 'Hotel', slug: 'hotel',
      address: 'Street', starRating: null, checkInTime: '14:00:00', checkOutTime: '12:00:00',
      status: 'DRAFT', description: null, latitude: null, longitude: null,
      createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z', version: 7,
    } }), { status: 200 }))
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Gallery unavailable' }), { status: 503 }))
    const { updateHotelGallery } = await import('./hotel-media-api')
    await expect(updateHotelGallery(hotelId, () => [])).rejects.toBeDefined()
    expect(fetcher.mock.calls.every(([, init]) => init?.method !== 'PUT')).toBe(true)
  })
})

it('serializes consecutive writes, reads each fresh version, and refreshes after conflict without retry', async () => {
  const hotelId = '11111111-1111-4111-8111-111111111111'
  const mediaId = '22222222-2222-4222-8222-222222222222'
  const hotel = {
    id: hotelId, ownerId: hotelId, cityId: hotelId, name: 'Hotel', slug: 'hotel',
    address: 'Street', starRating: null, checkInTime: '14:00:00', checkOutTime: '12:00:00',
    status: 'DRAFT', description: null, latitude: null, longitude: null,
    createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z',
  }
  const linked = [{ mediaId, albumId: '33333333-3333-4333-8333-333333333333', sortOrder: 0, cover: true }]
  let version = 7
  let releaseRefresh: (() => void) | undefined
  const refreshStarted = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  const refresh = vi.fn(async () => refreshStarted)
  fetcher.mockImplementation(async (input, init) => {
    if (init?.method === 'PUT') {
      version++
      return new Response(JSON.stringify({ message: 'ok', data: linked }))
    }
    return new Response(JSON.stringify({ message: 'ok', data: String(input).endsWith('/images') ? linked : { ...hotel, version } }))
  })
  const { updateHotelGallery } = await import('./hotel-media-api')
  const first = updateHotelGallery(hotelId, (images) => images, refresh)
  const second = updateHotelGallery(hotelId, (images) => images, refresh)
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1)
  releaseRefresh!()
  await Promise.all([first, second])
  const puts = fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')
  expect(puts.map(([, init]) => JSON.parse(String(init?.body)).expectedVersion)).toEqual([7, 8])
  expect(puts.map(([, init]) => JSON.parse(String(init?.body)).images)).toEqual([linked, linked])
  fetcher.mockImplementation(async (input, init) => init?.method === 'PUT'
    ? new Response(JSON.stringify({ detail: 'Concurrent update', code: 'CONCURRENT_UPDATE' }), { status: 409 })
    : new Response(JSON.stringify({ message: 'ok', data: String(input).endsWith('/images') ? linked : { ...hotel, version } })))
  const count = fetcher.mock.calls.length
  await expect(updateHotelGallery(hotelId, () => [], refresh)).rejects.toMatchObject({ status: 409 })
  expect(fetcher.mock.calls.slice(count).filter(([, init]) => init?.method === 'PUT')).toHaveLength(1)
  expect(refresh).toHaveBeenCalledTimes(3)
})
