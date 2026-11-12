import { useMemo, useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  ClientFilterState,
  ClientSortOption,
  ClientStay,
  ClientVibeKey,
} from '../model/client-home'
import type { ClientSearchFormValues } from '../model/client-search-schema'
import { fetchClientDestinations, fetchClientStays } from '../api/client-home-api'
import { CLIENT_VIBES } from '../mocks/client-home-data'

export function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function parseDateInput(value: string): Date | null {
  const match = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)}₫`
}

export function useClientHome() {
  const [filterState, setFilterState] = useState<ClientFilterState>({
    vibe: 'all',
    city: 'all',
    keyword: '',
    sort: 'featured',
    savedOnly: false,
  })

  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
  const [pulseSaved, setPulseSaved] = useState(false)
  const [modalStayId, setModalStayId] = useState<string | null>(null)
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean
    mode: 'login' | 'register'
  }>({ isOpen: false, mode: 'login' })
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  // TanStack Query queries
  const {
    data: allStays = [],
    isLoading: isLoadingStays,
    isError: isErrorStays,
  } = useQuery({
    queryKey: ['discovery', 'stays'],
    queryFn: ({ signal }) => fetchClientStays(signal),
  })

  const {
    data: destinations = [],
    isLoading: isLoadingDestinations,
  } = useQuery({
    queryKey: ['discovery', 'destinations'],
    queryFn: ({ signal }) => fetchClientDestinations(signal),
  })

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    setToastMessage(message)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 3200)
  }, [])

  const scrollToStays = useCallback(() => {
    window.setTimeout(() => {
      const el = document.getElementById('stays')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 60)
  }, [])

  const applyCity = useCallback((cityName: string, announce = true) => {
    setFilterState((prev) => {
      const isAlready = prev.city === cityName
      const newCity = isAlready ? 'all' : cityName
      return {
        ...prev,
        city: newCity,
        keyword: '',
        savedOnly: false,
      }
    })
    scrollToStays()
    if (announce) {
      showToast(
        filterState.city === cityName
          ? 'Đang hiển thị toàn bộ điểm đến.'
          : `Đang lọc chỗ nghỉ tại ${cityName}.`,
      )
    }
  }, [filterState.city, scrollToStays, showToast])

  const selectVibe = useCallback((vibe: ClientVibeKey) => {
    setFilterState((prev) => ({
      ...prev,
      vibe,
      savedOnly: false,
    }))
  }, [])

  const setSort = useCallback((sort: ClientSortOption) => {
    setFilterState((prev) => ({ ...prev, sort }))
  }, [])

  const setKeyword = useCallback((keyword: string) => {
    setFilterState((prev) => ({ ...prev, keyword, city: 'all' }))
  }, [])

  const toggleSaved = useCallback((stayId: string) => {
    const stay = allStays.find((s) => s.id === stayId)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(stayId)) {
        next.delete(stayId)
        showToast(stay ? `Đã bỏ lưu ${stay.name}.` : 'Đã bỏ lưu chỗ nghỉ.')
      } else {
        next.add(stayId)
        showToast(stay ? `Đã lưu ${stay.name} vào bộ sưu tập.` : 'Đã lưu chỗ nghỉ.')
      }
      return next
    })
    setPulseSaved(true)
    window.setTimeout(() => setPulseSaved(false), 500)
  }, [allStays, showToast])

  const toggleSavedOnly = useCallback(() => {
    if (savedIds.size === 0) {
      showToast('Chưa có chỗ nghỉ nào được lưu. Chạm vào trái tim trên thẻ để lưu.')
      return
    }
    setFilterState((prev) => {
      const nextSavedOnly = !prev.savedOnly
      showToast(
        nextSavedOnly
          ? `Đang xem ${savedIds.size} chỗ nghỉ đã lưu.`
          : 'Đã quay lại toàn bộ bộ sưu tập.',
      )
      return {
        ...prev,
        savedOnly: nextSavedOnly,
      }
    })
    scrollToStays()
  }, [savedIds.size, scrollToStays, showToast])

  const resetAll = useCallback((announce = true) => {
    setFilterState({
      vibe: 'all',
      city: 'all',
      keyword: '',
      sort: 'featured',
      savedOnly: false,
    })
    if (announce) {
      showToast('Đã hiển thị lại toàn bộ bộ sưu tập.')
    }
  }, [showToast])

  const handleSearchSubmit = useCallback((values: ClientSearchFormValues) => {
    const destination = values.destination.trim()
    const start = parseDateInput(values.checkIn)
    const end = parseDateInput(values.checkOut)

    if (!start || !end) {
      showToast('Vui lòng nhập ngày theo định dạng DD/MM/YYYY.')
      return
    }
    if (end <= start) {
      showToast('Ngày trả phòng phải sau ngày nhận phòng.')
      return
    }

    const nights = Math.round((end.getTime() - start.getTime()) / 86400000)
    const knownCities = Array.from(new Set(allStays.map((s) => s.city)))
    const matchedCity = knownCities.find((c) => {
      const cNorm = normalizeText(c)
      const dNorm = normalizeText(destination)
      return dNorm && (cNorm.includes(dNorm) || dNorm.includes(cNorm))
    })

    setFilterState({
      vibe: 'all',
      city: matchedCity || 'all',
      keyword: matchedCity ? '' : destination,
      sort: 'featured',
      savedOnly: false,
    })

    const place = matchedCity || destination || 'toàn bộ bộ sưu tập'
    showToast(`Đang tìm ${place} · ${nights} đêm · ${values.guests}.`)
    scrollToStays()
  }, [allStays, scrollToStays, showToast])

  // Filtered and sorted stays
  const activeStays = useMemo(() => {
    const keywordNorm = normalizeText(filterState.keyword)

    const filtered = allStays.filter((stay) => {
      const cityMatch = filterState.city === 'all' || stay.city === filterState.city
      const vibeMatch = filterState.vibe === 'all' || stay.vibes.includes(filterState.vibe)
      const savedMatch = !filterState.savedOnly || savedIds.has(stay.id)
      const keywordMatch =
        !keywordNorm ||
        [stay.name, stay.city, stay.region, stay.type].some((val) =>
          normalizeText(val).includes(keywordNorm),
        )

      return cityMatch && vibeMatch && savedMatch && keywordMatch
    })

    const list = [...filtered]
    if (filterState.sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price)
    } else if (filterState.sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price)
    } else if (filterState.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    }

    return list
  }, [allStays, filterState, savedIds])

  const filterLabel = useMemo(() => {
    const parts: string[] = []
    if (filterState.city !== 'all') parts.push(filterState.city)
    if (filterState.vibe !== 'all') {
      const vibeObj = CLIENT_VIBES.find((v) => v.key === filterState.vibe)
      parts.push(vibeObj?.label || filterState.vibe)
    }
    if (filterState.keyword) parts.push(`“${filterState.keyword}”`)
    if (filterState.savedOnly) parts.push('đã lưu')

    return parts.length ? `· ${parts.join(' · ')}` : 'từ bộ sưu tập'
  }, [filterState])

  const hasActiveFilters =
    filterState.city !== 'all' ||
    filterState.vibe !== 'all' ||
    Boolean(filterState.keyword) ||
    filterState.savedOnly

  const activeModalStay: ClientStay | null = useMemo(() => {
    if (!modalStayId) return null
    return allStays.find((s) => s.id === modalStayId) || null
  }, [allStays, modalStayId])

  return {
    allStays,
    destinations,
    activeStays,
    filterState,
    filterLabel,
    hasActiveFilters,
    savedIds,
    pulseSaved,
    modalStayId,
    activeModalStay,
    toastMessage,
    isLoadingStays,
    isErrorStays,
    isLoadingDestinations,
    applyCity,
    selectVibe,
    setSort,
    setKeyword,
    toggleSaved,
    toggleSavedOnly,
    resetAll,
    handleSearchSubmit,
    openModal: (id: string) => setModalStayId(id),
    closeModal: () => setModalStayId(null),
    authModalState,
    openAuthModal: (mode: 'login' | 'register' = 'login') =>
      setAuthModalState({ isOpen: true, mode }),
    closeAuthModal: () =>
      setAuthModalState((prev) => ({ ...prev, isOpen: false })),
    switchAuthMode: (mode: 'login' | 'register') =>
      setAuthModalState((prev) => ({ ...prev, mode })),
    showToast,
    scrollToStays,
  }
}
