import { Space } from 'antd'
import { Link } from 'react-router'

export function AuthActionLinks({ actionId }: { actionId: string }) {
  if (actionId === 'login') return (
    <Space wrap size="large" style={{ marginBottom: 8 }}>
      <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
      <Link to="/forgot-password">Quên mật khẩu?</Link>
    </Space>
  )
  if (actionId === 'register') return <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
  return null
}
