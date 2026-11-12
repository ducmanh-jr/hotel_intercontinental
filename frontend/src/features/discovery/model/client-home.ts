export type ClientVibeKey =
  | 'all'
  | 'glamping'
  | 'beach'
  | 'mountain'
  | 'heritage'
  | 'wellness'
  | 'pet'

export type ClientBadgeClass = 'gold' | 'dark' | 'sage'

export interface ClientStay {
  id: string
  name: string
  city: string
  region: string
  location: string
  type: string
  rating: number
  reviews: number
  price: number
  oldPrice: number
  badge: string
  badgeClass: ClientBadgeClass
  note: string
  amenities: string[]
  vibes: ClientVibeKey[]
  image: string
  desc: string
}

export interface ClientDestination {
  id: string
  city: string
  kicker: string
  image: string
  tag: string
  hasSparkle?: boolean
  count: string
  desc: string
  ctaText: string
}

export interface ClientProofItem {
  value: string
  label: string
}

export interface ClientStoryItem {
  step: string
  title: string
  desc: string
}

export interface ClientPartnerStat {
  value: string
  label: string
}

export type ClientSortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'rating'

export interface ClientFilterState {
  vibe: ClientVibeKey
  city: string
  keyword: string
  sort: ClientSortOption
  savedOnly: boolean
}
