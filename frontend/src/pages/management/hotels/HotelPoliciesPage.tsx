import { useHotelWorkspace, HotelPoliciesForm } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'

export function HotelPoliciesPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  if (!hotel) return null
  return <div className="hotel-policies-page max-w-4xl space-y-6">
    <PageHeader breadcrumbItems={[{ label: 'Khách sạn', to: '/hotels' }, { label: hotel.name, to: `/hotels/${hotelId}` }, { label: 'Chính sách' }]} kicker="QUY ĐỊNH LƯU TRÚ" title="Chính sách & Quy định" description="Cập nhật giờ nhận và trả phòng áp dụng cho khách lưu trú." />
    <HotelPoliciesForm hotel={hotel} />
  </div>
}
