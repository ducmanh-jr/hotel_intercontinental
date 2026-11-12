import { useEffect } from 'react'
import { Alert } from 'antd'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthPanel, sanitizeReturnTo, useAuthStatus, useCurrentUser, useSession } from '@/features/auth'
import { PageLoading } from '@/shared/ui/PageLoading'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const session = useSession()
  const { status } = useAuthStatus()
  const { currentUser, isChecking, isAdmin } = useCurrentUser()

  const rawReturnTo = (location.state as { from?: string } | null)?.from ?? searchParams.get('returnTo')
  const returnTo = sanitizeReturnTo(rawReturnTo)

  useEffect(() => {
    // Chỉ chuyển hướng khi có session, hoàn tất kiểm tra tài khoản và có returnTo nội bộ hợp lệ
    if (!session || isChecking || !currentUser || !returnTo) return

    // Nếu quay lại khu vực /admin, bắt buộc phải có role ADMIN
    if (returnTo.startsWith('/admin')) {
      if (isAdmin) {
        navigate(returnTo, { replace: true })
      }
      // Tài khoản không có role ADMIN tuyệt đối không được chuyển vào admin
    } else {
      navigate(returnTo, { replace: true })
    }
  }, [session, isChecking, currentUser, isAdmin, returnTo, navigate])

  if (returnTo && status === 'restoring') {
    return <PageLoading />
  }

  const hasForbiddenAdminAttempt =
    Boolean(session && !isChecking && currentUser && returnTo?.startsWith('/admin') && !isAdmin)

  return (
    <div style={{ width: '100%' }}>
      {hasForbiddenAdminAttempt && (
        <div style={{ maxWidth: 640, margin: '0 auto 16px' }} role="alert">
          <Alert
            type="warning"
            showIcon
            title="Tài khoản không có quyền quản trị viên"
            description={`Tài khoản ${currentUser?.email ?? ''} không có quyền ADMIN để truy cập ${returnTo}.`}
          />
        </div>
      )}
      <AuthPanel initialAction="login" />
    </div>
  )
}
