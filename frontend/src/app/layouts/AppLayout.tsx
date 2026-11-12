import { useState } from 'react'
import {
  BankOutlined,
  CompassOutlined,
  DashboardOutlined,
  DollarOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  LogoutOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Dropdown, type MenuProps } from 'antd'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  StayVibeFooter,
  STAYVIBE_FOOTER_GROUPS,
  ClientHomeProvider,
  useClientHomeContext,
  ClientSvgSprite,
  ClientSiteHeader,
  ClientMobileMenu,
  ClientSiteFooter,
  ClientToast,
} from '@/features/discovery'
import { AuthModal, useCurrentUser, useSession } from '@/features/auth'
import { setSession } from '@/shared/api/session'
import { formatRoleLabel } from '@/shared/lib/format'

function ClientHomeLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
    savedIds,
    filterState,
    pulseSaved,
    toggleSavedOnly,
    toastMessage,
    showToast,
    authModalState,
    openAuthModal,
    closeAuthModal,
  } = useClientHomeContext()

  return (
    <div className="client-theme min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      <ClientSvgSprite />
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>

      <ClientSiteHeader
        savedCount={savedIds.size}
        isSavedActive={filterState.savedOnly}
        pulseSaved={pulseSaved}
        onToggleSaved={toggleSavedOnly}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenAuthModal={(mode) => openAuthModal(mode)}
      />

      <ClientMobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenAuthModal={(mode) => openAuthModal(mode)}
      />

      <main id="main" tabIndex={-1} className="flex-1 w-full">
        <Outlet />
      </main>

      <ClientSiteFooter onToast={showToast} />
      <ClientToast message={toastMessage} />

      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={closeAuthModal}
        onSuccess={() => {
          showToast('Đăng nhập thành công! Chào mừng bạn trở lại.')
        }}
      />
    </div>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const session = useSession()
  const { currentUser, isAdmin } = useCurrentUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHomeRoute =
    location.pathname === '/' ||
    location.pathname === '/explore' ||
    location.pathname.startsWith('/hotels')

  if (isHomeRoute) {
    return (
      <ClientHomeProvider>
        <ClientHomeLayout />
      </ClientHomeProvider>
    )
  }

  const isManagementRoute = location.pathname.startsWith('/management')
  const closeMenu = () => setMobileMenuOpen(false)

  const userFullName =
    currentUser?.fullName ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Tài khoản')
  const userEmail = currentUser?.email || ''
  const userInitials =
    userFullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'SH'

  const handleLogout = () => {
    setSession(null)
    queryClient.clear()
    closeMenu()
    navigate('/')
  }

  // Account dropdown menu items
  const accountMenuItems: MenuProps['items'] = [
    {
      key: 'user-profile-header',
      label: (
        <div className="py-1 px-1">
          <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
            {userFullName}
          </div>
          {userEmail && (
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              {userEmail}
            </div>
          )}
          {currentUser?.roles && currentUser.roles.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {currentUser.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                >
                  {formatRoleLabel(role)}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    ...(isAdmin
      ? [
          {
            key: 'admin-portal-link',
            icon: <DashboardOutlined className="!text-[var(--md-sys-color-primary)]" />,
            label: (
              <NavLink
                to="/admin/users"
                className="font-semibold text-[var(--md-sys-color-primary)]"
              >
                StayHub Admin
              </NavLink>
            ),
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'goto-home',
      icon: <CompassOutlined />,
      label: 'Trang chủ khám phá',
      onClick: () => navigate('/'),
    },
    { type: 'divider' },
    {
      key: 'logout-action',
      icon: <LogoutOutlined className="!text-[var(--md-sys-color-error)]" />,
      label: <span className="text-[var(--md-sys-color-error)] font-medium">Đăng xuất tài khoản</span>,
      onClick: handleLogout,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--md-sys-color-on-surface)] focus:text-white focus:rounded-md shadow-lg"
        href="#main-content"
      >
        Đến nội dung chính
      </a>

      {/* Sticky Material 3 Navbar for Management / System pages */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-subtle)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 no-underline group focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-md shrink-0"
            aria-label="StayHub - Trang chủ đặt phòng nghỉ dưỡng"
            onClick={closeMenu}
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              <ShopOutlined aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-none shrink-0">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Stay<span className="text-[var(--md-sys-color-primary)]">Hub</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Nền tảng đặt phòng
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0" aria-label="Điều hướng chính">
            {isManagementRoute ? (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <CompassOutlined aria-hidden="true" />
                  <span>Khám phá</span>
                </NavLink>
                <NavLink
                  to="/hotels"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <BankOutlined aria-hidden="true" />
                  <span>Quản lý khách sạn</span>
                </NavLink>
                <NavLink
                  to="/management/rates"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <DollarOutlined aria-hidden="true" />
                  <span>Bảng giá phòng</span>
                </NavLink>
                <NavLink
                  to="/management/contracts"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <FileProtectOutlined aria-hidden="true" />
                  <span>Hợp đồng</span>
                </NavLink>
                <NavLink
                  to="/management/financial-access"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <SafetyCertificateOutlined aria-hidden="true" />
                  <span>Phân quyền tài chính</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `text-xs font-semibold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`
                  }
                >
                  <CompassOutlined aria-hidden="true" />
                  <span>Khám phá</span>
                </NavLink>
                <a
                  href="#destinations"
                  className="text-xs font-semibold px-3.5 py-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <EnvironmentOutlined aria-hidden="true" />
                  <span>Điểm đến</span>
                </a>
                <a
                  href="#stays"
                  className="text-xs font-semibold px-3.5 py-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <StarOutlined aria-hidden="true" />
                  <span>Bộ sưu tập chỗ nghỉ</span>
                </a>
                {isAdmin && (
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      `text-xs font-semibold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                          : 'text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30'
                      }`
                    }
                  >
                    <DashboardOutlined aria-hidden="true" />
                    <span>StayHub Admin</span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {session ? (
              <Dropdown menu={{ items: accountMenuItems }} trigger={['click']} placement="bottomRight">
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors border border-[var(--md-sys-color-outline-subtle)] bg-white cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)]"
                  aria-label={`Menu tài khoản ${userFullName}`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {userInitials}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-[var(--md-sys-color-on-surface)] max-w-[120px] truncate">
                    {userFullName}
                  </span>
                  <DownOutlined className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]" />
                </button>
              </Dropdown>
            ) : (
              <button
                type="button"
                className="m3-btn-filled !h-10 !px-4 sm:!px-5 !text-xs sm:!text-sm"
                onClick={() => void navigate('/login')}
              >
                <UserOutlined aria-hidden="true" />
                <span>Đăng nhập</span>
              </button>
            )}

            <button
              type="button"
              className="lg:hidden m3-btn-icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <MenuOutlined aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center text-sm">
              <ShopOutlined aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                Stay<span className="text-[var(--md-sys-color-primary)]">Hub</span>
              </span>
              <span className="text-[9px] tracking-wider text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                Nền tảng đặt phòng
              </span>
            </div>
          </div>
        }
        placement="right"
        onClose={closeMenu}
        open={mobileMenuOpen}
        styles={{
          body: {
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px',
            background: 'var(--md-sys-color-surface-container-low)',
          },
        }}
      >
        <div className="flex flex-col gap-2">
          {isManagementRoute ? (
            <>
              <NavLink
                to="/"
                end
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <CompassOutlined />
                <span>Khám phá</span>
              </NavLink>
              <NavLink
                to="/hotels"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <BankOutlined />
                <span>Quản lý khách sạn</span>
              </NavLink>
              <NavLink
                to="/management/rates"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <DollarOutlined />
                <span>Bảng giá phòng</span>
              </NavLink>
              <NavLink
                to="/management/contracts"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <FileProtectOutlined />
                <span>Hợp đồng</span>
              </NavLink>
              <NavLink
                to="/management/financial-access"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <SafetyCertificateOutlined />
                <span>Phân quyền tài chính</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <CompassOutlined />
                <span>Khám phá</span>
              </NavLink>
              <a
                href="#destinations"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <EnvironmentOutlined />
                <span>Điểm đến</span>
              </a>
              <a
                href="#stays"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]"
                onClick={closeMenu}
              >
                <StarOutlined />
                <span>Bộ sưu tập chỗ nghỉ</span>
              </a>
            </>
          )}

          {isAdmin && (
            <div className="pt-3 mt-2 border-t border-[var(--md-sys-color-outline-subtle)] flex flex-col gap-2">
              <NavLink
                to="/admin/users"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold text-sm"
                onClick={closeMenu}
              >
                <div className="flex items-center gap-2.5">
                  <DashboardOutlined />
                  <span>StayHub Admin</span>
                </div>
                <span className="text-xs bg-white/40 px-2 py-0.5 rounded font-bold">Quản trị</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--md-sys-color-outline-subtle)] flex flex-col gap-3">
          {session ? (
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-white border border-[var(--md-sys-color-outline-subtle)]">
                <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  {userFullName}
                </div>
                {userEmail && (
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    {userEmail}
                  </div>
                )}
              </div>
              <Button
                type="default"
                danger
                block
                className="!rounded-full !h-11 font-semibold"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button
              type="primary"
              block
              size="large"
              icon={<UserOutlined />}
              className="!h-12 !font-semibold !rounded-full"
              onClick={() => {
                closeMenu()
                void navigate('/login')
              }}
            >
              Đăng nhập tài khoản
            </Button>
          )}
        </div>
      </Drawer>

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <StayVibeFooter groups={STAYVIBE_FOOTER_GROUPS} />
      </div>
    </div>
  )
}
