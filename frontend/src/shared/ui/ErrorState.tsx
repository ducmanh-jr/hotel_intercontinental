import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import { ApiError, errorMessage } from '@/shared/api/api-error'

interface ErrorStateProps {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}

export function ErrorState({ error, onRetry, retrying = false }: ErrorStateProps) {
  if (error instanceof ApiError && error.kind === 'unsupported') {
    return <Alert type="info" showIcon title="Chức năng chưa được hỗ trợ" description={error.message} />
  }

  return (
    <div className="state-panel">
      <Alert
        type="error"
        showIcon
        title="Chưa lấy được dữ liệu"
        description={errorMessage(error)}
      />
      {error instanceof ApiError && error.traceId && (
        <p className="trace-id">Mã tra cứu: <code>{error.traceId}</code></p>
      )}
      <p className="muted">Kiểm tra dịch vụ backend đang chạy, sau đó thử kết nối lại.</p>
      <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={onRetry} loading={retrying}>
        Thử lại
      </Button>
    </div>
  )
}
