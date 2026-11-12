import type { VibeCategoryItem, BentoDestinationItem, StayVibeHotelItem, FooterLinkGroup } from '../model/discovery'

/**
 * Dữ liệu mẫu (Mock Data) phục vụ dựng khung giao diện (UI Skeleton) theo design.md.
 * Đã rút gọn để lại 1 mẫu đại diện cho mỗi phân loại dữ liệu.
 */
export const VIBE_CATEGORIES: VibeCategoryItem[] = [
  {
    id: 'glamping',
    label: 'Glamping',
    subLabel: 'Săn mây & rừng thông',
    icon: 'glamping',
    count: 1,
  },
]

export const BENTO_DESTINATIONS: BentoDestinationItem[] = [
  {
    id: 'da-lat',
    cityName: 'Đà Lạt',
    tagline: 'Featured Vibe · Săn mây & Glamping giữa rừng thông',
    description:
      'Những khu lều glamping sưởi ấm dưới tán thông và villa gỗ view thung lũng sương mù dành riêng cho hội bạn thân.',
    accommodationCount: 340,
    badgeText: 'Featured Vibe',
    spanClass: 'featured',
    imageUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    highlightVibe: 'Glamping & Chill',
  },
]

export const STAYVIBE_FEATURED_HOTELS: StayVibeHotelItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'StayVibe Cloud Pine Glamping & Resort',
    slug: 'stayvibe-cloud-pine-glamping-da-lat',
    cityId: 'da-lat',
    cityName: 'Đà Lạt',
    distanceLabel: 'Đồi Đa Phú · Cách trung tâm 4.2km',
    rating: 4.9,
    reviewCount: 328,
    vibeIds: ['glamping', 'eco-retreat', 'pet-friendly'],
    badge: {
      text: 'Giảm 25%',
      variant: 'discount',
    },
    amenities: ['Lửa trại Acoustic', 'Free ăn sáng', 'Cho phép thú cưng'],
    originalPricePerNight: 1850000,
    pricePerNight: 1390000,
    currency: 'VND',
    taxStatusNote: 'Giá niêm yết từ hệ thống · Đã gồm thuế & phí dịch vụ',
    roomsLeftNote: 'Chỉ còn 2 lều Panorama cuối',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=900&q=80',
    ],
  },
]

export const QUICK_LOCATION_SUGGESTIONS: string[] = [
  'Đà Lạt',
]

export const STAYVIBE_FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    id: 'discover',
    title: 'Khám phá theo phong cách',
    links: [
      { label: 'Glamping & Săn mây Đà Lạt', href: '#vibe-section', badge: 'Hot' },
    ],
  },
  {
    id: 'partner-ops',
    title: 'Dành cho Đối tác & Quản trị',
    links: [
      { label: 'Quản lý khách sạn', href: '/management/hotels' },
    ],
  },
  {
    id: 'transparency',
    title: 'Hỗ trợ & Chính sách',
    links: [
      { label: 'Chính sách hoàn hủy linh hoạt', href: '#hotels-section' },
    ],
  },
]
