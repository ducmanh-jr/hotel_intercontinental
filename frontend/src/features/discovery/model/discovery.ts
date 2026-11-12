export type VibeIconKey =
  | 'glamping'
  | 'boutique'
  | 'pool-party'
  | 'pet-friendly'
  | 'workation'
  | 'beachfront'
  | 'eco-retreat'
  | 'rooftop'

export interface VibeCategoryItem {
  id: string
  label: string
  subLabel: string
  icon: VibeIconKey
  count: number
}

export interface BentoDestinationItem {
  id: string
  cityName: string
  tagline: string
  description: string
  accommodationCount: number
  badgeText: string
  spanClass: 'featured' | 'wide' | 'square'
  imageUrl: string
  highlightVibe: string
}

export interface StayVibeHotelItem {
  id: string
  name: string
  slug: string
  cityId: string
  cityName: string
  distanceLabel: string
  rating: number
  reviewCount: number
  vibeIds: VibeIconKey[]
  badge?: {
    text: string
    variant: 'discount' | 'trend'
  }
  amenities: [string, string, string]
  originalPricePerNight?: number
  pricePerNight: number
  currency: 'VND'
  taxStatusNote: string
  roomsLeftNote?: string
  images: string[]
}

export interface FooterLinkGroup {
  id: string
  title: string
  links: Array<{
    label: string
    href: string
    badge?: string
  }>
}
