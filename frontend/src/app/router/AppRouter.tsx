import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import {
  BarChartOutlined,
  CalendarOutlined,
  CloudServerOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { HotelWorkspaceLayout } from '@/app/layouts/HotelWorkspaceLayout'
import { AdminRouteGuard } from '@/features/auth'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { HotelManagementListPage } from '@/pages/management/HotelManagementListPage'
import { ManagementPlaceholderPage } from '@/pages/management/ManagementPlaceholderPage'
import {
  HotelOverviewPage,
  HotelInfoPage,
  HotelPhotosPage,
  HotelAmenitiesPage,
  HotelRoomsPage,
  HotelRoomCreatePage,
  HotelRoomDetailPage,
  HotelRoomAmenitiesPage,
  HotelPhysicalRoomAmenitiesPage,
  HotelPricingPage,
  HotelPoliciesPage,
  HotelBookingsPage,
  HotelReviewsPage,
  HotelCreatePage,
} from '@/pages/management/hotels'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { StayVibeHomePage } from '@/pages/public/StayVibeHomePage'
import { HotelDetailPage } from '@/pages/public/HotelDetailPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        {/* Admin & Partner Dashboard Routes (Protected by AdminRouteGuard) */}
        <Route
          element={
            <AdminRouteGuard>
              <AdminLayout />
            </AdminRouteGuard>
          }
        >
          <Route path="admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="admin/overview" element={<AdminOverviewPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />

          {/* CẤP 1: Danh sách Khách sạn & Thêm mới */}
          <Route path="hotels" element={<HotelManagementListPage />} />
          <Route path="hotels/new" element={<HotelCreatePage />} />

          {/* CẤP 2: Khách sạn Workspace (/hotels/:hotelId/*) */}
          <Route path="hotels/:hotelId" element={<HotelWorkspaceLayout />}>
            <Route index element={<HotelOverviewPage />} />
            <Route path="info" element={<HotelInfoPage />} />
            <Route path="photos" element={<HotelPhotosPage />} />
            <Route path="amenities" element={<HotelAmenitiesPage />} />
            <Route path="rooms" element={<HotelRoomsPage />} />
            <Route path="rooms/new" element={<HotelRoomCreatePage />} />
            <Route path="rooms/:roomId" element={<HotelRoomDetailPage />} />
            <Route path="rooms/physical/:roomId/amenities" element={<HotelPhysicalRoomAmenitiesPage />} />
            <Route path="rooms/amenities" element={<HotelRoomAmenitiesPage />} />
            <Route path="pricing" element={<HotelPricingPage />} />
            <Route path="policies" element={<HotelPoliciesPage />} />
            <Route path="bookings" element={<HotelBookingsPage />} />
            <Route path="reviews" element={<HotelReviewsPage />} />
          </Route>

          {/* CẤP 1: Các phân hệ toàn hệ thống */}
          <Route
            path="bookings"
            element={
              <ManagementPlaceholderPage
                kicker="VẬN HÀNH & ĐẶT CHỖ"
                title="Quản lý Đặt phòng"
                description="Theo dõi tình trạng đơn đặt phòng, lịch nhận/trả phòng và xử lý các yêu cầu thay đổi phòng của tất cả cơ sở lưu trú."
                icon={<CalendarOutlined />}
              />
            }
          />
          <Route
            path="customers"
            element={
              <ManagementPlaceholderPage
                kicker="DỮ LIỆU KHÁCH HÀNG"
                title="Quản lý Khách hàng"
                description="Tra cứu thông tin khách lưu trú, lịch sử đặt phòng và hồ sơ liên hệ khách hàng thân thiết."
                icon={<UserOutlined />}
              />
            }
          />
          <Route
            path="vouchers"
            element={
              <ManagementPlaceholderPage
                kicker="MARKETING & KHUYẾN MÃI"
                title="Quản lý Voucher & Ưu đãi"
                description="Tạo mã giảm giá, chương trình khuyến mãi theo mùa và thiết lập điều kiện áp dụng cho từng khách sạn."
                icon={<TagOutlined />}
              />
            }
          />
          <Route
            path="complaints"
            element={
              <ManagementPlaceholderPage
                kicker="DỊCH VỤ KHÁCH HÀNG"
                title="Tiếp nhận & Xử lý Khiếu nại"
                description="Theo dõi phản hồi, khiếu nại chất lượng phòng từ khách và cập nhật tiến độ giải quyết nhanh chóng."
                icon={<MessageOutlined />}
              />
            }
          />
          <Route
            path="finance"
            element={
              <ManagementPlaceholderPage
                kicker="TÀI CHÍNH & DÒNG TIỀN"
                title="Quản lý Doanh thu & Tài chính"
                description="Giám sát doanh thu lưu trú, công nợ, đối soát thanh toán và dòng tiền chi tiết theo từng ngày."
                icon={<CreditCardOutlined />}
              />
            }
          />
          <Route
            path="reports"
            element={
              <ManagementPlaceholderPage
                kicker="BÁO CÁO & PHÂN TÍCH"
                title="Báo cáo Doanh thu & Vận hành"
                description="Thống kê hiệu suất kinh doanh, tỷ lệ lấp đầy phòng (ADR, RevPAR) và báo cáo tăng trưởng theo tháng."
                icon={<BarChartOutlined />}
              />
            }
          />
          <Route
            path="contracts"
            element={
              <ManagementPlaceholderPage
                kicker="HỢP ĐỒNG & THỎA THUẬN"
                title="Hợp đồng lưu trú"
                description="Quản lý hợp đồng hợp tác, tỷ lệ chiết khấu hoa hồng và các điều khoản pháp lý giữa StayHub và đối tác lưu trú."
                icon={<FileTextOutlined />}
              />
            }
          />
          <Route
            path="financial-access"
            element={
              <ManagementPlaceholderPage
                kicker="PHÂN QUYỀN & TRUY CẬP"
                title="Phân quyền tài chính"
                description="Kiểm soát và phân quyền người dùng có thẩm quyền tra cứu dữ liệu doanh thu, đối soát tài chính và giao dịch thanh toán."
                icon={<SafetyCertificateOutlined />}
              />
            }
          />
          <Route
            path="system-status"
            element={
              <ManagementPlaceholderPage
                kicker="GIÁM SÁT HỆ THỐNG"
                title="Trạng thái máy chủ"
                description="Theo dõi tình trạng kết nối máy chủ, thời gian phản hồi và hiệu năng của các dịch vụ hệ thống."
                icon={<CloudServerOutlined />}
              />
            }
          />

          {/* Redirects từ routes cũ */}
          <Route path="management/hotels" element={<Navigate to="/hotels" replace />} />
          <Route path="management/rates" element={<Navigate to="/hotels" replace />} />
          <Route path="management/bookings" element={<Navigate to="/bookings" replace />} />
          <Route path="management/customers" element={<Navigate to="/customers" replace />} />
          <Route path="management/vouchers" element={<Navigate to="/vouchers" replace />} />
          <Route path="management/complaints" element={<Navigate to="/complaints" replace />} />
          <Route path="management/finance" element={<Navigate to="/finance" replace />} />
          <Route path="management/reports" element={<Navigate to="/reports" replace />} />
          <Route path="management/contracts" element={<Navigate to="/contracts" replace />} />
          <Route path="management/financial-access" element={<Navigate to="/financial-access" replace />} />
        </Route>

        {/* Public / Customer Main Layout Routes */}
        <Route element={<AppLayout />}>
          <Route index element={<StayVibeHomePage />} />
          <Route path="explore" element={<StayVibeHomePage />} />
          <Route path="stays/:hotelId" element={<HotelDetailPage />} />
          <Route
            path="system-status"
            element={
              <ManagementPlaceholderPage
                kicker="GIÁM SÁT HỆ THỐNG"
                title="Trạng thái máy chủ"
                description="Theo dõi tình trạng kết nối máy chủ, thời gian phản hồi và hiệu năng của các dịch vụ hệ thống."
                icon={<CloudServerOutlined />}
              />
            }
          />
          <Route path="management/live" element={<Navigate to="/" replace />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
