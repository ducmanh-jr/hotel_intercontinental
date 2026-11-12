import { useHotelWorkspace, HotelAmenitiesManager } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'

export function HotelAmenitiesPage() {
  const { hotel, hotelId } = useHotelWorkspace()

  if (!hotel) return null

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Tiện ích khách sạn' },
  ]

  return (
    <div className="hotel-amenities-page max-w-5xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="TIỆN NGHI & DỊCH VỤ"
        title="Tiện ích khách sạn"
        description="Quản lý các tiện ích chung mà khách sạn cung cấp (Hồ bơi, Nhà hàng, Bãi đỗ xe...). Bạn có thể chọn nhanh từ danh mục hệ thống hoặc tự tạo tiện ích riêng chỉ thuộc khách sạn này."
      />

      <HotelAmenitiesManager hotelId={hotelId} />
    </div>
  )
}
