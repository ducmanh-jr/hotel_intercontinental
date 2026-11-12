import { useNavigate } from 'react-router'
import {
  useClientHomeContext,
  ClientHeroSection,
  ClientDestinationsSection,
  ClientStaysSection,
  ClientJournalSection,
  ClientPartnerSection,
  ClientStayModal,
} from '@/features/discovery'

export function StayVibeHomePage() {
  const navigate = useNavigate()
  const {
    allStays,
    destinations,
    activeStays,
    filterState,
    filterLabel,
    hasActiveFilters,
    savedIds,
    activeModalStay,
    isLoadingStays,
    isErrorStays,
    applyCity,
    selectVibe,
    setSort,
    toggleSaved,
    resetAll,
    handleSearchSubmit,
    closeModal,
    showToast,
    scrollToStays,
  } = useClientHomeContext()

  const handleOpenStay = (id: string) => {
    navigate(`/stays/${id}`)
  }

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section + Thanh tìm kiếm + Cam kết */}
      <ClientHeroSection
        onSearchSubmit={handleSearchSubmit}
        onQuickCity={(city) => applyCity(city)}
        onOpenStay={handleOpenStay}
      />

      {/* 2. Điểm đến thịnh hành */}
      <ClientDestinationsSection
        destinations={destinations}
        selectedCity={filterState.city}
        onSelectCity={(city) => applyCity(city)}
        onResetAll={() => resetAll()}
      />

      {/* 3. Bộ sưu tập chỗ nghỉ + Lọc Vibe + Sắp xếp */}
      <ClientStaysSection
        stays={activeStays}
        totalStaysCount={allStays.length}
        selectedVibe={filterState.vibe}
        selectedSort={filterState.sort}
        filterLabel={filterLabel}
        hasActiveFilters={hasActiveFilters}
        savedIds={savedIds}
        isLoading={isLoadingStays}
        isError={isErrorStays}
        onSelectVibe={selectVibe}
        onSelectSort={setSort}
        onToggleSaved={toggleSaved}
        onOpenStay={handleOpenStay}
        onResetAll={() => resetAll()}
      />

      {/* 4. Câu chuyện trải nghiệm (Journal) */}
      <ClientJournalSection
        onJournalCta={() => {
          selectVibe('wellness')
          applyCity('all', false)
          scrollToStays()
          showToast('Đang xem những chỗ nghỉ dành cho một kỳ nghỉ chậm.')
        }}
      />

      {/* 5. Khu vực đối tác lưu trú */}
      <ClientPartnerSection
        onPartnerAction={(msg) => showToast(msg)}
      />

      {/* 6. Modal chi tiết chỗ nghỉ */}
      <ClientStayModal
        stay={activeModalStay}
        isOpen={Boolean(activeModalStay)}
        onClose={closeModal}
        onBookStay={(stay) => {
          closeModal()
          showToast(`Đã ghi nhận lựa chọn ${stay.name} trong bản xem trước.`)
        }}
      />
    </div>
  )
}
