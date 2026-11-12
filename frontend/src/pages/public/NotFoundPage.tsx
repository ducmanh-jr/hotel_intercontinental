import { CompassOutlined,ThunderboltOutlined } from '@ant-design/icons'
import { Button, Result, Space } from 'antd'
import { useNavigate } from 'react-router'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="surface-card">
      <Result
        status="404"
        title="Không tìm thấy trang yêu cầu"
        subTitle="Đường dẫn bạn truy cập không tồn tại trong hệ thống StayVibe Sovereign."
        extra={
          <Space wrap>
            <Button
              type="primary"
              icon={<CompassOutlined aria-hidden="true" />}
              onClick={() => void navigate('/')}
            >
              Về trang Khám phá
            </Button>
            <Button
              icon={<ThunderboltOutlined aria-hidden="true" />}
              onClick={() => void navigate('/system-status')}
            >
              Trạng thái hệ thống
            </Button>
          </Space>
        }
      />
    </div>
  )
}
