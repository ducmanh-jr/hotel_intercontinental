# Quy tắc cho agent — Backend

Đối chiếu source ngày 2026-11-02, nền commit `c39f072`. Đọc hướng dẫn riêng ở thư mục con nếu có.

## MUST — bắt buộc

- Đọc [AgentRules.md](AgentRules.md), [mẫu code thật](AgentExamples.md) và code liên quan trước khi sửa.
- Đọc Git status/diff/cached diff; giữ nguyên thay đổi ngoài phạm vi. Không tự commit/push/đổi nhánh/reset.
- Giữ `api / application / domain / infrastructure`; không tự đổi kiến trúc hoặc thêm dependency.
- Controller gọi UseCase interface → application Result → `Response.from(result)` → ApiResponse; không trả domain/result trực tiếp qua HTTP.
- Application/domain là Java thuần. Repository interface bên trong; JPA/adapter/mapper bên infrastructure.
- Transaction dùng TransactionTemplate tại ModuleConfig; không gắn @Transactional/@Service vào application.
- Giữ ngoại lệ refresh: commit thu hồi family trước khi ném REFRESH_TOKEN_REUSED ra ngoài transaction.
- Controller không gắn @Validated cấp class; dùng @Valid và validation Spring MVC hiện tại.
- Dùng Clock inject; không dùng Instant.now() trong nghiệp vụ.
- Không truy cập repository/entity/service implementation nội bộ của module khác.
- Không đổi API/DB contract ngoài yêu cầu, không sửa migration đã áp dụng, không log secret/password/token.
- Làm checklist bàn giao trong [AgentRules.md](AgentRules.md#8-checklist-bàn-giao); báo đúng phần đã/chưa kiểm chứng.

## SHOULD — ưu tiên

- Copy cấu trúc từ file chuẩn trong [AgentExamples.md](AgentExamples.md), thay tên theo chức năng; không copy ngoại lệ cũ.
- Dùng record cho dữ liệu, constructor injection và field private final.
- Test theo hành vi, Given/When/Then, BDDMockito và @Nested; không mock khi không cần.

## Lệnh kiểm tra

```powershell
git status --short
git diff
git diff --cached
.\mvnw.cmd fmt:check
.\mvnw.cmd clean verify
git diff --check
```

Chỉ sửa Markdown: kiểm nội dung, đường dẫn và diff là đủ. Code thay đổi: chạy test phù hợp; full verify cần Docker. Không tắt test/rule hoặc sửa expected để che lỗi.

Bảng [Sai → Đúng](AgentRules.md#7-sai--đúng), mẫu transaction và công thức công việc nằm trong các tài liệu liên kết. File Markdown là hướng dẫn, không tự cưỡng chế kiến trúc trong CI.
