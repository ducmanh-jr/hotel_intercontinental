import { useState } from 'react'
import {
  ArrowLeftOutlined,
  BuildOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router'
import { useHotelWorkspace } from '@/features/hotels'
import {
  EditRoomTypeModal,
  buildRoomEditPayload,
  useManagementRoomMutations,
  useManagementRoomTypesQuery,
  useManagementRoomsQuery,
} from '@/features/rooms'
import type { ManagementRoom } from '@/features/rooms'
import { ErrorState } from '@/shared/ui/ErrorState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'

export function HotelRoomDetailPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const { roomId = '' } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { createRoom, updateRoom } = useManagementRoomMutations(hotelId)

  const roomTypesQuery = useManagementRoomTypesQuery(hotelId)
  const roomType = roomTypesQuery.data?.find((rt) => rt.id === roomId)

  const [roomPage, setRoomPage] = useState(0)
  const [roomPageSize, setRoomPageSize] = useState(20)

  // Danh sách phòng vật lý thuộc loại này
  const roomsQuery = useManagementRoomsQuery(hotelId, { roomTypeId: roomId, page: roomPage, size: roomPageSize })
  const physicalRooms = roomsQuery.data?.items ?? []

  // Modal Sửa loại phòng
  const [isEditingType, setIsEditingType] = useState(false)

  // Modal Thêm phòng vật lý
  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false)
  const [addRoomForm] = Form.useForm()

  // Modal Sửa phòng vật lý
  const [editingRoom, setEditingRoom] = useState<ManagementRoom | null>(null)
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false)
  const [roomEditForm] = Form.useForm()

  if (!hotel) return null

  if (roomTypesQuery.isPending) {
    return <PageLoading />
  }

  if (roomTypesQuery.isError) return <ErrorState error={roomTypesQuery.error} onRetry={() => void roomTypesQuery.refetch()} />
  if (!roomType) return <EmptyState title="Không tìm thấy loại phòng" description="Loại phòng không tồn tại trong khách sạn này." />

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Phòng', to: `/hotels/${hotelId}/rooms` },
    { label: roomType?.name || 'Chi tiết' },
  ]

  // Submit thêm phòng vật lý
  const handleCreatePhysicalRoom = async () => {
    try {
      const values = await addRoomForm.validateFields()
      setIsSubmittingRoom(true)
      await createRoom.mutateAsync({
        roomTypeId: roomId,
        roomNumber: values.roomNumber.trim(),
        floor: values.floor?.trim() || undefined,
        operationalFrom: dayjs(values.operationalFrom).toISOString(),
        operationalUntil: values.operationalUntil ? dayjs(values.operationalUntil).toISOString() : undefined,
      })
      message.success(`Đã thêm phòng ${values.roomNumber}!`)
      setIsAddingRoom(false)
      addRoomForm.resetFields()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      message.error(error instanceof Error ? error.message : 'Thêm phòng thất bại.')
    } finally {
      setIsSubmittingRoom(false)
    }
  }

  // Submit sửa phòng vật lý
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
    <div className="hotel-room-detail-page max-w-4xl space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="CHI TIẾT HẠNG PHÒNG"
        title={roomType?.name || 'Chi tiết loại phòng'}
        description="Thông tin chi tiết về sức chứa, mô tả và cấu hình phòng vật lý thuộc hạng phòng này."
        extra={
          <div className="flex items-center gap-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/hotels/${hotelId}/rooms`)}
            >
              Quay lại danh sách
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditingType(true)}
              className="!bg-[#0b5f53]"
            >
              Chỉnh sửa loại phòng
            </Button>
          </div>
        }
      />

      {/* Thông tin hạng phòng */}
      <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#dce7e3] mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#12211d] m-0">{roomType?.name}</h2>
            <div className="text-xs text-[#5f736e] mt-1">Mã loại phòng: {roomId}</div>
          </div>
          <Tag color={roomType?.active ?? true ? 'green' : 'default'} className="!rounded-md">
            {roomType?.active ?? true ? 'Đang kích hoạt' : 'Tạm ngưng'}
          </Tag>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="bg-[#f7fbfa] p-3 rounded-xl border border-[#dce7e3]">
            <div className="text-[11px] text-[#5f736e]">Người lớn tối đa</div>
            <div className="text-base font-bold text-[#12211d] mt-1">{roomType?.maxAdults ?? 2}</div>
          </div>
          <div className="bg-[#f7fbfa] p-3 rounded-xl border border-[#dce7e3]">
            <div className="text-[11px] text-[#5f736e]">Trẻ em tối đa</div>
            <div className="text-base font-bold text-[#12211d] mt-1">{roomType?.maxChildren ?? 0}</div>
          </div>
          <div className="bg-[#f7fbfa] p-3 rounded-xl border border-[#dce7e3]">
            <div className="text-[11px] text-[#5f736e]">Số lượng phòng vật lý</div>
            <div className="text-base font-bold text-[#0b5f53] mt-1">{roomsQuery.data?.totalItems ?? 0} phòng</div>
          </div>
        </div>

        {roomType?.description && (
          <div className="mt-4 pt-4 border-t border-[#dce7e3]">
            <div className="text-xs font-semibold text-[#12211d] mb-1">Mô tả loại phòng:</div>
            <p className="text-xs text-[#5f736e] leading-relaxed m-0">{roomType.description}</p>
          </div>
        )}
      </div>

      {/* Danh sách phòng vật lý thuộc hạng này */}
      <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#12211d] m-0 flex items-center gap-2">
              <BuildOutlined className="text-[#0b5f53]" />
              <span>Danh sách phòng vật lý thuộc hạng này ({roomsQuery.data?.totalItems ?? 0})</span>
            </h3>
            <p className="text-xs text-[#5f736e] mt-1 mb-0">
              Các số phòng cụ thể đã được gán vào hạng phòng {roomType?.name}.
            </p>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              addRoomForm.resetFields()
              addRoomForm.setFieldsValue({
                operationalFrom: dayjs(),
              })
              setIsAddingRoom(true)
            }}
            className="!bg-[#0b5f53]"
          >
            Thêm số phòng
          </Button>
        </div>

        {roomsQuery.isPending ? <PageLoading /> : roomsQuery.isError ? <ErrorState error={roomsQuery.error} onRetry={() => void roomsQuery.refetch()} /> : physicalRooms.length === 0 ? (
          <div className="py-6 text-center bg-[#f7fbfa] rounded-xl border border-dashed border-[#dce7e3]">
            <EmptyState
              title="Chưa có phòng vật lý nào được gán vào hạng này"
              description="Bấm 'Thêm số phòng' để thêm các số phòng cụ thể thuộc hạng này."
            />
          </div>
        ) : (
          <Table
            dataSource={physicalRooms}
            rowKey="id"
            pagination={{ current: roomPage + 1, pageSize: roomPageSize, total: roomsQuery.data?.totalItems ?? 0, showSizeChanger: true, onChange: (page, size) => { setRoomPage(page - 1); setRoomPageSize(size) } }}
            columns={[
              {
                title: 'Số phòng',
                dataIndex: 'roomNumber',
                key: 'roomNumber',
                render: (val: string) => <span className="font-bold text-[#12211d]">{val}</span>,
              },
              {
                title: 'Tầng',
                dataIndex: 'floor',
                key: 'floor',
                render: (val: string | null) => <span>{val ? `Tầng ${val}` : '—'}</span>,
              },
              {
                title: 'Trạng thái buồng phòng',
                dataIndex: 'readiness',
                key: 'readiness',
                render: (readiness: string, record) => (
                  <Select
                    size="small"
                    value={readiness}
                    className="w-28 text-xs"
                    onChange={async (newStatus) => {
                      if (newStatus !== 'ready' && newStatus !== 'cleaning') return
                      try {
                        await updateRoom.mutateAsync({ roomId: record.id, payload: { status: newStatus } })
                        message.success('Đã cập nhật trạng thái buồng phòng!')
                      } catch (error) {
                        message.error(error instanceof Error ? error.message : 'Thất bại.')
                      }
                    }}
                    options={[
                      { value: 'ready', label: '🟢 Sẵn sàng' },
                      { value: 'cleaning', label: '🟡 Cần dọn' },
                      { value: 'dirty', label: 'Chưa sẵn sàng', disabled: true },
                    ]}
                  />
                ),
              },
              {
                title: 'Ngày vận hành',
                dataIndex: 'operationalFrom',
                key: 'operationalFrom',
                render: (val: string) => (
                  <span className="text-xs text-[#5f736e]">
                    {val ? dayjs(val).format('DD/MM/YYYY') : '—'}
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
        )}
      </div>

      {/* Modal chỉnh sửa loại phòng */}
      <EditRoomTypeModal
        open={isEditingType}
        roomType={roomType}
        hotelId={hotelId}
        onClose={() => setIsEditingType(false)}
      />

      {/* MODAL THÊM PHÒNG VẬT LÝ VÀO HẠNG NÀY (HT20) */}
      <Modal
        title={`Thêm số phòng vật lý vào hạng ${roomType?.name || ''}`}
        open={isAddingRoom}
        onCancel={() => setIsAddingRoom(false)}
        onOk={handleCreatePhysicalRoom}
        confirmLoading={isSubmittingRoom}
        okText="Tạo phòng"
        cancelText="Hủy"
        okButtonProps={{ className: '!bg-[#0b5f53]' }}
      >
        <Form form={addRoomForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Số phòng"
              name="roomNumber"
              rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
            >
              <Input placeholder="VD: 101, 102..." maxLength={20} />
            </Form.Item>

            <Form.Item label="Tầng" name="floor">
              <Input placeholder="VD: 1, 2, 3..." maxLength={20} />
            </Form.Item>
          </div>

          <Form.Item
            label="Thời điểm bắt đầu phục vụ"
            name="operationalFrom"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Thời điểm kết thúc phục vụ (Tùy chọn)" name="operationalUntil">
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Để trống nếu vô thời hạn" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL SỬA PHÒNG VẬT LÝ (HT21) */}
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
    </div>
  )
}
