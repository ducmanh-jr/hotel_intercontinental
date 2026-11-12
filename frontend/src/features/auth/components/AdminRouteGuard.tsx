import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { Button, Result } from 'antd'
import { PageLoading } from '@/shared/ui/PageLoading'
import { ErrorState } from '@/shared/ui/ErrorState'
import { useAuthStatus, useSession } from '../hooks/use-session'
import { useCurrentUser } from '../hooks/use-current-user'

export function AdminRouteGuard({ children }: { children?: ReactNode }) {
  const session = useSession()
  const { status, error: restoreError, retry } = useAuthStatus()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, isChecking, isError, error, isAdmin, refetch } = useCurrentUser()

  // 1. Đang trong quá trình khôi phục phiên: chờ hoàn tất, không chuyển hướng hoặc nháy màn đăng nhập khi F5
  if (status === 'restoring') {
    return <PageLoading />
  }

  // 2. Lỗi mạng hoặc 5xx khi đang khôi phục phiên: hiển thị màn hình thử lại, không coi là đăng xuất
  if (status === 'restore-error') {
    return (
      <div className="m3-card max-w-lg mx-auto my-12 shadow-sm">
        <ErrorState error={restoreError} onRetry={() => void retry()} />
      </div>
    )
  }

  // 3. Chưa đăng nhập hoặc phiên hết hạn: mở cổng đăng nhập quản trị và giữ đường dẫn đang truy cập
  if (!session || status === 'unauthenticated') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  // 4. Đang kiểm tra tài khoản: hiển thị loading, chưa mount AdminLayout hoặc trang con
  if (isChecking) {
    return <PageLoading />
  }

  // 5. Lỗi mạng hoặc 5xx khi tải /users/me: hiển thị lỗi và nút thử lại, không cho vào admin và không xóa session
  if (isError) {
    return (
      <div className="m3-card max-w-lg mx-auto my-12 shadow-sm">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    )
  }

  // 6. Đã đăng nhập nhưng không có role ADMIN hoặc HOTEL_OWNER: từ chối truy cập
  const isAuthorized =
    isAdmin ||
    Boolean(currentUser?.roles?.includes('HOTEL_OWNER') || currentUser?.roles?.includes('OWNER'))
  if (!isAuthorized) {
    return (
      <div className="m3-card max-w-lg mx-auto my-12 shadow-sm" role="alert">
        <Result
          status="403"
          title="Bạn không có quyền truy cập"
          subTitle={`Tài khoản ${currentUser?.email ?? ''} không có quyền quản trị viên (ADMIN) hoặc chủ khách sạn (HOTEL_OWNER) để truy cập khu vực này.`}
          extra={
            <Button
              type="primary"
              className="!rounded-full !h-10 !px-6 font-semibold"
              onClick={() => void navigate('/', { replace: true })}
            >
              Về trang chủ
            </Button>
          }
        />
      </div>
    )
  }

  // 7. Bảo vệ riêng trang Quản trị người dùng: chỉ dành cho ADMIN, nếu là Owner chuyển hướng về Quản lý khách sạn
  if (location.pathname.startsWith('/admin/users') && !isAdmin) {
    return <Navigate to="/hotels" replace />
  }

  // 8. Đã xác minh có thẩm quyền: cho phép truy cập
  return children ? <>{children}</> : <Outlet />
}
