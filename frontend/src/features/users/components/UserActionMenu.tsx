import { Dropdown, type MenuProps } from 'antd'
import type { AdminUser } from '../model/user'

interface UserActionMenuProps {
  user: AdminUser
  disabled?: boolean
  currentUserId?: string
  onToggleLock: (user: AdminUser) => void
  onResendEmail: (user: AdminUser) => void
  onChangeRole: (user: AdminUser) => void
  onViewDetail: (user: AdminUser) => void
}

export function UserActionMenu({
  user,
  disabled = false,
  currentUserId,
  onToggleLock,
  onResendEmail,
  onChangeRole,
  onViewDetail,
}: UserActionMenuProps) {
  const isLocked = user.status === 'LOCKED' || user.status === 'INACTIVE'

  const items: MenuProps['items'] = [
    {
      key: 'detail',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#5F6B76' }}>
            visibility
          </span>
          Xem chi tiết
        </span>
      ),
      onClick: () => onViewDetail(user),
    },
    {
      key: 'change-role',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#5F6B76' }}>
            manage_accounts
          </span>
          Đổi vai trò
        </span>
      ),
      onClick: () => onChangeRole(user),
    },
    {
      key: 'resend-email',
      disabled: user.emailVerified || user.status !== 'PENDING',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#5F6B76' }}>
            mail
          </span>
          Gửi lại email xác thực
        </span>
      ),
      onClick: () => onResendEmail(user),
    },
    {
      type: 'divider',
    },
    {
      key: 'toggle-lock',
      disabled: user.id === currentUserId,
      danger: !isLocked,
      label: (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: isLocked ? '#1F7A4D' : undefined,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px', color: isLocked ? '#1F7A4D' : undefined }}
          >
            {isLocked ? 'lock_open' : 'lock'}
          </span>
          {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        </span>
      ),
      onClick: () => onToggleLock(user),
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        aria-label="Thao tác"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#5F6B76',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(227, 230, 233, 0.6)'
          e.currentTarget.style.color = '#17212B'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#5F6B76'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          more_vert
        </span>
      </button>
    </Dropdown>
  )
}
