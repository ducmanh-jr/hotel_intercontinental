import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  message,
} from 'antd'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeftOutlined, BuildOutlined, AppstoreAddOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useHotelWorkspace } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'
import {
  useManagementRoomMutations,
  useManagementRoomTypesQuery,
  type UpdateRoomTypePayload,
} from '@/features/rooms'

// Schema cho Tạo Phòng Vật Lý (HT20)
const createPhysicalRoomSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Số phòng không được để trống').max(20, 'Số phòng tối đa 20 ký tự'),
  roomTypeId: z.string().uuid('Vui lòng chọn loại phòng'),
  floor: z.string().trim().max(20, 'Tầng tối đa 20 ký tự').optional(),
  operationalFrom: z.custom<dayjs.Dayjs>((value) => dayjs.isDayjs(value) && value.isValid(), 'Vui lòng chọn ngày bắt đầu phục vụ'),
  operationalUntil: z.custom<dayjs.Dayjs>((value) => dayjs.isDayjs(value) && value.isValid(), 'Ngày kết thúc không hợp lệ').nullish(),
})

type CreatePhysicalRoomFormValues = z.infer<typeof createPhysicalRoomSchema>

// Schema cho Tạo Loại Phòng (HT16 + Cấu hình bổ sung)
const createRoomTypeSchema = z.object({
  name: z.string().trim().min(1, 'Tên loại phòng không được để trống').max(100, 'Tên loại phòng tối đa 100 ký tự'),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự').optional().or(z.literal('')),
  maxAdults: z.number({ message: 'Vui lòng nhập số người lớn' }).int().min(1, 'Tối thiểu 1 người lớn').max(32767, 'Vượt quá giới hạn cho phép'),
  maxChildren: z.number({ message: 'Vui lòng nhập số trẻ em' }).int().min(0, 'Số trẻ em không được âm').max(32767, 'Vượt quá giới hạn cho phép'),
  basePrice: z
    .number()
    .min(0, 'Giá cơ bản không được âm')
    .max(Number.MAX_SAFE_INTEGER, 'Giá quá lớn')
    .nullable()
    .optional(),
  active: z.boolean(),
})

type CreateRoomTypeFormValues = z.infer<typeof createRoomTypeSchema>

export function HotelRoomCreatePage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const navigate = useNavigate()
  const { createRoom, createRoomType, updateRoomType } = useManagementRoomMutations(hotelId)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'room-type' ? 'room-type' : 'room'
  const [activeTab, setActiveTab] = useState<'room' | 'room-type'>(initialTab)

  const roomTypesQuery = useManagementRoomTypesQuery(hotelId)
  const roomTypes = useMemo(() => roomTypesQuery.data ?? [], [roomTypesQuery.data])

  // Trạng thái theo dõi luồng tạo 2 bước cho loại phòng
  const [createdRoomTypeId, setCreatedRoomTypeId] = useState<string | null>(null)
  const [roomTypeError, setRoomTypeError] = useState<string | null>(null)
  const [isSubmittingRoomType, setIsSubmittingRoomType] = useState(false)

  // Form 1: Tạo phòng vật lý
  const roomForm = useForm<CreatePhysicalRoomFormValues>({
    resolver: zodResolver(createPhysicalRoomSchema),
    defaultValues: {
      roomNumber: '',
      roomTypeId: roomTypes[0]?.id || '',
      floor: '',
      operationalFrom: dayjs(),
      operationalUntil: null,
    },
  })

  // Form 2: Tạo loại phòng
  const roomTypeForm = useForm<CreateRoomTypeFormValues>({
    resolver: zodResolver(createRoomTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      maxAdults: 2,
      maxChildren: 0,
      basePrice: null,
      active: true,
    },
  })

  // Theo dõi số người để hiển thị tóm tắt sức chứa thân thiện
  const watchedAdults = useWatch({ control: roomTypeForm.control, name: 'maxAdults' }) ?? 2
  const watchedChildren = useWatch({ control: roomTypeForm.control, name: 'maxChildren' }) ?? 0
  const totalOccupancy = watchedAdults + watchedChildren

  // Tự động gán roomTypeId mặc định cho form phòng vật lý khi danh sách loại phòng tải xong
  useEffect(() => {
    if (roomTypes.length > 0 && !roomForm.getValues('roomTypeId')) {
      roomForm.setValue('roomTypeId', roomTypes[0].id)
    }
  }, [roomTypes, roomForm])

  if (!hotel) return null

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Phòng', to: `/hotels/${hotelId}/rooms` },
    { label: activeTab === 'room' ? 'Thêm phòng vật lý mới' : 'Thêm loại phòng mới' },
  ]

  // Submit tạo phòng vật lý
  const onSubmitRoom = async (values: CreatePhysicalRoomFormValues) => {
    try {
      const fromDate = dayjs(values.operationalFrom).toISOString()
      const untilDate = values.operationalUntil ? dayjs(values.operationalUntil).toISOString() : undefined

      await createRoom.mutateAsync({
        roomTypeId: values.roomTypeId,
        roomNumber: values.roomNumber.trim(),
        floor: values.floor?.trim() || undefined,
        operationalFrom: fromDate,
        operationalUntil: untilDate,
      })

      message.success(`Đã tạo phòng ${values.roomNumber} thành công!`)
      navigate(`/hotels/${hotelId}/rooms`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Tạo phòng vật lý thất bại.')
    }
  }

  // Submit tạo loại phòng (luồng 2 bước mượt mà trong 1 lần nhấn)
  const onSubmitRoomType = async (values: CreateRoomTypeFormValues) => {
    setIsSubmittingRoomType(true)
    setRoomTypeError(null)

    let targetRoomTypeId = createdRoomTypeId

    try {
      // BƯỚC 1: Gọi POST nếu loại phòng chưa được tạo trước đó
      if (!targetRoomTypeId) {
        const created = await createRoomType.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          maxAdults: values.maxAdults,
          maxChildren: values.maxChildren,
        })
        targetRoomTypeId = created.id
        setCreatedRoomTypeId(created.id)
      }

      // BƯỚC 2: Gọi PATCH cấu hình bổ sung (sức chứa tổng đã duyệt, trạng thái mở bán, giá cơ bản nếu có)
      const patchPayload: UpdateRoomTypePayload = {
        maxAdults: values.maxAdults,
        maxChildren: values.maxChildren,
        maxOccupancy: totalOccupancy,
        active: values.active,
      }

      if (values.basePrice !== null && values.basePrice !== undefined) {
        patchPayload.basePrice = values.basePrice
      }

      await updateRoomType.mutateAsync({
        roomTypeId: targetRoomTypeId,
        payload: patchPayload,
      })

      message.success(`Đã tạo và thiết lập loại phòng "${values.name}" thành công!`)
      navigate(`/hotels/${hotelId}/rooms`)
    } catch (error) {
      if (targetRoomTypeId) {
        setRoomTypeError(
          'Loại phòng đã được tạo trong hệ thống, nhưng chưa hoàn tất lưu giá cơ bản hoặc trạng thái mở bán. Vui lòng kiểm tra và bấm "Thử lại lưu cấu hình".',
        )
      } else {
        setRoomTypeError(error instanceof Error ? error.message : 'Tạo loại phòng thất bại.')
      }
    } finally {
      setIsSubmittingRoomType(false)
    }
  }

  return (
    <div className="hotel-room-create-page max-w-4xl space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="QUẢN LÝ PHÒNG &amp; HẠNG PHÒNG"
        title={activeTab === 'room' ? 'Thêm số phòng vật lý mới' : 'Thêm hạng / loại phòng mới'}
        description={
          activeTab === 'room'
            ? 'Khởi tạo các số phòng thực tế (ví dụ: 101, 102...) và gán vào một hạng phòng đã có trong khách sạn.'
            : 'Định nghĩa tên hạng phòng, sức chứa lưu trú, giá cơ bản và trạng thái mở bán kinh doanh.'
        }
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/hotels/${hotelId}/rooms`)}
            className="!rounded-xl"
          >
            Quay lại danh sách
          </Button>
        }
      />

      {/* Switcher Tab: Phòng vật lý vs Loại phòng */}
      <div className="bg-white p-3 rounded-2xl border border-[#dce7e3] shadow-xs flex items-center justify-between">
        <Radio.Group
          value={activeTab}
          onChange={(e) => {
            setActiveTab(e.target.value)
            setSearchParams({ tab: e.target.value })
          }}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="room" className="!rounded-l-lg">
            <BuildOutlined className="mr-1.5" /> Thêm phòng vật lý
          </Radio.Button>
          <Radio.Button value="room-type" className="!rounded-r-lg">
            <AppstoreAddOutlined className="mr-1.5" /> Thêm loại phòng mới
          </Radio.Button>
        </Radio.Group>
      </div>

      {activeTab === 'room' ? (
        <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs">
          {roomTypes.length === 0 ? (
            <div className="py-8 text-center bg-[#f7fbfa] rounded-xl border border-dashed border-[#dce7e3]">
              <p className="text-sm font-semibold text-[#12211d] mb-1">
                Khách sạn chưa có loại phòng nào
              </p>
              <p className="text-xs text-[#5f736e] max-w-md mx-auto mb-4">
                Bạn cần tạo ít nhất một hạng phòng (ví dụ: Phòng Deluxe, Standard...) trước khi tạo các số phòng vật lý thực tế.
              </p>
              <Button
                type="primary"
                onClick={() => {
                  setActiveTab('room-type')
                  setSearchParams({ tab: 'room-type' })
                }}
                className="!bg-[#0b5f53]"
              >
                Chuyển sang tạo loại phòng ngay
              </Button>
            </div>
          ) : (
            <Form layout="vertical" onFinish={roomForm.handleSubmit(onSubmitRoom)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item
                  label="Gán vào loại phòng"
                  required
                  validateStatus={roomForm.formState.errors.roomTypeId ? 'error' : undefined}
                  help={roomForm.formState.errors.roomTypeId?.message}
                >
                  <Controller
                    control={roomForm.control}
                    name="roomTypeId"
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Chọn loại phòng"
                        options={roomTypes.map((rt) => ({
                          value: rt.id,
                          label: `${rt.name} (${rt.maxAdults} người lớn, ${rt.maxChildren} trẻ em)`,
                        }))}
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="Số phòng"
                  required
                  validateStatus={roomForm.formState.errors.roomNumber ? 'error' : undefined}
                  help={roomForm.formState.errors.roomNumber?.message}
                >
                  <Controller
                    control={roomForm.control}
                    name="roomNumber"
                    render={({ field }) => (
                      <Input {...field} placeholder="VD: 101, 102, 201..." maxLength={20} />
                    )}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Form.Item
                  label="Tầng"
                  validateStatus={roomForm.formState.errors.floor ? 'error' : undefined}
                  help={roomForm.formState.errors.floor?.message}
                >
                  <Controller
                    control={roomForm.control}
                    name="floor"
                    render={({ field }) => (
                      <Input {...field} placeholder="VD: 1, 2, 3..." maxLength={20} />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="Ngày bắt đầu phục vụ"
                  required
                  validateStatus={roomForm.formState.errors.operationalFrom ? 'error' : undefined}
                  help={roomForm.formState.errors.operationalFrom?.message}
                >
                  <Controller
                    control={roomForm.control}
                    name="operationalFrom"
                    render={({ field }) => (
                      <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="Ngày kết thúc phục vụ (Tùy chọn)"
                  validateStatus={roomForm.formState.errors.operationalUntil ? 'error' : undefined}
                  help={roomForm.formState.errors.operationalUntil?.message}
                >
                  <Controller
                    control={roomForm.control}
                    name="operationalUntil"
                    render={({ field }) => (
                      <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        placeholder="Để trống nếu vô thời hạn"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                      />
                    )}
                  />
                </Form.Item>
              </div>

              <div className="pt-4 border-t border-[#dce7e3] flex justify-end gap-3">
                <Button onClick={() => navigate(`/hotels/${hotelId}/rooms`)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={roomForm.formState.isSubmitting || createRoom.isPending}
                  icon={<SaveOutlined />}
                  disabled={roomTypes.length === 0}
                  className="!bg-[#0b5f53]"
                >
                  Tạo phòng vật lý
                </Button>
              </div>
            </Form>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs">
          {roomTypeError && (
            <Alert
              type="error"
              showIcon
              closable
              onClose={() => setRoomTypeError(null)}
              message="Thao tác chưa hoàn tất"
              description={roomTypeError}
              className="mb-4"
            />
          )}

          <Form layout="vertical" onFinish={roomTypeForm.handleSubmit(onSubmitRoomType)}>
            <Form.Item
              label="Tên loại phòng"
              required
              validateStatus={roomTypeForm.formState.errors.name ? 'error' : undefined}
              help={roomTypeForm.formState.errors.name?.message}
            >
              <Controller
                control={roomTypeForm.control}
                name="name"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: Phòng Deluxe Hướng Biển, Phòng Suite Tổng Thống..."
                    maxLength={100}
                    disabled={isSubmittingRoomType}
                  />
                )}
              />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label="Số người lớn tối đa"
                required
                validateStatus={roomTypeForm.formState.errors.maxAdults ? 'error' : undefined}
                help={roomTypeForm.formState.errors.maxAdults?.message}
              >
                <Controller
                  control={roomTypeForm.control}
                  name="maxAdults"
                  render={({ field }) => (
                    <InputNumber
                      min={1}
                      max={32767}
                      className="w-full"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 1)}
                      disabled={isSubmittingRoomType}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Số trẻ em tối đa"
                required
                validateStatus={roomTypeForm.formState.errors.maxChildren ? 'error' : undefined}
                help={roomTypeForm.formState.errors.maxChildren?.message}
              >
                <Controller
                  control={roomTypeForm.control}
                  name="maxChildren"
                  render={({ field }) => (
                    <InputNumber
                      min={0}
                      max={32767}
                      className="w-full"
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={isSubmittingRoomType}
                    />
                  )}
                />
              </Form.Item>
            </div>

            {/* Dòng tóm tắt sức chứa tự động theo quy tắc đã được duyệt */}
            <div className="mb-4 text-xs text-[#0b5f53] bg-[#f0f9f6] p-2.5 rounded-xl border border-[#cce3dc]">
              Tối đa <strong>{watchedAdults} người lớn</strong> và <strong>{watchedChildren} trẻ em</strong> (Sức chứa tổng: {totalOccupancy} khách)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label="Giá cơ bản mỗi đêm"
                validateStatus={roomTypeForm.formState.errors.basePrice ? 'error' : undefined}
                help={
                  roomTypeForm.formState.errors.basePrice?.message ??
                  'Giá phòng mặc định mỗi đêm khi chưa thiết lập bảng giá theo ngày'
                }
              >
                <Controller
                  control={roomTypeForm.control}
                  name="basePrice"
                  render={({ field }) => (
                    <InputNumber
                      min={0}
                      precision={0}
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : (null as unknown as number))}
                      addonAfter="VND/đêm"
                      placeholder="VD: 1,500,000"
                      className="w-full"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      disabled={isSubmittingRoomType}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label="Trạng thái mở bán">
                <div className="pt-1">
                  <Controller
                    control={roomTypeForm.control}
                    name="active"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        checkedChildren="Mở bán"
                        unCheckedChildren="Tạm ngưng"
                        disabled={isSubmittingRoomType}
                      />
                    )}
                  />
                </div>
              </Form.Item>
            </div>

            <Form.Item
              label="Mô tả loại phòng (Tùy chọn)"
              validateStatus={roomTypeForm.formState.errors.description ? 'error' : undefined}
              help={roomTypeForm.formState.errors.description?.message}
            >
              <Controller
                control={roomTypeForm.control}
                name="description"
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    rows={4}
                    placeholder="Mô tả không gian, loại giường, diện tích m2 và các tiện ích đặc trưng của hạng phòng..."
                    maxLength={1000}
                    showCount
                    disabled={isSubmittingRoomType}
                  />
                )}
              />
            </Form.Item>

            <div className="pt-4 border-t border-[#dce7e3] flex justify-end gap-3">
              <Button onClick={() => navigate(`/hotels/${hotelId}/rooms`)} disabled={isSubmittingRoomType}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmittingRoomType}
                icon={createdRoomTypeId ? <ReloadOutlined /> : <SaveOutlined />}
                className="!bg-[#0b5f53]"
              >
                {createdRoomTypeId ? 'Thử lại lưu cấu hình' : 'Tạo loại phòng'}
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  )
}
