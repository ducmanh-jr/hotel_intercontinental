import { Skeleton } from 'antd'

export function PageLoading() {
  return (
    <div className="state-panel" role="status" aria-live="polite" aria-label="Đang tải dữ liệu">
      <Skeleton active title paragraph={{ rows: 3 }} />
    </div>
  )
}
