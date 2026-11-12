# NHIỆM VỤ ĐƯỢC GIAO & KẾT QUẢ THỰC HIỆN

**Thành viên thực hiện**: Nguyễn Đức Mạnh (`@ducmanh-jr`)  
**Phạm vi trách nhiệm**: Module `inventory` (Tồn kho & Vận hành lưu trú) & Module `pricing` (Giá phòng theo ngày)  
**Nhánh làm việc**: `features/inventory-pricing-finance`  
**Giai đoạn thực hiện**: Kế hoạch 2 tuần (09/11/2026 – 22/11/2026) theo phân công của nhóm  

---

## PHẦN I. NHIỆM VỤ ĐƯỢC GIAO LÀ GÌ?

Căn cứ theo tài liệu phân công nhiệm vụ 2 tuần (`assignment\Ke_hoach_phan_cong_2_tuan_Hotel_Booking.docx`) và bộ quy chuẩn dự án (`AgentRules\`), chịu trách nhiệm trọn vẹn **37 mã yêu cầu (SRS)** thuộc 4 lát cắt nghiệp vụ (Vertical Slices) cốt lõi:

### 1. Lát cắt 1: Tồn kho, Khả dụng phòng liên tục & Giữ chỗ (`IV-01..09, IV-12..14, BK-12`)
- **IV-01, IV-02, IV-03, IV-04**: Xây dựng thuật toán kiểm tra khả năng phân bổ phòng vật lý **liên tục suốt kỳ lưu trú** `[checkInDate, checkOutDate)`. Khách ở nhiều đêm không bị chuyển phòng giữa kỳ nếu không có phòng vật lý nào trống xuyên suốt.
- **IV-12, IV-13, IV-14**: Xử lý kịch bản chặn phòng chéo đêm (ví dụ: phòng 301 chặn đêm 1, phòng 302 chặn đêm 2 $\Rightarrow$ tồn kho khả dụng liên tục của loại phòng bằng 0). Chặn bán các ngày chưa được thiết lập giá hợp lệ (`<= 0`).
- **IV-05, IV-06, IV-07, IV-08, BK-12**: Cung cấp hợp đồng nội bộ (Public Module API) cho `booking` và `payment`:
  - `hold(...)`: Giữ chỗ 15 phút, khóa bi quan (`SELECT ... FOR UPDATE`) các dòng `room_types` theo thứ tự UUID tăng dần để chống deadlock và **chống tranh phòng cuối cùng**. Idempotent theo `bookingId`.
  - `confirm(...)`: Xác nhận giữ chỗ khi thanh toán thành công. Idempotent nếu gọi lặp.
  - `release(...)`: Hoàn trả tồn kho khi hết hạn hoặc hủy đơn. Idempotent tuyệt đối (gọi song song nhiều luồng chỉ hoàn trả đúng 1 lần).

### 2. Lát cắt 2: Quản lý chặn phòng bảo trì & Lịch phòng (`BL-01..12`)
- **BL-01..06, BL-09**: API tạo, sửa, gia hạn lịch chặn phòng vật lý (`POST/PUT/PATCH`). Chặn tạo/sửa lịch trong quá khứ, chống tạo hai lịch chặn chồng lấn trên cùng phòng vật lý. Kiểm tra ràng buộc: việc chặn phòng không được làm mất khả năng phân bổ phòng liên tục cho các đơn đặt phòng đã giữ chỗ/xác nhận từ trước.
- **BL-10**: Giải phóng lịch chặn phòng vật lý trước hạn (`status = RELEASED`), bảo toàn lịch sử kiểm toán (`released_by_user_id`, `released_at`, `release_reason`). Idempotent khi gọi lặp.
- **BL-11, BL-12**: API tra cứu danh sách lịch chặn phòng có bộ lọc theo khách sạn, loại phòng, phòng vật lý và dải ngày.
- **Room Calendar API**: API xem lịch phòng vật lý và tổng hợp tồn kho (`operationalCount`, `blockedCount`, `reservedCount`, `availableQuantity`) trong tối đa 90 ngày.

### 3. Lát cắt 3: Quản lý giá phòng theo ngày & Kiểm toán (`PR-01, PR-02, PR-08`)
- **PR-01, PR-02**: Tái cấu trúc module `pricing` theo Clean Architecture: API tra cứu giá phòng theo dải ngày (`GET`) và API thiết lập giá theo dải ngày (`PUT`), hỗ trợ giá theo ngày thường và cuối tuần/ngày lễ.
- **PR-08**: Ràng buộc toàn vẹn cơ sở dữ liệu `CHECK (amount > 0)` và bổ sung cột kiểm toán `updated_by_user_id` ghi nhận người thực hiện đổi giá.

### 4. Lát cắt 4: Phân phòng vật lý & Vận hành lưu trú (`BK-08..10, BK-14..18, IV-10..11, IV-15`)
- **BK-15, BK-16, BK-17**: Phân công phòng vật lý trước giờ nhận phòng. Cho phép đổi phòng linh hoạt, bảo toàn lịch sử phân công cũ ở trạng thái `RELEASED` kèm lý do thay đổi. Không trừ trùng tồn kho của hạng mục đã được gán phòng.
- **IV-15**: Cập nhật trạng thái buồng phòng vật lý (`READY` hoặc `DIRTY`).
- **BK-09, BK-14**: Tiếp nhận và ghi nhận thông tin khách báo đến muộn (`lateArrivalExpectedAt`, `lateArrivalNote`), dời mốc xử lý No-show sang thời điểm khách đã báo.
- **BK-08**: Thủ tục nhận phòng (Check-in): Kiểm tra đã gán đủ phòng vật lý cho mọi hạng mục và **mọi phòng đã gán đều phải ở trạng thái sẵn sàng (`READY`)**; nếu phòng `DIRTY` thì từ chối nhận phòng.
- **BK-18, IV-10**: Thủ tục trả phòng (Check-out): Tự động đổi trạng thái buồng phòng sang `DIRTY` để dọn dẹp. Nếu khách trả phòng sớm, **không tự động mở bán lại** các đêm còn lại để tránh xung đột lịch dọn phòng.
- **BK-10, IV-11**: Đánh dấu khách không đến (No-show): Giải phóng các phòng vật lý đã gán mà không đổi sang `DIRTY`; chỉ hoàn trả tồn kho của các đêm chưa sử dụng từ ngày hiện tại trở đi, bảo toàn lịch sử đêm đã qua; cơ chế idempotent không hoàn trả tồn lần hai.

### 5. Các ràng buộc kỹ thuật bắt buộc của nhóm
- Tuân thủ **Clean Architecture**: Tầng `domain` và `application` hoàn toàn độc lập, cấm import framework (`org.springframework.*`, `jakarta.persistence.*`).
- Tuân thủ **Spring Modulith**: Đóng gói nội bộ module, giao tiếp liên module qua interface đặt tại gốc module (`HotelDirectory`, `InventoryReservationDirectory`).
- **Quy tắc tuyệt đối**: **Chỉ duy nhất `shared` được phép có file `package-info.java`**, các module khác cấm tạo file này.
- **Không dùng `Instant.now()` tự do**: Mọi thời gian phải lấy qua bean `Clock` được inject để phục vụ kiểm thử.
- Tuân thủ chuẩn định dạng code `fmt:check` (Google Java Format).
- Làm việc nghiêm ngặt trên nhánh `features/inventory-pricing-finance`, tuyệt đối không thay đổi mã nguồn trên nhánh `develop`.

---

## PHẦN II. ĐÃ LÀM NHỮNG GÌ? (KẾT QUẢ THỰC HIỆN)

Hoàn thành **100% toàn bộ 37 mã yêu cầu** và các ràng buộc kỹ thuật:

### 1. Cơ sở dữ liệu & Database Migrations (Flyway)
Đã thiết kế và bổ sung 4 file Flyway migration tối ưu chỉ mục và ràng buộc toàn vẹn:
1. `V20261110102500000__harden_inventory_reservations.sql`: Thêm cột `booking_id`, `confirmed_at`, `release_reason`, các ràng buộc `CHECK` trạng thái và unique index `(booking_item_id, stay_date)`.
2. `V20261110104000000__harden_room_blocks.sql`: Thêm `updated_by_user_id`, `updated_at`, `release_reason`, ràng buộc `CHECK` giải phóng và chỉ mục tra cứu dải ngày phòng chặn.
3. `V20261110105000000__add_rate_audit_to_room_rates.sql`: Bổ sung `updated_by_user_id` và ràng buộc `CHECK (amount > 0)`.
4. `V20261110110000000__create_room_assignments.sql`: Tạo bảng `room_assignments` (lưu vết phân công/đổi phòng vật lý) và `booking_stay_operations` (lưu vết trạng thái lưu trú, khách đến muộn, nhận phòng, trả phòng, no-show).

### 2. Thiết kế Domain Model & Thuật toán cốt lõi
- Xây dựng `RoomAllocationPlanner.java`: Thuật toán đồ thị dòng cực đại / ghép cặp hai phía (Bipartite matching) kết hợp quy hoạch tham lam, kiểm tra xem có tồn tại ít nhất 1 phòng vật lý phục vụ xuyên suốt từ check-in đến check-out mà không bị gián đoạn hay phải chuyển phòng giữa chừng.
- Xây dựng các Domain Model và Repository Interface:
  - `RoomBlock` & `RoomBlockRepository`
  - `RoomAssignment` & `RoomAssignmentRepository`
  - `RoomRate` & `RoomRateRepository`

### 3. Hợp đồng tích hợp liên module (Spring Modulith Compliant)
- Xây dựng `InventoryReservationDirectory.java` đặt tại package gốc `com.team.hotelbooking.inventory`: cung cấp các phương thức `hold`, `confirm`, `release`, `releaseUnusedNights` cho `booking` và `payment`.
- Triển khai `InventoryReservationDirectoryAdapter.java`: sử dụng `TransactionTemplate` và khóa bi quan `room_types` theo thứ tự ID tăng dần chống deadlock và tranh phòng cuối.
- Mở rộng `HotelDirectory.java` và `HotelDirectoryAdapter.java` để module `inventory` tra cứu phòng vật lý, khóa phòng và cập nhật trạng thái buồng phòng đúng chuẩn Modulith (không vi phạm ranh giới module).

### 4. Tầng Application (Use Cases, Commands, Results & Services)
Xây dựng đầy đủ 11 Use Case Services độc lập, tuân thủ Clean Architecture (mỗi class 1 phương thức `execute`):
1. `CheckAvailabilityService`: Tra cứu khả dụng phòng liên tục kết hợp kiểm tra giá hợp lệ.
2. `CreateRoomBlockService`: Tạo lịch chặn phòng bảo trì.
3. `UpdateRoomBlockService`: Cập nhật/gia hạn lịch chặn phòng.
4. `ReleaseRoomBlockService`: Giải phóng lịch chặn phòng sớm.
5. `ListRoomBlocksService`: Lấy danh sách lịch chặn phòng theo bộ lọc.
6. `GetRoomCalendarService`: Lấy ma trận lịch phòng và tồn kho 90 ngày.
7. `AssignRoomsService`: Phân công/đổi phòng vật lý cho đơn đặt phòng.
8. `UpdateRoomReadinessService`: Cập nhật trạng thái phòng `READY`/`DIRTY`.
9. `RecordLateArrivalService`: Tiếp nhận và lưu thông báo khách đến muộn.
10. `CheckInBookingService`: Làm thủ tục nhận phòng (kiểm tra phân đủ phòng và phòng `READY`).
11. `CheckOutBookingService`: Làm thủ tục trả phòng (tự động chuyển phòng sang `DIRTY`).
12. `MarkNoShowService`: Đánh dấu khách không đến (trả tồn kho tương lai idempotent).
13. `GetRoomRatesService` & `SetRoomRatesService`: Tra cứu và đặt giá phòng theo dải ngày.

### 5. Tầng API (Controllers & DTOs)
Triển khai các REST Controller chuẩn RESTful, OpenAPI Swagger annotations và Spring Validation:
- `ManagementRoomBlockController.java`: Quản lý chặn phòng và lịch phòng.
- `ManagementStayOperationController.java`: Quản lý phân phòng và vận hành lưu trú.
- `ManagementRateController.java`: Quản lý giá phòng.

---

## PHẦN III. KẾT QUẢ KIỂM THỬ & CHỨNG MINH CHẤT LƯỢNG

Toàn bộ các tầng kiểm thử đã được chạy thực tế trên máy và đều vượt qua 100%:

| Loại kiểm thử | Công cụ / Môi trường | Số lượng | Kết quả | Ghi chú |
| :--- | :--- | :---: | :---: | :--- |
| **Google Java Format** | `fmt:check` | 629 files | **PASS (0 lỗi)** | Mã nguồn tuân thủ 100% chuẩn định dạng Google |
| **Spring Modulith** | `ModularityTests` | 3 tests | **PASS (3/3)** | Ranh giới giữa các module độc lập, chỉ `shared` có `package-info.java` |
| **Unit & MockMvc Tests** | JUnit 5, Mockito | 61 tests | **PASS (61/61)** | Kiểm tra logic nghiệp vụ từng Use Case và hợp đồng Controller |
| **Tích hợp đồng thời (Concurrency)** | PostgreSQL 18 | 7 tests | **PASS (7/7)** | Kiểm tra 20 luồng tranh 1 phòng cuối (`IV-08`), chặn phòng chéo đêm (`IV-13`), giải phóng song song idempotent (`IV-07`), đua giữ chỗ với chặn phòng (`BL-06`), 2 lễ tân gán trùng phòng (`BK-15`), vòng đời `DIRTY/READY` (`BK-08/18`), No-show trả tồn 1 lần (`BK-10`). |
| **Kiểm thử thực tế Postman** | Newman CLI engine | 25 requests | **PASS (25/25)** | 32/32 assertions đạt 100%. Bao gồm cả 17 request luồng chính và 8 request kiểm thử biên/lỗi. |
