import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { useHotelWorkspace, HotelAmenitiesManager } from '@/features/hotels'
import {
  useManagementRoomTypesQuery,
  useManagementRoomsQuery,
} from '@/features/rooms'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'
import { ErrorState } from '@/shared/ui/ErrorState'

export function HotelPhysicalRoomAmenitiesPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const { roomId = '' } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const roomsQuery = useManagementRoomsQuery(hotelId, { page: 0, size: 100 })
  const roomTypesQuery = useManagementRoomTypesQuery(hotelId)

  if (!hotel) return null

  if (roomsQuery.isPending || roomTypesQuery.isPending) {
    return <PageLoading />
  }

  if (roomsQuery.isError) {
    return (
      <ErrorState
        error={roomsQuery.error}
        onRetry={() => void roomsQuery.refetch()}
      />
    )
  }

  // Tìm phòng vật lý tương ứng trong danh sách
  const room = roomsQuery.data?.items.find((r) => r.id === roomId)
  const roomType = room
    ? roomTypesQuery.data?.find((rt) => rt.id === room.roomTypeId)
    : null

  const roomDisplayNumber = room?.roomNumber ?? roomId.slice(0, 8)
  const roomTypeDisplayName = roomType?.name ?? 'Hạng phòng'

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Phòng', to: `/hotels/${hotelId}/rooms` },
    { label: `Phòng ${roomDisplayNumber}` },
    { label: 'Tiện ích' },
  ]

  return (
    <div className="hotel-physical-room-amenities-page max-w-5xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker={`PHÒNG VẬT LÝ — TẦNG ${room?.floor || '—'}`}
        title={`Tiện ích phòng ${roomDisplayNumber}`}
        description={`Cấu hình tiện ích đặc thù cho phòng số ${roomDisplayNumber} thuộc hạng phòng ${roomTypeDisplayName}. Tiện ích riêng và tiện ích bổ sung tại đây chỉ áp dụng cho riêng phòng này.`}
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/hotels/${hotelId}/rooms`)}
            className="!rounded-xl"
          >
            Quay lại danh sách phòng
          </Button>
        }
      />

      <HotelAmenitiesManager
        hotelId={hotelId}
        roomId={roomId}
        roomNumber={roomDisplayNumber}
        roomTypeName={roomTypeDisplayName}
      />
    </div>
  )
}
