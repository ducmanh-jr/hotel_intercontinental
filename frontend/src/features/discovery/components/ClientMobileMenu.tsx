import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { DashboardOutlined, LogoutOutlined } from '@ant-design/icons'
import { useCurrentUser, useSession } from '@/features/auth'
import { setSession } from '@/shared/api/session'
import { useQueryClient } from '@tanstack/react-query'
import { ClientIcon } from './ClientSiteIcons'

interface ClientMobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenAuthModal?: (mode?: 'login' | 'register') => void
}

export function ClientMobileMenu({
  isOpen,
  onClose,
  onOpenAuthModal,
}: ClientMobileMenuProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useSession()
  const { currentUser, isAdmin } = useCurrentUser()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const userFullName =
    currentUser?.fullName ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Tài khoản')

  const handleLogout = () => {
    setSession(null)
    queryClient.clear()
    onClose()
    navigate('/')
  }

  const handleNavClick = (href: string) => {
    onClose()
    if (href.startsWith('#')) {
      const el = document.getElementById(href.replace('#', ''))
      if (el) {
        window.setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
      }
    } else {
      navigate(href)
    }
  }

  return (
    <>
      <div
        className={`mobile-menu-backdrop ${isOpen ? 'is-open' : ''}`}
        id="mobile-menu-backdrop"
        aria-hidden={!isOpen}
        onClick={onClose}
      />
      <div
        className={`mobile-menu ${isOpen ? 'is-open' : ''}`}
        id="mobile-menu"
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Menu điều hướng di động"
      >
        <div className="mobile-menu-head">
          <a
            className="brand"
            href="#top"
            aria-label="StayHub — về đầu trang"
            onClick={() => handleNavClick('#top')}
          >
            <span className="brand-mark">
              <ClientIcon name="compass" />
            </span>
            <span className="brand-word">
              <strong>StayHub</strong>
              <span>Bộ sưu tập lưu trú</span>
            </span>
          </a>
          <button
            className="icon-btn"
            id="menu-close"
            type="button"
            aria-label="Đóng menu"
            onClick={onClose}
          >
            <ClientIcon name="close" />
          </button>
        </div>

        <nav aria-label="Điều hướng di động">
          <a href="#destinations" onClick={() => handleNavClick('#destinations')}>
            Điểm đến
          </a>
          <a href="#stays" onClick={() => handleNavClick('#stays')}>
            Chỗ nghỉ
          </a>
          <a href="#journal" onClick={() => handleNavClick('#journal')}>
            Trải nghiệm
          </a>
          <a href="#partner" onClick={() => handleNavClick('#partner')}>
            Đối tác
          </a>
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className="flex items-center gap-2 text-base font-semibold text-[var(--accent)]"
              onClick={onClose}
            >
              <DashboardOutlined />
              <span>StayHub Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="mobile-menu-foot">
          {session ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-[var(--ink)] truncate">
                {userFullName}
              </div>
              <button
                type="button"
                className="login-btn !text-red-600 !border-red-300 hover:!bg-red-50 flex items-center justify-center gap-2"
                onClick={handleLogout}
              >
                <LogoutOutlined />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              className="login-btn"
              id="mobile-login-btn"
              type="button"
              onClick={() => {
                onClose()
                if (onOpenAuthModal) {
                  onOpenAuthModal('login')
                } else {
                  navigate('/login')
                }
              }}
            >
              Đăng nhập tài khoản
            </button>
          )}
          <p
            className="collection-note"
            style={{ color: 'var(--muted)', fontSize: '12.5px', margin: 0 }}
          >
            VI · VND &nbsp;·&nbsp; Hỗ trợ 24/7
          </p>
        </div>
      </div>
    </>
  )
}
