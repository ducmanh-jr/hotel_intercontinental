import {
  AppstoreAddOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons'
import { Button, Modal, Space, Tabs, Tag, message } from 'antd'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/features/auth'
import { HotelContractsSection, useHotelContractsQuery } from '@/features/contracts'

import { FinancialAccessSection } from '@/features/finance'
import {
  HotelAmenitiesManager,
  HotelGeneralEditForm,
  HotelStatusBadge,
  RoomTypeDailyRatesPanel,
  useApproveHotelMutation,
  useCitiesQuery,
  useManagementHotelDetailQuery,
} from '@/features/hotels'

import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelManagementDetailPage() {
  const { hotelId = '' } = useParams<{ hotelId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'general'

  const { isAdmin } = useCurrentUser()
  const citiesQuery = useCitiesQuery()
  const detailQuery = useManagementHotelDetailQuery(hotelId)
  const contractsQuery = useHotelContractsQuery(hotelId)
  const approveMutation = useApproveHotelMutation()

  const handleApprove = () => {
    Modal.confirm({
      title: 'Xác nhận duyệt khách sạn',
      content: `Bạn có chắc chắn muốn duyệt khách sạn "${detailQuery.data?.name}" từ bản nháp (DRAFT) sang trạng thái đã duyệt?`,
      okText: 'Duyệt khách sạn',
      cancelText: 'Hủy',
      okButtonProps: { style: { backgroundColor: '#1F7A4D' } },
      onOk: async () => {
        try {
          await approveMutation.mutateAsync(hotelId)
          message.success('Đã duyệt khách sạn thành công!')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Duyệt khách sạn thất bại.')
        }
      },
    })
  }

  if (detailQuery.isPending) {
    return (
      <div className="management-page">
        <PageLoading />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="management-page">
        <div className="surface-card">
          <ErrorState
            error={detailQuery.error}
            retrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        </div>
      </div>
    )
  }

  const hotel = detailQuery.data
  const cities = citiesQuery.data ?? []
  const contracts = contractsQuery.data ?? []

  return (
    <div className="management-page">
      <div className="detail-top-nav">
        <Button
          icon={<ArrowLeftOutlined aria-hidden="true" />}
          onClick={() => void navigate('/management/hotels')}
        >
          Danh sách khách sạn
        </Button>
        <Button
          icon={<ReloadOutlined aria-hidden="true" />}
          loading={detailQuery.isFetching}
          onClick={() => void detailQuery.refetch()}
        >
          Làm mới thông tin
        </Button>
        {isAdmin && hotel.status === 'DRAFT' && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined aria-hidden="true" />}
            loading={approveMutation.isPending}
            onClick={handleApprove}
            style={{ marginLeft: 'auto', backgroundColor: '#1F7A4D' }}
          >
            Duyệt khách sạn (DRAFT → APPROVED)
          </Button>
        )}
      </div>

      <header className="hotel-detail-hero">
        {hotel.coverImageUrl && (
          <div className="hotel-detail-hero__media">
            <img
              src={hotel.coverImageUrl}
              alt={hotel.name}
              className="hotel-detail-hero__img"
            />
          </div>
        )}
        <div className="hotel-detail-hero__info">
          <Space wrap size={8}>
            <HotelStatusBadge status={hotel.status} />
            {hotel.starRating && (
              <Tag color="gold">
                <StarFilled aria-hidden="true" /> {hotel.starRating} Sao
              </Tag>
            )}
            <Tag color="blue">{hotel.cityName ?? 'Việt Nam'}</Tag>
            <Tag>
              Nhận phòng {hotel.checkInTime.slice(0, 5)} · Trả phòng{' '}
              {hotel.checkOutTime.slice(0, 5)}
            </Tag>
          </Space>

          <h1>{hotel.name}</h1>
          <p className="hotel-detail-hero__address">
            <EnvironmentOutlined aria-hidden="true" /> {hotel.address}
          </p>
          {hotel.description && (
            <p className="hotel-detail-hero__desc">{hotel.description}</p>
          )}
        </div>
      </header>

      <Tabs
        activeKey={activeTab}
        onChange={(nextKey) => setSearchParams({ tab: nextKey })}
        size="large"
        items={[
          {
            key: 'general',
            label: (
              <span>
                <EditOutlined aria-hidden="true" /> Hồ sơ &amp; Nội dung khách sạn
              </span>
            ),
            children: <HotelGeneralEditForm hotel={hotel} cities={cities} />,
          },
          {
            key: 'amenities',
            label: (
              <span>
                <AppstoreAddOutlined aria-hidden="true" /> Tiện ích khách sạn
              </span>
            ),
            children: (
              <HotelAmenitiesManager
                hotelId={hotel.id}
                initialAmenityIds={hotel.amenityIds}
              />
            ),
          },
          {
            key: 'rates',
            label: (
              <span>
                <CalendarOutlined aria-hidden="true" /> Bảng giá theo ngày
              </span>
            ),
            children: (
              <RoomTypeDailyRatesPanel
                hotelId={hotel.id}
                roomTypes={hotel.roomTypes}
              />
            ),
          },
          {
            key: 'finance',
            label: (
              <span>
                <FileProtectOutlined aria-hidden="true" /> Hợp đồng &amp; Phân quyền Tài chính
              </span>
            ),
            children: (
              <div className="stack-lg">
                <HotelContractsSection hotelId={hotel.id} ownerUserId={hotel.ownerUserId} />
                <FinancialAccessSection
                  hotelId={hotel.id}
                  defaultOwnerUserId={hotel.ownerUserId}
                  contracts={contracts}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
