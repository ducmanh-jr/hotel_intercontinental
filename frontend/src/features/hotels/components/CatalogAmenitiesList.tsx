import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Modal,
  Tag,
  Tooltip,
} from 'antd'
import type { AmenityItem } from '../model/hotel'

interface CatalogAmenitiesListProps {
  catalogOptions: AmenityItem[]
  savedAmenityIds: string[]
  inheritedAmenityIds?: string[]
  title?: string
  description?: string
  scopeLabel: string
  isSaving: boolean
  saveError?: string | null
  onSave: (amenityIds: string[]) => Promise<void>
}

export function CatalogAmenitiesList({
  catalogOptions,
  savedAmenityIds,
  inheritedAmenityIds = [],
  title = 'Tiện ích có sẵn',
  description,
  scopeLabel,
  isSaving,
  saveError,
  onSave,
}: CatalogAmenitiesListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(savedAmenityIds)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false)

  // Track if user has touched selections
  const userDirtyRef = useRef(false)
  const lastSavedRef = useRef<string[]>(savedAmenityIds)

  // Synchronize when savedAmenityIds changes from backend, but ONLY if the user hasn't made uncommitted edits
  useEffect(() => {
    // If the saved list actually changed (e.g. initial load or post-save refetch)
    const prevSaved = lastSavedRef.current
    const isDifferent =
      prevSaved.length !== savedAmenityIds.length ||
      savedAmenityIds.some((id) => !prevSaved.includes(id))

    if (isDifferent) {
      lastSavedRef.current = savedAmenityIds
      // If user hasn't made uncommitted changes, sync with backend
      if (!userDirtyRef.current) {
        setSelectedIds(savedAmenityIds)
      }
    }
  }, [savedAmenityIds])

  // Compute isDirty relative to current savedAmenityIds
  const isDirty = useMemo(() => {
    if (selectedIds.length !== savedAmenityIds.length) return true
    const savedSet = new Set(savedAmenityIds)
    return selectedIds.some((id) => !savedSet.has(id))
  }, [selectedIds, savedAmenityIds])

  const inheritedSet = useMemo(
    () => new Set(inheritedAmenityIds),
    [inheritedAmenityIds],
  )

  // Filter catalog items by search term
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return catalogOptions
    return catalogOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(term) ||
        opt.code.toLowerCase().includes(term),
    )
  }, [catalogOptions, searchTerm])

  const handleToggle = (id: string, checked: boolean) => {
    userDirtyRef.current = true
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    )
  }

  const handleReset = () => {
    userDirtyRef.current = false
    setSelectedIds([...savedAmenityIds])
  }

  const handleSaveClick = () => {
    // If user is clearing everything and previously had saved items, confirm intent
    if (selectedIds.length === 0 && savedAmenityIds.length > 0) {
      setConfirmEmptyOpen(true)
      return
    }
    void executeSave(selectedIds)
  }

  const executeSave = async (ids: string[]) => {
    setConfirmEmptyOpen(false)
    await onSave(ids)
    userDirtyRef.current = false
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#dce7e3] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dce7e3]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#12211d] m-0">{title}</h3>
            <Tag color="green" className="!rounded-md !m-0 font-medium">
              Đã chọn: {selectedIds.length} / {catalogOptions.length}
            </Tag>
            {isDirty && (
              <Tag color="orange" className="!rounded-md !m-0 text-xs">
                Chưa lưu
              </Tag>
            )}
          </div>
          <p className="text-xs text-[#5f736e] mt-1 mb-0">
            {description ??
              `Chọn nhanh các tiện nghi chuẩn từ danh mục hệ thống để gắn vào ${scopeLabel}.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="middle"
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="text-xs !rounded-xl"
          >
            Hoàn tác
          </Button>
          <Button
            type="primary"
            size="middle"
            icon={<CheckOutlined />}
            onClick={handleSaveClick}
            loading={isSaving}
            disabled={!isDirty || isSaving}
            className="!bg-[#0b5f53] !border-[#0b5f53] !rounded-xl font-medium text-xs"
          >
            Lưu lựa chọn
          </Button>
        </div>
      </div>

      {saveError && (
        <Alert
          type="error"
          showIcon
          message="Không thể lưu danh mục tiện ích"
          description={saveError}
        />
      )}

      {/* Search Input */}
      <div className="max-w-xs">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Tìm tiện ích theo tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          size="middle"
          className="!rounded-xl text-xs"
        />
      </div>

      {/* Grid of Checkboxes */}
      {filteredOptions.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#5f736e] bg-[#f7fbfa] rounded-xl border border-dashed border-[#dce7e3]">
          {searchTerm
            ? `Không tìm thấy tiện ích nào khớp với "${searchTerm}".`
            : 'Danh mục tiện ích đang trống.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredOptions.map((item) => {
            const isChecked = selectedIds.includes(item.id)
            const isInherited = inheritedSet.has(item.id)

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                  isChecked
                    ? 'border-[#0b5f53] bg-[#f0f9f6]'
                    : isInherited
                      ? 'border-[#cce3dc] bg-[#fafcfb]'
                      : 'border-[#e2eae7] bg-white hover:border-[#b0cfc7]'
                }`}
              >
                <Checkbox
                  id={`amenity-cb-${item.id}`}
                  checked={isChecked}
                  disabled={isSaving}
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`amenity-cb-${item.id}`}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${
                        isChecked ? 'text-[#0b5f53]' : 'text-[#12211d]'
                      }`}
                    >
                      {item.name}
                    </span>
                    {isInherited && (
                      <Tooltip title="Tiện ích này đã có từ cấu hình hạng phòng. Đánh dấu tại đây là để xác nhận gắn trực tiếp cấp phòng.">
                        <Tag
                          color="blue"
                          className="!text-[10px] !leading-[16px] !px-1.5 !rounded !m-0"
                        >
                          Đã có từ hạng phòng
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                </label>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal when clearing all */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-amber-600">
            <ExclamationCircleOutlined /> Xác nhận tháo toàn bộ tiện ích có sẵn?
          </span>
        }
        open={confirmEmptyOpen}
        onCancel={() => setConfirmEmptyOpen(false)}
        onOk={() => void executeSave([])}
        confirmLoading={isSaving}
        okText="Đồng ý tháo hết"
        cancelText="Quay lại"
        okButtonProps={{ danger: true }}
        centered
      >
        <p className="text-xs text-[#5f736e] my-3 leading-relaxed">
          Bạn đang chọn bỏ đánh dấu tất cả các tiện ích danh mục có sẵn gắn trực tiếp vào{' '}
          <strong>{scopeLabel}</strong>.
          {inheritedAmenityIds.length > 0 && (
            <span className="block mt-2 font-medium text-[#12211d]">
              Lưu ý: Các tiện ích kế thừa từ hạng phòng sẽ vẫn được giữ nguyên và không bị ảnh hưởng.
            </span>
          )}
        </p>
      </Modal>
    </div>
  )
}
