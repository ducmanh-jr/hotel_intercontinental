import { useMemo, useState } from 'react'
import { BENTO_DESTINATIONS, STAYVIBE_FEATURED_HOTELS, VIBE_CATEGORIES } from '../mocks/stayvibe-mock-data'
import type { VibeIconKey } from '../model/discovery'
import { filterDiscoveryHotels, type SortOrder } from '../model/filter-hotels'

export function useDiscoveryHotels() {
  const [selectedVibe, setSelectedVibe] = useState<VibeIconKey | 'ALL'>('ALL')
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [petFriendlyOnly, setPetFriendlyOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>('POPULAR')
  const [wishlistedIds, setWishlistedIds] = useState<string[]>(['11111111-1111-4111-8111-111111111101'])

  const filteredHotels = useMemo(() => filterDiscoveryHotels(STAYVIBE_FEATURED_HOTELS, {
    vibe: selectedVibe, cityId: selectedCityId, keyword: searchKeyword, petFriendlyOnly, sortOrder,
  }), [selectedVibe, selectedCityId, searchKeyword, petFriendlyOnly, sortOrder])

  function handleResetFilters() {
    setSelectedVibe('ALL')
    setSelectedCityId('ALL')
    setSearchKeyword('')
    setPetFriendlyOnly(false)
    setSortOrder('POPULAR')
  }

  function handleToggleWishlist(hotelId: string) {
    setWishlistedIds((previous) => previous.includes(hotelId)
      ? previous.filter((id) => id !== hotelId) : [...previous, hotelId])
  }

  const selectedVibeLabel = selectedVibe === 'ALL' ? ''
    : (VIBE_CATEGORIES.find((category) => category.icon === selectedVibe)?.label ?? selectedVibe)
  const selectedCityName = selectedCityId === 'ALL' ? ''
    : (BENTO_DESTINATIONS.find((city) => city.id === selectedCityId)?.cityName ?? selectedCityId)
  const hasActiveFilters = selectedVibe !== 'ALL' || selectedCityId !== 'ALL'
    || searchKeyword.trim().length > 0 || petFriendlyOnly

  return {
    selectedVibe, setSelectedVibe, selectedCityId, setSelectedCityId,
    searchKeyword, setSearchKeyword, petFriendlyOnly, setPetFriendlyOnly,
    sortOrder, setSortOrder, wishlistedIds, filteredHotels,
    selectedVibeLabel, selectedCityName, hasActiveFilters, handleResetFilters, handleToggleWishlist,
  }
}
