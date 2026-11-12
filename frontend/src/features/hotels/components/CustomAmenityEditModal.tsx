import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form, Input, Modal } from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  updateCustomAmenityFormSchema,
  type CustomAmenity,
  type UpdateCustomAmenityFormValues,
} from '../model/scoped-amenity-schemas'
import {
  getAmenityErrorMessage,
  type AmenityScope,
  type UpdateCustomAmenityPayload,
} from '../api/scoped-amenities-api'
import { useUpdateCustomAmenityMutation } from '../hooks/use-scoped-amenities'

interface CustomAmenityEditModalProps {
  open: boolean
  amenity: CustomAmenity | null
  scope: AmenityScope
  scopeLabel: string
  onClose: () => void
  onSuccess?: () => void
}

export function CustomAmenityEditModal({
  open,
  amenity,
  scope,
  scopeLabel,
  onClose,
  onSuccess,
}: CustomAmenityEditModalProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const updateMutation = useUpdateCustomAmenityMutation(scope)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCustomAmenityFormValues>({
    resolver: zodResolver(updateCustomAmenityFormSchema),
    defaultValues: {
      name: amenity?.name ?? '',
      description: amenity?.description ?? '',
    },
  })

  const watchedName = useWatch({ control, name: 'name' }) ?? ''
  const watchedDescription = useWatch({ control, name: 'description' }) ?? ''

  // Determine if there are changes compared to the original amenity
  const originalName = amenity?.name?.trim() ?? ''
  const originalDesc = amenity?.description?.trim() ?? ''
  const currentName = watchedName.trim()
  const currentDesc = watchedDescription.trim()

  const isNameChanged = amenity ? currentName !== originalName : false
  const isDescChanged = amenity ? currentDesc !== originalDesc : false
  const hasChanges = isNameChanged || isDescChanged

  const handleClose = () => {
    if (updateMutation.isPending) return
    setApiError(null)
    onClose()
  }

  const onSubmit = async (values: UpdateCustomAmenityFormValues) => {
    if (!amenity || !hasChanges) return
    setApiError(null)

    const payload: UpdateCustomAmenityPayload = {
      expectedVersion: amenity.version,
    }

    if (isNameChanged) {
      payload.name = values.name.trim()
    }

    if (isDescChanged) {
      // Sending empty string clears description in backend contract
      payload.description = values.description?.trim() ?? ''
    }

    try {
      await updateMutation.mutateAsync({
        amenityId: amenity.id,
        payload,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      setApiError(getAmenityErrorMessage(error))
    }
  }

  return (
    <Modal
      title={amenity ? `Chỉnh sửa tiện ích: ${amenity.name}` : 'Chỉnh sửa tiện ích'}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden={false}
      centered
      className="custom-amenity-edit-modal"
    >
      <div className="py-2">
        <p className="text-xs text-[#5f736e] mb-4">
          Thuộc <strong className="text-[#12211d]">{scopeLabel}</strong>. Phiên bản hiện tại:{' '}
          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">
            v{amenity?.version ?? 0}
          </span>
        </p>

        {apiError && (
          <Alert
            type="error"
            showIcon
            message="Không thể cập nhật tiện ích"
            description={apiError}
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Tên tiện ích"
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
                  placeholder="Nhập tên tiện ích..."
                  maxLength={100}
                  disabled={updateMutation.isPending || isSubmitting}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả tiện ích (Tùy chọn)"
            validateStatus={errors.description ? 'error' : ''}
            help={errors.description?.message}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  placeholder="Mô tả tiện ích..."
                  rows={3}
                  maxLength={2000}
                  showCount
                  disabled={updateMutation.isPending || isSubmitting}
                />
              )}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#dce7e3]">
            <Button
              onClick={handleClose}
              disabled={updateMutation.isPending || isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending || isSubmitting}
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
