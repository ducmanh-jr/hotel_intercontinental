import { Modal, Descriptions, Tag } from 'antd'
import { formatPhoneNumber } from '@/shared/lib/format'
import type { AdminUser } from '../model/user'

interface UserDetailModalProps {
  user: AdminUser | null
  open: boolean
  onClose: () => void
}

export function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  if (!user) return null

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
      case 'ROLE_ADMIN':
        return 'Quản trị viên'
      case 'HOTEL_OWNER':
      case 'ROLE_HOTEL_OWNER':
      case 'OWNER':
      case 'ROLE_OWNER':
        return 'Chủ khách sạn'
      case 'CUSTOMER':
      case 'ROLE_CUSTOMER':
      case 'USER':
      case 'ROLE_USER':
        return 'Khách hàng'
      default:
        return role
    }
  }

  const getStatusLabel = (status: AdminUser['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="green">Đã xác thực</Tag>
      case 'PENDING':
        return <Tag color="gold">Chờ xác thực</Tag>
      case 'INACTIVE':
        return <Tag color="default">Chưa hoạt động</Tag>
      case 'LOCKED':
        return <Tag color="red">Đã khóa</Tag>
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#0E6B6F', fontSize: '22px' }}>
            account_circle
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Thông tin người dùng</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginTop: '16px' }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Họ và tên">{user.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{formatPhoneNumber(user.phone)}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">{user.roles.map(getRoleLabel).join(', ') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{getStatusLabel(user.status)}</Descriptions.Item>
          <Descriptions.Item label="Ngày tham gia">{user.joinedDate}</Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  )
}
