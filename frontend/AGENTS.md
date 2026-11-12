# Quy tắc cho agent

- Đọc README.md, package.json và code liên quan trước khi sửa. Giữ nguyên thay đổi ngoài phạm vi; không tự commit/push.
- Stack: React/TypeScript/Vite, React Router, TanStack Query, Ant Design, React Hook Form + Zod. Không tự thêm framework/bộ UI/state manager khác.
- Giữ app / pages / features / shared. Luồng: page -> feature hook -> feature API -> shared HTTP client. Shared không import feature/page.
- Gọi HTTP qua shared/api/http.ts; không fetch trong component. Truyền AbortSignal; giữ query key theo feature.
- Business API unwrap {message,data}; lỗi dùng ApiError/ProblemDetail và field errors; phân trang bắt đầu từ 0. Không đoán endpoint/DTO.
- Đọc env qua shared/config/env.ts; thêm biến mẫu vào .env.example. Không commit .env.local/secret; VITE_* là public, được bundle lúc build.
- Giữ API base là path cùng origin để dùng lại image qua các môi trường. API_PROXY_TARGET chỉ dành cho dev.
- Auth đã nối tại /login và /management/live theo backend develop. Access/refresh token chỉ giữ trong memory, không lưu password/token vào localStorage. Refresh thủ công; BE trả token trong JSON, chưa có cookie HttpOnly. Quyền thật luôn kiểm ở BE.
- Không tự tính lại giá/tồn/voucher/quyền hoặc giả thành công booking/payment ở FE.
- Mọi màn hình có loading, empty, error, success; form dùng RHF + Zod; dùng theme/UI chung, hỗ trợ bàn phím và mobile.
- Feature mẫu system-status gọi /actuator/health thật. Mock phải được ghi rõ và không được mô tả là đã tích hợp BE.
- Trước bàn giao chạy npm run check. Thêm test có ý nghĩa cho logic dùng chung và hành vi sửa; không khai báo test/build đạt khi chưa chạy.
- Nhánh <ten>/<cong-viec> -> PR develop -> staging -> main. Không bypass rules hoặc đổi CI để che lỗi.
