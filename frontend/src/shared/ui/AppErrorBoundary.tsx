import { Component, type ReactNode } from 'react'
import { Button, Result } from 'antd'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <Result
          status="500"
          title="Không thể mở trang"
          subTitle="Trang gặp lỗi hiển thị. Bạn có thể tải lại để thử tiếp."
          extra={<Button type="primary" onClick={() => window.location.reload()}>Tải lại trang</Button>}
        />
      )
    }
    return this.props.children
  }
}
