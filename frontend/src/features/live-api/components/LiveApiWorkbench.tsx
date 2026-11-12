import { Link } from 'react-router'
import { useAuthLinkToken, useSession } from '@/features/auth'
import { ActionWorkbench } from '@/shared/ui/ActionWorkbench'
import { operations } from '../model/operations'
import { OperationForm } from './OperationForm'

export function LiveApiWorkbench({ initialOperation = 'login' }: { initialOperation?: string }) {
  const token = useAuthLinkToken()
  const session = useSession()
  return <ActionWorkbench actions={operations} initialAction={initialOperation} hasSession={Boolean(session)}
    description="Thực hiện các chức năng đã có trên máy chủ: tài khoản, vai trò, khách sạn và phòng. Kết quả bên dưới là dữ liệu thật; thao tác tạo và cấp quyền sẽ được lưu."
    notice="Tải lại trang sẽ cần đăng nhập lại. Khi phiên hết hạn, chọn Làm mới phiên. Giá phòng, hợp đồng, tiện ích và tồn phòng chưa có trên bản backend develop này."
    toolbar={<Link to="/system-status">Trạng thái hệ thống</Link>}
    renderForm={(action) => <OperationForm key={action.id} operation={operations.find((item) => item.id === action.id)!} token={token} />} />
}
