import { Link } from 'react-router'
import { ActionWorkbench } from '@/shared/ui/ActionWorkbench'
import { authActions, isAuthActionId, type AuthActionId } from '../model/auth-actions'
import { useAuthLinkToken } from '../hooks/use-auth-link-token'
import { useSession } from '../hooks/use-session'
import { AuthForm } from './AuthForm'

export function AuthPanel({ initialAction = 'login' }: { initialAction?: AuthActionId }) {
  const token = useAuthLinkToken()
  const session = useSession()
  return <ActionWorkbench actions={authActions} initialAction={initialAction} hasSession={Boolean(session)}
    description="Thực hiện các chức năng tài khoản đã có trên máy chủ: đăng ký, xác minh email, đăng nhập và quản lý phiên."
    notice="Tải lại trang sẽ cần đăng nhập lại. Khi phiên hết hạn, chọn Làm mới phiên."
    toolbar={<Link to="/system-status">Trạng thái hệ thống</Link>}
    renderForm={(action) => <AuthForm key={action.id} actionId={isAuthActionId(action.id) ? action.id : 'login'} token={token} />} />
}
