import { ArrowRightOutlined, EnvironmentFilled } from '@ant-design/icons'
import type { BentoDestinationItem } from '../model/discovery'

interface BentoDestinationGridProps {
  destinations: BentoDestinationItem[]
  selectedCityId: string | 'ALL'
  onSelectCity: (cityId: string | 'ALL', cityName?: string) => void
}

export function BentoDestinationGrid({
  destinations,
  selectedCityId,
  onSelectCity,
}: BentoDestinationGridProps) {
  return (
    <section
      id="bento-section"
      className="w-full my-6 sm:my-8"
      aria-labelledby="bento-section-heading"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--md-sys-color-primary)] font-sans">
            Điểm đến nổi bật
          </span>
          <h2 id="bento-section-heading" className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] mt-1 font-sans">
            Khám phá điểm đến thịnh hành
          </h2>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 font-sans">
            Những tọa độ du lịch và nghỉ dưỡng được yêu thích nhất mùa này.
          </p>
        </div>

        {selectedCityId !== 'ALL' && (
          <button
            type="button"
            className="m3-btn-outlined !h-8 !px-3.5 !rounded-full !text-xs font-semibold cursor-pointer"
            onClick={() => onSelectCity('ALL')}
          >
            Xem tất cả điểm đến
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" role="list">
        {destinations.map((item) => {
          const isSelected = selectedCityId === item.id
          const isSingle = destinations.length === 1

          return (
            <article
              key={item.id}
              role="listitem"
              className={`group relative overflow-hidden rounded-2xl bg-neutral-900 text-white flex flex-col justify-between p-5 sm:p-6 min-h-[280px] sm:min-h-[320px] border border-[var(--md-sys-color-outline-subtle)] shadow-xs hover:shadow-md transition-all duration-300 ${
                isSingle ? 'col-span-full min-h-[320px]' : ''
              } ${isSelected ? 'ring-2 ring-[var(--md-sys-color-primary)] border-transparent' : ''}`}
            >
              <img
                src={item.imageUrl}
                alt={`Điểm đến ${item.cityName}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 group-hover:from-black transition-colors duration-300 pointer-events-none"
                aria-hidden="true"
              />

              {/* Top Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium"
                  style={{ color: '#ffffff' }}
                >
                  <EnvironmentFilled className="!text-[var(--md-sys-color-primary-container)]" aria-hidden="true" />
                  <span>{item.badgeText}</span>
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  {item.highlightVibe}
                </span>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10 flex flex-col items-start gap-1">
                <h3
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] m-0 font-sans"
                  style={{ color: '#ffffff' }}
                >
                  {item.cityName}
                </h3>
                <p
                  className="text-xs sm:text-sm font-medium m-0 mt-0.5 font-sans drop-shadow-sm"
                  style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                >
                  {item.tagline}
                </p>
                {item.description && (
                  <p
                    className="text-xs line-clamp-2 max-w-xl m-0 mt-0.5 font-sans"
                    style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                  >
                    {item.description}
                  </p>
                )}

                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-neutral-100 transition-all cursor-pointer shadow-md"
                  aria-pressed={isSelected}
                  onClick={() =>
                    onSelectCity(isSelected ? 'ALL' : item.id, item.cityName)
                  }
                >
                  <span className="!text-[#191C1C] text-xs font-bold">
                    {isSelected
                      ? `Đang chọn ${item.cityName}`
                      : `Khám phá ${item.accommodationCount}+ chỗ nghỉ`}
                  </span>
                  <ArrowRightOutlined className="!text-[#191C1C] text-xs" aria-hidden="true" />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
