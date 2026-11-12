import { useMemo, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Switch, message } from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { buildRoomTypeEditPayload, type ManagementRoomType } from '../api/room-type-api'
import { useManagementRoomMutations } from '../hooks/use-management-room-mutations'

const editRoomTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên loại phòng không được để trống')
    .max(100, 'Tên loại phòng tối đa 100 ký tự'),
  description: z.string().trim().optional().or(z.literal('')),
  maxAdults: z
    .number({ message: 'Vui lòng nhập số người lớn' })
    .int('Phải là số nguyên')
    .min(1, 'Số người lớn tối thiểu là 1')
    .max(32767, 'Số người lớn vượt giới hạn cho phép'),
  maxChildren: z
    .number({ message: 'Vui lòng nhập số trẻ em' })
    .int('Phải là số nguyên')
    .min(0, 'Số trẻ em không được âm')
    .max(32767, 'Số trẻ em vượt giới hạn cho phép'),
  basePrice: z
    .number()
    .min(0, 'Giá cơ bản không được âm')
    .max(Number.MAX_SAFE_INTEGER, 'Giá quá lớn')
    .nullable()
    .optional(),
  active: z.boolean(),
})

type EditRoomTypeFormValues = z.infer<typeof editRoomTypeSchema>

interface EditRoomTypeModalProps {
  open: boolean
  roomType: ManagementRoomType | null
  hotelId: string
  onClose: () => void
  onSuccess?: () => void
}

export function EditRoomTypeModal({
  open,
  roomType,
  hotelId,
  onClose,
  onSuccess,
}: EditRoomTypeModalProps) {
  const { updateRoomType } = useManagementRoomMutations(hotelId)
  const [apiError, setApiError] = useState<string | null>(null)

  const defaultValues = useMemo<EditRoomTypeFormValues>(() => {
    return {
      name: roomType?.name ?? '',
      description: roomType?.description ?? '',
      maxAdults: roomType?.maxAdults ?? 2,
      maxChildren: roomType?.maxChildren ?? 0,
      basePrice: roomType?.basePrice !== undefined ? roomType.basePrice : null,
      active: roomType?.active ?? true,
    }
  }, [roomType])

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditRoomTypeFormValues>({
    resolver: zodResolver(editRoomTypeSchema),
    values: defaultValues,
  })

  const watchedValues = useWatch({ control })
  const watchedAdults = watchedValues.maxAdults ?? roomType?.maxAdults ?? 2
  const watchedChildren = watchedValues.maxChildren ?? roomType?.maxChildren ?? 0
  const totalOccupancy = watchedAdults + watchedChildren

  // Kiểm tra có thay đổi nào so với dữ liệu gốc không
  const hasChanges = useMemo(() => {
    if (!roomType) return false
    const currentName = (watchedValues.name ?? '').trim()
    const currentDesc = (watchedValues.description ?? '').trim()
    const origName = roomType.name.trim()
    const origDesc = (roomType.description ?? '').trim()

    if (currentName !== origName) return true
    if (currentDesc !== origDesc) return true
    if (watchedValues.maxAdults !== roomType.maxAdults) return true
    if (watchedValues.maxChildren !== roomType.maxChildren) return true
    if (watchedValues.active !== roomType.active) return true

    // So sánh giá:
    // Nếu ban đầu có basePrice và giá hiện tại khác ban đầu -> có thay đổi
    // Nếu ban đầu không có basePrice và hiện tại người dùng nhập số -> có thay đổi
    if (roomType.basePrice !== undefined) {
      if (watchedValues.basePrice !== roomType.basePrice) return true
    } else {
      if (watchedValues.basePrice !== null && watchedValues.basePrice !== undefined) return true
    }

    return false
  }, [roomType, watchedValues])

  const handleClose = () => {
    if (isSubmitting || updateRoomType.isPending) return
    setApiError(null)
    onClose()
  }

  const onSubmit = async (values: EditRoomTypeFormValues) => {
    if (!roomType || !hasChanges) return
    setApiError(null)

    try {
      const payload = buildRoomTypeEditPayload(roomType, {
        name: values.name,
        description: values.description,
        maxAdults: values.maxAdults,
        maxChildren: values.maxChildren,
        basePrice: values.basePrice,
        active: values.active,
      })

      await updateRoomType.mutateAsync({
        roomTypeId: roomType.id,
        payload,
      })

      message.success(`Đã cập nhật loại phòng "${values.name}"!`)
      onSuccess?.()
      onClose()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Cập nhật loại phòng thất bại.')
    }
  }

  return (
    <Modal
      title={
        <div>
          <div className="text-base font-bold text-[#12211d]">Chỉnh sửa loại phòng</div>
          {roomType && (
            <div className="text-xs text-[#5f736e] font-normal mt-0.5">{roomType.name}</div>
          )}
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      centered
      className="edit-room-type-modal"
    >
      <div className="py-2">
        {apiError && (
          <Alert
            type="error"
            showIcon
            closable
            onClose={() => setApiError(null)}
            message="Không thể lưu thay đổi"
            description={apiError}
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Tên loại phòng"
            required
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="VD: Phòng Deluxe Hướng Biển..."
                  maxLength={100}
                  disabled={isSubmitting || updateRoomType.isPending}
                />
              )}
            />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Số người lớn tối đa"
              required
              validateStatus={errors.maxAdults ? 'error' : ''}
              help={errors.maxAdults?.message}
            >
              <Controller
                name="maxAdults"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    min={1}
                    max={32767}
                    className="w-full"
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 1)}
                    disabled={isSubmitting || updateRoomType.isPending}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Số trẻ em tối đa"
              required
              validateStatus={errors.maxChildren ? 'error' : ''}
              help={errors.maxChildren?.message}
            >
              <Controller
                name="maxChildren"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    min={0}
                    max={32767}
                    className="w-full"
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 0)}
                    disabled={isSubmitting || updateRoomType.isPending}
                  />
                )}
              />
            </Form.Item>
          </div>

          {/* Dòng tóm tắt sức chứa tự động theo quy tắc đã chốt */}
          <div className="mb-4 text-xs text-[#0b5f53] bg-[#f0f9f6] p-2.5 rounded-xl border border-[#cce3dc]">
            Tối đa <strong>{watchedAdults} người lớn</strong> và <strong>{watchedChildren} trẻ em</strong> (Sức chứa tổng: {totalOccupancy} khách)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Giá cơ bản mỗi đêm"
              validateStatus={errors.basePrice ? 'error' : ''}
              help={
                errors.basePrice?.message ??
                (roomType?.basePrice === undefined
                  ? 'Để trống nếu muốn giữ nguyên giá hiện tại trên máy chủ'
                  : 'Giá phòng tiêu chuẩn mỗi đêm')
              }
            >
              <Controller
                name="basePrice"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    min={0}
                    precision={0}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : (null as unknown as number))}
                    addonAfter="VND/đêm"
                    placeholder={
                      roomType?.basePrice !== undefined
                        ? 'VD: 1,500,000'
                        : 'Nhập giá cơ bản mới...'
                    }
                    className="w-full"
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    disabled={isSubmitting || updateRoomType.isPending}
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Trạng thái mở bán">
              <div className="pt-1">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      checkedChildren="Mở bán"
                      unCheckedChildren="Tạm ngưng"
                      disabled={isSubmitting || updateRoomType.isPending}
                    />
                  )}
                />
              </div>
            </Form.Item>
          </div>

          <Form.Item
            label="Mô tả loại phòng"
            validateStatus={errors.description ? 'error' : ''}
            help={errors.description?.message}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={3}
                  placeholder="Mô tả không gian, diện tích và các đặc điểm nổi bật..."
                  maxLength={1000}
                  showCount
                  disabled={isSubmitting || updateRoomType.isPending}
                />
              )}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#dce7e3]">
            <Button onClick={handleClose} disabled={isSubmitting || updateRoomType.isPending}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting || updateRoomType.isPending}
              disabled={!hasChanges}
              className="!bg-[#0b5f53] !border-[#0b5f53]"
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}
