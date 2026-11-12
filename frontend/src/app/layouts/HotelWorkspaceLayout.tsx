import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Result, Tooltip } from 'antd'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { PageLoading } from '@/shared/ui/PageLoading'
import {
  HotelStatusBadge,
  HotelSwitcher,
  HotelWorkspaceProvider,
  useManagementHotelDetailQuery,
  useHotelImagesQuery,
} from '@/features/hotels'
import { useManagementRoomTypesQuery } from '@/features/rooms'
import { HOTEL_WORKSPACE_NAV_ITEMS } from '@/config/navigation.config'

interface HotelWorkspaceNavProps {
  hotelId: string
  hotel: {
    imageCount?: number
    roomTypes?: unknown[]
  }
}

function HotelWorkspaceNav({ hotelId, hotel }: HotelWorkspaceNavProps) {
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = navRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = navRef.current
    if (!el) return

    updateScrollState()

    const onScroll = () => updateScrollState()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateScrollState)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState()
      })
      resizeObserver.observe(el)
    }

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver?.disconnect()
    }
  }, [updateScrollState])

  // Tự động cuộn tab active vào giữa tầm nhìn khi chuyển trang
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const activeTab = el.querySelector<HTMLElement>('[aria-current="page"]')
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [location.pathname])

  const handleScroll = (direction: 'left' | 'right') => {
    const el = navRef.current
    if (!el) return
    const scrollAmount = Math.max(el.clientWidth * 0.6, 220)
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    const el = navRef.current
    if (!el) return
    if (e.deltaX === 0 && e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 lg:px-6">
      {/* Nút cuộn trái + Vệt mờ Fade */}
      {canScrollLeft && (
        <div className="absolute left-2 lg:left-4 top-0 bottom-0 z-20 flex items-center pr-6 bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none">
          <Tooltip title="Cuộn sang trái" placement="bottom">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Cuộn sang trái"
              className="w-7 h-7 rounded-full bg-white border border-[#bcd8cf] shadow-xs flex items-center justify-center text-[#0b5f53] hover:bg-[#eef8f5] hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
            >
              <LeftOutlined className="text-[10px]" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Dàn hàng ngang các hạng mục quản lý */}
      <nav
        ref={navRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth py-0.5 select-none"
        aria-label="Các hạng mục quản lý khách sạn"
      >
        {HOTEL_WORKSPACE_NAV_ITEMS.map((item) => {
          const targetPath = item.path ? `/hotels/${hotelId}/${item.path}` : `/hotels/${hotelId}`
          const isOverview = !item.path
          const isActive = isOverview
            ? location.pathname === `/hotels/${hotelId}` || location.pathname === `/hotels/${hotelId}/`
            : location.pathname.startsWith(targetPath)

          const Icon = item.icon

          // Dynamic badges for operator feedback
          let badgeCount: number | null = null
          if (item.key === 'photos' && typeof hotel.imageCount === 'number') {
            badgeCount = hotel.imageCount
          } else if (item.key === 'rooms' && Array.isArray(hotel.roomTypes)) {
            badgeCount = hotel.roomTypes.length
          }

          return (
            <Link
              key={item.key}
              to={targetPath}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2.5 text-xs sm:text-[13px] border-b-2 transition-all shrink-0 no-underline select-none ${
                isActive
                  ? 'border-[#0b5f53] text-[#0b5f53] font-bold'
                  : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:border-slate-300 font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="text-sm shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {badgeCount !== null && (
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-[#eef8f5] text-[#0b5f53] border border-[#cfe5dd] font-bold'
                      : 'bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] font-semibold'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Nút cuộn phải + Vệt mờ Fade */}
      {canScrollRight && (
        <div className="absolute right-2 lg:right-4 top-0 bottom-0 z-20 flex items-center pl-6 bg-gradient-to-l from-white via-white/95 to-transparent pointer-events-none">
          <Tooltip title="Cuộn sang phải" placement="bottom">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Cuộn sang phải"
              className="w-7 h-7 rounded-full bg-white border border-[#bcd8cf] shadow-xs flex items-center justify-center text-[#0b5f53] hover:bg-[#eef8f5] hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
            >
              <RightOutlined className="text-[10px]" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export function HotelWorkspaceLayout() {
  const { hotelId = '' } = useParams<{ hotelId: string }>()
  const navigate = useNavigate()
  const detailQuery = useManagementHotelDetailQuery(hotelId)
  const roomTypesQuery = useManagementRoomTypesQuery(hotelId, detailQuery.isSuccess)
  const imagesQuery = useHotelImagesQuery(hotelId, detailQuery.isSuccess)

  if (detailQuery.isPending) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <PageLoading />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="p-8">
        <Result
          status="404"
          title="Không tìm thấy khách sạn"
          subTitle="Khách sạn không tồn tại hoặc bạn không có quyền quản lý cơ sở này."
          extra={
            <Button
              type="primary"
              className="!bg-[#0b5f53] !rounded-xl"
              onClick={() => navigate('/hotels')}
            >
              Về danh sách khách sạn
            </Button>
          }
        />
      </div>
    )
  }

  const hotel = {
    ...detailQuery.data,
    ...(roomTypesQuery.isSuccess ? {
      roomTypes: roomTypesQuery.data.map((type) => ({ ...type, hotelId, isActive: type.active })),
    } : {}),
    ...(imagesQuery.isSuccess ? {
      imageCount: imagesQuery.data.length,
      coverImageUrl: imagesQuery.data.find((image) => image.cover)?.url ?? imagesQuery.data[0]?.url ?? null,
    } : {}),
  }

  return (
    <HotelWorkspaceProvider
      hotel={hotel}
      hotelId={hotelId}
      isLoading={detailQuery.isPending}
      isError={detailQuery.isError}
      error={detailQuery.error}
      refetch={() => void detailQuery.refetch()}
    >
      <div className="hotel-workspace-shell flex flex-col flex-1 min-w-0 -m-4 lg:-m-6">
        {/* HEADER QUẢN LÝ CƠ SỞ & DÀN HÀNG NGANG CÁC HẠNG MỤC - GU SKILL PHƯƠNG ÁN A */}
        <header
          className="bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] sticky top-[64px] z-30 shadow-2xs"
          aria-label="Thanh điều hướng chi tiết khách sạn"
        >
          {/* Hàng 1: Nút quay lại danh sách + Nút đổi khách sạn & Trạng thái hồ sơ & Xem trước web khách */}
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-2 flex items-center justify-between gap-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2.5 min-w-0">
              <Tooltip title="Về danh sách khách sạn" placement="bottom">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowLeftOutlined className="text-sm" />}
                  onClick={() => void navigate('/hotels')}
                  aria-label="Về danh sách khách sạn"
                  className="!w-8 !h-8 !rounded-lg !text-[#64748b] hover:!text-[#0b5f53] hover:!bg-[#eef8f5] flex items-center justify-center !p-0 shrink-0"
                />
              </Tooltip>
              <div className="h-4 w-px bg-[#e2e8f0] shrink-0" aria-hidden="true" />
              <HotelSwitcher />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hotel.status === 'ACTIVE' && (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/stays/${hotelId}`, '_blank')}
                  className="!text-xs !text-[#0b5f53] !bg-[#eef8f5] hover:!bg-[#dfede7] !border !border-[#cfe5dd] !hidden sm:!inline-flex items-center !rounded-lg font-medium !h-7 !px-2.5"
                >
                  Xem trang khách
                </Button>
              )}
              <HotelStatusBadge status={hotel.status} />
            </div>
          </div>

          {/* Hàng 2: Dàn hàng ngang các hạng mục quản lý (Clean Underline Tabs với nút cuộn trái/phải) */}
          <HotelWorkspaceNav hotelId={hotelId} hotel={hotel} />
        </header>

        {/* Viewport nội dung trang con - Luôn căn giữa màn hình */}
        <div className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </HotelWorkspaceProvider>
  )
}
