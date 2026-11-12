import { useState } from 'react'
import {
  BankOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  StarFilled,
} from '@ant-design/icons'
import { Button, Select, Space, Tag } from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import {
  HotelStatusBadge,
  RoomTypeDailyRatesPanel,
  useManagementHotelDetailQuery,
  useManagementHotelsQuery,
} from '@/features/hotels'

import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelRatesManagementPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryHotelId = searchParams.get('hotelId') ?? ''
  const [selectedHotelId, setSelectedHotelId] = useState(queryHotelId)

  const hotelsListQuery = useManagementHotelsQuery({ page: 0, size: 20 })
  const hotels = hotelsListQuery.data?.content ?? []

  const activeHotelId =
    hotels.some((h) => h.id === selectedHotelId)
      ? selectedHotelId
      : (hotels[0]?.id ?? '')

  const hotelDetailQuery = useManagementHotelDetailQuery(activeHotelId)

  function handleSelectHotel(nextHotelId: string) {
    setSelectedHotelId(nextHotelId)
    setSearchParams({ hotelId: nextHotelId })
  }

  return (
    <div className="management-page rates-management-page">
      {/* 1. Header trang tinh gọn, sang trọng */}
      <header className="rates-page-header">
        <div className="rates-page-header__content">
          <span className="rates-page-header__kicker">
            <DollarOutlined aria-hidden="true" /> QUẢN LÝ DOANH THU &amp; PHÂN PHỐI
          </span>
          <h1 className="rates-page-header__title">
            Tra cứu Giá Phòng Theo Ngày Lưu Trú
          </h1>
          <p className="rates-page-header__desc">
            Theo dõi mức giá niêm yết từng đêm theo từng khách sạn và hạng phòng
            trong khoảng thời gian chọn trước.
          </p>
        </div>

        <div className="rates-page-header__actions">
          {activeHotelId && (
            <Button
              icon={<SettingOutlined aria-hidden="true" />}
              onClick={() =>
                void navigate(`/management/hotels/${activeHotelId}?tab=general`)
              }
            >
              Mở hồ sơ khách sạn
            </Button>
          )}
          <Button
            icon={<BankOutlined aria-hidden="true" />}
            onClick={() => void navigate('/management/hotels')}
          >
            Danh sách khách sạn
          </Button>
        </div>
      </header>

      {hotelsListQuery.isPending ? (
        <PageLoading />
      ) : hotelsListQuery.isError ? (
        <div className="surface-card">
          <ErrorState
            error={hotelsListQuery.error}
            retrying={hotelsListQuery.isFetching}
            onRetry={() => void hotelsListQuery.refetch()}
          />
        </div>
      ) : hotels.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            title="Chưa có khách sạn nào được phép vận hành"
            description="Vui lòng tạo khách sạn mới tại mục Quản trị khách sạn trước khi xem bảng giá."
            action={
              <Button
                type="primary"
                onClick={() => void navigate('/management/hotels')}
              >
                Đến Quản trị khách sạn
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* 2. Thanh chọn cơ sở lưu trú liền mạch */}
          <section
            className="rates-hotel-strip"
            aria-label="Chọn khách sạn cần xem giá"
          >
            <div className="rates-hotel-strip__selector">
              <label htmlFor="rates-hotel-switcher" className="rates-hotel-strip__label">
                Cơ sở lưu trú:
              </label>
              <Select
                id="rates-hotel-switcher"
                value={activeHotelId}
                onChange={handleSelectHotel}
                className="rates-hotel-strip__select"
                size="large"
                options={hotels.map((h) => ({
                  label: `${h.name} — ${h.cityName ?? 'Việt Nam'}`,
                  value: h.id,
                }))}
              />
            </div>

            {hotelDetailQuery.data && (
              <div className="rates-hotel-strip__meta">
                <Space wrap size={8}>
                  <HotelStatusBadge status={hotelDetailQuery.data.status} />
                  {hotelDetailQuery.data.starRating && (
                    <Tag color="gold">
                      <StarFilled aria-hidden="true" />{' '}
                      {hotelDetailQuery.data.starRating} Sao
                    </Tag>
                  )}
                  <Tag color="blue">
                    <EnvironmentOutlined aria-hidden="true" />{' '}
                    {hotelDetailQuery.data.cityName}
                  </Tag>
                  <Tag>
                    {hotelDetailQuery.data.roomTypes
                      ? `${hotelDetailQuery.data.roomTypes.length} hạng phòng`
                      : 'Chưa có dữ liệu hạng phòng'}
                  </Tag>
                </Space>
              </div>
            )}
          </section>

          {/* 3. Panel dữ liệu bảng giá */}
          {hotelDetailQuery.isPending ? (
            <PageLoading />
          ) : hotelDetailQuery.isError ? (
            <div className="surface-card">
              <ErrorState
                error={hotelDetailQuery.error}
                retrying={hotelDetailQuery.isFetching}
                onRetry={() => void hotelDetailQuery.refetch()}
              />
            </div>
          ) : (
            <RoomTypeDailyRatesPanel
              key={hotelDetailQuery.data.id}
              hotelId={hotelDetailQuery.data.id}
              hotelName={hotelDetailQuery.data.name}
              roomTypes={hotelDetailQuery.data.roomTypes}
            />
          )}
        </>
      )}
    </div>
  )
}
