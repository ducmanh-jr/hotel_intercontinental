import { useState } from 'react'
import {
  ArrowRightOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  StarFilled,
} from '@ant-design/icons'
import { HeartVectorIcon } from './StayVibeIcons'
import type { StayVibeHotelItem } from '../model/discovery'
import { formatCurrencyAmount } from '@/shared/lib/format'

interface HotelCardProps {
  hotel: StayVibeHotelItem
  isWishlisted: boolean
  onToggleWishlist: (hotelId: string) => void
  onInspectHotel: (hotel: StayVibeHotelItem) => void
}

export function HotelCard({
  hotel,
  isWishlisted,
  onToggleWishlist,
  onInspectHotel,
}: HotelCardProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const totalImages = hotel.images.length

  function handlePrevImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }

  function handleNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setImageIndex((prev) => (prev + 1) % totalImages)
  }

  return (
    <article
      className="group bg-white rounded-2xl border border-[var(--md-sys-color-outline-subtle)] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[var(--md-sys-color-outline)] transition-all duration-200 w-full"
      role="listitem"
    >
      <div className="flex flex-col gap-3">
        {/* Media Carousel */}
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[var(--md-sys-color-surface-container)]">
          <img
            src={hotel.images[imageIndex]}
            alt={`${hotel.name} - Ảnh ${imageIndex + 1}/${totalImages}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {/* Location Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[var(--md-sys-color-on-surface)] text-xs font-semibold shadow-xs">
              <EnvironmentOutlined className="text-[var(--md-sys-color-primary)] text-xs" aria-hidden="true" />
              <span>{hotel.cityName}</span>
            </span>
          </div>

          {/* Wishlist Button (min 44x44 touch target) */}
          <button
            type="button"
            className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-sm shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer z-10 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)]"
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? `Bỏ lưu yêu thích ${hotel.name}`
                : `Lưu yêu thích ${hotel.name}`
            }
            onClick={() => onToggleWishlist(hotel.id)}
          >
            <HeartVectorIcon filled={isWishlisted} />
          </button>

          {/* Manual Carousel controls */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-[var(--md-sys-color-on-surface)] flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] transition-all duration-200 hover:bg-white shadow-xs cursor-pointer z-10"
                aria-label={`Ảnh trước của ${hotel.name}`}
                onClick={handlePrevImage}
              >
                <LeftOutlined aria-hidden="true" />
              </button>
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-[var(--md-sys-color-on-surface)] flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] transition-all duration-200 hover:bg-white shadow-xs cursor-pointer z-10"
                aria-label={`Ảnh tiếp theo của ${hotel.name}`}
                onClick={handleNextImage}
              >
                <RightOutlined aria-hidden="true" />
              </button>
              <div
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm z-10"
                role="tablist"
                aria-label="Chọn ảnh khách sạn"
              >
                {hotel.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === imageIndex}
                    aria-label={`Ảnh ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === imageIndex ? 'bg-white w-3' : 'bg-white/50 w-1.5'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageIndex(idx)
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card Info */}
        <div className="flex flex-col gap-1.5">
          {/* Rating & Distance */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="inline-flex items-center gap-1 font-semibold text-[var(--md-sys-color-on-surface)]">
              <StarFilled className="text-amber-500" aria-hidden="true" />
              <span>{hotel.rating.toFixed(1)}</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-normal">
                ({hotel.reviewCount} đánh giá)
              </span>
            </div>
            <span className="text-[var(--md-sys-color-on-surface-variant)] truncate text-right max-w-[180px]">
              {hotel.distanceLabel}
            </span>
          </div>

          {/* Hotel Name */}
          <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] line-clamp-1 mt-0.5">
            <button
              type="button"
              className="text-left cursor-pointer w-full text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors"
              onClick={() => onInspectHotel(hotel)}
            >
              {hotel.name}
            </button>
          </h3>

          {/* Amenities Chips */}
          <ul className="flex flex-wrap gap-1.5 my-1 p-0 list-none" aria-label="Tiện ích nổi bật">
            {hotel.amenities.map((amenity) => (
              <li
                key={amenity}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] text-[11px] font-medium"
              >
                <CheckOutlined className="text-[var(--md-sys-color-primary)] text-[10px]" aria-hidden="true" />
                <span>{amenity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Price & Action */}
      <div className="flex items-end justify-between gap-3 pt-3 border-t border-[var(--md-sys-color-outline-subtle)] mt-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[var(--md-sys-color-on-surface)] tabular-nums">
              {formatCurrencyAmount(hotel.pricePerNight, hotel.currency)}
            </span>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">/ đêm</span>
          </div>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            {hotel.taxStatusNote}
          </span>
        </div>

        <button
          type="button"
          className="m3-btn-tonal !h-9 !px-3.5 !rounded-full !text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          onClick={() => onInspectHotel(hotel)}
        >
          <span>Chi tiết</span>
          <ArrowRightOutlined aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
