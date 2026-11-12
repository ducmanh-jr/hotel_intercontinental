import { useState } from 'react'
import { z } from 'zod'
import dayjs from 'dayjs'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { PageLoading } from '@/shared/ui/PageLoading'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { useInventory } from '../hooks/use-inventory'
import {
  inventoryRangeSchema,
  blockFormSchema,
  releaseFormSchema,
} from '../model/inventory'
import type { RoomBlock } from '../api/inventory-api'

export function RoomInventoryPanel({
  hotelId,
  hotelStatus,
}: {
  hotelId: string
  hotelStatus: string
}) {
  const { message } = App.useApp()
  const isHotelActive = hotelStatus === 'ACTIVE'

  const [range, setRange] = useState({
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(6, 'day').format('YYYY-MM-DD'),
  })

  const { calendar, blocks, mutation } = useInventory(
    hotelId,
    range,
    isHotelActive,
  )

  const dates = useForm<z.infer<typeof inventoryRangeSchema>>({
    resolver: zodResolver(inventoryRangeSchema),
    defaultValues: range,
  })

  const blockForm = useForm<z.infer<typeof blockFormSchema>>({
    resolver: zodResolver(blockFormSchema),
  })

  const releaseForm = useForm<z.infer<typeof releaseFormSchema>>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: { reason: '' },
  })

  const [blockOpen, setBlockOpen] = useState(false)
  const [editing, setEditing] = useState<RoomBlock | null>(null)
  const [releasing, setReleasing] = useState<RoomBlock | null>(null)

  // Nếu khách sạn chưa ACTIVE (ví dụ Bản nháp)
  if (!isHotelActive) {
    return (
      <section className="bg-white rounded-2xl border border-[#dce7e3] p-6 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b5f53]">
            VẬN HÀNH BUỒNG PHÒNG
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12211d] mt-0.5 mb-1">
            Tồn kho &amp; Lịch phòng
          </h2>
          <p className="text-xs text-[#5f736e] m-0">
            Theo dõi số lượng buồng phòng khả dụng theo ngày và quản lý lịch bảo trì, chặn phòng vật lý.
          </p>
        </div>

        <Alert
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Chức năng Tồn kho & Chặn phòng chỉ khả dụng khi khách sạn Đang hoạt động"
          description={
            <div className="space-y-2.5 mt-1">
              <p className="text-xs text-[#344a44] m-0 leading-relaxed">
                Khách sạn hiện đang ở trạng thái <strong>Bản nháp</strong>. Hệ thống quản lý tồn kho và buồng phòng vật lý theo lịch sẽ tự động được kích hoạt sau khi cơ sở lưu trú hoàn tất thông tin và được chuyển sang trạng thái <strong>Hoạt động (ACTIVE)</strong>.
              </p>
              <div>
                <Button
                  size="small"
                  type="primary"
                  className="!bg-[#0b5f53] hover:!bg-[#08473e] !rounded-lg text-xs"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/hotels/${hotelId}`
                    }
                  }}
                >
                  Kiểm tra tiến độ hoàn thiện cơ sở
                </Button>
              </div>
            </div>
          }
          className="!rounded-xl !p-4"
        />
      </section>
    )
  }

  const rows =
    calendar.data?.roomTypes.flatMap((type) =>
      type.dailySummaries.map((summary) => ({
        ...summary,
        key: `${type.roomTypeId}:${summary.date}`,
        name: type.roomTypeName,
      })),
    ) ?? []

  const physical =
    calendar.data?.roomTypes.flatMap((type) =>
      type.rooms.map((room) => ({ ...room, typeName: type.roomTypeName })),
    ) ?? []

  const openBlock = (block?: RoomBlock) => {
    setEditing(block ?? null)
    blockForm.reset(
      block
        ? {
            roomId: block.roomId,
            startDate: block.startDate,
            endDate: block.endDate,
            reason: block.reason,
          }
        : { roomId: '', ...range, reason: '' },
    )
    setBlockOpen(true)
  }

  return (
    <section className="bg-white rounded-2xl border border-[#dce7e3] p-6 shadow-xs space-y-6">
      {/* Header khu vực Tồn kho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dce7e3]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b5f53]">
            VẬN HÀNH BUỒNG PHÒNG
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12211d] mt-0.5 mb-1">
            Tồn kho &amp; Lịch phòng
          </h2>
          <p className="text-xs text-[#5f736e] m-0">
            Số phòng khả dụng được cập nhật từ hệ thống lưu trú. Khoảng ngày bao gồm cả ngày kết thúc.
          </p>
        </div>

        <Button
          type="primary"
          icon={<StopOutlined />}
          onClick={() => openBlock()}
          disabled={!physical.length || mutation.isPending}
          className="!bg-[#0b5f53] hover:!bg-[#08473e] !rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          Chặn phòng mới
        </Button>
      </div>

      {/* Toolbar lọc khoảng ngày */}
      <form
        onSubmit={dates.handleSubmit((values) => {
          setRange(values)
          if (
            values.startDate === range.startDate &&
            values.endDate === range.endDate
          ) {
            void calendar.refetch()
            void blocks.refetch()
          }
        })}
        className="bg-[#fafdfc] p-4 rounded-xl border border-[#dce7e3] flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#12211d]">
            Khoảng ngày tồn kho:
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              {...dates.register('startDate')}
              className="w-36 !rounded-lg text-xs"
            />
            <span className="text-[#5f736e] font-semibold">→</span>
            <Input
              type="date"
              {...dates.register('endDate')}
              className="w-36 !rounded-lg text-xs"
            />
          </div>
          <Button
            htmlType="submit"
            loading={calendar.isFetching || blocks.isFetching}
            className="!rounded-lg text-xs"
          >
            Tra cứu tồn kho
          </Button>
        </div>

        {Object.entries(dates.formState.errors).map(([field, error]) => (
          <p role="alert" key={field} className="text-xs text-red-500 m-0 w-full">
            {error?.message}
          </p>
        ))}
      </form>

      {mutation.isError && (
        <Alert
          type="error"
          title="Không thể lưu thay đổi"
          description={errorMessage(mutation.error)}
          showIcon
          className="!rounded-xl"
        />
      )}

      {/* 1. Bảng số lượng tồn phòng theo ngày */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#12211d] m-0 flex items-center gap-2">
          <CalendarOutlined className="text-[#0b5f53]" />
          <span>Biểu tổng hợp buồng phòng theo ngày</span>
        </h3>

        {calendar.isPending ? (
          <PageLoading />
        ) : calendar.isError ? (
          <Alert
            type="error"
            showIcon
            message="Chưa thể tải dữ liệu lịch tồn kho phòng"
            description={
              <div className="space-y-2 text-xs">
                <p className="m-0">{errorMessage(calendar.error)}</p>
                <div>
                  <Button
                    size="small"
                    onClick={() => void calendar.refetch()}
                    className="text-xs"
                  >
                    Thử lại
                  </Button>
                </div>
                {Boolean(
                  calendar.error &&
                    typeof calendar.error === 'object' &&
                    'traceId' in calendar.error,
                ) && (
                  <details className="text-[11px] text-gray-500 pt-1">
                    <summary className="cursor-pointer">Chi tiết kỹ thuật</summary>
                    <div className="mt-1 font-mono">
                      Mã tra cứu: {(calendar.error as { traceId?: string }).traceId}
                    </div>
                  </details>
                )}
              </div>
            }
            className="!rounded-xl"
          />
        ) : (
          <div className="border border-[#dce7e3] rounded-xl overflow-hidden shadow-xs">
            <Table
              size="small"
              rowKey="key"
              dataSource={rows}
              scroll={{ x: 700 }}
              pagination={{ pageSize: 14 }}
              locale={{
                emptyText: 'Chưa có dữ liệu tồn kho trong khoảng ngày đã chọn.',
              }}
              columns={[
                {
                  title: 'Hạng phòng',
                  dataIndex: 'name',
                  render: (name: string) => (
                    <span className="font-semibold text-xs text-[#12211d]">{name}</span>
                  ),
                },
                {
                  title: 'Ngày',
                  dataIndex: 'date',
                  render: (val: string) => <span className="text-xs font-mono">{val}</span>,
                },
                {
                  title: 'Đang phục vụ',
                  dataIndex: 'operationalRooms',
                  align: 'center',
                  render: (val: number) => <span className="text-xs">{val}</span>,
                },
                {
                  title: 'Bị chặn',
                  dataIndex: 'blockedRooms',
                  align: 'center',
                  render: (val: number) => (
                    <span className={`text-xs ${val > 0 ? 'text-amber-600 font-bold' : ''}`}>
                      {val}
                    </span>
                  ),
                },
                {
                  title: 'Đã giữ / Đặt',
                  dataIndex: 'reservedRooms',
                  align: 'center',
                  render: (val: number) => (
                    <span className={`text-xs ${val > 0 ? 'text-blue-600 font-bold' : ''}`}>
                      {val}
                    </span>
                  ),
                },
                {
                  title: 'Còn trống',
                  dataIndex: 'availableRooms',
                  align: 'center',
                  render: (val: number) => (
                    <Tag
                      color={val > 0 ? 'green' : 'default'}
                      className="!rounded-md text-xs font-bold"
                    >
                      {val}
                    </Tag>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* 2. Trạng thái buồng phòng vật lý */}
      {calendar.isSuccess && physical.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#12211d] m-0">
            Trạng thái buồng phòng vật lý
          </h3>
          <div className="border border-[#dce7e3] rounded-xl overflow-hidden shadow-xs">
            <Table
              size="small"
              rowKey="roomId"
              dataSource={physical}
              scroll={{ x: 550 }}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Chưa có phòng vật lý trong hạng đang bán.' }}
              columns={[
                {
                  title: 'Số phòng',
                  dataIndex: 'roomNumber',
                  render: (val: string) => (
                    <span className="font-bold text-xs text-[#12211d]">{val}</span>
                  ),
                },
                {
                  title: 'Hạng phòng',
                  dataIndex: 'typeName',
                  render: (val: string) => <span className="text-xs text-[#5f736e]">{val}</span>,
                },
                {
                  title: 'Tầng',
                  dataIndex: 'floor',
                  render: (val: string | null) => (
                    <span className="text-xs text-[#5f736e]">{val ? `Tầng ${val}` : '—'}</span>
                  ),
                },
                {
                  title: 'Trạng thái sẵn sàng',
                  render: (_, room) => (
                    <Select
                      size="small"
                      aria-label={`Trạng thái phòng ${room.roomNumber}`}
                      value={room.readiness}
                      disabled={mutation.isPending}
                      className="w-32 text-xs"
                      options={[
                        { value: 'READY', label: '🟢 Sẵn sàng (READY)' },
                        { value: 'DIRTY', label: '🟡 Cần dọn (DIRTY)' },
                      ]}
                      onChange={async (readiness: 'READY' | 'DIRTY') => {
                        try {
                          await mutation.mutateAsync({
                            kind: 'readiness',
                            roomId: room.roomId,
                            readiness,
                          })
                          void message.success('Đã cập nhật trạng thái phòng.')
                        } catch {
                          /* Error is rendered above. */
                        }
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* 3. Lịch chặn phòng */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#12211d] m-0">
            Lịch chặn / bảo trì phòng
          </h3>
        </div>

        {blocks.isPending ? (
          <PageLoading />
        ) : blocks.isError ? (
          <Alert
            type="error"
            showIcon
            message="Chưa thể tải danh sách lịch chặn phòng"
            description={
              <div className="space-y-2 text-xs">
                <p className="m-0">{errorMessage(blocks.error)}</p>
                <div>
                  <Button
                    size="small"
                    onClick={() => void blocks.refetch()}
                    className="text-xs"
                  >
                    Thử lại
                  </Button>
                </div>
                {Boolean(
                  blocks.error &&
                    typeof blocks.error === 'object' &&
                    'traceId' in blocks.error,
                ) && (
                  <details className="text-[11px] text-gray-500 pt-1">
                    <summary className="cursor-pointer">Chi tiết kỹ thuật</summary>
                    <div className="mt-1 font-mono">
                      Mã tra cứu: {(blocks.error as { traceId?: string }).traceId}
                    </div>
                  </details>
                )}
              </div>
            }
            className="!rounded-xl"
          />
        ) : (
          <div className="border border-[#dce7e3] rounded-xl overflow-hidden shadow-xs">
            <Table
              size="small"
              rowKey="id"
              dataSource={blocks.data}
              scroll={{ x: 750 }}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Không có lịch chặn trong khoảng ngày đã chọn.' }}
              columns={[
                {
                  title: 'Phòng',
                  render: (_, block) => (
                    <span className="font-semibold text-xs text-[#12211d]">
                      {physical.find((room) => room.roomId === block.roomId)?.roomNumber ??
                        block.roomId.slice(0, 8)}
                    </span>
                  ),
                },
                {
                  title: 'Từ ngày',
                  dataIndex: 'startDate',
                  render: (val: string) => <span className="text-xs font-mono">{val}</span>,
                },
                {
                  title: 'Đến ngày',
                  dataIndex: 'endDate',
                  render: (val: string) => <span className="text-xs font-mono">{val}</span>,
                },
                {
                  title: 'Lý do',
                  dataIndex: 'reason',
                  render: (val: string) => <span className="text-xs">{val}</span>,
                },
                {
                  title: 'Trạng thái',
                  render: (_, block) => (
                    <Tag
                      color={block.status === 'ACTIVE' ? 'red' : 'default'}
                      className="!rounded-md text-xs"
                    >
                      {block.status === 'ACTIVE' ? 'Đang chặn' : 'Đã giải phóng'}
                    </Tag>
                  ),
                },
                {
                  title: 'Thao tác',
                  render: (_, block) =>
                    block.status === 'ACTIVE' && (
                      <Space>
                        <Button
                          size="small"
                          disabled={mutation.isPending}
                          onClick={() => openBlock(block)}
                          className="text-xs"
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          disabled={mutation.isPending}
                          onClick={() => {
                            releaseForm.reset({ reason: '' })
                            setReleasing(block)
                          }}
                          className="text-xs"
                        >
                          Giải phóng
                        </Button>
                      </Space>
                    ),
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Modal Tạo/Sửa lịch chặn */}
      <Modal
        title={editing ? 'Sửa lịch chặn phòng' : 'Tạo lịch chặn phòng mới'}
        open={blockOpen}
        onCancel={() => {
          if (!mutation.isPending) setBlockOpen(false)
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          className="space-y-3 pt-2"
          onFinish={blockForm.handleSubmit(async (values) => {
            if (mutation.isPending) return
            try {
              const { roomId, ...payload } = values
              await mutation.mutateAsync(
                editing
                  ? { kind: 'update', blockId: editing.id, payload }
                  : { kind: 'create', payload: { ...payload, roomId } },
              )
              setBlockOpen(false)
              void message.success('Đã lưu lịch chặn phòng.')
            } catch (error) {
              applyApiFieldErrors(error, blockForm.setError)
              blockForm.setError('root', { message: errorMessage(error) })
            }
          })}
        >
          <Form.Item label="Phòng vật lý" required>
            <Controller
              name="roomId"
              control={blockForm.control}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full"
                  aria-label="Phòng cần chặn"
                  disabled={Boolean(editing) || mutation.isPending}
                  options={physical.map((room) => ({
                    value: room.roomId,
                    label: `${room.roomNumber} — ${room.typeName}`,
                  }))}
                />
              )}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Từ đêm" required>
              <Input type="date" {...blockForm.register('startDate')} />
            </Form.Item>
            <Form.Item label="Đến hết đêm" required>
              <Input type="date" {...blockForm.register('endDate')} />
            </Form.Item>
          </div>

          <Form.Item label="Lý do chặn phòng" required>
            <Input.TextArea
              {...blockForm.register('reason')}
              maxLength={255}
              placeholder="VD: Bảo trì điều hòa, sửa chữa đường ống..."
              rows={3}
            />
          </Form.Item>

          {Object.entries(blockForm.formState.errors).map(([field, error]) => (
            <p role="alert" key={field} className="text-xs text-red-500 m-0">
              {error?.message}
            </p>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setBlockOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              className="!bg-[#0b5f53]"
            >
              Lưu lịch chặn
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Giải phóng lịch chặn */}
      <Modal
        title="Giải phóng lịch chặn phòng"
        open={Boolean(releasing)}
        onCancel={() => {
          if (!mutation.isPending) setReleasing(null)
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          className="space-y-3 pt-2"
          onFinish={releaseForm.handleSubmit(async (values) => {
            if (!releasing || mutation.isPending) return
            try {
              await mutation.mutateAsync({
                kind: 'release',
                blockId: releasing.id,
                reason: values.reason,
              })
              setReleasing(null)
              void message.success('Đã giải phóng lịch chặn.')
            } catch (error) {
              releaseForm.setError('root', { message: errorMessage(error) })
            }
          })}
        >
          <Form.Item label="Lý do giải phóng" required>
            <Input.TextArea
              {...releaseForm.register('reason')}
              maxLength={255}
              placeholder="VD: Đã hoàn tất bảo trì trước hạn..."
              rows={3}
            />
          </Form.Item>

          {releaseForm.formState.errors.reason && (
            <p role="alert" className="text-xs text-red-500 m-0">
              {releaseForm.formState.errors.reason.message}
            </p>
          )}
          {releaseForm.formState.errors.root && (
            <p role="alert" className="text-xs text-red-500 m-0">
              {releaseForm.formState.errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setReleasing(null)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              className="!bg-[#0b5f53]"
            >
              Giải phóng lịch chặn
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  )
}
