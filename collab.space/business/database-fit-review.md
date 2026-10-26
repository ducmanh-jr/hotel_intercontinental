# Đối chiếu thiết kế database với nghiệp vụ v0.3

Ngày kiểm tra: 21/10/2026.

> Bản đánh giá lịch sử: áp dụng cho export 33 bảng ngày 19/10, không phải DBML mới 37 bảng. Xem [docs database hiện tại](../database/README.md) để biết cấu trúc và các điểm cần sửa mới nhất; không dùng các kết luận thiếu bảng/enum trong báo cáo này cho bản mới.

## 1. Kết luận và phạm vi kiểm tra

**Thiết kế ngày 19/10 là nền tảng có thể tiếp tục sử dụng, nhưng chưa đủ cho nghiệp vụ v0.3.** Thiếu đáng kể nhất là quản lý phòng vật lý/gán phòng, xác minh email một lần và dữ liệu giữ nguyên điều khoản của đơn. Không nên dùng nguyên bản thiết kế để triển khai toàn bộ phạm vi mới.

Đã kiểm tra trực tiếp:

- Bản export 33 bảng do người phụ trách xác nhận: `C:/Users/Admin/Downloads/Untitled Diagram_2026-10-19T12_41_44.318Z.md`.
- [Phạm vi và quy tắc nghiệp vụ v0.3](module-scope-and-rules-draft.md).
- Source và cấu hình backend trong checkout hiện tại.

Đây là đánh giá thiết kế dữ liệu. Bản export có nhãn `CURRENT — Flyway V1..V5` và `PLANNED`, nhưng những nhãn đó không chứng minh đã triển khai. Repo hiện chưa có entity nghiệp vụ hoặc file migration trong thư mục migration; Docker Engine không kết nối được khi kiểm tra, nên chưa kiểm chứng database đang chạy, dữ liệu thực tế, ràng buộc SQL hay hành vi đồng thời.

Các đề xuất cấu trúc dưới đây chưa được áp dụng vào bản export hoặc database.

## 2. Mức phù hợp theo module

| Module | Nền tảng có trong export | Điểm còn thiếu hoặc chưa đủ rõ |
| --- | --- | --- |
| identity | `users`, RBAC, `refresh_tokens`, `password_reset_tokens` | Chưa có biểu diễn rõ email đã xác minh độc lập với khóa tài khoản, mã xác minh email và liên kết ảnh tài khoản theo media. Thu hồi phiên tức thời chưa được chứng minh. |
| hotel | `hotels`, `room_types`, tiện ích, `hotel_members`, giờ nhận/trả mặc định | Chưa có phòng vật lý; trạng thái công khai, tạm ngừng và khóa bởi quản trị chưa được đặc tả đủ. Cần thống nhất vai trò OWNER/MANAGER/RECEPTIONIST. |
| inventory | `room_inventory`, `inventory_reservations`, `room_blocks` | Chỉ theo loại phòng/ngày và chặn theo số lượng; chưa đáp ứng lịch phòng vật lý, bảo trì theo phòng và phân bổ liên tục. |
| pricing | `room_rates`, `booking_night_prices`, các tổng tiền của booking | Có giá theo ngày và giá chụp tại lúc đặt. Chưa có giá cơ bản dự phòng; có thành phần voucher ngoài phạm vi. Điều kiện giá dương cần thống nhất. |
| booking | `bookings`, `booking_items`, lịch sử trạng thái và hạn giữ chỗ | Thiếu gán phòng, ghi nhận đến muộn có cấu trúc, điều khoản/giờ nhận trả lưu tại lúc đặt và chống tạo trùng đơn. Danh sách giá trị trạng thái chưa được cung cấp. |
| payment | `payment_attempts`, `payment_webhook_events`, `refunds`, các khóa chống lặp | Phù hợp hướng nhiều lần thanh toán/đơn và hoàn tiền riêng. Cần đặc tả ánh xạ cổng thanh toán, yêu cầu đang có hiệu lực và các ràng buộc xuyên giao dịch. |
| media | `media_objects`, `hotel_images`, `room_type_images` | Quan hệ nhiều ảnh phù hợp yêu cầu không giới hạn số lượng. Ảnh tài khoản còn dùng `avatar_url`; một ảnh cover duy nhất mới là ghi chú đề xuất, chưa thấy chỉ mục tương ứng. |

“Có nền tảng” chỉ xác nhận thiết kế có nơi biểu diễn một phần dữ liệu; không đồng nghĩa quy tắc đã được thực thi.

## 3. Các thay đổi quan trọng trước khi triển khai

### DB-01. Bổ sung phòng vật lý, phân công và lịch ngừng phục vụ

**Quy tắc liên quan:** HT-10 đến HT-12; IV-01, IV-08, IV-12 đến IV-15; BK-15 đến BK-18.

**Bằng chứng:** Export có `room_types` (dòng 467), nhưng không có bảng phòng vật lý hoặc gán phòng. `room_blocks` ghi rõ chặn theo loại phòng và số lượng, chưa quản lý phòng riêng lẻ (dòng 325–338).

**Hệ quả:** Không biết khách ở phòng 301 hay 302; không kiểm tra được trùng phòng, bảo trì đúng phòng hoặc phòng nào đang chờ dọn. Tồn đủ theo từng ngày chưa chứng minh có cùng một phòng trống suốt kỳ ở.

**Hướng bổ sung đề xuất:**

- `rooms`: khách sạn, loại phòng, số phòng, tầng, thời gian hiệu lực/ngừng sử dụng và thông tin bàn giao cần thiết; số phòng duy nhất trong khách sạn.
- `room_assignments`: liên kết từng phòng vật lý với hạng mục đơn, kỳ được gán, trạng thái còn hiệu lực và người/thời điểm phân công; giữ lịch sử khi đổi phân công.
- Lịch ngừng phục vụ theo phòng, có khoảng thời gian, lý do và người thực hiện; có thể mở rộng cấu trúc chặn hiện tại hoặc tạo cấu trúc riêng, nhưng chỉ có một cách tính ảnh hưởng vào tồn.
- Biểu diễn chờ dọn/sẵn sàng tách khỏi lịch đã đặt/bảo trì. Có thể lưu tình trạng hiện tại và lịch sử thay đổi nếu cần truy vết.

`room_inventory` có thể giữ làm dữ liệu tổng hợp để truy vấn/khóa theo ngày; tổng phòng phải được đồng bộ từ danh mục thực tế. Gán số phòng không tạo thêm khoản trừ tồn. Khả năng phân bổ liên tục phải được bảo đảm cho cả các đơn chưa được nhân viên gán số phòng, không chỉ cho đơn đã gán.

### DB-02. Bổ sung xác minh email một lần

**Quy tắc liên quan:** ID-09 đến ID-11; BK-04.

**Bằng chứng:** `users` chỉ có `status`, chưa có thông tin xác minh email tách biệt (dòng 624–637). Có `password_reset_tokens` (dòng 537–547), không có bảng mã xác minh email hoặc trường mục đích để dùng bảng token chung cho việc này. Export không định nghĩa các giá trị `USER_STATUS__T`.

**Hướng bổ sung đề xuất:**

- `email_verified_at` hoặc biểu diễn tương đương độc lập với trạng thái khóa/mở tài khoản.
- `email_verification_tokens`: tài khoản, mã đã băm, thời điểm hết hạn, đã dùng/thu hồi. Có thể dùng bảng token chung nếu phân biệt mục đích rõ ràng.
- Backend chỉ tạo booking khi email đã xác minh; reset password không tự thay thế quy trình xác minh email.

Không kết luận rằng trường `status` hiện tại chắc chắn không thể biểu diễn xác minh; vấn đề là export chưa định nghĩa ý nghĩa và cách giữ kết quả xác minh sau khi khóa/mở tài khoản.

### DB-03. Lưu giờ, chính sách và thông tin đến muộn của từng đơn

**Quy tắc liên quan:** HT-07; ID-05; PR-06; BK-01, BK-07, BK-10, BK-13, BK-19.

**Bằng chứng:** `hotels` có `check_in_time`/`check_out_time` mặc định 14:00/12:00 (dòng 500–501); `bookings` chỉ lưu ngày nhận/trả, một nhóm `guest_*_snapshot`, trạng thái và hạn giữ chỗ (dòng 293–315). `booking_status_history` có actor, lý do và thời gian (dòng 228–238).

**Hướng bổ sung đề xuất:**

- Lưu giờ nhận/trả áp dụng tại lúc đặt, hoặc mốc thời gian đầy đủ tương đương, để sửa cấu hình khách sạn không đổi đơn cũ.
- Lưu bản chính sách hoặc phiên bản bất biến của chính sách hủy/no-show áp dụng cho đơn. Các con số như 24 giờ/100% vẫn đang chờ duyệt; thiết kế phải giữ được chính sách thực tế sau khi chốt.
- Có dữ liệu đến muộn: thời điểm dự kiến, lúc thông báo/ghi nhận, người ghi nhận và tình trạng thông báo; ghi vào cấu trúc riêng hoặc trường có cấu trúc rõ ràng. Ghi chú tự do trong lịch sử trạng thái chưa đủ làm điều kiện tự động, vì báo đến muộn vẫn giữ CONFIRMED.
- Phân biệt thông tin liên hệ người đặt và đại diện lưu trú khi khác nhau; một nhóm snapshot cần được định nghĩa rõ đang đại diện cho ai. `customer_id` chỉ liên kết tài khoản, không giữ nguyên thông tin liên hệ trước khi hồ sơ thay đổi.
- Lịch sử check-in/check-out/NO_SHOW có thể tận dụng `booking_status_history`; không bắt buộc thêm cột riêng cho mọi mốc nếu lịch sử đủ rõ và bất biến.

### DB-04. Bổ sung cơ chế chống tạo booking trùng

**Quy tắc liên quan:** BK-12; IV-05 đến IV-07.

**Bằng chứng:** `bookings` có `booking_code` duy nhất nhưng chưa có khóa nhận diện yêu cầu tạo đơn (dòng 293–324). `idempotency_key` hiện có ở thanh toán và hoàn tiền, không có ở booking.

**Hệ quả:** Cùng một lần bấm đặt được gửi lại có thể sinh hai booking với hai mã khác nhau; unique booking code không ngăn tình huống này.

**Hướng bổ sung đề xuất:** Khóa yêu cầu tạo booking có phạm vi theo người dùng và thao tác; có thể lưu tại booking hoặc bảng yêu cầu riêng. Phải kiểm tra yêu cầu gửi lại có cùng nội dung, trả cùng kết quả và không giữ tồn thêm. Kiểm tra/ghi nhận khóa và giữ tồn cần phối hợp trong xử lý giao dịch.

## 4. Những phần có thể tái sử dụng nhưng cần hoàn thiện

### DB-05. Phân quyền khách sạn và khóa bán bởi quản trị

- `hotel_members(hotel_id, user_id, member_role, status)` là nền tảng phù hợp cho nhân sự theo khách sạn (dòng 366–377).
- `roles.role_key` đang ghi ví dụ CUSTOMER/HOTEL_OWNER/ADMIN; nghiệp vụ đang dùng HOTEL_MANAGER/RECEPTIONIST. Cần chốt cách ánh xạ và dữ liệu vai trò; việc khác tên chưa tự chứng minh phải đổi cấu trúc bảng.
- `hotels.owner_user_id` bắt buộc nhưng nghiệp vụ chưa quyết định vai trò chủ sở hữu; phải thống nhất ý nghĩa trường này so với quản lý được phân công.
- `hotels.status` có thể biểu diễn trạng thái công khai, nhưng chưa đủ mô tả quyền mở lại sau khóa. Cần mô hình giữ được nguồn/lý do khóa và người thực hiện, hoặc trạng thái riêng có lịch sử phù hợp; không mặc định chỉ thêm một boolean là đủ.

### DB-06. Giá trọn gói và các phần ngoài phạm vi

- `room_rates` lưu giá từng ngày; `booking_night_prices` lưu giá từng đêm lúc đặt, phù hợp hướng PR-03/PR-06 (dòng 264–270, 356–363).
- Chưa có giá cơ bản để dùng khi không cấu hình giá riêng từng ngày như PR-02 đang đề xuất. Nếu giữ PR-02 cần bổ sung giá cơ bản có hiệu lực; nếu chỉ dùng giá theo ngày thì sửa quy tắc và yêu cầu cấu hình đủ ngày. Đây là lựa chọn nghiệp vụ còn chờ duyệt.
- Nguồn ghi giá `>= 0`, trong khi PR-01 yêu cầu `> 0`; cần thống nhất trước khi tạo ràng buộc thật.
- `promotions`, `promotion_redemptions` và `bookings.discount_amount` hỗ trợ voucher nhưng phạm vi đã chốt không có voucher. Có thể để phần khuyến mãi ngoài migration MVP; nếu giữ cột giảm giá thì cố định bằng 0 cho luồng hiện tại và giữ tổng tiền nhất quán. Không cần xóa dữ liệu khi mới đang đánh giá thiết kế.
- `room_types.max_adults/max_children` và số người ở booking/item cần thống nhất với quy tắc tổng sức chứa không phân tuổi. Chưa nên áp dụng hạn mức trẻ em riêng chỉ vì schema có cột này.
- `reviews` và thông báo trong ứng dụng là phần có thể để sau; xác minh/khôi phục qua email vẫn thuộc phạm vi identity. `outbox_events` là lựa chọn kỹ thuật hỗ trợ độ tin cậy, không phải tính năng khách hàng bắt buộc vì có trong export.

### DB-07. Thanh toán và hoàn tiền

**Nền tảng phù hợp:** `payment_attempts` có nhiều lần thử theo booking, amount/currency, khóa chống lặp và tham chiếu cổng. Có `payment_webhook_events` chống xử lý lặp và `refunds` tách riêng (dòng 137–206).

**Cần hoàn thiện khi thiết kế tích hợp:**

- Phân biệt phương thức thanh toán, nhà cung cấp, mã tham chiếu do backend gửi và mã giao dịch do cổng trả. Có thể sinh mã gửi từ payment attempt ID nếu đáp ứng giao thức; không bắt buộc thêm cột cho mọi tham số có thể tính lại.
- Định nghĩa nguồn của `provider_event_id` và khóa chống lặp tương ứng nếu dùng VNPAY; export chưa mô tả ánh xạ này. Chống lặp tiếp nhận thông báo và chống áp dụng tác động thu tiền hai lần phải cùng được xử lý.
- Xác định hạn của từng yêu cầu thanh toán, gắn với hạn giữ chỗ booking; lưu hoặc có quy tắc suy ra rõ ràng.
- Bảo đảm cùng booking chỉ có một yêu cầu đang có hiệu lực. Unique `(booking_id, attempt_number)` hiện chưa bảo đảm điều này.
- `refunds.booking_id` phải thuộc đúng booking của `payment_attempt_id`. Export thể hiện hai FK riêng, chưa thể hiện ràng buộc kết hợp này; có thể dùng FK kết hợp hoặc bỏ trường lặp và suy ra qua attempt.
- Tổng đã hoàn và đang yêu cầu hoàn không vượt số đã thu; cần xử lý đồng thời trên giao dịch gốc. Một CHECK trên từng dòng không tự bảo đảm tổng nhiều dòng.
- Thu tiền trễ, thu thừa, thử lại và hoàn tiền cần giữ nguyên lịch sử tài chính; booking và payment có trạng thái riêng. NO_SHOW không tạo lần thu/hoàn mới.

### DB-08. Media và ảnh không giới hạn số lượng

- `hotel_images`/`room_type_images` là quan hệ nhiều ảnh, không thấy giới hạn số dòng 10 ảnh: phù hợp MD-03 về khách sạn và loại phòng (dòng 385–418).
- Nguồn có `is_cover` và ghi chú cần partial unique index, nhưng danh sách index chưa có ràng buộc một cover/đối tượng. Cần bổ sung khi làm migration.
- `users.avatar_url` (dòng 633) chưa liên kết `media_objects`; nếu lưu nhiều ảnh tài khoản và chọn một avatar theo MD-03, cần quan hệ sở hữu/ảnh tài khoản và liên kết avatar hiện hành hoặc biểu diễn tương đương.
- `media_objects.created_by_user_id` lưu người tải, không tự chứng minh người đó có quyền gắn ảnh vào khách sạn. Backend phải kiểm tra quyền và sở hữu; các FK hiện tại không thay thế kiểm tra này.
- Riêng tư/công khai, xóa ảnh còn được dùng và dọn tệp chưa gắn là quy tắc dịch vụ/lưu trữ cần thực hiện; không kết luận đã đáp ứng chỉ vì có metadata.

### DB-09. Giá trị enum và ràng buộc thực thi

Export cung cấp tên các kiểu như `BOOKING_STATUS__T`, `HOTEL_STATUS__T`, `HOTEL_MEMBER_ROLE__T`, nhưng không có định nghĩa đầy đủ danh sách giá trị. Chưa thể xác nhận có NO_SHOW, CHECKED_IN, CHECKED_OUT hoặc các vai trò mới chỉ từ tên kiểu.

Cần đặc tả giá trị và chuyển trạng thái trước khi viết migration. Các dòng “CHECK” và “CHECK đề xuất” trong export là mô tả, chưa phải bằng chứng có ràng buộc SQL đã được áp dụng. FK/chỉ mục được mô tả cũng cần kiểm tra lại khi có DDL thực tế.

## 5. Những gì cần kiểm tra ở tầng xử lý, ngoài cấu trúc bảng

Các bảng đúng chưa đủ để chứng minh các yêu cầu sau:

1. Kiểm tra tồn, giữ đủ mọi đêm và chống tạo trùng đơn diễn ra nhất quán khi hai khách tranh phòng cuối.
2. Tổng hợp tồn khớp ledger giữ/xác nhận, phòng vật lý và lịch chặn; không trừ lại khi thanh toán hoặc gán phòng.
3. Không nhận thêm đơn khi lịch phòng bị phân mảnh, dù số lượng tối thiểu theo ngày vẫn dương.
4. Tại hạn giữ chỗ, xác nhận thanh toán và tác vụ hết hạn không cùng xác nhận/trả tồn theo hai kết quả khác nhau.
5. Khóa tài khoản/đăng xuất/reset password có hiệu lực với phiên theo chính sách đã chọn; có bảng refresh token chưa chứng minh access token bị thu hồi ngay.
6. Thông báo thanh toán lặp, tiền về sau hết hạn và hai yêu cầu hoàn đồng thời không tạo tác động tài chính sai.
7. Quyền quản lý, lễ tân và khóa bán bởi quản trị được kiểm tra đúng phạm vi khách sạn.

Đây là các mục nghiệm thu sau khi có migration và logic, chưa được kiểm thử trong lần đánh giá này.

## 6. Thứ tự chỉnh thiết kế đề xuất

1. **Bổ sung phòng vật lý và lịch phân công/ngừng phục vụ**, chốt cách đồng bộ tồn và bảo đảm ở liên tục.
2. **Bổ sung xác minh email, điều khoản đơn, đến muộn và khóa chống tạo trùng booking.**
3. **Đặc tả trạng thái/quyền/ánh xạ thanh toán**, hoàn thiện ràng buộc refund và số yêu cầu thu đang có hiệu lực.
4. **Thu gọn MVP theo phạm vi đã chốt**, hoàn thiện media và quyết định giá cơ bản/giá theo ngày.
5. Sau khi duyệt thiết kế, viết migration, triển khai một luồng đặt–thanh toán–gán phòng và kiểm thử các tình huống ở mục 5.

Các chính sách chưa duyệt như thời lượng giữ chỗ, giờ NO_SHOW, phí hủy và lựa chọn cổng thanh toán cần được chốt hoặc để cấu hình phù hợp; không tự gán giá trị cố định chỉ để hoàn tất schema.
