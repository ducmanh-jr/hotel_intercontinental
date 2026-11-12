import { useMemo, useState } from 'react'
import {
  AppstoreOutlined,
  CheckOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { Input, Popover } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import { useHotelWorkspace } from '../context/hotel-workspace-context'
import { useHotelCoverImage } from '../hooks/use-hotel-cover-image'
import { useManagementHotelsQuery } from '../hooks/use-hotel-list-query'

interface SwitcherHotelItemProps {
  hotel: {
    id: string
    name: string
    cityName?: string
    address?: string
    coverImageUrl?: string | null
    status?: string
  }
  isSelected: boolean
  onSelect: () => void
}

function SwitcherHotelItem({ hotel, isSelected, onSelect }: SwitcherHotelItemProps) {
  const { data: coverUrl } = useHotelCoverImage(hotel.id, hotel.coverImageUrl)
  const displayImage = coverUrl || hotel.coverImageUrl

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs border cursor-pointer ${
        isSelected
          ? 'bg-[#eef8f5] text-[#0b5f53] font-semibold border-[#bcd8cf]'
          : 'bg-transparent text-[#1e293b] hover:bg-[#f1f5f9] border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt={hotel.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isSelected ? 'bg-[#0b5f53] text-white' : 'bg-[#eef3f1] text-[#55655f]'
              }`}
            >
              <ShopOutlined className="text-sm" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`truncate text-xs ${
                isSelected ? 'font-bold text-[#08473e]' : 'font-semibold text-slate-800'
              }`}
            >
              {hotel.name}
            </span>
            {hotel.status === 'DRAFT' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                Nháp
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#64748b] truncate font-normal mt-0.5">
            {hotel.cityName || hotel.address || 'Cơ sở lưu trú'}
          </div>
        </div>
      </div>
      {isSelected && <CheckOutlined className="text-[#0b5f53] shrink-0 text-xs ml-2" />}
    </button>
  )
}

export function HotelSwitcher() {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { hotel, hotelId, completion } = useHotelWorkspace()

  // Danh sách khách sạn của owner để switch
  const hotelsQuery = useManagementHotelsQuery({ page: 0, size: 50 })
  const allHotels = hotelsQuery.data?.content ?? []

  // Khách sạn hiện tại và các khách sạn khác
  const currentHotel = allHotels.find((h) => h.id === hotelId) || hotel
  const otherHotels = allHotels.filter((h) => h.id !== hotelId)

  // Ảnh bìa của khách sạn hiện tại trên nút Trigger
  const { data: currentCoverUrl } = useHotelCoverImage(
    hotelId,
    currentHotel?.coverImageUrl || hotel?.coverImageUrl,
  )
  const triggerCoverImage = currentCoverUrl || currentHotel?.coverImageUrl || hotel?.coverImageUrl

  // Filter theo ô tìm kiếm
  const normalizedKeyword = searchTerm.trim().toLowerCase()
  const filteredOtherHotels = useMemo(() => {
    if (!normalizedKeyword) return otherHotels
    return otherHotels.filter(
      (h) =>
        h.name.toLowerCase().includes(normalizedKeyword) ||
        (h.cityName && h.cityName.toLowerCase().includes(normalizedKeyword)) ||
        (h.address && h.address.toLowerCase().includes(normalizedKeyword)),
    )
  }, [otherHotels, normalizedKeyword])

  const isCurrentMatching = useMemo(() => {
    if (!currentHotel) return false
    if (!normalizedKeyword) return true
    return (
      currentHotel.name.toLowerCase().includes(normalizedKeyword) ||
      (currentHotel.cityName && currentHotel.cityName.toLowerCase().includes(normalizedKeyword)) ||
      (currentHotel.address && currentHotel.address.toLowerCase().includes(normalizedKeyword))
    )
  }, [currentHotel, normalizedKeyword])

  // Trích xuất sub-path hiện tại: /hotels/:hotelId(/subpath...)
  const handleSelectHotel = (targetId: string) => {
    if (targetId === hotelId) {
      setOpen(false)
      return
    }

    const segments = location.pathname.split('/').filter(Boolean)
    const subPath = segments.slice(2).join('/')
    const nextUrl = subPath ? `/hotels/${targetId}/${subPath}` : `/hotels/${targetId}`

    setOpen(false)
    void navigate(nextUrl)
  }

  const hotelName = hotel?.name || currentHotel?.name || 'Đang tải...'

  const popoverContent = (
    <div className="w-[340px] max-w-[calc(100vw-32px)] flex flex-col p-1">
      {/* Header Popover: Tiêu đề + Số lượng */}
      <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-slate-100">
        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
          Chuyển cơ sở lưu trú
        </span>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
          {allHotels.length} cơ sở
        </span>
      </div>

      {/* Ô tìm kiếm nhanh nếu có từ 3 khách sạn trở lên */}
      {allHotels.length > 2 && (
        <div className="pt-2 px-1 pb-1">
          <Input
            placeholder="Tìm theo tên hoặc địa chỉ..."
            prefix={<SearchOutlined className="text-slate-400 text-xs" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            size="small"
            className="!rounded-lg !text-xs !bg-slate-50/70 hover:!bg-white focus:!bg-white !border-slate-200"
          />
        </div>
      )}

      {/* Vùng danh sách cuộn độc lập (max-h-72 cuộn mượt không che hết màn hình) */}
      <div className="max-h-[300px] overflow-y-auto px-1 py-1 space-y-1 scrollbar-thin">
        {/* Khách sạn hiện tại (Đang quản lý) */}
        {currentHotel && isCurrentMatching && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 py-1">
              Đang quản lý
            </div>
            <SwitcherHotelItem
              hotel={{
                ...currentHotel,
                coverImageUrl: triggerCoverImage,
              }}
              isSelected={true}
              onSelect={() => setOpen(false)}
            />
          </div>
        )}

        {/* Các cơ sở khác */}
        {filteredOtherHotels.length > 0 && (
          <div className="pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 py-1">
              Cơ sở khác ({filteredOtherHotels.length})
            </div>
            <div className="space-y-1">
              {filteredOtherHotels.map((item) => (
                <SwitcherHotelItem
                  key={item.id}
                  hotel={item}
                  isSelected={false}
                  onSelect={() => handleSelectHotel(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Khi tìm kiếm không có kết quả */}
        {!isCurrentMatching && filteredOtherHotels.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            Không tìm thấy cơ sở phù hợp với &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>

      {/* Footer hành động nhanh */}
      <div className="pt-2 mt-1 border-t border-slate-100 px-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            void navigate('/hotels')
          }}
          className="text-xs text-slate-600 hover:text-[#0b5f53] font-medium flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
        >
          <AppstoreOutlined className="text-xs" />
          <span>Xem tất cả ({allHotels.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            void navigate('/hotels?create=true')
          }}
          className="text-xs text-[#0b5f53] hover:text-[#08473e] font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#eef8f5] transition-colors border-0 bg-transparent cursor-pointer"
        >
          <PlusOutlined className="text-xs" />
          <span>Thêm cơ sở</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="hotel-switcher-container">
      <Popover
        content={popoverContent}
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
      >
        <button
          type="button"
          className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#dce7e3] bg-white hover:bg-[#f7fbfa] hover:border-[#bcd8cf] transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#0b5f53]/20 shadow-2xs"
          aria-label={`Khách sạn hiện tại: ${hotelName}. Bấm để đổi khách sạn.`}
          aria-expanded={open}
        >
          <div className="w-8 h-8 rounded-lg bg-[#eef8f5] text-[#0b5f53] border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
            {triggerCoverImage ? (
              <img
                src={triggerCoverImage}
                alt={hotelName}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShopOutlined className="text-base" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#8c9e99] leading-none">
              Cơ sở đang quản lý
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className="text-xs sm:text-sm font-semibold text-[#12211d] truncate max-w-[160px] sm:max-w-[260px]">
                {hotelName}
              </strong>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#0b5f53] bg-[#eef8f5] px-2 py-0.5 rounded-full shrink-0">
            Hoàn thiện {completion.percent}%
          </span>
          <DownOutlined
            className={`text-[10px] text-[#5f736e] shrink-0 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </Popover>
    </div>
  )
}
