# Nguồn và phạm vi sơ đồ

Các sơ đồ là thiết kế luồng đề xuất, không phải bằng chứng hệ thống đã triển khai.

- Kiến trúc theo ảnh người dùng gửi: Cloudflare DNS/Proxy/HTTPS; VPS Ubuntu và Docker Compose; Nginx phục vụ React/Vite và reverse proxy /api; Spring Boot Modular Monolith; PostgreSQL persistent volume; Redis; Cloudflare R2; SMTP; VNPAY; GitHub Actions và GHCR.
- Quy tắc nghiệp vụ lấy từ business-rules.md, data-dictionary.md và README.md trong thư mục database.
- Các bước còn là đề xuất được đánh dấu ở thẻ ghi chú: vai trò Redis, URL ký trước R2, outbox/tác vụ nền, chính sách giữ/hủy/hoàn, lịch job, API và pipeline chi tiết.
- Không xác định endpoint nghiệp vụ cụ thể khi chưa có hợp đồng API; chỉ giữ đường /api được ghi trên ảnh.
- IPN được xác thực và xử lý chống lặp; Return URL không phải bằng chứng thanh toán. Hai đường có thứ tự độc lập.
- PostgreSQL là nguồn dữ liệu bền vững cho booking/tồn/tiền. Redis không thay thế transaction và kiểm tra tồn ở DB.
- Việc ký URL bằng S3 client không nhất thiết phát sinh một request đến R2; mũi tên đó thể hiện quan hệ sử dụng S3 API/client.
- Nội dung tác giả viết bằng tiếng Việt có dấu. Thanh công cụ cố định và thuộc tính html lang của trình xem Archify dùng tiếng Anh do chưa hỗ trợ tiếng Việt.
