import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import { Skeleton, Result, Button } from 'antd'
import { usePublicHotelDetailQuery } from '@/features/hotels'
import {
  HOTEL_DETAIL_DATABASE,
  HOTEL_SWITCHER_CHIPS,
  type HotelDetailItem,
} from '@/features/discovery'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫'
}

function formatDateVN(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts
  return `${parseInt(d, 10)} thg ${parseInt(m, 10)}, ${y}`
}

function formatDateSlash(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

export function HotelDetailPage() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const navigate = useNavigate()

  const isUuid = Boolean(
    hotelId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        hotelId,
      ),
  )
  const publicQuery = usePublicHotelDetailQuery(isUuid ? hotelId : undefined)

  const currentHotelKey =
    hotelId && HOTEL_DETAIL_DATABASE[hotelId] ? hotelId : 'the-lagom'
  const baseHotel: HotelDetailItem =
    HOTEL_DETAIL_DATABASE[currentHotelKey] ||
    HOTEL_DETAIL_DATABASE['the-lagom']

  const hotel: HotelDetailItem = useMemo(() => {
    return publicQuery.hotel
      ? {
          ...baseHotel,
          id: publicQuery.hotel.id,
          title: publicQuery.hotel.name,
          location: publicQuery.hotel.address,
          desc: publicQuery.hotel.description
            ? [publicQuery.hotel.description]
            : baseHotel.desc,
          rating: publicQuery.hotel.starRating
            ? Number(publicQuery.hotel.starRating)
            : baseHotel.rating,
        }
      : baseHotel
  }, [baseHotel, publicQuery.hotel])

  // Booking & Date State
  const [checkIn, setCheckIn] = useState<string>('2026-11-13')
  const [checkOut, setCheckOut] = useState<string>('2026-11-15')
  const [nights, setNights] = useState<number>(2)
  const [adults, setAdults] = useState<number>(1)
  const [children, setChildren] = useState<number>(0)
  const [isSelectingStart, setIsSelectingStart] = useState<boolean>(true)
  const [isGuestsOpen, setIsGuestsOpen] = useState<boolean>(false)
  const [isSaved, setIsSaved] = useState<boolean>(false)

  // Modals & Subnav State
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false)
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState<boolean>(false)
  const [isReserveOpen, setIsReserveOpen] = useState<boolean>(false)
  const [activeHelpArticle, setActiveHelpArticle] = useState<
    'rules' | 'safety' | 'cancellation' | 'staycover' | null
  >(null)
  const [isSubnavVisible, setIsSubnavVisible] = useState<boolean>(false)
  const [activeSection, setActiveSection] = useState<string>('gallery')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)

  // Dynamic Page Title
  useEffect(() => {
    document.title = `${hotel.title} - StayHub`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hotel])

  // Toast Timer
  const showToast = (msg: string) => {
    setToastMessage(msg)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 3200)
  }

  // Scroll Spy for Sticky Subnav
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsSubnavVisible(scrollY > 380)

      const sections = ['gallery', 'amenities', 'reviews', 'location', 'host']
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const top = el.offsetTop - 140
          if (scrollY >= top) {
            setActiveSection(sectionId)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close Help Article Modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeHelpArticle) {
        setActiveHelpArticle(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeHelpArticle])

  // Price Calculations
  const roomSubtotal = hotel.price * nights
  const cleaningFee = hotel.cleaningFee
  const serviceFee = hotel.serviceFee
  const discount = hotel.discount
  const grandTotal = roomSubtotal + cleaningFee + serviceFee - discount

  // Calendar Click Handler
  const handleDateClick = (dateStr: string) => {
    if (isSelectingStart) {
      setCheckIn(dateStr)
      setIsSelectingStart(false)
      showToast(
        `Đã chọn ngày nhận phòng: ${formatDateSlash(dateStr)}. Vui lòng chọn ngày trả phòng.`,
      )
    } else {
      if (dateStr > checkIn) {
        setCheckOut(dateStr)
        const d1 = new Date(checkIn).getTime()
        const d2 = new Date(dateStr).getTime()
        const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
        setNights(diff)
        setIsSelectingStart(true)
        showToast(`Đã cập nhật kỳ nghỉ: ${diff} đêm.`)
      } else {
        setCheckIn(dateStr)
        showToast(
          `Ngày trả phòng phải sau ngày nhận phòng. Đã chọn lại ngày nhận phòng: ${formatDateSlash(dateStr)}`,
        )
      }
    }
  }

  const resetDefaultDates = () => {
    setCheckIn('2026-11-13')
    setCheckOut('2026-11-15')
    setNights(2)
    setIsSelectingStart(true)
    showToast('Đã đặt lại thời gian lưu trú mặc định (13 – 15 thg 11, 2026).')
  }

  // Share handler
  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
    showToast('🔗 Đã sao chép liên kết phòng vào bộ nhớ tạm.')
  }

  // Favorite toggle
  const toggleSave = () => {
    const next = !isSaved
    setIsSaved(next)
    if (next) {
      showToast('❤️ Đã lưu vào danh sách Yêu thích của bạn.')
    } else {
      showToast('Đã bỏ lưu khỏi danh sách Yêu thích.')
    }
  }

  // Scroll to section
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Total guest description
  const totalGuests = adults + children
  const guestsLabel =
    `${totalGuests} khách` +
    (children > 0 ? ` (${adults} lớn, ${children} trẻ)` : '')

  if (isUuid && publicQuery.isLoading) {
    return (
      <div className="w-full bg-[#fbf9f5] min-h-screen py-16 px-4 max-w-[1280px] mx-auto">
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      </div>
    )
  }

  if (isUuid && (publicQuery.isError || !publicQuery.hotel)) {
    return (
      <div className="w-full bg-[#fbf9f5] min-h-screen py-20 px-4 max-w-[800px] mx-auto text-center">
        <Result
          status="404"
          title="Không tìm thấy khách sạn"
          subTitle="Khách sạn không tồn tại hoặc chưa được kích hoạt công khai trên hệ thống."
          extra={
            <Link to="/">
              <Button type="primary" style={{ backgroundColor: '#1F7A4D' }}>
                Về trang chủ
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="w-full bg-[#fbf9f5] text-[#1a1918] font-sans min-h-screen">
      {/* ─── TOP QUICK SWITCHER STRIP (Chỉ hiển thị khi chạy thử nghiệm mock) ─── */}
      {!isUuid && !publicQuery.hotel && (
        <div
          className="w-full bg-[#f3ede2] border-b border-[#ece5dc] py-2 px-4 md:px-8 text-[13px] text-[#706a62]"
          data-od-id="top-switcher-strip"
        >
          <div className="max-w-[1280px] mx-auto flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-[#1a1918] inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg
                className="w-3.5 h-3.5 text-[#b66d3a]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>Chuyển đổi phòng xem thử:</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
              {HOTEL_SWITCHER_CHIPS.map((chip) => {
                const active = chip.id === currentHotelKey
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      navigate(`/hotels/${chip.id}`)
                      showToast(`Đã chuyển sang chỗ nghỉ: ${chip.label}`)
                    }}
                    className={`px-3 py-1 rounded-full text-xs transition-all border ${
                      active
                        ? 'bg-[#1a1918] text-white border-[#1a1918] font-medium shadow-xs'
                        : 'bg-white text-[#423f3b] border-[#e3dcd1] hover:border-[#b66d3a] hover:text-[#b66d3a]'
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY SECONDARY SUBNAV BAR (On Scroll) ─── */}
      {isSubnavVisible && (
        <nav
          className="sticky top-0 z-40 w-full bg-[#fbf9f5]/95 backdrop-blur-md border-b border-[#e3dcd1] shadow-xs transition-all duration-200"
          aria-label="Điều hướng nhanh trang"
        >
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between h-[60px] gap-4">
            <div className="flex items-center gap-6 text-sm font-medium">
              {[
                { id: 'gallery', label: 'Ảnh' },
                { id: 'amenities', label: 'Tiện nghi' },
                { id: 'reviews', label: 'Đánh giá' },
                { id: 'location', label: 'Vị trí' },
                { id: 'host', label: 'Chủ nhà' },
              ].map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollTo(link.id)}
                  className={`py-4 transition-colors relative cursor-pointer ${
                    activeSection === link.id
                      ? 'text-[#1a1918] font-bold border-b-2 border-[#1a1918]'
                      : 'text-[#706a62] hover:text-[#1a1918]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-base font-bold text-[#A8532A]">
                  {formatVND(hotel.price)}{' '}
                  <span className="text-xs font-normal text-[#706a62]">/ đêm</span>
                </div>
                <div className="text-[11px] text-[#706a62]">
                  ★ {hotel.rating.toFixed(2)} · {hotel.reviews} đánh giá
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReserveOpen(true)}
                className="bg-[#b66d3a] hover:bg-[#9e5b2c] active:bg-[#884b21] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                Đặt phòng
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-4">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-[#706a62] hover:text-[#1a1918] transition-colors font-medium group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Quay lại bộ sưu tập chỗ nghỉ</span>
          </Link>
        </div>

        {/* ─── LISTING HEADER & META ─── */}
        <section className="mb-6" id="gallery">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-serif font-bold text-[#1a1918] tracking-tight leading-snug mb-3">
            {hotel.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#423f3b]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-[#1a1918]">
                <svg
                  className="w-4 h-4 text-[#df8a15] fill-current"
                  viewBox="0 0 24 24"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{hotel.rating.toFixed(2)}</span>
              </span>
              <span className="text-[#948d84]">·</span>
              <button
                type="button"
                onClick={() => scrollTo('reviews')}
                className="font-semibold underline hover:text-[#b66d3a] transition-colors cursor-pointer"
              >
                {hotel.reviews} đánh giá
              </button>
              <span className="text-[#948d84]">·</span>
              <span className="inline-flex items-center gap-1 text-[#2a583e] font-medium bg-[#eef5f1] px-2 py-0.5 rounded-full text-xs">
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Chủ nhà siêu cấp</span>
              </span>
              <span className="text-[#948d84]">·</span>
              <button
                type="button"
                onClick={() => scrollTo('location')}
                className="underline hover:text-[#b66d3a] transition-colors cursor-pointer text-[#706a62]"
              >
                {hotel.location}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#f3ede2] text-[#1a1918] transition-colors border border-transparent hover:border-[#e3dcd1] cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Chia sẻ</span>
              </button>
              <button
                type="button"
                onClick={toggleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#f3ede2] text-[#1a1918] transition-colors border border-transparent hover:border-[#e3dcd1] cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 transition-colors ${
                    isSaved ? 'text-[#b66d3a] fill-[#b66d3a]' : 'text-[#1a1918]'
                  }`}
                  viewBox="0 0 24 24"
                  fill={isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ─── SIGNATURE 5-PHOTO HERO GRID ─── */}
        <section className="relative rounded-2xl overflow-hidden mb-10 group" data-od-id="hero-photo-grid">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[320px] sm:h-[400px] md:h-[450px]">
            {/* Big Main Left Photo */}
            <div
              onClick={() => setIsGalleryOpen(true)}
              className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer"
            >
              <img
                src={hotel.photos[0]}
                alt={hotel.title}
                className="w-full h-full object-cover group-hover:brightness-95 hover:scale-[1.02] transition-all duration-500 ease-out"
              />
            </div>
            {/* 4 Smaller Photos */}
            {hotel.photos.slice(1, 5).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => setIsGalleryOpen(true)}
                className="hidden md:block relative overflow-hidden cursor-pointer"
              >
                <img
                  src={photoUrl}
                  alt={`${hotel.title} ảnh ${idx + 2}`}
                  className="w-full h-full object-cover hover:scale-[1.03] hover:brightness-95 transition-all duration-500 ease-out"
                />
              </div>
            ))}
          </div>

          {/* Floating Show All Photos Button */}
          <button
            type="button"
            onClick={() => setIsGalleryOpen(true)}
            className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-[#1a1918] px-4 py-2 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 border border-[#e3dcd1] hover:scale-102 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Hiện tất cả 24 ảnh</span>
          </button>
        </section>

        {/* ─── ASYMMETRIC 2-COLUMN LAYOUT (Main + Sticky Booking Rail) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ─── LEFT COLUMN (CONTENT) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
            {/* Host Summary & Specs */}
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#ece5dc]">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1a1918]">
                  {hotel.type} · Chủ nhà {hotel.hostName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#706a62] mt-1.5">
                  {hotel.specs.map((spec, i) => (
                    <span key={i} className="inline-flex items-center gap-2">
                      {i > 0 && <span className="text-[#948d84]">·</span>}
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>
              </div>
              <img
                src={hotel.hostAvatar}
                alt={hotel.hostName}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-white shadow-xs ring-1 ring-[#e3dcd1] flex-shrink-0"
              />
            </div>

            {/* Guest Favorite Award Lockup */}
            <div className="border border-[#e3dcd1] bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
              <div className="flex items-center gap-3 text-[#1a1918]">
                {/* Left Laurel Wreath SVG */}
                <svg
                  className="w-6 h-9 fill-current text-[#1a1918]"
                  viewBox="0 0 24 36"
                >
                  <path d="M11.5 2C10.8 5 9.2 8.5 7 11.5c-2.3 3.1-4.8 5.7-6 8 2.2-.4 4.8-.3 7-1.4 1.8-1 3.2-2.7 4-4.8.8 2.5 2.1 4.7 4.2 6.3 1.9 1.4 4.3 2.1 6.8 2-1.5-2.2-4.1-4.7-6.5-7.7-2.3-2.9-4-6.3-5-11.9z" />
                  <path d="M6 21c-2.2 2.8-3.7 5.7-4.5 8.5 2.5-.2 5-1 7-2.5 1.5-1.2 2.7-2.8 3.5-4.8-1.8.2-3.8-.1-6-1.2z" />
                  <path d="M12 28c-1.5 2.5-2.6 4.8-3.2 7 2.2 0 4.2-.7 6-2 1.3-1 2.2-2.3 2.8-3.9-1.8.1-3.6-.1-5.6-1.1z" />
                </svg>
                <div className="text-3xl md:text-4xl font-serif font-bold text-[#1a1918]">
                  {hotel.rating.toFixed(2)}
                </div>
                {/* Right Laurel Wreath SVG */}
                <svg
                  className="w-6 h-9 fill-current text-[#1a1918] scale-x-[-1]"
                  viewBox="0 0 24 36"
                >
                  <path d="M11.5 2C10.8 5 9.2 8.5 7 11.5c-2.3 3.1-4.8 5.7-6 8 2.2-.4 4.8-.3 7-1.4 1.8-1 3.2-2.7 4-4.8.8 2.5 2.1 4.7 4.2 6.3 1.9 1.4 4.3 2.1 6.8 2-1.5-2.2-4.1-4.7-6.5-7.7-2.3-2.9-4-6.3-5-11.9z" />
                  <path d="M6 21c-2.2 2.8-3.7 5.7-4.5 8.5 2.5-.2 5-1 7-2.5 1.5-1.2 2.7-2.8 3.5-4.8-1.8.2-3.8-.1-6-1.2z" />
                  <path d="M12 28c-1.5 2.5-2.6 4.8-3.2 7 2.2 0 4.2-.7 6-2 1.3-1 2.2-2.3 2.8-3.9-1.8.1-3.6-.1-5.6-1.1z" />
                </svg>
              </div>

              <div className="text-center md:text-left flex-1 max-w-md">
                <div className="text-base font-bold text-[#1a1918]">
                  Được khách yêu thích
                </div>
                <div className="text-xs sm:text-sm text-[#706a62] leading-relaxed mt-0.5">
                  Một trong những chỗ nghỉ được yêu thích nhất trên StayHub dựa trên
                  điểm số, đánh giá và độ tin cậy.
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#ece5dc] pt-3 md:pt-0 md:pl-6 text-center">
                <div>
                  <div className="text-base sm:text-lg font-bold text-[#1a1918]">
                    {hotel.rating.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#706a62]">Đánh giá sao</div>
                </div>
                <div className="w-[1px] h-8 bg-[#ece5dc]" />
                <div>
                  <div className="text-base sm:text-lg font-bold text-[#1a1918]">
                    {hotel.reviews}
                  </div>
                  <div className="text-xs text-[#706a62]">Đánh giá</div>
                </div>
              </div>
            </div>

            {/* Highlights List */}
            <div className="flex flex-col gap-5 py-4 border-y border-[#ece5dc]">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#f8eee6] text-[#b66d3a] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1918] text-base">
                    Tự nhận phòng thuận tiện
                  </h4>
                  <p className="text-sm text-[#706a62] mt-0.5 leading-relaxed">
                    Tự nhận phòng linh hoạt bất kỳ lúc nào với bàn phím khóa điện tử thông minh.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#f8eee6] text-[#b66d3a] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1918] text-base">
                    Vị trí được đánh giá cao
                  </h4>
                  <p className="text-sm text-[#706a62] mt-0.5 leading-relaxed">
                    95% khách lưu trú gần đây đánh giá 5 sao cho vị trí trung tâm,
                    tiện lợi khám phá ẩm thực và danh thắng.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#f8eee6] text-[#b66d3a] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1918] text-base">
                    Hủy miễn phí trong 48 giờ
                  </h4>
                  <p className="text-sm text-[#706a62] mt-0.5 leading-relaxed">
                    Nhận hoàn tiền đầy đủ nếu hủy trước ngày 11 thg 11, 2026. An tâm linh hoạt lịch trình.
                  </p>
                </div>
              </div>
            </div>

            {/* StayCover Protection Banner */}
            <div className="bg-[#f8eee6] border border-[#e3dcd1] rounded-2xl p-5 md:p-6 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl font-bold tracking-tight text-[#1a1918] font-serif">
                  stay<span className="text-[#b66d3a]">cover</span>
                </div>
                <span className="text-[11px] font-semibold text-[#8c4f24] uppercase tracking-wider bg-[#eddccf] px-2.5 py-0.5 rounded-full">
                  Bảo vệ miễn phí
                </span>
              </div>
              <p className="text-sm text-[#423f3b] leading-relaxed m-0">
                Mọi đặt phòng tại StayHub đều bao gồm gói bảo vệ StayCover toàn diện chống sự cố hủy phòng bất ngờ và hỗ trợ khách lưu trú 24/7.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#ebd8cb] text-xs text-[#423f3b]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-[#b66d3a] font-bold">✓</span>
                  <span>Bảo đảm phòng đúng mô tả</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-[#b66d3a] font-bold">✓</span>
                  <span>Bảo đảm hoàn tiền do sự cố</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-[#b66d3a] font-bold">✓</span>
                  <span>Đường dây nóng hỗ trợ 24/7</span>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveHelpArticle('staycover')}
                  className="text-sm font-semibold underline text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Tìm hiểu chi tiết quyền lợi StayCover</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Description Section */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xl font-serif font-bold text-[#1a1918]">
                Giới thiệu về chỗ nghỉ
              </h3>
              <div className="space-y-3 text-sm md:text-base text-[#423f3b] leading-relaxed">
                {hotel.desc.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => showToast('Đang hiển thị mô tả đầy đủ của chỗ nghỉ.')}
                className="inline-flex items-center gap-1 font-semibold text-sm underline text-[#1a1918] hover:text-[#b66d3a] transition-colors mt-2 w-fit cursor-pointer"
              >
                <span>Hiển thị thêm</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </section>

            {/* Sleeping Arrangements */}
            <section className="flex flex-col gap-4 pt-4 border-t border-[#ece5dc]">
              <h3 className="text-xl font-serif font-bold text-[#1a1918]">
                Nơi bạn sẽ ngủ
              </h3>
              <div className="border border-[#e3dcd1] bg-white rounded-xl p-5 max-w-sm flex flex-col gap-3 shadow-xs">
                <svg
                  className="w-6 h-6 text-[#1a1918]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                  <path d="M6 8v9" />
                </svg>
                <div>
                  <h4 className="font-bold text-[#1a1918] text-base">
                    Phòng ngủ chính
                  </h4>
                  <p className="text-xs sm:text-sm text-[#706a62] mt-1 leading-relaxed">
                    {hotel.sleepDesc}
                  </p>
                </div>
              </div>
            </section>

            {/* Amenities Section */}
            <section
              className="flex flex-col gap-5 pt-4 border-t border-[#ece5dc]"
              id="amenities"
            >
              <h3 className="text-xl font-serif font-bold text-[#1a1918]">
                Nơi này có những gì cho bạn?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#1a1918]">
                {[
                  {
                    name: 'Wi-Fi tốc độ cao (150 Mbps)',
                    icon: (
                      <path d="M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" />
                    ),
                  },
                  {
                    name: 'Không gian bàn làm việc chuyên dụng',
                    icon: (
                      <>
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </>
                    ),
                  },
                  {
                    name: 'TV thông minh 43" 4K (Netflix & YouTube)',
                    icon: (
                      <>
                        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                        <polyline points="17 2 12 7 7 2" />
                      </>
                    ),
                  },
                  {
                    name: 'Điều hòa không khí Inverter 2 chiều',
                    icon: (
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    ),
                  },
                  {
                    name: 'Khóa điện tử tự nhận phòng',
                    icon: (
                      <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </>
                    ),
                  },
                  {
                    name: 'Tủ lạnh mini & Ấm siêu tốc',
                    icon: (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </>
                    ),
                  },
                  {
                    name: 'Máy sấy tóc & Bàn là hơi nước',
                    icon: (
                      <>
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </>
                    ),
                  },
                  {
                    name: 'Đầu báo khói & Bình chữa cháy',
                    icon: (
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    ),
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-[#423f3b] flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {item.icon}
                    </svg>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsAmenitiesOpen(true)}
                className="mt-2 w-fit px-6 py-3 rounded-xl border border-[#1a1918] hover:bg-[#f3ede2] text-[#1a1918] font-semibold text-sm transition-colors cursor-pointer"
              >
                Hiển thị tất cả 32 tiện nghi
              </button>
            </section>

            {/* Interactive Calendar Date Picker */}
            <section
              className="flex flex-col gap-4 pt-4 border-t border-[#ece5dc]"
              id="booking-calendar"
            >
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a1918]">
                  {nights} đêm tại {hotel.city}
                </h3>
                <p className="text-sm text-[#706a62] mt-0.5">
                  {formatDateVN(checkIn)} – {formatDateVN(checkOut)}
                </p>
              </div>

              <div className="border border-[#e3dcd1] bg-white rounded-2xl p-5 md:p-6 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tháng 11 năm 2026 */}
                  <div>
                    <div className="font-bold text-[#1a1918] text-sm text-center mb-3">
                      Tháng 11 năm 2026
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#706a62] mb-2">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span>CN</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {/* Leading 6 blanks for Nov 1 being Sunday */}
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                        const dayStr = day < 10 ? `0${day}` : `${day}`
                        const fullDate = `2026-11-${dayStr}`
                        const isPast = day < 13
                        const isSelected =
                          fullDate === checkIn || fullDate === checkOut
                        const isInRange =
                          fullDate > checkIn && fullDate < checkOut

                        return (
                          <button
                            key={fullDate}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleDateClick(fullDate)}
                            className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                              isPast
                                ? 'text-[#948d84] opacity-35 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#1a1918] text-white font-bold shadow-xs'
                                  : isInRange
                                    ? 'bg-[#f8eee6] text-[#b66d3a] font-semibold'
                                    : 'text-[#1a1918] hover:border hover:border-[#1a1918]'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tháng 12 năm 2026 */}
                  <div>
                    <div className="font-bold text-[#1a1918] text-sm text-center mb-3">
                      Tháng 12 năm 2026
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#706a62] mb-2">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span>CN</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {/* Dec 1 starts on Tuesday = 1 blank */}
                      <span />
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const dayStr = day < 10 ? `0${day}` : `${day}`
                        const fullDate = `2026-12-${dayStr}`
                        const isSelected =
                          fullDate === checkIn || fullDate === checkOut
                        const isInRange =
                          fullDate > checkIn && fullDate < checkOut

                        return (
                          <button
                            key={fullDate}
                            type="button"
                            onClick={() => handleDateClick(fullDate)}
                            className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#1a1918] text-white font-bold shadow-xs'
                                : isInRange
                                  ? 'bg-[#f8eee6] text-[#b66d3a] font-semibold'
                                  : 'text-[#1a1918] hover:border hover:border-[#1a1918]'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#ece5dc] flex justify-end">
                  <button
                    type="button"
                    onClick={resetDefaultDates}
                    className="text-xs font-bold underline text-[#706a62] hover:text-[#1a1918] transition-colors cursor-pointer"
                  >
                    Đặt lại ngày mặc định
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ─── RIGHT COLUMN: STICKY BOOKING RAIL ─── */}
          <aside className="lg:col-span-5 xl:col-span-4 relative" data-od-id="booking-rail">
            <div className="sticky top-20 bg-white border border-[#e3dcd1] rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              {/* Price & Rating Header */}
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-2xl font-bold text-[#A8532A]">
                    {formatVND(hotel.price)}
                  </span>
                  <span className="text-sm text-[#706a62] ml-1">/ đêm</span>
                </div>
                <div className="text-xs font-semibold text-[#1a1918]">
                  <span>★ {hotel.rating.toFixed(2)}</span>
                  <span className="text-[#706a62] ml-1">
                    · {hotel.reviews} đánh giá
                  </span>
                </div>
              </div>

              {/* Date & Guest Input Box */}
              <div className="border border-[#e3dcd1] rounded-xl overflow-hidden text-left">
                <div className="grid grid-cols-2 divide-x divide-[#e3dcd1] border-b border-[#e3dcd1]">
                  <button
                    type="button"
                    onClick={() => scrollTo('booking-calendar')}
                    className="p-3 text-left hover:bg-[#fbf9f5] transition-colors cursor-pointer"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#706a62]">
                      Nhận phòng
                    </div>
                    <div className="text-sm font-semibold text-[#1a1918] mt-0.5">
                      {formatDateSlash(checkIn)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo('booking-calendar')}
                    className="p-3 text-left hover:bg-[#fbf9f5] transition-colors cursor-pointer"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#706a62]">
                      Trả phòng
                    </div>
                    <div className="text-sm font-semibold text-[#1a1918] mt-0.5">
                      {formatDateSlash(checkOut)}
                    </div>
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGuestsOpen(!isGuestsOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[#fbf9f5] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#706a62]">
                        Khách
                      </div>
                      <div className="text-sm font-semibold text-[#1a1918] mt-0.5">
                        {guestsLabel}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#706a62] transition-transform ${
                        isGuestsOpen ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Guest Dropdown */}
                  {isGuestsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e3dcd1] rounded-xl p-4 shadow-xl z-30 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-[#1a1918]">
                            Người lớn
                          </div>
                          <div className="text-xs text-[#706a62]">
                            Từ 13 tuổi trở lên
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={adults <= 1}
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="w-8 h-8 rounded-full border border-[#e3dcd1] flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#1a1918]"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {adults}
                          </span>
                          <button
                            type="button"
                            disabled={adults >= 4}
                            onClick={() => setAdults(Math.min(4, adults + 1))}
                            className="w-8 h-8 rounded-full border border-[#e3dcd1] flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#1a1918]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-[#1a1918]">
                            Trẻ em
                          </div>
                          <div className="text-xs text-[#706a62]">
                            Độ tuổi 2 – 12
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={children <= 0}
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="w-8 h-8 rounded-full border border-[#e3dcd1] flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#1a1918]"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {children}
                          </span>
                          <button
                            type="button"
                            disabled={children >= 2}
                            onClick={() => setChildren(Math.min(2, children + 1))}
                            className="w-8 h-8 rounded-full border border-[#e3dcd1] flex items-center justify-center text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#1a1918]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right pt-2 border-t border-[#ece5dc]">
                        <button
                          type="button"
                          onClick={() => setIsGuestsOpen(false)}
                          className="text-xs font-bold underline text-[#1a1918] hover:text-[#b66d3a]"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={() => setIsReserveOpen(true)}
                className="w-full bg-[#b66d3a] hover:bg-[#9e5b2c] active:bg-[#884b21] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md text-center cursor-pointer"
                data-od-id="btn-reserve-main"
              >
                Đặt phòng
              </button>

              <div className="text-center text-xs text-[#706a62]">
                Bạn vẫn chưa bị trừ tiền
              </div>

              {/* Price Calculation Breakdown */}
              <div className="flex flex-col gap-2.5 text-sm text-[#423f3b] pt-2 border-t border-[#ece5dc]">
                <div className="flex items-center justify-between">
                  <span className="underline">
                    {formatVND(hotel.price)} x {nights} đêm
                  </span>
                  <span>{formatVND(roomSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="underline">Phí vệ sinh chỗ nghỉ</span>
                  <span>{formatVND(cleaningFee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="underline">Phí dịch vụ StayHub</span>
                  <span>{formatVND(serviceFee)}</span>
                </div>
                <div className="flex items-center justify-between text-[#2a583e] font-medium">
                  <span>Ưu đãi đặt sớm (StaySmart)</span>
                  <span>-{formatVND(discount)}</span>
                </div>

                <div className="border-t border-[#ece5dc] my-1" />

                <div className="flex items-center justify-between text-base font-bold text-[#1a1918]">
                  <span>Tổng trước thuế</span>
                  <span className="text-[#A8532A] text-lg font-bold">
                    {formatVND(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() =>
                  showToast(
                    'Cảm ơn bạn! Đội ngũ kiểm duyệt StayHub luôn sẵn sàng lắng nghe.',
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-[#706a62] hover:text-[#1a1918] transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>Báo cáo chỗ nghỉ này</span>
              </button>
            </div>
          </aside>
        </div>

        {/* ─── REVIEWS SECTION ─── */}
        <section
          className="mt-14 pt-10 border-t border-[#ece5dc]"
          id="reviews"
          data-od-id="reviews-section"
        >
          <div className="flex items-center gap-2 text-2xl font-serif font-bold text-[#1a1918] mb-6">
            <svg
              className="w-6 h-6 text-[#df8a15] fill-current"
              viewBox="0 0 24 24"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>
              {hotel.rating.toFixed(2)} · {hotel.reviews} đánh giá
            </span>
          </div>

          {/* Category Rating Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3.5 mb-8 text-sm">
            {[
              { label: 'Mức độ sạch sẽ', val: '4.9', width: '98%' },
              { label: 'Độ chính xác', val: '4.9', width: '98%' },
              { label: 'Giao tiếp', val: '5.0', width: '100%' },
              { label: 'Vị trí', val: '4.8', width: '96%' },
              { label: 'Nhận phòng', val: '5.0', width: '100%' },
              { label: 'Giá trị tương xứng', val: '4.9', width: '98%' },
            ].map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="w-40 text-[#423f3b]">{cat.label}</span>
                <div className="flex-1 bg-[#ece5dc] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1a1918] h-full rounded-full"
                    style={{ width: cat.width }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-[#1a1918] text-xs">
                  {cat.val}
                </span>
              </div>
            ))}
          </div>

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/client/hoian.jpg"
                  alt="Hương Lan"
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <h5 className="font-bold text-[#1a1918] text-sm">Hương Lan</h5>
                  <p className="text-xs text-[#706a62]">
                    Hà Nội, Việt Nam · Đã ở 3 đêm
                  </p>
                </div>
              </div>
              <div className="text-xs text-[#706a62]">
                ★★★★★ · Tháng 10 năm 2026
              </div>
              <p className="text-sm text-[#423f3b] leading-relaxed">
                "Phòng xinh xắn, sạch sẽ ngoài mong đợi. Mình đi công tác 3 ngày và
                cực kỳ thích chiếc bàn làm việc với ghế công thái học, Wi-Fi mượt mà
                không bị ngắt quãng. Cửa khóa thông minh tự nhận phòng rất nhanh và
                tiện."
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/client/dalat.jpg"
                  alt="Alexandre M."
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <h5 className="font-bold text-[#1a1918] text-sm">Alexandre M.</h5>
                  <p className="text-xs text-[#706a62]">
                    Paris, Pháp · Đã ở 5 đêm
                  </p>
                </div>
              </div>
              <div className="text-xs text-[#706a62]">
                ★★★★★ · Tháng 10 năm 2026
              </div>
              <p className="text-sm text-[#423f3b] leading-relaxed">
                "The place was perfect for my solo trip. Quiet neighborhood, walking
                distance to local markets and amazing specialty coffee shops. The
                hosts were super responsive, kind, and helpful throughout my stay."
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/client/phuquoc.jpg"
                  alt="Tuấn Kiệt"
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <h5 className="font-bold text-[#1a1918] text-sm">Tuấn Kiệt</h5>
                  <p className="text-xs text-[#706a62]">
                    Đà Nẵng, Việt Nam · Đã ở 2 đêm
                  </p>
                </div>
              </div>
              <div className="text-xs text-[#706a62]">
                ★★★★★ · Tháng 9 năm 2026
              </div>
              <p className="text-sm text-[#423f3b] leading-relaxed">
                "Không gian được bài trí tinh tế, ánh sáng buổi sáng rọi vào phòng
                rất thư thái. Đệm êm, phòng tắm nước nóng mạnh và thơm mùi tinh dầu
                thảo mộc dịu nhẹ. Chắc chắn sẽ quay lại!"
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/client/glamping.jpg"
                  alt="Minh Thảo"
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <h5 className="font-bold text-[#1a1918] text-sm">Minh Thảo</h5>
                  <p className="text-xs text-[#706a62]">
                    TP. Hồ Chí Minh · Đã ở 1 đêm
                  </p>
                </div>
              </div>
              <div className="text-xs text-[#706a62]">
                ★★★★★ · Tháng 9 năm 2026
              </div>
              <p className="text-sm text-[#423f3b] leading-relaxed">
                "Mình chọn chỗ nghỉ cho một ngày nghỉ ngơi và làm việc đổi gió. Mọi
                góc nhỏ đều chỉn chu, có trà thảo mộc thơm và sách tuyển chọn rất có
                gu. Cảm ơn chủ nhà chu đáo."
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              showToast('Hiển thị đầy đủ đánh giá của khách đã xác thực.')
            }
            className="px-6 py-3 rounded-xl border border-[#1a1918] hover:bg-[#f3ede2] text-[#1a1918] font-semibold text-sm transition-colors cursor-pointer"
          >
            Hiển thị tất cả {hotel.reviews} đánh giá
          </button>
        </section>

        {/* ─── LOCATION & NEIGHBORHOOD ─── */}
        <section
          className="mt-14 pt-10 border-t border-[#ece5dc]"
          id="location"
          data-od-id="location-section"
        >
          <h3 className="text-2xl font-serif font-bold text-[#1a1918] mb-1">
            Nơi bạn sẽ đến
          </h3>
          <p className="text-sm text-[#706a62] mb-5">{hotel.location}</p>

          {/* Map Graphic Mockup Card */}
          <div className="relative rounded-2xl overflow-hidden border border-[#e3dcd1] shadow-xs bg-[#f0ede6] h-[340px] md:h-[400px]">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 800 400"
              preserveAspectRatio="xMidYMid slice"
            >
              <rect width="800" height="400" fill="#f0ede6" />
              <path
                d="M-50,200 Q200,180 400,210 T850,190"
                stroke="#ffffff"
                strokeWidth="24"
                fill="none"
              />
              <path
                d="M250,-50 L280,450"
                stroke="#ffffff"
                strokeWidth="18"
                fill="none"
              />
              <path
                d="M520,-50 L500,450"
                stroke="#ffffff"
                strokeWidth="18"
                fill="none"
              />
              <path
                d="M-50,320 L850,300"
                stroke="#ffffff"
                strokeWidth="14"
                fill="none"
              />
              <path
                d="M-50,80 L850,110"
                stroke="#ffffff"
                strokeWidth="12"
                fill="none"
              />
              {/* River curve */}
              <path
                d="M680,-50 Q600,150 720,280 T850,450"
                stroke="#d5e8f0"
                strokeWidth="48"
                fill="none"
              />
              {/* Green parks */}
              <rect x="80" y="40" width="120" height="90" rx="8" fill="#dce6d5" />
              <rect
                x="340"
                y="260"
                width="110"
                height="80"
                rx="8"
                fill="#dce6d5"
              />
            </svg>

            {/* Custom Location Pin Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#b66d3a]/25 animate-ping absolute" />
                <div className="w-12 h-12 rounded-full bg-[#b66d3a] text-white flex items-center justify-center shadow-lg relative border-2 border-white">
                  <svg
                    className="w-6 h-6 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="font-bold text-[#1a1918] text-base mb-1">
              Khu vực {hotel.city}
            </h4>
            <p className="text-sm text-[#423f3b] leading-relaxed max-w-3xl">
              Tọa lạc tại khu vực trung tâm đắc địa – vừa liền kề các tuyến đường ẩm
              thực địa phương sôi động, vừa giữ được sự tĩnh lặng hiếm có trong con
              hẻm dân cư văn minh. Cách các điểm tham quan 5–10 phút đi bộ, xung
              quanh có vô số quán cà phê specialty, hiệu bánh thủ công và cửa hàng
              tiện lợi 24/7.
            </p>
          </div>
        </section>

        {/* ─── HOST PROFILE SECTION ─── */}
        <section
          className="mt-14 pt-10 border-t border-[#ece5dc]"
          id="host"
          data-od-id="host-section"
        >
          <div className="border border-[#e3dcd1] rounded-2xl p-6 md:p-8 bg-white grid grid-cols-1 md:grid-cols-12 gap-8 shadow-xs">
            {/* Left Host Badge */}
            <div className="md:col-span-5 flex flex-col items-center text-center p-6 bg-[#f8eee6] rounded-xl">
              <img
                src={hotel.hostAvatar}
                alt={hotel.hostName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-[#e3dcd1]"
              />
              <div className="font-bold text-xl text-[#1a1918] mt-3">
                {hotel.hostName}
              </div>
              <div className="text-xs text-[#706a62] mt-0.5 font-medium">
                Chủ nhà siêu cấp · 3 năm đón khách
              </div>

              <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-5 border-t border-[#e3dcd1] text-center">
                <div>
                  <div className="text-lg font-bold text-[#1a1918]">450</div>
                  <div className="text-[11px] text-[#706a62]">Đánh giá</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#1a1918]">4.95★</div>
                  <div className="text-[11px] text-[#706a62]">Xếp hạng</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#1a1918]">3</div>
                  <div className="text-[11px] text-[#706a62]">Năm đón khách</div>
                </div>
              </div>
            </div>

            {/* Right Host Bio */}
            <div className="md:col-span-7 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xl font-serif font-bold text-[#1a1918] mb-2">
                  Gặp gỡ chủ nhà của bạn
                </h4>
                <p className="text-sm md:text-base text-[#423f3b] leading-relaxed italic mb-4">
                  "{hotel.hostBio}"
                </p>

                <div className="flex items-start gap-2.5 text-xs text-[#423f3b] mb-3">
                  <svg
                    className="w-4 h-4 text-[#df8a15] fill-current flex-shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>
                    <strong>Chủ nhà siêu cấp:</strong> Người có nhiều kinh nghiệm,
                    được đánh giá cao và cam kết mang lại kỳ nghỉ tuyệt vời cho khách.
                  </span>
                </div>

                <p className="text-xs text-[#706a62]">
                  Tỷ lệ phản hồi: <strong>100%</strong> · Thời gian phản hồi:{' '}
                  <strong>trong vòng 1 giờ</strong>
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    showToast('Hộp thư tin nhắn với chủ nhà đã sẵn sàng!')
                  }
                  className="px-6 py-3 rounded-xl border border-[#1a1918] hover:bg-[#1a1918] hover:text-white text-[#1a1918] font-semibold text-sm transition-all cursor-pointer"
                >
                  Nhắn tin cho chủ nhà
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── THINGS TO KNOW & HELP ARTICLES ─── */}
        <section
          className="mt-14 pt-10 border-t border-[#ece5dc]"
          id="help-articles"
          data-od-id="things-to-know"
          aria-labelledby="things-to-know-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
            <div>
              <h3
                id="things-to-know-heading"
                className="text-2xl sm:text-3xl font-serif font-bold text-[#1a1918] m-0"
              >
                Những điều cần biết
              </h3>
              <p className="text-sm text-[#706a62] mt-1.5 mb-0 max-w-2xl leading-relaxed">
                Thông tin quy định nhận phòng, trang bị an toàn và điều kiện hủy đặt phòng áp dụng tại {hotel.title}.
              </p>
            </div>
            <span className="text-xs text-[#8c827a] font-medium shrink-0">
              Cập nhật cho kỳ nghỉ {nights} đêm của bạn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* Cột 1: Quy định chung */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#faf7f2] border border-[#ede5d8]">
              <div>
                <h4 className="font-bold text-[#1a1918] text-base mb-3.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#b66d3a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Quy định chung</span>
                </h4>

                <div className="space-y-3 text-[#423f3b] leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="font-semibold text-[#1a1918] shrink-0 w-24">Nhận phòng:</span>
                    <span>Sau 14:00 (Linh hoạt)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-semibold text-[#1a1918] shrink-0 w-24">Trả phòng:</span>
                    <span>Trước 11:00</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-semibold text-[#1a1918] shrink-0 w-24">Vào phòng:</span>
                    <span>Khóa điện tử tự động</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-semibold text-[#1a1918] shrink-0 w-24">Hạn chế:</span>
                    <span className="text-[#843e18] font-medium">Không hút thuốc · Không tiệc tùng ồn ào</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#e8dfd3]">
                <button
                  type="button"
                  onClick={() => setActiveHelpArticle('rules')}
                  className="text-sm font-semibold underline text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Xem nội quy phòng chi tiết</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Cột 2: An toàn & Chỗ nghỉ */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#faf7f2] border border-[#ede5d8]">
              <div>
                <h4 className="font-bold text-[#1a1918] text-base mb-3.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#b66d3a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>An toàn &amp; Chỗ nghỉ</span>
                </h4>

                <div className="space-y-3 text-[#423f3b] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-[#0b5f53] font-bold shrink-0">✓</span>
                    <div>
                      <strong className="text-[#1a1918]">Đầu báo khói độc lập:</strong>
                      <span className="block text-xs text-[#706a62]">Trang bị trong phòng và hành lang</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#0b5f53] font-bold shrink-0">✓</span>
                    <div>
                      <strong className="text-[#1a1918]">Bình chữa cháy khẩn cấp:</strong>
                      <span className="block text-xs text-[#706a62]">Bố trí tại cửa thoát hiểm mỗi tầng</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#0b5f53] font-bold shrink-0">✓</span>
                    <div>
                      <strong className="text-[#1a1918]">An ninh &amp; Khóa số:</strong>
                      <span className="block text-xs text-[#706a62]">Camera sảnh chung và khóa thẻ từ 2 lớp</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#e8dfd3]">
                <button
                  type="button"
                  onClick={() => setActiveHelpArticle('safety')}
                  className="text-sm font-semibold underline text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Xem hướng dẫn an toàn</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Cột 3: Chính sách hủy phòng */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#faf7f2] border border-[#ede5d8]">
              <div>
                <h4 className="font-bold text-[#1a1918] text-base mb-3.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#b66d3a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Chính sách hủy phòng</span>
                </h4>

                <div className="space-y-3 text-[#423f3b] leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-[#f0e9df] border border-[#e0d5c5]">
                    <div className="font-semibold text-[#1a1918] text-xs flex items-center justify-between">
                      <span>Hủy miễn phí</span>
                      <span className="text-[#0b5f53] font-bold">100% hoàn phí</span>
                    </div>
                    <p className="text-xs text-[#706a62] m-0 mt-0.5">
                      Áp dụng trong vòng 48 giờ sau khi đặt phòng thành công.
                    </p>
                  </div>

                  <div className="text-xs space-y-1.5 text-[#5f5b55]">
                    <div className="flex items-baseline justify-between gap-1">
                      <span>Sau 48h đến trước nhận phòng 5 ngày:</span>
                      <strong className="text-[#1a1918] shrink-0">Hoàn 50%</strong>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span>Trong vòng 48h trước nhận phòng:</span>
                      <strong className="text-[#843e18] shrink-0">Không hoàn tiền</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#e8dfd3]">
                <button
                  type="button"
                  onClick={() => setActiveHelpArticle('cancellation')}
                  className="text-sm font-semibold underline text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Chi tiết điều khoản hoàn hủy</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── MOBILE BOTTOM RESERVE BAR (< md:hidden) ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e3dcd1] p-4 flex md:hidden items-center justify-between shadow-lg"
        data-od-id="mobile-bottom-bar"
      >
        <div>
          <div className="text-base font-bold text-[#A8532A]">
            {formatVND(hotel.price)}{' '}
            <span className="text-xs text-[#706a62] font-normal">/ đêm</span>
          </div>
          <button
            type="button"
            onClick={() => scrollTo('booking-calendar')}
            className="text-xs text-[#706a62] underline text-left"
          >
            {formatDateVN(checkIn).split(',')[0]} – {formatDateVN(checkOut).split(',')[0]}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsReserveOpen(true)}
          className="bg-[#b66d3a] hover:bg-[#9e5b2c] active:bg-[#884b21] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-sm cursor-pointer"
        >
          Đặt phòng
        </button>
      </div>

      {/* ─── FULLSCREEN PHOTO GALLERY LIGHTBOX MODAL ─── */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#fbf9f5] flex flex-col overflow-y-auto"
          data-od-id="gallery-modal"
        >
          <div className="sticky top-0 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-[#e3dcd1] px-4 md:px-8 py-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={() => setIsGalleryOpen(false)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Đóng bộ sưu tập</span>
            </button>
            <div className="text-sm font-bold text-[#1a1918]">
              {hotel.photos.length} ảnh chất lượng cao
            </div>
            <button
              type="button"
              onClick={handleShareClick}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a1918] hover:text-[#b66d3a] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
            {hotel.photos.map((photo, index) => (
              <div key={index} className="flex flex-col gap-2">
                <img
                  src={photo}
                  alt={`${hotel.title} ảnh ${index + 1}`}
                  className="w-full rounded-2xl object-cover max-h-[600px] shadow-sm border border-[#e3dcd1]"
                />
                <div className="text-xs sm:text-sm text-[#706a62]">
                  Ảnh {index + 1} / {hotel.photos.length} — Không gian thực tế tại{' '}
                  {hotel.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ALL AMENITIES MODAL ─── */}
      {isAmenitiesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAmenitiesOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsAmenitiesOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f3ede2] flex items-center justify-center text-[#706a62] hover:text-[#1a1918] transition-colors cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-2xl font-serif font-bold text-[#1a1918] mb-6">
              Tiện nghi chỗ nghỉ
            </h3>

            <div className="space-y-6 text-sm text-[#1a1918]">
              <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b border-[#ece5dc]">
                  Không gian làm việc & Giải trí
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#423f3b]">
                  <div>✓ Wi-Fi tốc độ cao 150 Mbps</div>
                  <div>✓ Bàn làm việc & ghế công thái học</div>
                  <div>✓ Smart TV 43" 4K HDR</div>
                  <div>✓ Tài khoản Netflix & Youtube Premium</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b border-[#ece5dc]">
                  Phòng ngủ & Giặt ủi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#423f3b]">
                  <div>✓ Giường đệm cao su tự nhiên cao cấp</div>
                  <div>✓ Ga trải giường cotton 100%</div>
                  <div>✓ Rèm chắn sáng tuyệt đối</div>
                  <div>✓ Máy giặt & sấy hiện đại</div>
                  <div>✓ Bàn là hơi nước & móc treo quần áo</div>
                  <div>✓ Máy sấy tóc công suất lớn</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b border-[#ece5dc]">
                  Bếp & Ăn uống
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#423f3b]">
                  <div>✓ Tủ lạnh mini Electrolux</div>
                  <div>✓ Ấm đun nước siêu tốc</div>
                  <div>✓ Cốc, ly và bộ thìa nĩa inox</div>
                  <div>✓ Trà thảo mộc & cà phê phin chào đón</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b border-[#ece5dc]">
                  An toàn & Bảo mật
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#423f3b]">
                  <div>✓ Khóa cửa số tự nhận phòng 24/7</div>
                  <div>✓ Đầu báo khói thông minh</div>
                  <div>✓ Bình chữa cháy đạt chuẩn PCCC</div>
                  <div>✓ Hộp sơ cứu y tế gia đình</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESERVATION CONFIRMATION DIALOG ─── */}
      {isReserveOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsReserveOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsReserveOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f3ede2] flex items-center justify-center text-[#706a62] hover:text-[#1a1918] transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="text-xs font-bold text-[#b66d3a] uppercase tracking-wider mb-1">
              Xác nhận yêu cầu đặt chỗ
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#1a1918] mb-4">
              {hotel.title}
            </h3>

            <div className="bg-[#f8eee6] p-4 rounded-xl mb-4 text-sm flex flex-col gap-2 border border-[#e3dcd1]">
              <div className="flex justify-between">
                <span className="text-[#706a62]">Thời gian:</span>
                <strong className="text-[#1a1918]">
                  {formatDateVN(checkIn)} – {formatDateVN(checkOut)} ({nights} đêm)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#706a62]">Số khách:</span>
                <strong className="text-[#1a1918]">{guestsLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#706a62]">Nhận phòng:</span>
                <strong className="text-[#1a1918]">Tự nhận phòng sau 14:00</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#e3dcd1]">
                <span className="font-semibold text-[#1a1918]">Tổng thanh toán:</span>
                <strong className="text-[#A8532A] text-xl font-bold">
                  {formatVND(grandTotal)}
                </strong>
              </div>
            </div>

            <p className="text-xs text-[#706a62] leading-relaxed mb-6">
              Bằng việc nhấp "Xác nhận & Đặt phòng", bạn đồng ý với Quy định nhà của Chủ
              nhà, Chính sách hủy phòng và Thỏa thuận dịch vụ khách của StayHub.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsReserveOpen(false)
                showToast(
                  '🎉 Đặt phòng thành công! Chủ nhà sẽ liên hệ hỗ trợ bạn nhận phòng.',
                )
              }}
              className="w-full bg-[#b66d3a] hover:bg-[#9e5b2c] active:bg-[#884b21] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md cursor-pointer"
            >
              Xác nhận & Đặt phòng
            </button>
          </div>
        </div>
      )}

      {/* ─── HELP ARTICLE / POLICY DETAIL MODAL ─── */}
      {activeHelpArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveHelpArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpArticleModalTitle"
        >
          <div
            className="bg-[#fdfbf7] border border-[#e3dcd1] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveHelpArticle(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#ede5d8] flex items-center justify-center text-[#706a62] hover:text-[#1a1918] transition-colors cursor-pointer"
              aria-label="Đóng bài viết"
            >
              ✕
            </button>

            {/* Content for: House Rules */}
            {activeHelpArticle === 'rules' && (
              <article className="space-y-5 text-[#34302c]">
                <div className="border-b border-[#e8dfd3] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b66d3a]">
                    Hướng dẫn lưu trú
                  </span>
                  <h3 id="helpArticleModalTitle" className="text-2xl font-serif font-bold text-[#1a1918] mt-1 mb-0">
                    Nội quy &amp; Quy định chỗ nghỉ
                  </h3>
                  <p className="text-xs text-[#706a62] mt-1 mb-0">
                    Áp dụng cho tất cả khách lưu trú tại {hotel.title}
                  </p>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">1. Thời gian nhận &amp; trả phòng</h4>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Giờ nhận phòng tiêu chuẩn:</strong> Từ 14:00. Bạn có thể tự nhận phòng bất kỳ lúc nào bằng mã khóa điện tử thông minh gửi qua email/tin nhắn trước ngày check-in.
                    </p>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Giờ trả phòng tiêu chuẩn:</strong> Trước 11:00. Vui lòng đóng chặt cửa và để chìa khóa phụ (nếu có) vào hộp an toàn khi rời đi.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">2. Quy định trong thời gian lưu trú</h4>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Không hút thuốc:</strong> Nghiêm cấm hút thuốc lá và thuốc lá điện tử bên trong toàn bộ không gian phòng nghỉ. Khách vi phạm sẽ chịu phí vệ sinh chuyên sâu 2.000.000₫.
                    </p>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Khung giờ yên tĩnh:</strong> Từ 22:00 đến 08:00 sáng hôm sau. Vui lòng giữ âm lượng vừa phải nhằm tôn trọng sự yên bình của các phòng lân cận.
                    </p>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Tiệc tùng &amp; Sự kiện:</strong> Không cho phép tụ tập đông người, mở nhạc công suất lớn hoặc tổ chức sự kiện khi chưa có thỏa thuận trước bằng văn bản với chủ nhà.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">3. Số lượng khách &amp; Thú cưng</h4>
                    <p className="m-0 text-[#55504a]">
                      • Số lượng khách tối đa phải tuân theo số lượng đã đăng ký khi đặt phòng ({hotel.specs[0] || 'theo sức chứa phòng'}). Khách phát sinh cần thông báo và phụ thu theo quy định cơ sở.
                    </p>
                  </section>
                </div>
              </article>
            )}

            {/* Content for: Safety */}
            {activeHelpArticle === 'safety' && (
              <article className="space-y-5 text-[#34302c]">
                <div className="border-b border-[#e8dfd3] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b66d3a]">
                    An toàn &amp; Khẩn cấp
                  </span>
                  <h3 id="helpArticleModalTitle" className="text-2xl font-serif font-bold text-[#1a1918] mt-1 mb-0">
                    Hướng dẫn an toàn &amp; Tiện ích khẩn cấp
                  </h3>
                  <p className="text-xs text-[#706a62] mt-1 mb-0">
                    Các biện pháp bảo vệ sự an toàn tối đa cho kỳ nghỉ của bạn
                  </p>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">1. Thiết bị phòng cháy &amp; Báo khói</h4>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Đầu báo khói quang học:</strong> Được lắp đặt tại phòng khách, phòng ngủ và trần hành lang, hoạt động liên tục 24/24.
                    </p>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Bình bọt chữa cháy:</strong> Trang bị sẵn tại góc hành lang mỗi tầng và gần cửa cầu thang thoát hiểm.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">2. An ninh &amp; Giám sát</h4>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Khóa thẻ từ và mã số bảo mật:</strong> Mã số mở cửa được tạo riêng cho từng lượt khách và tự động vô hiệu hóa sau giờ trả phòng.
                    </p>
                    <p className="m-0 text-[#55504a]">
                      • <strong>Camera an ninh:</strong> Chỉ được lắp đặt ở lối vào chính và sảnh sinh hoạt chung nhằm bảo đảm an ninh; tuyệt đối không có camera trong không gian phòng riêng tư.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">3. Đường dây liên lạc khẩn cấp</h4>
                    <div className="bg-[#f5efe6] p-3 rounded-xl border border-[#e3dcd1] text-xs space-y-1">
                      <div>• Cấp cứu y tế: <strong>115</strong> | Cứu hỏa: <strong>114</strong> | Công an: <strong>113</strong></div>
                      <div>• Hotline hỗ trợ StayHub: <strong>1900 8888</strong> (Phục vụ 24/7)</div>
                    </div>
                  </section>
                </div>
              </article>
            )}

            {/* Content for: Cancellation Policy */}
            {activeHelpArticle === 'cancellation' && (
              <article className="space-y-5 text-[#34302c]">
                <div className="border-b border-[#e8dfd3] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b66d3a]">
                    Chính sách đặt chỗ
                  </span>
                  <h3 id="helpArticleModalTitle" className="text-2xl font-serif font-bold text-[#1a1918] mt-1 mb-0">
                    Chính sách hoàn hủy chi tiết
                  </h3>
                  <p className="text-xs text-[#706a62] mt-1 mb-0">
                    Linh hoạt và minh bạch theo tiêu chuẩn bảo vệ quyền lợi người đặt
                  </p>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="bg-[#edf6f2] border border-[#bcd8cf] rounded-xl p-4">
                    <div className="font-bold text-[#08473e] text-sm mb-1">
                      ✓ Miễn phí hủy trong vòng 48 giờ
                    </div>
                    <p className="text-xs text-[#344a44] m-0">
                      Nếu đặt phòng trước ngày nhận phòng từ 14 ngày trở lên, bạn có 48 giờ để hủy hoàn toàn miễn phí và nhận lại 100% tiền phòng.
                    </p>
                  </div>

                  <section className="space-y-2">
                    <h4 className="font-bold text-[#1a1918] text-sm m-0">Thời gian biểu hoàn tiền</h4>
                    <div className="space-y-2 text-xs text-[#55504a]">
                      <div className="flex items-start justify-between p-2.5 rounded-lg bg-[#f8f4ed] border border-[#e8dfd3]">
                        <div>
                          <strong className="text-[#1a1918] block">Hủy trước 7 ngày nhận phòng:</strong>
                          <span>Nhận lại 100% tiền phòng trừ phí dịch vụ xử lý giao dịch.</span>
                        </div>
                        <span className="font-bold text-[#0b5f53] shrink-0 text-sm">Hoàn 100%</span>
                      </div>
                      <div className="flex items-start justify-between p-2.5 rounded-lg bg-[#f8f4ed] border border-[#e8dfd3]">
                        <div>
                          <strong className="text-[#1a1918] block">Hủy từ 48 giờ đến 7 ngày trước nhận phòng:</strong>
                          <span>Nhận lại 50% tổng số tiền đã thanh toán cho toàn bộ kỳ nghỉ.</span>
                        </div>
                        <span className="font-bold text-[#b66d3a] shrink-0 text-sm">Hoàn 50%</span>
                      </div>
                      <div className="flex items-start justify-between p-2.5 rounded-lg bg-[#f8f4ed] border border-[#e8dfd3]">
                        <div>
                          <strong className="text-[#1a1918] block">Hủy dưới 48 giờ hoặc vắng mặt (No-show):</strong>
                          <span>Không hoàn tiền đối với các đêm đã đặt nhằm bù đắp chi phí giữ chỗ của chủ nhà.</span>
                        </div>
                        <span className="font-bold text-[#9b2c22] shrink-0 text-sm">Không hoàn</span>
                      </div>
                    </div>
                  </section>
                </div>
              </article>
            )}

            {/* Content for: StayCover */}
            {activeHelpArticle === 'staycover' && (
              <article className="space-y-5 text-[#34302c]">
                <div className="border-b border-[#e8dfd3] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#b66d3a]">
                    Chương trình bảo vệ độc quyền
                  </span>
                  <h3 id="helpArticleModalTitle" className="text-2xl font-serif font-bold text-[#1a1918] mt-1 mb-0">
                    Bảo đảm đặt phòng StayCover
                  </h3>
                  <p className="text-xs text-[#706a62] mt-1 mb-0">
                    Bảo vệ toàn diện được tích hợp miễn phí trong mọi đặt phòng StayHub
                  </p>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p className="text-[#423f3b] m-0">
                    StayCover là cam kết độc quyền của StayHub nhằm đem đến sự an tâm tuyệt đối cho khách lưu trú từ khoảnh khắc xác nhận đến lúc trả phòng:
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#f8f4ed] border border-[#e3dcd1]">
                      <strong className="text-[#1a1918] block mb-1">1. Bảo đảm chủ nhà không hủy bất ngờ</strong>
                      <p className="text-xs text-[#706a62] m-0">
                        Nếu chủ nhà hủy phòng trong vòng 30 ngày trước giờ check-in, StayHub sẽ tìm cho bạn một chỗ nghỉ tương đương hoặc tốt hơn, hoặc hoàn lại 100% chi phí.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f8f4ed] border border-[#e3dcd1]">
                      <strong className="text-[#1a1918] block mb-1">2. Bảo đảm phòng đúng thực tế mô tả</strong>
                      <p className="text-xs text-[#706a62] m-0">
                        Nếu nhận phòng và phát hiện cơ sở vật chất bị thiếu hụt nghiêm trọng hoặc sai lệch so với bài đăng, đội ngũ hỗ trợ sẽ can thiệp xử lý trong vòng 2 giờ.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f8f4ed] border border-[#e3dcd1]">
                      <strong className="text-[#1a1918] block mb-1">3. Đường dây an toàn 24/7</strong>
                      <p className="text-xs text-[#706a62] m-0">
                        Luôn có chuyên viên chăm sóc khách hàng túc trực hỗ trợ giải quyết mọi thắc mắc trong suốt chuyến đi.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t border-[#e8dfd3] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveHelpArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-[#1a1918] hover:bg-[#34302c] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Đã hiểu &amp; Đóng bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION PILL ─── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1918] text-white px-5 py-3 rounded-full text-sm font-medium shadow-2xl animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
