import { Tag } from 'antd'
import type { HotelStatus } from '../model/hotel'

const STATUS_META: Record<
  HotelStatus,
  { label: string; color: 'success' | 'processing' | 'default' | 'error' | 'warning' }
> = {
  LOCKED: { label: 'Bị khóa', color: 'error' },
  ACTIVE: { label: 'Đang hoạt động', color: 'success' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', color: 'warning' },
  DRAFT: { label: 'Bản nháp', color: 'default' },
  REJECTED: { label: 'Từ chối duyệt', color: 'error' },
  SUSPENDED: { label: 'Tạm đình chỉ', color: 'error' },
}

export function HotelStatusBadge({ status }: { status: HotelStatus }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}
