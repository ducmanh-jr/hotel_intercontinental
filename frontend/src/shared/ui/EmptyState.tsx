import type { ReactNode } from 'react'
import { Empty } from 'antd'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state-panel">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<><strong>{title}</strong>{description && <p className="muted">{description}</p>}</>}
      >
        {action}
      </Empty>
    </div>
  )
}
