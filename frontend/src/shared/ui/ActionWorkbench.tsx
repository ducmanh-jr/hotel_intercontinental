import { useState, type ReactNode } from 'react'
import { Alert, Select, Space, Tag } from 'antd'
import type { FormAction } from '../model/form-action'

interface ActionWorkbenchProps {
  actions: FormAction[]
  initialAction: string
  hasSession: boolean
  description: string
  notice: string
  toolbar?: ReactNode
  renderForm: (action: FormAction) => ReactNode
}

export function ActionWorkbench({ actions, initialAction, hasSession, description, notice, toolbar, renderForm }: ActionWorkbenchProps) {
  const [selected, setSelected] = useState(initialAction)
  const action = actions.find((item) => item.id === selected) ?? actions[0]
  return (
    <div className="management-page" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      <h1>Kiểm thử nghiệp vụ</h1>
      <p>{description}</p>
      <Space wrap style={{ marginBottom: 24 }}>
        <Tag color="green">API thật</Tag>
        <Tag>{hasSession ? 'Đã đăng nhập' : 'Chưa đăng nhập'}</Tag>
        {toolbar}
      </Space>
      <Alert type="info" showIcon title="Phiên đăng nhập chỉ giữ trong bộ nhớ của tab." description={notice} />
      <label htmlFor="live-operation" style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>
        Chức năng cần kiểm thử
      </label>
      <Select id="live-operation" style={{ width: '100%', maxWidth: 640 }} value={selected} onChange={setSelected}
        options={[...new Set(actions.map((item) => item.group))].map((group) => ({
          label: group, options: actions.filter((item) => item.group === group).map((item) => ({ label: item.title, value: item.id })),
        }))} />
      {renderForm(action)}
    </div>
  )
}
