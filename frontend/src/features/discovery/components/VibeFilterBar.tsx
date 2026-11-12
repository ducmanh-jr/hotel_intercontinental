import { useRef } from 'react'
import {
  AppstoreOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { VibeSvgIcon } from './StayVibeIcons'
import type { VibeCategoryItem, VibeIconKey } from '../model/discovery'

interface VibeFilterBarProps {
  categories: VibeCategoryItem[]
  selectedVibe: VibeIconKey | 'ALL'
  onSelectVibe: (vibeId: VibeIconKey | 'ALL') => void
  totalMatchingCount: number
}

export function VibeFilterBar({
  categories,
  selectedVibe,
  onSelectVibe,
  totalMatchingCount,
}: VibeFilterBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  function handleScroll(direction: 'left' | 'right') {
    if (!scrollContainerRef.current) return
    const offset = direction === 'left' ? -280 : 280
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section
      id="vibe-section"
      className="w-full my-6"
      aria-label="Lọc nhanh theo phong cách lưu trú"
    >
      <div className="flex items-center justify-between gap-4 mb-3.5">
        <div>
          <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--md-sys-color-primary)]">
            Phong cách lưu trú
          </h2>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Lựa chọn phong cách phù hợp cho kỳ nghỉ — đang có{' '}
            <strong className="text-[var(--md-sys-color-on-surface)]">{totalMatchingCount}</strong> chỗ nghỉ
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-[var(--md-sys-color-outline-subtle)] bg-white text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center text-xs hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] transition cursor-pointer"
            aria-label="Cuộn danh sách phong cách sang trái"
            onClick={() => handleScroll('left')}
          >
            <LeftOutlined aria-hidden="true" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-[var(--md-sys-color-outline-subtle)] bg-white text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center text-xs hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] transition cursor-pointer"
            aria-label="Cuộn danh sách phong cách sang phải"
            onClick={() => handleScroll('right')}
          >
            <RightOutlined aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-2 scroll-smooth"
        role="group"
        aria-label="Chọn phong cách lưu trú"
      >
        {/* 'All' Chip */}
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${
            selectedVibe === 'ALL'
              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary-container)] font-bold shadow-xs'
              : 'bg-white border-[var(--md-sys-color-outline-subtle)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
          aria-pressed={selectedVibe === 'ALL'}
          onClick={() => onSelectVibe('ALL')}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
              selectedVibe === 'ALL'
                ? 'bg-[var(--md-sys-color-primary)] text-white'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
            }`}
            aria-hidden="true"
          >
            <AppstoreOutlined />
          </span>
          <span className="font-semibold whitespace-nowrap">Tất cả phong cách</span>
        </button>

        {/* Category Chips */}
        {categories.map((category) => {
          const isSelected = selectedVibe === category.icon
          return (
            <button
              key={category.id}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${
                isSelected
                  ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary-container)] font-bold shadow-xs'
                  : 'bg-white border-[var(--md-sys-color-outline-subtle)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              aria-pressed={isSelected}
              onClick={() => onSelectVibe(isSelected ? 'ALL' : category.icon)}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-white'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
                aria-hidden="true"
              >
                <VibeSvgIcon icon={category.icon} />
              </span>
              <span className="font-semibold whitespace-nowrap">{category.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
