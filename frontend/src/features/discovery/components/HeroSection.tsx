import {
  CompassOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { SmartSearchBar } from './SmartSearchBar'
import type { SmartSearchFormValues } from '../model/search-form-schema'

interface HeroSectionProps {
  onSearchSubmit: (values: SmartSearchFormValues) => void
  onResetSearch: () => void
  activeDestinationFilter: string
}

export function HeroSection({
  onSearchSubmit,
  onResetSearch,
  activeDestinationFilter,
}: HeroSectionProps) {
  return (
    <section aria-labelledby="stayhub-hero-heading" className="w-full">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-subtle)] p-6 sm:p-8 lg:p-10 shadow-sm">
        {/* Subtle Background Ambience */}
        <div
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[var(--md-sys-color-primary)]/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Content Box */}
        <div className="relative z-10 max-w-3xl mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs font-semibold">
              <CompassOutlined aria-hidden="true" />
              <span>Khám phá chỗ nghỉ StayHub</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--md-sys-color-outline-subtle)] text-[var(--md-sys-color-on-surface-variant)] text-xs font-medium">
              <InfoCircleOutlined aria-hidden="true" />
              <span>Chế độ tìm kiếm khám phá (Dữ liệu minh họa)</span>
            </span>
          </div>

          <h1
            id="stayhub-hero-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight leading-tight mb-2"
          >
            Tìm chỗ nghỉ lý tưởng cho kỳ nghỉ tiếp theo của bạn
          </h1>

          <p className="text-sm sm:text-base text-[var(--md-sys-color-on-surface-variant)] max-w-2xl leading-relaxed">
            Tra cứu các khách sạn, khu nghỉ dưỡng, homestay và điểm lưu trú đặc sắc theo thành phố hoặc phong cách trải nghiệm.
          </p>
        </div>

        {/* Smart Search Bar */}
        <div className="relative z-10 w-full">
          <SmartSearchBar
            onSearchSubmit={onSearchSubmit}
            onResetSearch={onResetSearch}
            activeDestinationFilter={activeDestinationFilter}
          />
        </div>
      </div>
    </section>
  )
}
