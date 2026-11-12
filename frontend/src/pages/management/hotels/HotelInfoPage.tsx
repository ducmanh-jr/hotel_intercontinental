import { useHotelWorkspace, HotelGeneralEditForm, useCitiesQuery } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelInfoPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const citiesQuery = useCitiesQuery()

  if (!hotel) return null

  if (citiesQuery.isPending) {
    return <PageLoading />
  }

  const cities = citiesQuery.data ?? []

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Thông tin chung' },
  ]

  return (
    <div className="hotel-info-page max-w-6xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="HỒ SƠ KHÁCH SẠN"
        title="Thông tin chung"
        description="Quản lý thông tin định danh, vị trí địa lý, thời gian nhận trả phòng và mô tả tổng quan cơ sở."
      />

      <HotelGeneralEditForm hotel={hotel} cities={cities} />
    </div>
  )
}
