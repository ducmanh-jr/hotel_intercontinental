import { useState } from 'react'
import {
  AppstoreOutlined,
  DollarOutlined,
  EllipsisOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  StarFilled,
  UnorderedListOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Dropdown,
  Input,
  Pagination,
  Progress,
  Segmented,
  Select,
  Skeleton,
} from 'antd'
import { useNavigate } from 'react-router'
import {
  calculateHotelCompletion,
  HotelStatusBadge,
  useCitiesQuery,
  useManagementHotelsQuery,
  useHotelCoverImage,
  type HotelStatus,
  type ManagementHotelSummary,
} from '@/features/hotels'

function HotelCardCover({ hotel }: { hotel: ManagementHotelSummary }) {
  const { data: coverUrl } = useHotelCoverImage(hotel.id, hotel.coverImageUrl)
  const displayUrl = coverUrl || hotel.coverImageUrl

  if (displayUrl) {
    return (
      <img
        src={displayUrl}
        alt={hotel.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f2f8f6] via-[#e5f3ee] to-[#d6ede4] text-[#0b5f53] p-4 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-white/85 shadow-2xs border border-[#cfe5dd] flex items-center justify-center mb-1.5 text-[#0b5f53]">
        <HomeOutlined className="text-xl opacity-80" />
      </div>
      <span className="text-xs font-semibold text-[#1e463d]">Chưa có ảnh bìa</span>
      <span className="text-[10.5px] text-[#5f736e]">Chờ tải ảnh đại diện</span>
    </div>
  )
}

function HotelCardCompletion({ hotel }: { hotel: ManagementHotelSummary }) {
  const { data: coverUrl } = useHotelCoverImage(hotel.id, hotel.coverImageUrl)
  const displayUrl = coverUrl || hotel.coverImageUrl
  const completion = calculateHotelCompletion(displayUrl ? { ...hotel, coverImageUrl: displayUrl } : hotel)

  return (
    <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#edf2f7] space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#64748b] font-medium">Hoàn thiện hồ sơ</span>
        <span className="font-bold text-[#0b5f53] text-[12px]">{completion.percent}%</span>
      </div>
      <Progress
        percent={completion.percent}
        showInfo={false}
        size={['100%', 4]}
        strokeColor="#0b5f53"
        railColor="#e2e8f0"
        className="!m-0"
      />
    </div>
  )
}

function HotelTableThumbnail({ hotel }: { hotel: ManagementHotelSummary }) {
  const { data: coverUrl } = useHotelCoverImage(hotel.id, hotel.coverImageUrl)
  const displayUrl = coverUrl || hotel.coverImageUrl

  if (displayUrl) {
    return (
      <img
        src={displayUrl}
        alt={hotel.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
    )
  }

  return <HomeOutlined className="text-[#0b5f53] text-base" />
}

function HotelTableCompletion({ hotel }: { hotel: ManagementHotelSummary }) {
  const { data: coverUrl } = useHotelCoverImage(hotel.id, hotel.coverImageUrl)
  const displayUrl = coverUrl || hotel.coverImageUrl
  const completion = calculateHotelCompletion(displayUrl ? { ...hotel, coverImageUrl: displayUrl } : hotel)

  return (
    <div className="flex items-center gap-2">
      <Progress
        percent={completion.percent}
        showInfo={false}
        size={['100%', 4]}
        strokeColor="#0b5f53"
        railColor="#e0e8e6"
        className="!m-0"
      />
      <span className="text-[11px] font-bold text-[#0b5f53] shrink-0">
        {completion.percent}%
      </span>
    </div>
  )
}
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'

type ViewMode = 'card' | 'table'

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: HotelStatus | 'ALL' }> = [
  { label: 'Tất cả trạng thái', value: 'ALL' },
  { label: 'Bản nháp', value: 'DRAFT' },
  { label: 'Chờ duyệt', value: 'PENDING_APPROVAL' },
  { label: 'Đang bán', value: 'ACTIVE' },
  { label: 'Tạm ngưng', value: 'SUSPENDED' },
]

export function HotelManagementListPage() {
  const navigate = useNavigate()
  const mode = 'api'

  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<HotelStatus | 'ALL'>('ALL')
  const [keyword, setKeyword] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  const citiesQuery = useCitiesQuery()
  const hotelsQuery = useManagementHotelsQuery({
    page,
    size: 12,
    status,
    keyword,
  })

  const cities = citiesQuery.data ?? []
  const rawHotels = hotelsQuery.data?.content ?? []
  const totalElements = hotelsQuery.data?.totalElements ?? 0
  const totalPages = hotelsQuery.data?.totalPages ?? 1

  // Client-side fallback filter if BE doesn't support keyword/status directly in all modes
  const hotels = mode === 'api' ? rawHotels : rawHotels.filter((h) => {
    if (status !== 'ALL' && h.status !== status) return false
    if (keyword) {
      const q = keyword.toLowerCase().trim()
      const matchName = h.name.toLowerCase().includes(q)
      const matchAddress = h.address?.toLowerCase().includes(q)
      const matchCity = h.cityName?.toLowerCase().includes(q)
      if (!matchName && !matchAddress && !matchCity) return false
    }
    return true
  })

  const resetFilters = () => {
    setPage(0)
    setStatus('ALL')
    setKeyword('')
  }

  const getCityName = (hotel: ManagementHotelSummary) => {
    return (
      hotel.cityName ||
      cities.find((c) => c.id === hotel.cityId)?.name ||
      hotel.address ||
      'Việt Nam'
    )
  }

  return (
    <div className="hotel-management-list-page max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <PageHeader
        breadcrumbItems={[{ label: 'Khách sạn' }]}
        kicker="CƠ SỞ LƯU TRÚ"
        title="Khách sạn"
        description="Theo dõi toàn bộ danh sách khách sạn và khu nghỉ dưỡng trực thuộc đối tác. Quản lý hồ sơ vận hành, loại phòng, giá bán và tiện ích lưu trú."
        extra={
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/hotels/new')}
            className="!rounded-xl !bg-[#0b5f53] hover:!bg-[#08473e] !px-6 font-semibold"
          >
            Thêm khách sạn
          </Button>
        }
      />

      {/* 2. Thanh công cụ (Toolbar) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Ô tìm kiếm theo tên */}
          <Input
            disabled={mode === 'api'}
            placeholder="Tìm kiếm theo tên khách sạn..."
            prefix={<SearchOutlined className="text-[#5f736e]" />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            allowClear
            size="large"
            className="w-full sm:max-w-xs rounded-xl"
          />

          {/* Filter trạng thái */}
          <Select
            disabled={mode === 'api'}
            size="large"
            value={status}
            onChange={(val) => {
              setStatus(val)
              setPage(0)
            }}
            className="w-full sm:w-52"
            options={STATUS_FILTER_OPTIONS}
          />

          {(keyword || status !== 'ALL') && (
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="text-[#0b5f53] text-xs font-semibold self-start sm:self-center"
            >
              Đặt lại
            </Button>
          )}

          {mode === 'api' && (
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-[#5f736e] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
              <InfoCircleOutlined className="text-[#0b5f53]" />
              <span>Phân trang cơ sở dữ liệu API</span>
            </span>
          )}
        </div>

        {/* Chuyển chế độ xem Card / Bảng */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <span className="text-xs text-[#5f736e] font-medium mr-1 hidden sm:inline">Chế độ xem:</span>
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            className="!p-1 !rounded-xl !bg-[#f1f5f9]"
            options={[
              {
                value: 'card',
                icon: <AppstoreOutlined />,
                label: 'Thẻ',
              },
              {
                value: 'table',
                icon: <UnorderedListOutlined />,
                label: 'Bảng',
              },
            ]}
          />
        </div>
      </div>

      {/* 3. Nội dung danh sách theo trạng thái (Loading, Error, Empty, Card/Table) */}
      {hotelsQuery.isPending ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="rounded-2xl border border-[#dce7e3] overflow-hidden">
                <Skeleton.Image className="!w-full !h-44" active />
                <div className="p-4 space-y-3">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-[#dce7e3] p-6">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        )
      ) : hotelsQuery.isError ? (
        <Card className="rounded-2xl border border-[#dce7e3] p-6">
          <ErrorState
            error={hotelsQuery.error}
            retrying={hotelsQuery.isFetching}
            onRetry={() => void hotelsQuery.refetch()}
          />
        </Card>
      ) : hotels.length === 0 ? (
        <Card className="rounded-2xl border border-[#dce7e3] p-10 text-center">
          <EmptyState
            title="Chưa có khách sạn nào"
            description="Bạn chưa khởi tạo cơ sở lưu trú nào trên hệ thống hoặc không có khách sạn nào phù hợp với bộ lọc tìm kiếm hiện tại."
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                {(keyword || status !== 'ALL') && (
                  <Button size="large" onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/hotels/new')}
                  className="!bg-[#0b5f53] hover:!bg-[#08473e] !rounded-xl !px-6 font-semibold"
                >
                  Tạo khách sạn đầu tiên
                </Button>
              </div>
            }
          />
        </Card>
      ) : viewMode === 'card' ? (
        /* CHẾ ĐỘ XEM THẺ (CARD GRID) - GU SKILL */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => {
              const cityName = getCityName(hotel)
              const roomCount = hotel.roomTypeCount ?? 0

              return (
                <div
                  key={hotel.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Quản lý khách sạn ${hotel.name}`}
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/hotels/${hotel.id}`)
                    }
                  }}
                  className="group bg-white rounded-2xl border border-[#e2e8f0] hover:border-[#0b5f53]/50 hover:shadow-lg hover:shadow-[#0b5f53]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5f53] focus-visible:ring-offset-2 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Ảnh bìa & Badges */}
                    <div className="relative h-48 bg-[#f4f8f7] overflow-hidden">
                      <HotelCardCover hotel={hotel} />

                      {/* Trạng thái & Hạng sao */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <HotelStatusBadge status={hotel.status} />
                      </div>

                      {hotel.starRating && (
                        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs z-10 border border-white/10">
                          <StarFilled className="text-[10px] text-amber-400" />
                          <span>{hotel.starRating} sao</span>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Nội dung chi tiết */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-[#12211d] group-hover:text-[#0b5f53] transition-colors truncate m-0">
                          {hotel.name}
                        </h3>
                        <p className="text-xs text-[#5f736e] flex items-center gap-1.5 mt-1 m-0 truncate">
                          <EnvironmentOutlined className="text-[#0b5f53] shrink-0" />
                          <span>{cityName}</span>
                        </p>
                      </div>

                      {/* Tiến độ hoàn thiện */}
                      <HotelCardCompletion hotel={hotel} />

                      {/* Thông số phòng */}
                      <div className="flex items-center justify-between text-xs text-[#5f736e] pt-1 border-t border-[#f1f5f9]">
                        <span className="flex items-center gap-1.5 font-medium text-[#1e293b]">
                          <HomeOutlined className="text-[#0b5f53]" />
                          <span>{roomCount} loại phòng</span>
                        </span>
                        <span className="text-[11.5px] font-medium text-[#64748b]">
                          {hotel.checkInTime ? `Nhận ${hotel.checkInTime.slice(0, 5)}` : 'Nhận 14:00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions chân card: QUẢN LÝ + BẢNG GIÁ + MORE */}
                  <div
                    className="p-3 bg-[#fafcfb] border-t border-[#edf2f0] flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="primary"
                      icon={<SettingOutlined />}
                      onClick={() => navigate(`/hotels/${hotel.id}`)}
                      className="!flex-1 !h-9 !bg-[#0b5f53] hover:!bg-[#08473e] !text-white !font-semibold !text-xs !rounded-xl !shadow-2xs !border-0 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      Quản lý
                    </Button>

                    <Button
                      icon={<DollarOutlined />}
                      onClick={() => navigate(`/hotels/${hotel.id}/pricing`)}
                      className="!flex-1 !h-9 !bg-[#eef8f5] hover:!bg-[#dfede7] !text-[#0b5f53] hover:!text-[#08473e] !border-[#cfe5dd] hover:!border-[#0b5f53] !font-semibold !text-xs !rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      Bảng giá
                    </Button>

                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'info',
                            label: 'Chỉnh sửa thông tin',
                            icon: <SettingOutlined />,
                            onClick: () => navigate(`/hotels/${hotel.id}/info`),
                          },
                          {
                            key: 'pricing',
                            label: 'Biểu giá theo ngày',
                            icon: <DollarOutlined />,
                            onClick: () => navigate(`/hotels/${hotel.id}/pricing`),
                          },
                          {
                            key: 'status',
                            label: hotel.status === 'ACTIVE' ? 'Tạm ngưng hoạt động' : 'Kích hoạt / Cập nhật',
                            icon: hotel.status === 'ACTIVE' ? <PauseCircleOutlined /> : <PlayCircleOutlined />,
                            onClick: () => navigate(`/hotels/${hotel.id}/info`),
                          },
                          ...(hotel.status === 'ACTIVE'
                            ? [
                                {
                                  key: 'public',
                                  label: 'Xem trang công khai',
                                  icon: <EyeOutlined />,
                                  onClick: () => window.open(`/stays/${hotel.id}`, '_blank'),
                                },
                              ]
                            : []),
                        ],
                      }}
                      trigger={['click']}
                      placement="topRight"
                    >
                      <Button
                        type="default"
                        icon={<EllipsisOutlined className="text-base" />}
                        aria-label="Tùy chọn khác"
                        className="!w-9 !h-9 !min-w-[36px] !rounded-xl !border-[#e2e8f0] !text-[#5f736e] hover:!bg-[#f1f5f9] flex items-center justify-center !p-0"
                      />
                    </Dropdown>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center sm:justify-end pt-4">
              <Pagination
                current={page + 1}
                total={totalElements}
                pageSize={12}
                onChange={(p) => setPage(p - 1)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      ) : (
        /* CHẾ ĐỘ XEM BẢNG (TABLE VIEW) - GU SKILL */
        <Card className="rounded-2xl border border-[#e2e8f0] overflow-hidden p-0 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569] uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-4 px-5">Khách sạn / Cơ sở</th>
                  <th className="py-4 px-4">Tỉnh / Thành</th>
                  <th className="py-4 px-4">Tiêu chuẩn sao</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-4">Hoàn thiện</th>
                  <th className="py-4 px-4">Loại phòng</th>
                  <th className="py-4 px-5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {hotels.map((hotel) => {
                  const cityName = getCityName(hotel)
                  const roomCount = hotel.roomTypeCount ?? 0

                  return (
                    <tr
                      key={hotel.id}
                      tabIndex={0}
                      role="row"
                      aria-label={`Khách sạn ${hotel.name}`}
                      onClick={() => navigate(`/hotels/${hotel.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/hotels/${hotel.id}`)
                        }
                      }}
                      className="hover:bg-[#f8fbfa] focus-visible:bg-[#eef8f5] focus-visible:outline-none transition-colors cursor-pointer group"
                    >
                      {/* Tên & Thumbnail */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#eef8f5] border border-[#dce7e3] overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                            <HotelTableThumbnail hotel={hotel} />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-sm text-[#12211d] group-hover:text-[#0b5f53] transition-colors truncate">
                              {hotel.name}
                            </div>
                            <div className="text-[11.5px] text-[#5f736e] truncate mt-0.5">{hotel.address}</div>
                          </div>
                        </div>
                      </td>

                      {/* Tỉnh / Thành */}
                      <td className="py-3.5 px-4 text-[#1e293b] font-medium text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          <EnvironmentOutlined className="text-[#0b5f53] text-xs" />
                          <span>{cityName}</span>
                        </span>
                      </td>

                      {/* Tiêu chuẩn sao */}
                      <td className="py-3.5 px-4">
                        {hotel.starRating ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-md font-bold text-xs">
                            <StarFilled className="text-[10px] text-amber-500" />
                            <span>{hotel.starRating} sao</span>
                          </span>
                        ) : (
                          <span className="text-[#94a3b8] italic">Chưa xếp hạng</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <HotelStatusBadge status={hotel.status} />
                      </td>

                      {/* % Hoàn thiện */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <HotelTableCompletion hotel={hotel} />
                      </td>

                      {/* Loại phòng */}
                      <td className="py-3.5 px-4 font-semibold text-[#12211d]">
                        <span className="bg-[#f1f5f9] text-[#334155] px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {roomCount} loại phòng
                        </span>
                      </td>

                      {/* Thao tác: CỤM NÚT QUẢN LÝ VÀ BẢNG GIÁ CAO CẤP */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="primary"
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => navigate(`/hotels/${hotel.id}`)}
                            className="!h-8 !px-3.5 !bg-[#0b5f53] hover:!bg-[#08473e] !text-white !font-semibold !text-xs !rounded-lg !shadow-2xs !border-0 flex items-center gap-1"
                          >
                            Quản lý
                          </Button>
                          <Button
                            size="small"
                            icon={<DollarOutlined />}
                            onClick={() => navigate(`/hotels/${hotel.id}/pricing`)}
                            className="!h-8 !px-3 !bg-[#eef8f5] hover:!bg-[#dfede7] !text-[#0b5f53] hover:!text-[#08473e] !border-[#cfe5dd] hover:!border-[#0b5f53] !font-semibold !text-xs !rounded-lg flex items-center gap-1"
                          >
                            Bảng giá
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-end p-4 border-t border-[#e2e8f0] bg-[#fafcfb]">
              <Pagination
                current={page + 1}
                total={totalElements}
                pageSize={12}
                onChange={(p) => setPage(p - 1)}
                showSizeChanger={false}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
