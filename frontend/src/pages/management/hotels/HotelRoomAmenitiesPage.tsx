import { useState } from 'react'
import { Select } from 'antd'
import { useHotelWorkspace, HotelAmenitiesManager } from '@/features/hotels'
import { useManagementRoomTypesQuery } from '@/features/rooms'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'
import { ErrorState } from '@/shared/ui/ErrorState'
import { EmptyState } from '@/shared/ui/EmptyState'

export function HotelRoomAmenitiesPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const types = useManagementRoomTypesQuery(hotelId)
  const [selected, setSelected] = useState('')

  if (!hotel) return null
  if (types.isPending) return <PageLoading />
  if (types.isError) return <ErrorState error={types.error} onRetry={() => void types.refetch()} />
  if (!types.data.length) {
    return (
      <EmptyState
        title="Chưa có hạng phòng"
        description="Tạo hạng phòng trước khi cấu hình tiện ích."
      />
    )
  }

  const room = types.data.find((type) => type.id === selected) ?? types.data[0]

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Phòng', to: `/hotels/${hotelId}/rooms` },
    { label: 'Tiện ích hạng phòng' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="CẤU HÌNH HẠNG PHÒNG"
        title="Tiện ích hạng phòng"
        description="Chọn hạng phòng và thiết lập các tiện ích tiêu chuẩn áp dụng cho tất cả các phòng thuộc hạng phòng đó."
      />

      <div className="bg-white p-4 rounded-2xl border border-[#dce7e3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-[#5f736e]">
          Đang xem tiện ích của hạng phòng:
        </div>
        <Select
          aria-label="Chọn hạng phòng"
          className="w-full sm:w-80"
          value={room.id}
          options={types.data.map((type) => ({ value: type.id, label: type.name }))}
          onChange={setSelected}
        />
      </div>

      <HotelAmenitiesManager
        hotelId={hotelId}
        roomTypeId={room.id}
        roomTypeName={room.name}
      />
    </div>
  )
}
