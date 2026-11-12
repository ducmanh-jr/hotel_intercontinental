import {
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  LineChartOutlined,
  StarFilled,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { Button, Card, Space, Tag } from 'antd'
import { useNavigate } from 'react-router'
import { useHotelWorkspace, HotelStatusBadge, CompletionChecklist } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'

export function HotelOverviewPage() {
  const { hotel, hotelId, completion } = useHotelWorkspace()
  const navigate = useNavigate()

  if (!hotel) return null

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Tổng quan' },
  ]

  return (
    <div className="hotel-overview-page max-w-6xl mx-auto space-y-6">
      {/* 1. Header */}
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="TỔNG QUAN CƠ SỞ"
        title={hotel.name}
        description="Bảng điều khiển cơ sở lưu trú, theo dõi tiến độ hoàn thiện hồ sơ và các chỉ số hoạt động."
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/hotels/${hotelId}/info`)}
            >
              Chỉnh sửa hồ sơ
            </Button>
            {hotel.status === 'ACTIVE' && (
              <Button
                type="primary"
                className="!bg-[#0b5f53] !rounded-xl"
                icon={<EyeOutlined />}
                onClick={() => window.open(`/stays/${hotelId}`, '_blank')}
              >
                Xem trang công khai
              </Button>
            )}
          </Space>
        }
      />

      {/* 2. Hero Card */}
      <div className="bg-white rounded-2xl border border-[#dce7e3] overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row">
          {hotel.coverImageUrl ? (
            <div className="md:w-72 h-48 md:h-auto bg-[#eef8f5] shrink-0">
              <img
                src={hotel.coverImageUrl}
                alt={hotel.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="md:w-72 h-48 md:h-auto bg-[#eef8f5] flex items-center justify-center text-[#5f736e] text-xs font-medium shrink-0">
              Chưa có ảnh bìa
            </div>
          )}

          <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
            <div>
              <Space wrap size={8} className="mb-2">
                <HotelStatusBadge status={hotel.status} />
                {hotel.starRating && (
                  <Tag color="gold" className="!rounded-md">
                    <StarFilled /> {hotel.starRating} Sao
                  </Tag>
                )}
                <Tag color="blue" className="!rounded-md">
                  {hotel.cityName || 'Việt Nam'}
                </Tag>
                <Tag className="!rounded-md">
                  Nhận {hotel.checkInTime?.slice(0, 5)} · Trả {hotel.checkOutTime?.slice(0, 5)}
                </Tag>
              </Space>

              <h2 className="text-xl font-bold text-[#12211d] mb-1">{hotel.name}</h2>
              <p className="text-xs text-[#5f736e] flex items-center gap-1.5 mb-3">
                <EnvironmentOutlined className="text-[#0b5f53]" />
                {hotel.address}
              </p>
              {hotel.description && (
                <p className="text-xs text-[#344a44] line-clamp-2 leading-relaxed m-0">
                  {hotel.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#dce7e3] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#5f736e]">
                Mã định danh:{' '}
                <code className="bg-[#f4f8f7] px-1.5 py-0.5 rounded text-[11px] font-mono">
                  {hotel.id}
                </code>
              </span>
              <span className="text-xs font-semibold text-[#0b5f53]">
                {hotel.roomTypes ? `${hotel.roomTypes.length} hạng phòng` : 'Chưa có dữ liệu loại phòng'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Card Checklist hoàn thiện hồ sơ */}
      <CompletionChecklist hotel={hotel} completion={completion} />

      {/* 4. Card Thống kê nhanh (Placeholder cho vận hành) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#12211d] m-0">
            Chỉ số vận hành cơ sở
          </h3>
          <span className="text-[11px] text-[#5f736e] italic">
            Backend chưa cung cấp API thống kê vận hành
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Đơn mới */}
          <Card className="rounded-2xl border border-[#dce7e3] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5f736e] font-medium">Đơn đặt mới (30 ngày)</span>
              <div className="w-8 h-8 rounded-lg bg-[#eef8f5] text-[#0b5f53] flex items-center justify-center">
                <CalendarOutlined />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#12211d]">
              —
            </div>
            <div className="text-[11px] text-[#5f736e] mt-1">
              Chưa có dữ liệu từ API
            </div>
          </Card>

          {/* Card 2: Doanh thu tháng */}
          <Card className="rounded-2xl border border-[#dce7e3] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5f736e] font-medium">Doanh thu tháng này</span>
              <div className="w-8 h-8 rounded-lg bg-[#eef8f5] text-[#0b5f53] flex items-center justify-center">
                <LineChartOutlined />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#12211d]">
              —
            </div>
            <div className="text-[11px] text-[#5f736e] mt-1">
              Chưa có dữ liệu từ API
            </div>
          </Card>

          {/* Card 3: Tỷ lệ lấp đầy */}
          <Card className="rounded-2xl border border-[#dce7e3] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5f736e] font-medium">Tỷ lệ lấp đầy phòng</span>
              <div className="w-8 h-8 rounded-lg bg-[#eef8f5] text-[#0b5f53] flex items-center justify-center">
                <UsergroupAddOutlined />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#12211d]">
              —
            </div>
            <div className="text-[11px] text-[#5f736e] mt-1">
              Chưa có dữ liệu từ API
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
