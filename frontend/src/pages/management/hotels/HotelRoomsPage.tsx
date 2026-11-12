import { useState } from 'react'
import {
  AppstoreOutlined,
  BuildOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { Link, useNavigate } from 'react-router'
import { useHotelWorkspace } from '@/features/hotels'
import {
  EditRoomTypeModal,
  buildRoomEditPayload,
  useManagementRoomMutations,
  useManagementRoomTypesQuery,
  useManagementRoomsQuery,
} from '@/features/rooms'
import type { ManagementRoom, ManagementRoomType } from '@/features/rooms'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelRoomsPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const navigate = useNavigate()
  const { updateRoom } = useManagementRoomMutations(hotelId)
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms')
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | undefined>(undefined)

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Queries
  const roomTypesQuery = useManagementRoomTypesQuery(hotelId)
  const roomTypes = roomTypesQuery.data ?? []

  const roomsQuery = useManagementRoomsQuery(hotelId, {
    roomTypeId: selectedRoomTypeId,
    page: currentPage,
    size: pageSize,
  })
  const roomPage = roomsQuery.data
  const physicalRooms = roomPage?.items ?? []

  // Modal Sửa phòng vật lý
  const [editingRoom, setEditingRoom] = useState<ManagementRoom | null>(null)
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false)
  const [roomEditForm] = Form.useForm()

  // Modal Sửa loại phòng
  const [editingRoomType, setEditingRoomType] = useState<ManagementRoomType | null>(null)

  if (!hotel) return null

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Phòng' },
    { label: activeTab === 'rooms' ? 'Phòng vật lý' : 'Loại phòng' },
  ]

  // Render readiness badge
  const renderReadinessTag = (readiness: string, roomId: string) => {
    return (
      <Select
        size="small"
        value={readiness}
        className="w-28 text-xs"
        onChange={async (newStatus) => {
                      if (newStatus !== 'ready' && newStatus !== 'cleaning') return
          try {
            await updateRoom.mutateAsync({ roomId, payload: { status: newStatus } })
            message.success('Đã cập nhật trạng thái buồng phòng!')
          } catch (error) {
            message.error(error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại.')
          }
        }}
        options={[
          { value: 'ready', label: '🟢 Sẵn sàng' },
          { value: 'cleaning', label: '🟡 Cần dọn' },
          { value: 'dirty', label: 'Chưa sẵn sàng', disabled: true },
        ]}
      />
    )
  }

  // Handle submit Sửa phòng vật lý
  const handleSaveRoomEdit = async () => {
    if (!editingRoom) return
    try {
      const values = await roomEditForm.validateFields()
      setIsUpdatingRoom(true)
      await updateRoom.mutateAsync({ roomId: editingRoom.id, payload: buildRoomEditPayload(editingRoom, values) })
      message.success(`Đã cập nhật phòng ${values.roomNumber}!`)
      setEditingRoom(null)
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      message.error(error instanceof Error ? error.message : 'Cập nhật phòng thất bại.')
    } finally {
      setIsUpdatingRoom(false)
    }
  }

  return (
    <div className="hotel-rooms-page max-w-5xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="QUẢN LÝ PHÒNG &amp; LƯU TRÚ"
        title="Quản lý buồng phòng &amp; Hạng phòng"
        description="Theo dõi danh sách các phòng vật lý thực tế, trạng thái buồng phòng (sẵn sàng hoặc chưa sẵn sàng) và các hạng phòng phục vụ kinh doanh."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              navigate(
                `/hotels/${hotelId}/rooms/new?tab=${
                  activeTab === 'rooms'
                    ? roomTypes.length === 0
                      ? 'room-type'
                      : 'room'
                    : 'room-type'
                }`
              )
            }
            className="!bg-[#0b5f53] !rounded-xl font-semibold"
          >
            {activeTab === 'rooms'
              ? roomTypes.length === 0
                ? 'Thêm loại phòng trước'
                : 'Thêm phòng vật lý mới'
              : 'Thêm loại phòng mới'}
          </Button>
        }
      />

      {/* Tabs / Segmented switcher */}
      <div className="bg-white p-3 rounded-2xl border border-[#dce7e3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <Radio.Group
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="rooms" className="!rounded-l-lg">
            <BuildOutlined className="mr-1.5" /> Danh sách phòng vật lý ({roomPage?.totalItems ?? 0})
          </Radio.Button>
          <Radio.Button value="types" className="!rounded-r-lg">
            <AppstoreOutlined className="mr-1.5" /> Hạng / Loại phòng ({roomTypes.length})
          </Radio.Button>
        </Radio.Group>

        {activeTab === 'rooms' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#5f736e] whitespace-nowrap">Lọc theo loại:</span>
            <Select
              allowClear
              placeholder="Tất cả loại phòng"
              value={selectedRoomTypeId}
              onChange={(value) => { setSelectedRoomTypeId(value); setCurrentPage(0) }}
              className="w-full sm:w-52"
              size="small"
              options={roomTypes.map((rt) => ({ value: rt.id, label: rt.name }))}
            />
          </div>
        )}
      </div>

      {/* TAB 1: DANH SÁCH PHÒNG VẬT LÝ */}
      {activeTab === 'rooms' && (
        <>
          {roomsQuery.isPending ? (
            <PageLoading />
          ) : roomsQuery.isError ? (
            <ErrorState
              error={roomsQuery.error}
              onRetry={() => void roomsQuery.refetch()}
            />
          ) : physicalRooms.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#dce7e3] text-center shadow-xs">
              {roomTypes.length === 0 ? (
                <EmptyState
                  title="Chưa có loại phòng nào"
                  description="Khách sạn cần có ít nhất 1 loại phòng (hạng phòng như Standard, Deluxe...) trước khi có thể khởi tạo các số phòng vật lý thực tế."
                  action={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setActiveTab('types')
                        navigate(`/hotels/${hotelId}/rooms/new?tab=room-type`)
                      }}
                      className="!bg-[#0b5f53] !rounded-xl font-semibold mt-3"
                    >
                      Thêm loại phòng đầu tiên
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="Chưa có phòng vật lý nào"
                  description={
                    selectedRoomTypeId
                      ? 'Không có phòng nào thuộc loại phòng đã chọn.'
                      : 'Hãy tạo các số phòng vật lý thực tế của khách sạn (ví dụ: Phòng 101, 102...) để đưa vào vận hành đón khách.'
                  }
                  action={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate(`/hotels/${hotelId}/rooms/new?tab=room`)}
                      className="!bg-[#0b5f53] !rounded-xl font-semibold mt-3"
                    >
                      Thêm phòng vật lý mới
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#dce7e3] overflow-hidden shadow-xs">
              <Table
                dataSource={physicalRooms}
                rowKey="id"
                pagination={{ current: currentPage + 1, pageSize, total: roomPage?.totalItems ?? 0, showSizeChanger: true, onChange: (page, size) => { setCurrentPage(page - 1); setPageSize(size) } }}
                columns={[
                  {
                    title: 'Số phòng',
                    dataIndex: 'roomNumber',
                    key: 'roomNumber',
                    render: (roomNumber: string) => (
                      <span className="font-bold text-[#12211d] text-sm">{roomNumber}</span>
                    ),
                  },
                  {
                    title: 'Tầng',
                    dataIndex: 'floor',
                    key: 'floor',
                    render: (floor: string | null) => (
                      <span className="text-xs text-[#5f736e]">
                        {floor ? `Tầng ${floor}` : '—'}
                      </span>
                    ),
                  },
                  {
                    title: 'Loại phòng',
                    dataIndex: 'roomTypeId',
                    key: 'roomTypeId',
                    render: (roomTypeId: string) => {
                      const found = roomTypes.find((rt) => rt.id === roomTypeId)
                      return (
                        <span className="text-xs text-[#12211d] font-medium">
                          {found ? found.name : roomTypeId.slice(0, 8)}
                        </span>
                      )
                    },
                  },
                  {
                    title: 'Trạng thái buồng phòng',
                    dataIndex: 'readiness',
                    key: 'readiness',
                    render: (readiness: string, record) => renderReadinessTag(readiness, record.id),
                  },
                  {
                    title: 'Ngày vận hành',
                    dataIndex: 'operationalFrom',
                    key: 'operationalFrom',
                    render: (operationalFrom: string) => (
                      <span className="text-xs text-[#5f736e]">
                        {operationalFrom ? dayjs(operationalFrom).format('DD/MM/YYYY') : '—'}
                      </span>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    align: 'right',
                    render: (_, record) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingRoom(record)
                            roomEditForm.resetFields()
                            roomEditForm.setFieldsValue({
                              roomNumber: record.roomNumber,
                              floor: record.floor,
                              status: record.readiness,
                            })
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            navigate(
                              `/hotels/${hotelId}/rooms/physical/${record.id}/amenities`,
                            )
                          }
                        >
                          Tiện ích
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* TAB 2: HẠNG / LOẠI PHÒNG */}
      {activeTab === 'types' && (
        <>
          {roomTypesQuery.isPending ? (
            <PageLoading />
          ) : roomTypesQuery.isError ? (
            <ErrorState
              error={roomTypesQuery.error}
              onRetry={() => void roomTypesQuery.refetch()}
            />
          ) : roomTypes.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#dce7e3] text-center shadow-xs">
              <EmptyState
                title="Chưa có loại phòng nào"
                description="Hãy tạo loại phòng đầu tiên để khách sạn có thể thiết lập giá và tạo phòng vật lý."
                action={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/hotels/${hotelId}/rooms/new?tab=room-type`)}
                    className="!bg-[#0b5f53] mt-3"
                  >
                    Thêm loại phòng mới
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#dce7e3] overflow-hidden shadow-xs">
              <Table
                dataSource={roomTypes}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Tên loại phòng',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name: string, record) => (
                      <div>
                        <Link
                          to={`/hotels/${hotelId}/rooms/${record.id}`}
                          className="font-bold text-[#12211d] hover:text-[#0b5f53]"
                        >
                          {name}
                        </Link>
                        {record.description && (
                          <div className="text-xs text-[#5f736e] line-clamp-1 mt-0.5">
                            {record.description}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: 'Sức chứa',
                    key: 'capacity',
                    render: (_, record) => (
                      <div className="text-xs text-[#344a44] flex items-center gap-1.5">
                        <UserOutlined />
                        <span>{record.maxAdults} người lớn</span>
                        {(record.maxChildren ?? 0) > 0 && <span>· {record.maxChildren} trẻ em</span>}
                      </div>
                    ),
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'active',
                    key: 'active',
                    render: (active: boolean) => (
                      <Tag color={active ? 'green' : 'default'} className="!rounded-md text-xs">
                        {active ? 'Đang kích hoạt' : 'Tạm ngưng'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    align: 'right',
                    render: (_, record) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setEditingRoomType(record)}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/hotels/${hotelId}/rooms/${record.id}`)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* MODAL SỬA PHÒNG VẬT LÝ (HT21: UpdateRoomRequest) */}
      <Modal
        title={`Chỉnh sửa phòng ${editingRoom?.roomNumber || ''}`}
        open={Boolean(editingRoom)}
        onCancel={() => setEditingRoom(null)}
        onOk={handleSaveRoomEdit}
        confirmLoading={isUpdatingRoom}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        okButtonProps={{ className: '!bg-[#0b5f53]' }}
      >
        <Form form={roomEditForm} layout="vertical" className="mt-4">
          <Form.Item
            label="Số phòng"
            name="roomNumber"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
          >
            <Input maxLength={50} />
          </Form.Item>

          <Form.Item label="Tầng" name="floor">
            <Input placeholder="VD: 1, 2, 3..." />
          </Form.Item>

          <Form.Item label="Hoạt động" name="active" help="Để trống để giữ nguyên. Mở lại phòng sẽ xóa ngày kết thúc phục vụ.">
            <Select allowClear placeholder="Giữ nguyên" options={[{ value: true, label: 'Sử dụng' }, { value: false, label: 'Ngừng sử dụng' }]} />
          </Form.Item>
          <Form.Item label="Trạng thái buồng phòng" name="status" help="DIRTY chỉ có nghĩa chưa sẵn sàng; backend chưa phân biệt dọn dẹp và bảo trì.">
            <Select
              options={[
                { value: 'ready', label: '🟢 Sẵn sàng phục vụ (ready)' },
                { value: 'cleaning', label: '🟡 Cần dọn (DIRTY)' },
                { value: 'dirty', label: 'Chưa sẵn sàng (DIRTY)', disabled: true },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa loại phòng */}
      <EditRoomTypeModal
        open={Boolean(editingRoomType)}
        roomType={editingRoomType}
        hotelId={hotelId}
        onClose={() => setEditingRoomType(null)}
      />
    </div>
  )
}
