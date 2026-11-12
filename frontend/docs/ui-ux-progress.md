# Tiến độ Chuẩn hóa Giao diện UI/UX — StayHub Frontend

Tài liệu này ghi nhận quá trình thiết kế, chuẩn hóa giao diện và theo dõi tiến độ từng plan theo phong cách của dự án và `design-taste-frontend` (`references/app-screens.md`).

---

## 1. Phong cách thiết kế đã chọn (Taste Direction)

Lựa chọn được xác lập và lưu trữ trong [`.taste-skill/direction.json`](../.taste-skill/direction.json):

- **Khuôn mẫu ứng dụng**: `app-screens` (hướng dẫn cho màn hình quản trị, bảng điều khiển và tác vụ vận hành).
- **Style**: `accent-ladder` (chủ đạo nền sáng - light theme).
- **Triết lý**:
  - *"One brand hue at full strength only on small marks, and its pale tints doing all the area work: the active nav row, badges and progress tracks."*
  - Màu sắc áp dụng có chủ đích lên dữ liệu và trạng thái; hạn chế trang trí thừa, không dùng gradient lòe loẹt hay hiệu ứng đổ bóng nặng.
- **Hệ thống Design Tokens (StayHub Brand)**:
  - **Màu chủ đạo (Brand Teal)**: `--admin-teal: #0E6B6F`, `--admin-teal-hover: #0A5356`, `--admin-teal-soft: #E6F4F5`, `--admin-teal-ink: #073B3D`.
  - **Nền & Bề mặt (Ground & Surfaces)**: `--admin-ground: #F5F6F7`, `--admin-surface: #FFFFFF`, `--admin-raised: #F0F2F4`, `--admin-border: #E3E6E9`, `--admin-rule: #EAECEE`.
  - **Trạng thái (Semantic Status)**:
    - Hoạt động: `--admin-status-active: #1F7A4D`, nền `--admin-status-active-bg: #E6F4EC`.
    - Chờ duyệt: `--admin-status-pending: #8A5A00`, nền `--admin-status-pending-bg: #FFF3D6`.
    - Tạm dừng: `--admin-status-inactive: #4B5560`, nền `--admin-status-inactive-bg: #EEF0F2`.
    - Đã khóa: `--admin-status-locked: #B42318`, nền `--admin-status-locked-bg: #FDECEA`.
  - **Typography**: Phông chữ chính `Be Vietnam Pro` (tải nội bộ), các cỡ phông phân cấp rõ ràng (Title: 22–24px, Section: 16px, Body: 13px, Caption/Meta: 11–12px), số liệu dùng `.tabular-nums`.
  - **Kích thước khung**: Sidebar cố định 240px trên Desktop/Tablet, Header thanh mảnh 56px, bo góc thẻ 10px, bo góc nút 6px.

---

## 2. Plan 1: Chuẩn hóa AdminLayout và Hệ thống thiết kế (Đã hoàn thành)

### Những việc đã làm
1. **Chuẩn hóa khung giao diện `AdminLayout` ([`src/app/layouts/AdminLayout.tsx`](../src/app/layouts/AdminLayout.tsx))**:
   - **Sidebar**:
     - Cố định 240px trên màn hình lớn (desktop/tablet), tự động ẩn dạng off-screen drawer trên màn hình nhỏ (mobile `< 768px`).
     - Tích hợp lớp phủ mờ (backdrop overlay), hỗ trợ đóng bằng nút bấm, phím `Escape`, hoặc khi bấm vào liên kết điều hướng.
     - Brand Header với biểu tượng StayHub Teal và nhãn Admin Portal.
     - Điều hướng phân nhóm rõ ràng: *Quản trị vận hành* (`/admin/overview`, `/admin/users`), *Quản lý khách sạn* (`/management/hotels`, `/management/rates`, `/management/contracts`, `/management/financial-access`), *Hệ thống* (`/management/live`, `/system-status`).
     - Trạng thái liên kết kích hoạt (Active Nav Item) theo đúng chuẩn `accent-ladder`: nền `--admin-teal-soft`, chữ đậm `--admin-teal-ink`, vạch chỉ báo 3px `--admin-teal`.
   - **Header cố định (Sticky Header)**:
     - Chiều cao chuẩn 56px, đường viền phân tách mỏng 1px `#E3E6E9`.
     - Nút hamburger cho thiết bị di động với nhãn trợ năng đầy đủ.
     - Breadcrumb ngữ nghĩa `<nav aria-label="Breadcrumb">` với danh sách `<ol>` và `aria-current="page"`.
     - Nút "Về trang chủ" (`/`) phẳng, liên kết nhanh về giao diện khách hàng.
     - Menu tài khoản người dùng (User Account Menu) tích hợp Ant Design Dropdown: hiển thị tên quản trị viên, thông tin phiên bộ nhớ (`useSession`), các tùy chọn đăng nhập/đăng xuất/chuyển phân hệ.
   - **Vùng nội dung (Content Canvas)**:
     - Khung chứa co giãn linh hoạt, giới hạn chiều rộng tối đa 1360px, căn giữa, padding 24px (desktop) và 16px (mobile).
2. **Hệ thống thiết kế bằng CSS Tokens ([`src/shared/styles/admin-dashboard.css`](../src/shared/styles/admin-dashboard.css))**:
   - Định nghĩa toàn bộ biến CSS cho màu sắc, khoảng cách, kích thước nút, ô nhập liệu, bảng và thẻ trạng thái.
   - Cung cấp các class tiện ích chuẩn: `.admin-btn-primary`, `.admin-btn-secondary`, `.admin-btn-ghost`, `.admin-btn-danger`, `.admin-input`, `.admin-table`, `.admin-status-pill`.
   - Loại bỏ các hiệu ứng đổ bóng thừa trên bề mặt phẳng, loại bỏ gradient không cần thiết.
3. **Chuẩn hóa màn hình Tổng quan ([`src/pages/admin/AdminOverviewPage.tsx`](../src/pages/admin/AdminOverviewPage.tsx))**:
   - Không bịa đặt KPI, không tạo biểu đồ hoặc số liệu ảo.
   - Tổ chức thành hub điều hướng trung tâm với các thẻ phẳng liên kết trực tiếp tới các phân hệ quản lý thực tế của hệ thống.
4. **Cải tiến màn hình Quản lý người dùng ([`src/pages/admin/AdminUsersPage.tsx`](../src/pages/admin/AdminUsersPage.tsx))**:
   - Sửa lỗi che khuất tiêu đề (covered text) trên màn hình mobile 390px bằng cách đưa sidebar mobile ra ngoài màn hình khi đóng.
   - Chuẩn hóa nút bấm phẳng, loại bỏ đổ bóng theo quy tắc anti-slop của taste-skill.
   - Căn phải cho cột số điện thoại kèm `.tabular-nums`.

---

## 3. Kết quả kiểm tra & Xác minh (Verification)

### Kiểm tra tích hợp mã nguồn (`npm run check`)
- **Lint**: `eslint .` đạt 0 lỗi, tuân thủ nghiêm ngặt quy tắc feature boundaries.
- **Typecheck**: `tsc -b` đạt 0 lỗi TypeScript.
- **Unit & Contract Tests**: Toàn bộ 94 tests trong 11 files vượt qua (bao gồm auth API, hotel management contract, user validation, filter logic).
- **Production Build**: `vite build` tạo bundle hoàn tất, sẵn sàng deploy.

### Kiểm tra Taste Skill & Trình duyệt thực tế (CDP Inspector)
Kiểm tra trên cả Vite Dev Server và Production Preview (`vite preview`) tại 3 kích thước chuẩn:
- **Desktop 1440px**: 0 FAIL, 0 WARN. Giao diện thoáng đãng, sidebar cố định 240px, bố cục cân đối.
- **Tablet 768px**: 0 FAIL, 0 WARN. Sidebar và bảng hiển thị ổn định, không tràn ngang.
- **Mobile 390px**: 0 FAIL, 0 WARN. Sidebar chuyển thành drawer ẩn hoàn toàn khi đóng, không che nội dung trang; nút bấm và bảng thích ứng tốt.
- **Taste Linter (`lint.mjs`)**: 0 FAIL, 0 WARN trên toàn bộ các file giao diện admin.

---

## 4. Hạn chế và phạm vi chưa kiểm thử

1. **Kiểm thử E2E trực tiếp với backend**: Chưa thực hiện kiểm thử E2E tương tác với cơ sở dữ liệu thật và email SMTP thật (kết quả ở đây dựa trên Vitest contracts, lint, typecheck và kiểm tra render trình duyệt thực qua CDP). Không suy diễn kết quả build thành E2E thật.
2. **Quyền hạn và API Quản trị**: Hiện tại chức năng danh sách người dùng quản trị đang chạy với nguồn dữ liệu mẫu hiển thị (preview), chưa có endpoint quản trị danh sách người dùng toàn diện từ backend.
3. **Lưu trữ phiên**: Token xác thực chỉ lưu trong bộ nhớ RAM (in-memory) theo đúng quy tắc bảo mật; tải lại trang sẽ đặt lại phiên đăng nhập.

---

## 5. Kế hoạch tiếp theo (Next Plans)

- **Plan 2**: Chuẩn hóa giao diện Quản lý cơ sở lưu trú và chi tiết phòng (`HotelManagementListPage`, `HotelManagementDetailPage`) theo cùng hệ thống tokens `accent-ladder` và shell chuẩn.
- **Plan 3**: Chuẩn hóa các màn Bảng giá phòng, Hợp đồng đối tác và Phân quyền tài chính (`HotelRatesManagementPage`, `HotelContractsManagementPage`, `FinancialAccessManagementPage`).
- **Plan 4**: Chuẩn hóa màn hình Bàn kiểm thử API trực tiếp (`LiveApiPage`) và Giám sát máy chủ (`SystemStatusPage`).
