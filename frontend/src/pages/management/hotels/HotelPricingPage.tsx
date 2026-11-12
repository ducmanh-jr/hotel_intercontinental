import { useHotelWorkspace, RoomTypeDailyRatesPanel } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RoomInventoryPanel, useManagementRoomTypesQuery } from '@/features/rooms'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelPricingPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const roomTypesQuery = useManagementRoomTypesQuery(hotelId)

  if (!hotel) return null
  if (roomTypesQuery.isPending) return <PageLoading />
  if (roomTypesQuery.isError) return <ErrorState error={roomTypesQuery.error} onRetry={() => void roomTypesQuery.refetch()} />

  const roomTypes = roomTypesQuery.data?.map((type) => ({
    ...type, hotelId, isActive: type.active,
  }))

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Giá & Tồn kho' },
  ]

  return (
    <div className="hotel-pricing-page max-w-5xl mx-auto space-y-8 pb-12">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="DOANH THU &amp; PHÂN PHỐI"
        title="Giá &amp; Tồn kho"
        description="Tra cứu và điều chỉnh biểu giá phòng theo từng ngày lưu trú cho từng hạng phòng. Giá cập nhật sẽ áp dụng cho các lượt đặt phòng mới."
      />

      <RoomTypeDailyRatesPanel
        hotelId={hotelId}
        roomTypes={roomTypes}
        hotelStatus={hotel.status}
      />
      <RoomInventoryPanel key={hotelId} hotelId={hotelId} hotelStatus={hotel.status} />
    </div>
  )
}
