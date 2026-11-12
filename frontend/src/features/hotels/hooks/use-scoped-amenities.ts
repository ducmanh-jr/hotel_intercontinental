import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomAmenity,
  detachCustomAmenity,
  getRoomTypeAmenities,
  getScopedAmenities,
  replaceRoomTypeAmenities,
  replaceScopedCatalogAmenities,
  updateCustomAmenity,
  type AmenityScope,
  type CreateCustomAmenityPayload,
  type UpdateCustomAmenityPayload,
} from '../api/scoped-amenities-api'
import { hotelManagementKeys } from './hotel-query-keys'

/**
 * Hook đọc tiện ích quản lý của khách sạn hoặc phòng vật lý (GET H / GET R).
 * Sử dụng được kể cả khi khách sạn còn DRAFT.
 */
export function useScopedAmenitiesQuery(scope: AmenityScope) {
  const isScopeValid =
    Boolean(scope.hotelId) &&
    (scope.roomId === undefined || scope.roomId === null || Boolean(scope.roomId))

  return useQuery({
    queryKey: hotelManagementKeys.scopedAmenities(scope.hotelId, scope.roomId),
    queryFn: ({ signal }) => getScopedAmenities(scope, signal),
    enabled: isScopeValid,
    retry: false,
  })
}

/**
 * Hook đọc tiện ích của hạng phòng để quản lý (GET /management/hotels/{hotelId}/room-types/{roomTypeId}/amenities).
 * Không yêu cầu khách sạn ACTIVE hay hạng phòng đang bán.
 */
export function useRoomTypeAmenitiesQuery(hotelId: string, roomTypeId: string) {
  return useQuery({
    queryKey: hotelManagementKeys.roomTypeAmenities(hotelId, roomTypeId),
    queryFn: ({ signal }) => getRoomTypeAmenities(hotelId, roomTypeId, signal),
    enabled: Boolean(hotelId) && Boolean(roomTypeId),
    retry: false,
  })
}

/**
 * Hook thay thế danh mục có sẵn gắn trực tiếp (PUT H / PUT R).
 */
export function useReplaceCatalogAmenitiesMutation(scope: AmenityScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amenityIds: string[]) =>
      replaceScopedCatalogAmenities(scope, amenityIds),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hotelManagementKeys.scopedAmenities(scope.hotelId, scope.roomId),
      })
      if (!scope.roomId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: hotelManagementKeys.detail('api', scope.hotelId),
          }),
          queryClient.invalidateQueries({
            queryKey: hotelManagementKeys.publicDetail(scope.hotelId),
          }),
        ])
      }
    },
  })
}

/**
 * Hook tạo tiện ích riêng (POST H / POST R).
 * Tiện ích được gắn ngay attached=true, không retry khi timeout.
 */
export function useCreateCustomAmenityMutation(scope: AmenityScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCustomAmenityPayload) =>
      createCustomAmenity(scope, payload),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hotelManagementKeys.scopedAmenities(scope.hotelId, scope.roomId),
      })
    },
  })
}

/**
 * Hook cập nhật hoặc gắn lại tiện ích riêng (PATCH H/{id} / PATCH R/{id}).
 */
export function useUpdateCustomAmenityMutation(scope: AmenityScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      amenityId,
      payload,
    }: {
      amenityId: string
      payload: UpdateCustomAmenityPayload
    }) => updateCustomAmenity(scope, amenityId, payload),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hotelManagementKeys.scopedAmenities(scope.hotelId, scope.roomId),
      })
    },
  })
}

/**
 * Hook tháo mềm tiện ích riêng (DELETE H/{id}?expectedVersion=N / DELETE R/{id}?expectedVersion=N).
 */
export function useDetachCustomAmenityMutation(scope: AmenityScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      amenityId,
      expectedVersion,
    }: {
      amenityId: string
      expectedVersion: number
    }) => detachCustomAmenity(scope, amenityId, expectedVersion),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hotelManagementKeys.scopedAmenities(scope.hotelId, scope.roomId),
      })
    },
  })
}

/**
 * Hook thay thế tiện ích gắn vào hạng phòng (PUT /management/hotels/{hotelId}/room-types/{roomTypeId}/amenities).
 * Tự động làm mới dữ liệu tiện ích kế thừa của các phòng liên quan.
 */
export function useReplaceRoomTypeAmenitiesMutation(hotelId: string, roomTypeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amenityIds: string[]) =>
      replaceRoomTypeAmenities(hotelId, roomTypeId, amenityIds),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: hotelManagementKeys.roomTypeAmenities(hotelId, roomTypeId),
        }),
        // Làm mới tất cả dữ liệu tiện ích có phạm vi của khách sạn này (bao gồm các phòng vật lý)
        queryClient.invalidateQueries({
          queryKey: ['hotels', 'scoped-amenities', hotelId],
        }),
        queryClient.invalidateQueries({
          queryKey: hotelManagementKeys.publicRoomTypes(hotelId),
        }),
      ])
    },
  })
}
