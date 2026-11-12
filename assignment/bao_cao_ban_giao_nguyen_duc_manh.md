# Báo Cáo Bàn Giao & Kịch Bản Demo — Nguyễn Đức Mạnh (`@ducmanh-jr`)

Tài liệu này tổng hợp đầy đủ **Báo cáo tiến độ Tuần 1 (12/11)**, **Báo cáo tiến độ Tuần 2 (19/11)**, **Hướng dẫn tích hợp liên module cho các thành viên trong nhóm**, và **Kịch bản Demo ngày 20/11**.

---

## 1. Hướng dẫn tích hợp liên module (Dành cho `booking`, `payment`, `hotel`, và Frontend)

### 1.1 Dành cho Nguyễn Thành Đạt (`booking`) & Vũ Hải Đăng (`payment`)
Module `inventory` cung cấp contract công khai tại `InventoryReservationDirectory` (tương tự mẫu `PricingDirectory`):

- **`HoldOutcome hold(HoldRequest request)`**:
  - Khóa bi quan (`PESSIMISTIC_WRITE` / `SELECT ... FOR UPDATE`) các dòng `room_types` theo thứ tự UUID tăng dần để chống deadlock và chống tranh phòng cuối (`IV-08`).
  - Kiểm tra mọi đêm trong `[checkInDate, checkOutDate)` đều có giá hợp lệ `> 0` (`PR-01`, `PR-02`, `HT-03`) và còn đủ phòng trống liên tục suốt kỳ (`IV-04`, `IV-13` qua `RoomAllocationPlanner`).
  - **Idempotent theo `bookingId` (`BK-12`)**: Gọi lặp cùng `bookingId` khi đang giữ chỗ còn hạn sẽ trả về `HoldOutcome(..., alreadyHeld = true)` mà không giữ trùng lần hai.
- **`void confirm(UUID bookingId)`**:
  - Chuyển toàn bộ dòng `HELD` còn hạn của `bookingId` sang `CONFIRMED` (`IV-06`).
  - Nếu đã `CONFIRMED` toàn bộ $\Rightarrow$ no-op (idempotent).
  - Nếu đã hết hạn (`expires_at <= now`) hoặc đã `RELEASED` $\Rightarrow$ ném `InventoryException(HOLD_EXPIRED)` để luồng thanh toán xử lý hoàn tiền.
- **`ReleaseOutcome release(UUID bookingId, ReleaseReason reason)`**:
  - Giải phóng toàn bộ dòng `HELD`/`CONFIRMED` sang `RELEASED` với `reason` (`EXPIRED`, `CANCELLED`, `PAYMENT_FAILED`).
  - **Idempotent tuyệt đối (`IV-07`)**: Gọi lặp lần 2 trả `releasedRowCount = 0`.
- **`ReleaseOutcome releaseUnusedNights(UUID bookingId, LocalDate fromDate)`**:
  - Dùng cho nghiệp vụ `NO_SHOW` (`BK-10`, `BK-14`, `IV-11`): chỉ giải phóng các đêm có `stay_date >= fromDate`, giữ nguyên lịch sử các đêm đã qua.

---

## 2. Mẫu Báo Cáo Tiến Độ Tuần 1 (Gửi trước 20:00 Thứ Năm 12/11/2026)

> **Báo cáo tiến độ Tuần 1 — Nguyễn Đức Mạnh (`@ducmanh-jr`) — Module `inventory` & `pricing`**
> - **Đã hoàn thành**:
>   1. Gia cố API tra cứu khả dụng `GET /api/v1/hotels/{hotelId}/availability` (`IV-01..04`, `IV-12..14`, `PR-01/02`, `HT-03/12`): tích hợp bộ lập lịch `RoomAllocationPlanner` kiểm tra khả năng phân bổ phòng vật lý liên tục suốt kỳ lưu trú và chặn bán đêm chưa có giá hợp lệ (`<= 0`).
>   2. Xây dựng contract nội bộ `InventoryReservationDirectory` (`hold`, `confirm`, `release`, `releaseUnusedNights`) kèm khóa `FOR UPDATE` theo thứ tự `room_types.id` (`IV-05..08`, `BK-12`) và migration `V20261110102500000__harden_inventory_reservations.sql`.
>   3. Hoàn thiện bộ API Quản lý chặn phòng vật lý (`BL-01..12`) và API Lịch phòng (`GET /api/v1/management/hotels/{hotelId}/room-calendar`) tại `ManagementRoomBlockController` + migration `V20261110104000000__harden_room_blocks.sql`.
>   4. Gia cố module `pricing` (`PR-01`, `PR-08`): tách biệt hoàn toàn `pricing.application` khỏi `pricing.infrastructure`, bổ sung lưu vết `updated_by_user_id` trong `V20261110105000000__add_rate_audit_to_room_rates.sql`.
> - **Kiểm thử**: Vượt qua toàn bộ Unit Test, MockMvc Test và kiểm thử đa luồng 20 luồng tranh 1 phòng cuối cùng trên PostgreSQL.

---

## 3. Mẫu Báo Cáo Tiến Độ Tuần 2 (Gửi trước 20:00 Thứ Năm 19/11/2026)

> **Báo cáo tiến độ Tuần 2 — Nguyễn Đức Mạnh (`@ducmanh-jr`) — Vận hành lưu trú & Kiểm thử đồng thời**
> - **Đã hoàn thành**:
>   1. Hoàn thiện migration `V20261110110000000__create_room_assignments.sql` và bộ API vận hành lưu trú tại `ManagementStayOperationController`:
>      - `PUT /api/v1/management/hotels/{hotelId}/bookings/{bookingId}/room-assignments` (`BK-15..17`: gán/đổi phòng vật lý, lưu lịch sử `RELEASED`, không trừ tồn lần hai).
>      - `PATCH /api/v1/management/hotels/{hotelId}/rooms/{roomId}/readiness` (`IV-15`: cập nhật `READY`/`DIRTY`).
>      - `POST /api/v1/management/hotels/{hotelId}/bookings/{bookingId}/late-arrival` (`BK-09`, `BK-14`: ghi nhận khách báo đến muộn).
>      - `POST /api/v1/management/hotels/{hotelId}/bookings/{bookingId}/check-in` (`BK-08`: kiểm tra đủ phòng đã gán và mọi phòng `READY`).
>      - `POST /api/v1/management/hotels/{hotelId}/bookings/{bookingId}/check-out` (`BK-18`, `IV-10`: tự động chuyển các phòng đã ở sang `DIRTY`, không mở bán lại đêm trả sớm).
>      - `POST /api/v1/management/hotels/{hotelId}/bookings/{bookingId}/no-show` (`BK-10`, `IV-11`: hoàn trả tồn kho đúng một lần cho các đêm tương lai).
>   2. Hoàn thiện bộ kiểm thử tích hợp đa luồng `InventoryConcurrencyIntegrationTests` (7/7 kịch bản PASS trên PostgreSQL 18), `ModularityTests` (3/3 PASS), Unit/Controller Tests (61/61 PASS), và bộ Postman Collection `Hotel_Booking_API_Postman_Collection.json` (17/17 PASS).

---

## 4. Kịch Bản Demo Ngày 20/11 (Chạy trực tiếp trên Postman + PostgreSQL 18)

1. **Bước 1 — Đăng nhập & Thiết lập giá (`PR-01`, `PR-02`, `PR-08`)**:
   - Chạy `1.1 Đăng nhập lấy Token` $\rightarrow$ tự động lưu `accessToken`.
   - Chạy `[PR02] Đặt giá phòng theo dải ngày` (`1.200.000đ`/đêm cho `2026-12-01..04`) và `[PR01] Xem giá phòng theo dải ngày`.
2. **Bước 2 — Kiểm tra khả dụng liên tục & Lịch phòng (`IV-01`, `IV-13`)**:
   - Chạy `[IV01] Kiểm tra phòng trống và báo giá` $\rightarrow$ trả về `availableQuantity = 2`, `totalEstimatedPrice = 3.600.000`.
   - Chạy `[Calendar] Xem lịch phòng và tồn kho theo ngày` $\rightarrow$ hiển thị 2 phòng vật lý `301`, `302` cùng `dailySummaries` 10 ngày.
3. **Bước 3 — Chặn phòng bảo trì, gia hạn và giải phóng (`BL-01..12`)**:
   - Chạy `[BL-01] Tạo lịch chặn phòng vật lý` cho phòng `301` (`2026-12-05..06`) $\rightarrow$ `201 Created`.
   - Chạy `[BL-06] Cập nhật / Gia hạn lịch chặn phòng` đến `2026-12-07` $\rightarrow$ `200 OK`.
   - Chạy `[BL-10] Giải phóng lịch chặn phòng` $\rightarrow$ `status = RELEASED` (vẫn giữ bản ghi lịch sử).
4. **Bước 4 — Phân phòng, đến muộn, nhận phòng và trả phòng (`BK-08..09`, `BK-15..18`, `IV-10`)**:
   - Chạy `[BK-15/16] Phân phòng / Đổi phòng vật lý cho đơn đặt phòng` $\rightarrow$ gán phòng `301` (`status = ASSIGNED`).
   - Chạy `[Readiness] Cập nhật trạng thái sẵn sàng của phòng vật lý` (`READY`).
   - Chạy `[BK-09] Ghi nhận khách đến nhận phòng muộn` $\rightarrow$ lưu `lateArrivalExpectedAt`.
   - Chạy `[BK-08] Làm thủ tục nhận phòng (Check-in)` $\rightarrow$ `stayStatus = CHECKED_IN`.
   - Chạy `[BK-18, IV-10] Làm thủ tục trả phòng (Check-out)` $\rightarrow$ `stayStatus = CHECKED_OUT`, phòng `301` tự động chuyển sang `DIRTY`.
5. **Bước 5 — Đánh dấu khách không đến (`BK-10`, `IV-11`)**:
   - Chạy `[BK-10, IV-11] Đánh dấu khách không đến (No-show)` trên đơn `noShowBookingId` $\rightarrow$ `stayStatus = NO_SHOW`, tự động hoàn trả các đêm chưa sử dụng (`releasedRoomNights = 1`).

