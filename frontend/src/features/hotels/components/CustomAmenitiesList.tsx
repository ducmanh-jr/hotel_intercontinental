import { useState } from 'react'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Collapse,
  Modal,
  Tag,
  Tooltip,
  message,
} from 'antd'
import type { CustomAmenity } from '../model/scoped-amenity-schemas'
import {
  getAmenityErrorMessage,
  type AmenityScope,
} from '../api/scoped-amenities-api'
import {
  useDetachCustomAmenityMutation,
  useUpdateCustomAmenityMutation,
} from '../hooks/use-scoped-amenities'
import { CustomAmenityCreateModal } from './CustomAmenityCreateModal'
import { CustomAmenityEditModal } from './CustomAmenityEditModal'

interface CustomAmenitiesListProps {
  customAmenities: CustomAmenity[]
  scope: AmenityScope
  scopeLabel: string
}

export function CustomAmenitiesList({
  customAmenities,
  scope,
  scopeLabel,
}: CustomAmenitiesListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<CustomAmenity | null>(null)
  const [detachingAmenity, setDetachingAmenity] = useState<CustomAmenity | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const detachMutation = useDetachCustomAmenityMutation(scope)
  const updateMutation = useUpdateCustomAmenityMutation(scope)

  const activeAmenities = customAmenities.filter((item) => item.attached)
  const detachedAmenities = customAmenities.filter((item) => !item.attached)

  // Xử lý tháo tiện ích riêng
  const handleConfirmDetach = async () => {
    if (!detachingAmenity) return
    setActionError(null)
    try {
      await detachMutation.mutateAsync({
        amenityId: detachingAmenity.id,
        expectedVersion: detachingAmenity.version,
      })
      void message.success(`Đã tháo tiện ích "${detachingAmenity.name}". Mục này được chuyển vào danh sách "Đã tháo".`)
      setDetachingAmenity(null)
    } catch (error) {
      setActionError(getAmenityErrorMessage(error))
    }
  }

  // Xử lý gắn lại tiện ích đã tháo
  const handleReattach = async (item: CustomAmenity) => {
    setActionError(null)
    try {
      await updateMutation.mutateAsync({
        amenityId: item.id,
        payload: {
          attached: true,
          expectedVersion: item.version,
        },
      })
      void message.success(`Đã gắn lại tiện ích "${item.name}".`)
    } catch (error) {
      setActionError(getAmenityErrorMessage(error))
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dce7e3]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#12211d] m-0">Tiện ích riêng</h3>
            <Tag color="cyan" className="!rounded-md !m-0">
              Đang gắn: {activeAmenities.length}
            </Tag>
          </div>
          <p className="text-xs text-[#5f736e] mt-1 mb-0">
            Tiện ích đặc thù chỉ thuộc {scopeLabel}, không nằm trong danh mục hệ thống chung.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setActionError(null)
            setCreateModalOpen(true)
          }}
          className="!bg-[#0b5f53] !border-[#0b5f53] !rounded-xl font-medium shrink-0"
        >
          Thêm tiện ích riêng
        </Button>
      </div>

      {actionError && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setActionError(null)}
          message="Thao tác thất bại"
          description={actionError}
        />
      )}

      {/* Danh sách tiện ích đang gắn (attached=true) */}
      {activeAmenities.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-[#f7fbfa] border border-dashed border-[#dce7e3]">
          <p className="text-sm font-medium text-[#12211d] mb-1">
            Chưa có tiện ích riêng nào đang gắn
          </p>
          <p className="text-xs text-[#5f736e] max-w-md mx-auto mb-3">
            Bấm "Thêm tiện ích riêng" ở trên để tạo các tiện nghi đặc biệt chỉ có tại {scopeLabel}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeAmenities.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-[#dce7e3] bg-[#fcfdfd] hover:border-[#0b5f53] transition-colors flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-[#0b5f53] text-sm shrink-0" />
                  <span className="text-sm font-semibold text-[#12211d] truncate">
                    {item.name}
                  </span>
                </div>
                {item.description ? (
                  <p className="text-xs text-[#5f736e] mt-1 mb-0 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#8c9e99] italic mt-1 mb-0">Không có mô tả</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <Tooltip title="Chỉnh sửa tiện ích">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setActionError(null)
                      setEditingAmenity(item)
                    }}
                    className="!text-[#5f736e] hover:!text-[#0b5f53] hover:!bg-[#e6f4f1]"
                  />
                </Tooltip>
                <Tooltip title="Tháo tiện ích (có thể gắn lại)">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setActionError(null)
                      setDetachingAmenity(item)
                    }}
                    className="hover:!bg-red-50"
                  />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Khu vực Tiện ích đã tháo (attached=false) */}
      {detachedAmenities.length > 0 && (
        <div className="pt-2 border-t border-[#dce7e3]">
          <Collapse
            ghost
            defaultActiveKey={['detached']}
            items={[
              {
                key: 'detached',
                label: (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5f736e]">
                    <span>Danh sách tiện ích đã tháo ({detachedAmenities.length})</span>
                    <span className="text-[11px] font-normal text-[#8c9e99]">
                      — Nhấn để mở rộng và gắn lại khi cần
                    </span>
                  </div>
                ),
                children: (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-[#5f736e] mb-3">
                      Các tiện ích này đã được tạo nhưng hiện không gắn vào {scopeLabel}. Bạn có thể gắn lại bất cứ lúc nào mà không làm mất thông tin đã lưu.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {detachedAmenities.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-dashed border-[#dce7e3] bg-[#fafafa] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-[#5f736e] line-through block truncate">
                              {item.name}
                            </span>
                            {item.description && (
                              <span className="text-[11px] text-[#8c9e99] truncate block mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <Button
                            size="small"
                            icon={<RedoOutlined />}
                            loading={updateMutation.isPending}
                            onClick={() => void handleReattach(item)}
                            className="text-xs !rounded-lg shrink-0"
                          >
                            Gắn lại
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Modal tạo mới */}
      <CustomAmenityCreateModal
        open={createModalOpen}
        scope={scope}
        scopeLabel={scopeLabel}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Modal chỉnh sửa */}
      {editingAmenity && (
        <CustomAmenityEditModal
          key={editingAmenity.id}
          open={Boolean(editingAmenity)}
          amenity={editingAmenity}
          scope={scope}
          scopeLabel={scopeLabel}
          onClose={() => setEditingAmenity(null)}
        />
      )}

      {/* Modal xác nhận tháo */}
      <Modal
        title={`Tháo tiện ích "${detachingAmenity?.name}"?`}
        open={Boolean(detachingAmenity)}
        onCancel={() => {
          if (!detachMutation.isPending) setDetachingAmenity(null)
        }}
        onOk={handleConfirmDetach}
        confirmLoading={detachMutation.isPending}
        okText="Tháo tiện ích"
        cancelText="Giữ lại"
        okButtonProps={{ danger: true }}
        centered
      >
        <p className="text-xs text-[#5f736e] my-3 leading-relaxed">
          Tiện ích này sẽ được ngừng sử dụng tại <strong>{scopeLabel}</strong> và chuyển vào mục{' '}
          <strong>"Đã tháo"</strong>. Bạn có thể gắn lại bất cứ lúc nào mà không mất dữ liệu.
        </p>
      </Modal>
    </div>
  )
}
