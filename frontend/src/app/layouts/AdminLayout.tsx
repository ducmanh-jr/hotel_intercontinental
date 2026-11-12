import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  ArrowLeftOutlined,
  CloseOutlined,
  CompassOutlined,
  DownOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ConfigProvider, Dropdown, Tooltip, type MenuProps } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { setSession } from '@/shared/api/session'
import { useCurrentUser } from '@/features/auth'
import { MAIN_NAV_GROUPS } from '@/config/navigation.config'
import { formatRoleLabel } from '@/shared/lib/format'

const ADMIN_DASHBOARD_FONT_FAMILY =
  "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export function AdminLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser, isAdmin, isOwner } = useCurrentUser()

  const isOwnerOnly = Boolean(
    !isAdmin && (isOwner || currentUser?.roles?.includes('HOTEL_OWNER')),
  )

  // Danh mục menu điều hướng tùy biến theo vai trò người dùng từ file cấu hình duy nhất
  const navGroups = useMemo(() => {
    return MAIN_NAV_GROUPS.filter((g) => (isAdmin ? true : !g.adminOnly)).map((g) => ({
      ...g,
      items: g.items.filter((item) => (isAdmin ? true : !item.adminOnly)),
    }))
  }, [isAdmin])

  // Trạng thái đang ở trong ngữ cảnh 1 khách sạn cụ thể (/hotels/:hotelId/*)
  const isHotelWorkspace =
    location.pathname.startsWith('/hotels/') && location.pathname !== '/hotels/new'

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileDrawerOpen])

  // Derive current page title for breadcrumb
  let currentPageTitle = 'Quản lý'
  if (location.pathname.includes('/admin/users')) {
    currentPageTitle = 'Người dùng & Phân quyền'
  } else if (location.pathname.includes('/admin/overview')) {
    currentPageTitle = 'Tổng quan'
  } else if (location.pathname.startsWith('/hotels')) {
    currentPageTitle = 'Khách sạn'
  } else if (location.pathname.includes('/bookings')) {
    currentPageTitle = 'Đặt phòng'
  } else if (location.pathname.includes('/customers')) {
    currentPageTitle = 'Khách hàng'
  } else if (location.pathname.includes('/vouchers')) {
    currentPageTitle = 'Voucher & Ưu đãi'
  } else if (location.pathname.includes('/complaints')) {
    currentPageTitle = 'Khiếu nại'
  } else if (location.pathname.includes('/finance')) {
    currentPageTitle = 'Quản lý doanh thu'
  } else if (location.pathname.includes('/reports')) {
    currentPageTitle = 'Báo cáo doanh thu'
  } else if (location.pathname.includes('/contracts')) {
    currentPageTitle = 'Hợp đồng lưu trú'
  } else if (location.pathname.includes('/financial-access')) {
    currentPageTitle = 'Phân quyền tài chính'
  } else if (location.pathname.includes('/system-status')) {
    currentPageTitle = 'Trạng thái máy chủ'
  }

  // Real user display values
  const userFullName =
    currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Tài khoản')
  const userEmail = currentUser?.email || ''
  const userRoles =
    currentUser?.roles && currentUser.roles.length > 0 ? currentUser.roles : ['ADMIN']
  const userInitials =
    userFullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'SH'

  const handleLogout = () => {
    setSession(null)
    queryClient.clear()
    navigate('/admin/login', { replace: true })
  }

  // Account dropdown menu items
  const accountMenuItems: MenuProps['items'] = [
    {
      key: 'user-profile-header',
      label: (
        <div className="py-1 px-1">
          <div className="text-sm font-semibold text-[#12211d]">{userFullName}</div>
          <div className="text-xs text-[#5f736e] mt-0.5">{userEmail}</div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {userRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#d9f0ea] text-[#08473e]"
              >
                {formatRoleLabel(role)}
              </span>
            ))}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile-action',
      icon: <UserOutlined />,
      label: isOwnerOnly ? 'Hồ sơ chủ khách sạn' : 'Hồ sơ quản trị',
      onClick: () => navigate(isAdmin ? '/admin/users' : '/admin/overview'),
    },
    {
      key: 'settings-action',
      icon: <SettingOutlined />,
      label: isOwnerOnly ? 'Cài đặt cổng đối tác' : 'Cài đặt cổng quản trị',
      onClick: () => navigate(isAdmin ? '/system-status' : '/admin/overview'),
    },
    { type: 'divider' },
    {
      key: 'goto-home',
      icon: <CompassOutlined />,
      label: 'Về trang chủ StayHub',
      onClick: () => navigate('/'),
    },
    { type: 'divider' },
    {
      key: 'logout-action',
      icon: <LogoutOutlined className="!text-[#9b2c22]" />,
      label: <span className="text-[#9b2c22] font-semibold">Đăng xuất tài khoản</span>,
      onClick: handleLogout,
    },
  ]

  const closeMobileDrawer = () => setMobileDrawerOpen(false)

  // Cho phép người dùng thu gọn / mở rộng menu thủ công, lưu trạng thái vào localStorage
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem('stayhub_sidebar_collapsed')
      if (saved !== null) return saved === 'true'
    } catch {
      // bỏ qua lỗi nếu localStorage không khả dụng
    }
    return null
  })

  const toggleCollapsed = () => {
    const next = userCollapsed !== null ? !userCollapsed : !isHotelWorkspace
    setUserCollapsed(next)
    try {
      localStorage.setItem('stayhub_sidebar_collapsed', String(next))
    } catch {
      // bỏ qua lỗi nếu localStorage không khả dụng
    }
  }

  // Sidebar width: khi thu gọn thì chỉ 68px và chỉ hiện logo; khi mở rộng thì 264px
  const isCollapsed =
    !mobileDrawerOpen && (userCollapsed !== null ? userCollapsed : isHotelWorkspace)

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: ADMIN_DASHBOARD_FONT_FAMILY,
        },
      }}
    >
      <div className="admin-console-shell bg-[#f4f8f7] text-[#12211d] min-h-screen flex">
      {/* Mobile Backdrop Scrim */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#071c18]/48 backdrop-blur-xs min-[981px]:hidden"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* CẤP 1: Sidebar Navigation Toàn hệ thống */}
      <aside
        id="admin-sidebar"
        className={`fixed min-[981px]:sticky top-0 bottom-0 left-0 z-50 h-screen bg-white border-r border-[#dce7e3] flex flex-col justify-between shrink-0 transition-all duration-200 ease-out p-3 pt-[18px] pb-3 ${
          mobileDrawerOpen
            ? 'w-[264px] translate-x-0 shadow-2xl'
            : isCollapsed
              ? 'w-[68px] -translate-x-full min-[981px]:translate-x-0 shadow-none px-2'
              : 'w-[264px] -translate-x-full min-[981px]:translate-x-0 shadow-none'
        }`}
        aria-label="Thanh điều hướng toàn hệ thống"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Row */}
          <div
            className={`flex items-center pb-4 mb-2 border-b border-[#dce7e3] ${
              isCollapsed ? 'justify-center px-0' : 'justify-between px-2'
            }`}
          >
            <NavLink
              to="/admin/overview"
              className="flex items-center gap-3 no-underline select-none group"
              onClick={closeMobileDrawer}
              aria-label="StayHub Portal - Về trang tổng quan"
            >
              <div className="w-[38px] h-[38px] rounded-[11px] bg-[#0b5f53] text-white flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:bg-[#08473e] transition-colors">
                <HomeOutlined aria-hidden="true" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[17.5px] font-semibold text-[#12211d] leading-[1.1] tracking-tight">
                    StayHub
                  </span>
                  <span className="text-[9.5px] uppercase font-semibold tracking-[.13em] text-[#5f736e]">
                    {isOwnerOnly ? 'Partner Portal' : 'Admin Portal'}
                  </span>
                </div>
              )}
            </NavLink>

            {/* Desktop Collapse Button */}
            {!isCollapsed && (
              <button
                type="button"
                className="hidden min-[981px]:flex w-7 h-7 rounded-md text-[#5f736e] hover:text-[#0b5f53] hover:bg-[#eef8f5] transition-colors border-0 bg-transparent cursor-pointer items-center justify-center"
                onClick={toggleCollapsed}
                title="Thu gọn menu"
                aria-label="Thu gọn menu"
              >
                <MenuFoldOutlined className="text-sm" />
              </button>
            )}

            {/* Mobile Close Button */}
            {!isCollapsed && (
              <button
                type="button"
                className="min-[981px]:hidden w-8 h-8 rounded-md flex items-center justify-center text-[#5f736e] hover:text-[#12211d] hover:bg-[#f7fbfa] transition-colors border-0 bg-transparent cursor-pointer"
                onClick={closeMobileDrawer}
                aria-label="Đóng thanh điều hướng"
              >
                <CloseOutlined className="text-sm" />
              </button>
            )}
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 overflow-y-auto px-1 py-1 flex flex-col gap-4 pb-24">
            {navGroups.map((group) => (
              <div key={group.title} className="flex flex-col">
                {!isCollapsed ? (
                  <div className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-[.12em] text-[#5f736e]">
                    {group.title}
                  </div>
                ) : (
                  <div className="my-1 border-t border-[#eef8f5]" />
                )}
                <nav className="flex flex-col gap-[2px]" aria-label={group.title}>
                  {group.items.map((item) => {
                    const IconComponent = item.icon
                    // Khách sạn active với mọi route bắt đầu bằng /hotels
                    const isHotelsActive = location.pathname.startsWith('/hotels')
                    const isActive =
                      item.to === '/hotels'
                        ? isHotelsActive
                        : item.exact
                          ? location.pathname === item.to
                          : location.pathname === item.to ||
                            (item.to !== '/admin/overview' && location.pathname.startsWith(item.to))

                    const linkContent = (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`admin-nav-link ${isActive ? 'is-active' : ''} ${
                          isCollapsed ? '!justify-center !px-0 !py-2.5' : ''
                        }`}
                        onClick={closeMobileDrawer}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="text-base shrink-0 flex items-center">
                          <IconComponent aria-hidden="true" />
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    )

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.to} title={item.label} placement="right">
                          {linkContent}
                        </Tooltip>
                      )
                    }

                    return linkContent
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Collapse/Expand Toggle Row */}
        <div className="pt-2 pb-1 border-t border-[#edf4f1]">
          {isCollapsed ? (
            <Tooltip title="Mở rộng menu" placement="right">
              <button
                type="button"
                className="hidden min-[981px]:flex w-full h-8 rounded-lg text-[#5f736e] hover:text-[#0b5f53] hover:bg-[#eef8f5] transition-colors border-0 bg-transparent cursor-pointer items-center justify-center"
                onClick={toggleCollapsed}
                aria-label="Mở rộng menu"
              >
                <MenuUnfoldOutlined className="text-sm" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="hidden min-[981px]:flex w-full h-8 px-2.5 rounded-lg text-xs font-medium text-[#5f736e] hover:text-[#0b5f53] hover:bg-[#eef8f5] transition-colors border-0 bg-transparent cursor-pointer items-center justify-between"
              onClick={toggleCollapsed}
              aria-label="Thu gọn menu"
            >
              <span className="flex items-center gap-2">
                <MenuFoldOutlined className="text-sm shrink-0" />
                <span>Thu gọn menu</span>
              </span>
            </button>
          )}
        </div>

        {/* Sidebar Footer User Button */}
        <div className="pt-2 border-t border-[#dce7e3]">
          <Dropdown menu={{ items: accountMenuItems }} trigger={['click']} placement="topRight">
            <button
              type="button"
              className={`w-full min-h-[52px] rounded-[10px] hover:bg-[#f7fbfa] transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-between gap-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0b5f53] ${
                isCollapsed ? 'px-1 justify-center' : 'px-3 py-2'
              }`}
              aria-label={`Tài khoản ${isOwnerOnly ? 'chủ khách sạn' : 'quản trị viên'} ${userFullName}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#0b5f53] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {userInitials}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#12211d] truncate">
                      {userFullName}
                    </span>
                    <span className="text-[11px] text-[#5f736e] truncate">{userEmail}</span>
                  </div>
                )}
              </div>
              {!isCollapsed && <DownOutlined className="text-[10px] text-[#5f736e] shrink-0" />}
            </button>
          </Dropdown>
        </div>
      </aside>

      {/* Main Column Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top App Bar */}
        <header
          className="sticky top-0 z-40 min-h-[64px] bg-white border-b border-[#dce7e3] px-4 sm:px-7 flex items-center justify-between gap-3 shadow-xs"
          role="banner"
        >
          {/* Left: Desktop collapse toggle, Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              className="hidden min-[981px]:flex w-8 h-8 rounded-lg border border-[#dce7e3] hover:border-[#0b5f53] hover:text-[#0b5f53] text-[#5f736e] bg-white items-center justify-center cursor-pointer transition-colors shadow-2xs"
              onClick={toggleCollapsed}
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {isCollapsed ? (
                <MenuUnfoldOutlined className="text-sm" />
              ) : (
                <MenuFoldOutlined className="text-sm" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="min-[981px]:hidden w-9 h-9 rounded-lg border border-[#bfd3cd] hover:border-[#0b5f53] hover:text-[#0b5f53] text-[#344a44] bg-white flex items-center justify-center cursor-pointer transition-colors"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở thanh điều hướng"
            >
              <MenuOutlined />
            </button>

            {/* Breadcrumb */}
            <nav aria-label="Điều hướng phân cấp" className="flex items-center gap-1.5 text-[12.5px] min-w-0">
              <NavLink
                to="/admin/overview"
                className="text-[#5f736e] hover:text-[#0b5f53] transition-colors no-underline hidden sm:inline"
              >
                {isOwnerOnly ? 'Đối tác' : 'Quản trị'}
              </NavLink>
              <span className="text-[#bfd3cd] hidden sm:inline">/</span>
              <span className="font-semibold text-[#12211d] truncate">{currentPageTitle}</span>
            </nav>
          </div>

          {/* Right: Quick actions & User menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Back to guest/customer homepage button */}
            <NavLink
              to="/"
              className="admin-guest-btn"
              style={{ color: '#344a44', textDecoration: 'none' }}
              title="Về trang khách"
            >
              <ArrowLeftOutlined className="text-xs" aria-hidden="true" />
              <span>Về trang khách</span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Main Viewport */}
        <main className="admin-content-viewport flex-1 p-4 lg:p-6 flex flex-col min-w-0" id="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  </ConfigProvider>
  )
}
