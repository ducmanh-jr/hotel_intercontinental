// Client Home Features (Sovereign Editorial Template)
export * from './model/client-home'
export * from './model/client-search-schema'
export * from './mocks/client-home-data'
export * from './mocks/hotel-detail-data'
export * from './api/client-home-api'
export * from './hooks/use-client-home'
export * from './hooks/use-client-home-context'
export * from './context/ClientHomeContext'
export { ClientSvgSprite, ClientIcon } from './components/ClientSiteIcons'
export { ClientSiteHeader } from './components/ClientSiteHeader'
export { ClientMobileMenu } from './components/ClientMobileMenu'
export { ClientHeroSection } from './components/ClientHeroSection'
export { ClientDestinationsSection } from './components/ClientDestinationsSection'
export { ClientStaysSection } from './components/ClientStaysSection'
export { ClientStayCard } from './components/ClientStayCard'
export { ClientJournalSection } from './components/ClientJournalSection'
export { ClientPartnerSection } from './components/ClientPartnerSection'
export { ClientStayModal } from './components/ClientStayModal'
export { ClientSiteFooter } from './components/ClientSiteFooter'
export { ClientToast } from './components/ClientToast'

// Backward compatibility exports for existing layouts and unit tests
export { StayVibeFooter } from './components/StayVibeFooter'
export {
  STAYVIBE_FOOTER_GROUPS,
  BENTO_DESTINATIONS,
  STAYVIBE_FEATURED_HOTELS,
  VIBE_CATEGORIES,
} from './mocks/stayvibe-mock-data'
export { BentoDestinationGrid } from './components/BentoDestinationGrid'
export { HeroSection } from './components/HeroSection'
export { HotelCard } from './components/HotelCard'
export type { SmartSearchFormValues } from './model/search-form-schema'
export { VibeFilterBar } from './components/VibeFilterBar'
export type { StayVibeHotelItem, VibeIconKey } from './model/discovery'
export { useDiscoveryHotels } from './hooks/use-discovery-hotels'
export type { SortOrder } from './model/filter-hotels'
