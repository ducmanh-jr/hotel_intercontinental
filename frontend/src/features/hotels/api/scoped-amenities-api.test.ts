import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ApiError } from '@/shared/api/api-error'
import { http } from '@/shared/api/http'
import {
  createCustomAmenity,
  detachCustomAmenity,
  getAmenityErrorMessage,
  getRoomTypeAmenities,
  getScopedAmenities,
  replaceRoomTypeAmenities,
  replaceScopedCatalogAmenities,
  updateCustomAmenity,
} from './scoped-amenities-api'

vi.mock('@/shared/api/http', () => ({
  http: {
    request: vi.fn(),
  },
}))

describe('scoped-amenities-api contract and error handling', () => {
  const hotelId = '11111111-1111-4111-8111-111111111111'
  const roomId = '22222222-2222-4222-8222-222222222222'
  const amenityId = '33333333-3333-4333-8333-333333333333'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getScopedAmenities', () => {
    it('requests hotel scope GET endpoint when roomId is not provided', async () => {
      const mockResponse = {
        hotelId,
        roomId: null,
        catalogAmenities: [
          { id: amenityId, code: 'POOL', name: 'Hồ bơi', category: 'HOTEL' },
        ],
        customAmenities: [],
        inheritedAmenities: [],
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await getScopedAmenities({ hotelId })

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/amenities`,
        expect.objectContaining({ method: 'GET' }),
      )
      expect(result.hotelId).toBe(hotelId)
      expect(result.catalogAmenities).toHaveLength(1)
    })

    it('requests physical room GET endpoint when roomId is provided', async () => {
      const mockResponse = {
        hotelId,
        roomId,
        catalogAmenities: [],
        customAmenities: [],
        inheritedAmenities: [
          { id: amenityId, code: 'WIFI', name: 'Wi-Fi', category: 'ROOM' },
        ],
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await getScopedAmenities({ hotelId, roomId })

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/rooms/${roomId}/amenities`,
        expect.objectContaining({ method: 'GET' }),
      )
      expect(result.roomId).toBe(roomId)
      expect(result.inheritedAmenities).toHaveLength(1)
    })
  })

  describe('replaceScopedCatalogAmenities', () => {
    it('sends PUT to hotel endpoint and receives array of catalog amenities', async () => {
      const mockResponse = [
        { id: amenityId, code: 'POOL', name: 'Hồ bơi', category: 'HOTEL' },
      ]
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await replaceScopedCatalogAmenities({ hotelId }, [amenityId])

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/amenities`,
        expect.objectContaining({
          method: 'PUT',
          body: { amenityIds: [amenityId] },
        }),
      )
      expect(Array.isArray(result)).toBe(true)
    })

    it('sends PUT to room endpoint and receives ManagementAmenities object', async () => {
      const mockResponse = {
        hotelId,
        roomId,
        catalogAmenities: [
          { id: amenityId, code: 'BALCONY', name: 'Ban công riêng', category: 'ROOM' },
        ],
        customAmenities: [],
        inheritedAmenities: [],
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await replaceScopedCatalogAmenities({ hotelId, roomId }, [amenityId])

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/rooms/${roomId}/amenities`,
        expect.objectContaining({
          method: 'PUT',
          body: { amenityIds: [amenityId] },
        }),
      )
      expect(result).toHaveProperty('catalogAmenities')
    })
  })

  describe('createCustomAmenity', () => {
    it('sends POST to scope endpoint with trimmed fields', async () => {
      const mockResponse = {
        id: amenityId,
        hotelId,
        roomId: null,
        name: 'Bồn tắm lộ thiên',
        description: 'Chỉ có tại khách sạn này',
        attached: true,
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:00:00Z',
        version: 0,
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await createCustomAmenity({ hotelId }, {
        name: '  Bồn tắm lộ thiên  ',
        description: '  Chỉ có tại khách sạn này  ',
      })

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/amenities`,
        expect.objectContaining({
          method: 'POST',
          body: {
            name: 'Bồn tắm lộ thiên',
            description: 'Chỉ có tại khách sạn này',
          },
        }),
      )
      expect(result.attached).toBe(true)
      expect(result.version).toBe(0)
    })
  })

  describe('updateCustomAmenity', () => {
    it('sends PATCH with expectedVersion and only modified fields', async () => {
      const mockResponse = {
        id: amenityId,
        hotelId,
        roomId: null,
        name: 'Tên mới',
        description: 'Mô tả mới',
        attached: true,
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:05:00Z',
        version: 1,
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await updateCustomAmenity(
        { hotelId },
        amenityId,
        { name: 'Tên mới', description: 'Mô tả mới', expectedVersion: 0 },
      )

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/amenities/${amenityId}`,
        expect.objectContaining({
          method: 'PATCH',
          body: {
            expectedVersion: 0,
            name: 'Tên mới',
            description: 'Mô tả mới',
          },
        }),
      )
      expect(result.version).toBe(1)
    })

    it('supports reattaching a detached amenity with attached: true', async () => {
      const mockResponse = {
        id: amenityId,
        hotelId,
        roomId,
        name: 'Tiện ích phòng',
        description: null,
        attached: true,
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:10:00Z',
        version: 3,
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await updateCustomAmenity(
        { hotelId, roomId },
        amenityId,
        { attached: true, expectedVersion: 2 },
      )

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/rooms/${roomId}/amenities/${amenityId}`,
        expect.objectContaining({
          method: 'PATCH',
          body: {
            expectedVersion: 2,
            attached: true,
          },
        }),
      )
      expect(result.attached).toBe(true)
      expect(result.version).toBe(3)
    })
  })

  describe('detachCustomAmenity', () => {
    it('sends DELETE with expectedVersion query param and returns detached amenity', async () => {
      const mockResponse = {
        id: amenityId,
        hotelId,
        roomId: null,
        name: 'Bồn tắm',
        description: null,
        attached: false,
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:15:00Z',
        version: 1,
      }
      vi.mocked(http.request).mockResolvedValueOnce(mockResponse)

      const result = await detachCustomAmenity({ hotelId }, amenityId, 0)

      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/amenities/${amenityId}?expectedVersion=0`,
        expect.objectContaining({ method: 'DELETE' }),
      )
      expect(result.attached).toBe(false)
      expect(result.version).toBe(1)
    })
  })

  describe('room-type amenities', () => {
    const roomTypeId = '44444444-4444-4444-8444-444444444444'

    it('getRoomTypeAmenities calls GET room-types amenities endpoint', async () => {
      vi.mocked(http.request).mockResolvedValueOnce([])
      await getRoomTypeAmenities(hotelId, roomTypeId)
      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/room-types/${roomTypeId}/amenities`,
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('replaceRoomTypeAmenities calls PUT room-types amenities endpoint', async () => {
      vi.mocked(http.request).mockResolvedValueOnce([])
      await replaceRoomTypeAmenities(hotelId, roomTypeId, [amenityId])
      expect(http.request).toHaveBeenCalledWith(
        `/management/hotels/${hotelId}/room-types/${roomTypeId}/amenities`,
        expect.objectContaining({
          method: 'PUT',
          body: { amenityIds: [amenityId] },
        }),
      )
    })
  })

  describe('getAmenityErrorMessage', () => {
    it('translates DUPLICATE_CUSTOM_AMENITY correctly', () => {
      const error = new ApiError('Duplicate', {
        kind: 'http',
        status: 409,
        code: 'DUPLICATE_CUSTOM_AMENITY',
      })
      expect(getAmenityErrorMessage(error)).toBe(
        'Tiện ích này đã có. Bạn có thể sửa hoặc gắn lại mục đã tháo.',
      )
    })

    it('translates AMENITY_CONCURRENT_UPDATE correctly', () => {
      const error = new ApiError('Conflict', {
        kind: 'http',
        status: 409,
        code: 'AMENITY_CONCURRENT_UPDATE',
      })
      expect(getAmenityErrorMessage(error)).toContain('thao tác khác')
    })

    it('translates 403 access denied correctly', () => {
      const error = new ApiError('Forbidden', { kind: 'http', status: 403 })
      expect(getAmenityErrorMessage(error)).toContain('không có đủ quyền')
    })

    it('translates 404 not found correctly', () => {
      const error = new ApiError('Not found', { kind: 'http', status: 404 })
      expect(getAmenityErrorMessage(error)).toContain('Không tìm thấy đối tượng')
    })

    it('translates 400 field validation errors correctly', () => {
      const error = new ApiError('Bad request', {
        kind: 'http',
        status: 400,
        errors: [{ field: 'name', message: 'Tên tiện ích không được để trống.' }],
      })
      expect(getAmenityErrorMessage(error)).toBe('Tên tiện ích không được để trống.')
    })
  })
})
