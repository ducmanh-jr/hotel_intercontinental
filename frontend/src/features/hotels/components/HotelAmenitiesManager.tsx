import { useState } from 'react'
import { message } from 'antd'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useAmenitiesQuery } from '../hooks/use-amenities-query'
import {
  useReplaceCatalogAmenitiesMutation,
  useReplaceRoomTypeAmenitiesMutation,
  useRoomTypeAmenitiesQuery,
  useScopedAmenitiesQuery,
} from '../hooks/use-scoped-amenities'
import {
  getAmenityErrorMessage,
  type AmenityScope,
} from '../api/scoped-amenities-api'
import { CatalogAmenitiesList } from './CatalogAmenitiesList'
import { CustomAmenitiesList } from './CustomAmenitiesList'
import { InheritedAmenitiesSection } from './InheritedAmenitiesSection'

export interface HotelAmenitiesManagerProps {
  hotelId: string
  roomId?: string | null
  roomNumber?: string
  roomTypeId?: string
  roomTypeName?: string
  /** @deprecated Kept for backward compatibility, not needed for scoped API */
  initialAmenityIds?: string[]
  /** @deprecated Kept for backward compatibility, scoped API works on draft hotels */
  readable?: boolean
}

export function HotelAmenitiesManager(props: HotelAmenitiesManagerProps) {
  // Key uniquely by hotel, physical room, or room type to isolate all state
  const componentKey = `${props.hotelId}:${props.roomId ?? ''}:${props.roomTypeId ?? ''}`
  return <ScopedAmenitiesEditor key={componentKey} {...props} />
}

function ScopedAmenitiesEditor({
  hotelId,
  roomId,
  roomNumber,
  roomTypeId,
  roomTypeName,
}: HotelAmenitiesManagerProps) {
  const isRoomTypeMode = Boolean(roomTypeId && !roomId)
  const isPhysicalRoomMode = Boolean(roomId)

  // Scope for Hotel or Physical Room
  const scope: AmenityScope = { hotelId, roomId: roomId ?? undefined }

  // Target label for user notifications and modal guidance
  const scopeLabel = isPhysicalRoomMode
    ? `phòng ${roomNumber || roomId}`
    : isRoomTypeMode
      ? `hạng phòng ${roomTypeName || roomTypeId}`
      : 'khách sạn'

  // Catalog category: ROOM for physical room or room type; HOTEL for hotel
  const catalogCategory = isPhysicalRoomMode || isRoomTypeMode ? 'ROOM' : 'HOTEL'
  const catalogQuery = useAmenitiesQuery(catalogCategory)

  // 1. In Room Type mode, query room type amenities
  const roomTypeQuery = useRoomTypeAmenitiesQuery(
    hotelId,
    roomTypeId ?? '',
  )
  const replaceRoomTypeMutation = useReplaceRoomTypeAmenitiesMutation(
    hotelId,
    roomTypeId ?? '',
  )

  // 2. In Scoped mode (Hotel or Physical Room), query scoped amenities
  const scopedQuery = useScopedAmenitiesQuery(scope)
  const replaceCatalogMutation = useReplaceCatalogAmenitiesMutation(scope)

  const [saveError, setSaveError] = useState<string | null>(null)

  // Loading states
  if (catalogQuery.isPending) {
    return <PageLoading />
  }

  if (isRoomTypeMode && roomTypeQuery.isPending) {
    return <PageLoading />
  }

  if (!isRoomTypeMode && scopedQuery.isPending) {
    return <PageLoading />
  }

  // Error states - do not display as empty list when request fails
  if (catalogQuery.isError) {
    return (
      <ErrorState
        error={catalogQuery.error}
        onRetry={() => void catalogQuery.refetch()}
      />
    )
  }

  if (isRoomTypeMode && roomTypeQuery.isError) {
    return (
      <ErrorState
        error={roomTypeQuery.error}
        onRetry={() => void roomTypeQuery.refetch()}
      />
    )
  }

  if (!isRoomTypeMode && scopedQuery.isError) {
    return (
      <ErrorState
        error={scopedQuery.error}
        onRetry={() => void scopedQuery.refetch()}
      />
    )
  }

  const catalogOptions = catalogQuery.data ?? []
  if (catalogOptions.length === 0) {
    return (
      <EmptyState
        title="Danh mục tiện ích đang trống"
        description="Chưa có tiện ích thuộc nhóm này trong hệ thống."
      />
    )
  }

  // ==========================================
  // RENDER FOR ROOM TYPE MODE
  // ==========================================
  if (isRoomTypeMode) {
    const savedIds = roomTypeQuery.data?.map((item) => item.id) ?? []

    const handleSaveRoomTypeCatalog = async (amenityIds: string[]) => {
      setSaveError(null)
      try {
        await replaceRoomTypeMutation.mutateAsync(amenityIds)
        void message.success(
          `Đã lưu tiện ích cho hạng phòng ${roomTypeName || ''}.`,
        )
      } catch (error) {
        setSaveError(getAmenityErrorMessage(error))
      }
    }

    return (
      <div className="space-y-6">
        <CatalogAmenitiesList
          catalogOptions={catalogOptions}
          savedAmenityIds={savedIds}
          scopeLabel={scopeLabel}
          title="Tiện ích có sẵn của hạng phòng"
          description={`Chọn các tiện nghi chung áp dụng cho tất cả các phòng thuộc hạng ${roomTypeName || ''}.`}
          isSaving={replaceRoomTypeMutation.isPending}
          saveError={saveError}
          onSave={handleSaveRoomTypeCatalog}
        />
      </div>
    )
  }

  // ==========================================
  // RENDER FOR SCOPED MODE (HOTEL OR PHYSICAL ROOM)
  // ==========================================
  const scopedData = scopedQuery.data
  const savedCatalogIds =
    scopedData?.catalogAmenities?.map((item) => item.id) ?? []
  const customAmenities = scopedData?.customAmenities ?? []
  const inheritedAmenities = scopedData?.inheritedAmenities ?? []
  const inheritedIds = inheritedAmenities.map((item) => item.id)

  const handleSaveCatalog = async (amenityIds: string[]) => {
    setSaveError(null)
    try {
      await replaceCatalogMutation.mutateAsync(amenityIds)
      void message.success(`Đã lưu tiện ích có sẵn cho ${scopeLabel}.`)
    } catch (error) {
      setSaveError(getAmenityErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      {/* KHU VỰC A (chỉ hiển thị cho phòng vật lý): Tiện ích kế thừa từ hạng phòng */}
      {isPhysicalRoomMode && (
        <InheritedAmenitiesSection
          hotelId={hotelId}
          roomTypeId={scopedData?.roomId ?? undefined}
          roomTypeName={roomTypeName}
          inheritedAmenities={inheritedAmenities}
        />
      )}

      {/* KHU VỰC B: Tiện ích có sẵn từ danh mục (HOTEL hoặc ROOM) */}
      <CatalogAmenitiesList
        catalogOptions={catalogOptions}
        savedAmenityIds={savedCatalogIds}
        inheritedAmenityIds={inheritedIds}
        scopeLabel={scopeLabel}
        title={
          isPhysicalRoomMode
            ? 'Bổ sung từ danh mục'
            : 'Tiện ích có sẵn'
        }
        description={
          isPhysicalRoomMode
            ? `Đánh dấu thêm các tiện nghi từ danh mục chuẩn chỉ dành riêng cho ${scopeLabel}.`
            : 'Đánh dấu các tiện ích chung mà cơ sở lưu trú của bạn cung cấp.'
        }
        isSaving={replaceCatalogMutation.isPending}
        saveError={saveError}
        onSave={handleSaveCatalog}
      />

      {/* KHU VỰC C: Tiện ích riêng (custom amenities) */}
      <CustomAmenitiesList
        customAmenities={customAmenities}
        scope={scope}
        scopeLabel={scopeLabel}
      />
    </div>
  )
}
