import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fields and nullability mirror ManagementHotelResponse / CreateHotelResponse.
const id = '11111111-1111-4111-8111-111111111111'
const hotel = {
  id,
  ownerId: '22222222-2222-4222-8222-222222222222',
  cityId: '33333333-3333-4333-8333-333333333333',
  name: 'Test Hotel',
  slug: 'test-hotel-generated-by-backend',
  description: null,
  address: '01 Test Street',
  latitude: null,
  longitude: null,
  starRating: null,
  checkInTime: '14:00:00',
  checkOutTime: '12:00:00',
  status: 'DRAFT',
  createdAt: '2026-11-04T00:00:00Z',
  updatedAt: '2026-11-04T00:00:00Z',
  version: 0,
}
const payload = {
  name: 'Test Hotel', slug: 'ui-preview-slug',
  cityId: hotel.cityId, ownerUserId: hotel.ownerId,
  address: '01 Test Street', starRating: 3,
  checkInTime: '14:00', checkOutTime: '12:00', description: '',
  latitude: 21.123456, longitude: 105.123456,
}
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

describe('management API compatibility with the implemented backend', () => {
  it('reads a populated backend page and maps ownerId for the UI', async () => {
    respond({ content: [hotel], page: 1, size: 6, totalElements: 7, totalPages: 2, first: false, last: true })
    const { getManagementHotels } = await import('./hotel-management-api')
    const controller = new AbortController()
    const result = await getManagementHotels({ page: 1, size: 6 }, controller.signal)
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/management/hotels?page=1&size=6')
    expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(result).toMatchObject({
      content: [{ id, ownerUserId: hotel.ownerId, starRating: null }],
      page: 1, size: 6, totalElements: 7, totalPages: 2, first: false, last: true,
    })
  })

  it('reads backend detail without inventing missing amenities or room types', async () => {
    respond(hotel)
    const { getManagementHotelDetail } = await import('./hotel-management-api')
    const result = await getManagementHotelDetail(id)
    expect(result).toMatchObject({ id, ownerUserId: hotel.ownerId, slug: hotel.slug, version: 0 })
    expect(result.roomTypes).toBeUndefined()
    expect(result.amenityIds).toBeUndefined()
  })

  it('rejects a malformed response instead of accepting an incomplete hotel', async () => {
    respond({ id })
    const { getManagementHotelDetail } = await import('./hotel-management-api')
    await expect(getManagementHotelDetail(id)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it.each([null, 3])('displays backend starRating %s without substituting five stars', async (starRating) => {
    respond({ ...hotel, starRating })
    const { getManagementHotelDetail } = await import('./hotel-management-api')
    const detail = await getManagementHotelDetail(id)
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
    const { DataModeContext } = await import('@/shared/lib/data-mode-context')
    const { HotelGeneralEditForm } = await import('../components/HotelGeneralEditForm')
    const html = renderToStaticMarkup(createElement(QueryClientProvider, { client: new QueryClient() },
      createElement(DataModeContext.Provider, { value: { mode: 'api', setMode: () => undefined } },
        createElement(HotelGeneralEditForm, { hotel: detail, cities: [] })),
    ))
    const ratingInput = html.match(/<input\b[^>]*\bid="[^"]+-starRating"[^>]*>/)?.[0]
    expect(ratingInput).toBeDefined()
    expect(ratingInput).toContain(`value="${starRating ?? ''}"`)
  }, 20_000)

  it('sends only CreateHotelRequest fields and accepts the backend generated slug', async () => {
    respond(hotel, 201)
    const { createAdminHotel } = await import('./hotel-management-api')
    const result = await createAdminHotel(payload)
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/management/hotels')
    expect(fetcher.mock.calls[0][1]?.method).toBe('POST')
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({
      ownerId: hotel.ownerId, cityId: hotel.cityId,
      name: 'Test Hotel', address: '01 Test Street', starRating: 3,
      checkInTime: '14:00', checkOutTime: '12:00', description: '',
      latitude: 21.123456, longitude: 105.123456,
    })
    expect(result.slug).toBe(hotel.slug)
  })

  it('approves via the backend PATCH and preserves its returned ACTIVE state', async () => {
    respond({ ...hotel, status: 'ACTIVE', version: 1 })
    const { approveHotel } = await import('./hotel-management-api')
    const result = await approveHotel(id)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${id}/approve`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PATCH')
    expect(result).toMatchObject({ status: 'ACTIVE', version: 1, ownerUserId: hotel.ownerId })
  })

  it('allows backend-valid short names and an empty slug in the real create form', async () => {
    const { createAdminHotelApiFormSchema } = await import('../model/hotel-form-schemas')
    const result = createAdminHotelApiFormSchema.safeParse({
      ...payload, name: 'A', address: 'A', slug: '', latitude: null, longitude: null,
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ['cityId', 'sample-city'],
    ['latitude', 21.1234567],
    ['longitude', 105.1234567],
  ])('rejects invalid backend input in form field %s', async (field, value) => {
    const { createAdminHotelApiFormSchema } = await import('../model/hotel-form-schemas')
    const result = createAdminHotelApiFormSchema.safeParse({ ...payload, [field]: value })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain(field)
    }
  })

  it('maps backend ownerId field errors back to the owner form field', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({
      status: 400, detail: 'Invalid owner', code: 'VALIDATION_FAILED', traceId: 'trace-1',
      errors: [{ field: 'ownerId', message: 'Owner không được để trống.' }],
    }), { status: 400 }))
    const { createAdminHotel } = await import('./hotel-management-api')
    await expect(createAdminHotel(payload)).rejects.toMatchObject({
      status: 400, code: 'VALIDATION_FAILED', traceId: 'trace-1',
      errors: [{ field: 'ownerUserId', message: 'Owner không được để trống.' }],
    })
  })

  it('sends pagination only because the backend does not implement filters', async () => {
    respond({ content: [], page: 0, size: 6, totalElements: 0, totalPages: 0, first: true, last: true })
    const { getManagementHotels } = await import('./hotel-management-api')
    await getManagementHotels({ cityId: hotel.cityId, status: 'ACTIVE', keyword: 'Test', vibe: 'Glamping' })
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/management/hotels?page=0&size=6')
  })

  it('fetches cities from /api/v1/cities', async () => {
    respond([{ id: '822cafba-73f6-4ec0-bae7-71804535cae3', countryCode: 'VN', name: 'Đà Nẵng', slug: 'da-nang' }])
    const { getCities } = await import('./catalog-api')
    const cities = await getCities()
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/cities')
    expect(fetcher.mock.calls[0][1]?.method).toBe('GET')
    expect(cities[0]?.name).toBe('Đà Nẵng')
  })

  it('fetches amenities from /api/v1/amenities', async () => {
    respond([{ id: '59fe1090-6e67-4d93-b140-232c5e885c27', code: 'FREE_PARKING', name: 'Bãi đỗ xe', category: 'HOTEL' }])
    const { getAmenities } = await import('./catalog-api')
    const amenities = await getAmenities('HOTEL')
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/amenities?category=HOTEL')
    expect(amenities[0]?.code).toBe('FREE_PARKING')
  })

  it('patches supported hotel fields with the version read by the form', async () => {
    respond({ ...hotel, name: 'Updated', contactPhone: '+84901234567', version: 4 })
    const { updateManagementHotel } = await import('./hotel-management-api')
    const result = await updateManagementHotel(id, { name: 'Updated', contactPhone: '+84901234567', version: 3 })
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${id}`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PATCH')
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ version: 3, name: 'Updated', contactPhone: '+84901234567' })
    expect(result).toMatchObject({ name: 'Updated', version: 4, contactPhone: '+84901234567' })
  })

  it('replaces hotel amenities and maps response objects to selected ids', async () => {
    const amenityId = '59fe1090-6e67-4d93-b140-232c5e885c27'
    respond([{ id: amenityId, code: 'PARKING', name: 'Bãi đỗ xe', category: 'HOTEL' }])
    const { updateHotelAmenities } = await import('./hotel-management-api')
    await expect(updateHotelAmenities(id, { amenityIds: [amenityId] })).resolves.toEqual([amenityId])
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${id}/amenities`)
    expect(fetcher.mock.calls[0][1]?.method).toBe('PUT')
  })

  it('clears room-type amenities via an explicit empty replacement', async () => {
    respond([])
    const { updateRoomTypeAmenities } = await import('./hotel-management-api')
    await expect(updateRoomTypeAmenities(id, hotel.cityId, { amenityIds: [] })).resolves.toEqual([])
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/management/hotels/${id}/room-types/${hotel.cityId}/amenities`)
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ amenityIds: [] })
  })
})

describe('mock financial access', () => {
  it('enforces optimistic locking (expectedVersion) on FN00 financial access updates', async () => {
    const { getMockFinancialAccess, updateMockFinancialAccess } = await import('@/features/finance/mocks/financial-access-mock')
    const { ApiError } = await import('@/shared/api/api-error')
    const current = await getMockFinancialAccess({
      hotelId: '33333333-3333-4333-8333-333333333301',
      userId: '99999999-9999-4999-8999-999999999901',
    })

    await expect(
      updateMockFinancialAccess(
        {
          hotelId: '33333333-3333-4333-8333-333333333301',
          userId: '99999999-9999-4999-8999-999999999901',
        },
        {
          contractId: current.contractId,
          status: 'GRANTED',
          canReadContracts: true,
          canReadSettlements: true,
          canExportReports: true,
          expectedVersion: current.version + 99,
          reason: 'Test version mismatch',
        },
      ),
    ).rejects.toThrowError(ApiError)
  })
})
