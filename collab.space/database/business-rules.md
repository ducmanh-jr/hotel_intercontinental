# Quy tắc dữ liệu và nghiệp vụ — Hotel Booking

[Tổng quan](README.md) · [ERD/FK](erd.md) · [Từ điển](data-dictionary.md)

Nguồn là DBML 37 bảng người dùng gửi ngày 21/10/2026. **THEO DBML** xác nhận cấu trúc được khai báo; **NGHIỆP VỤ** là hành vi đã trao đổi; **ĐỀ XUẤT/CẦN CHỐT** chưa tự trở thành ràng buộc hoặc logic đã chạy. Không dùng các giá trị enum tự đề xuất của bản docs 19/10 thay cho danh sách thật ở mục 8.

## 1. Tài khoản và quyền

- Email, phone và token_hash có UNIQUE theo DBML; chuẩn hóa email là quy tắc backend, CHECK trong Note chưa được khai báo thực thi.
- Đặt phòng cần tài khoản đã đăng ký, đăng nhập, không bị khóa và xác minh email một lần. Mã xác minh email khác mã reset password; đều kiểm tra hạn, đã dùng và thu hồi.
- **CẦN SỬA:** users.email_verified_at đang là timestamp NOT NULL. Đề xuất timestamptz nullable: NULL trước khi xác minh, có thời điểm sau khi xác minh. Không điền giờ giả để vượt NOT NULL.
- Role/permission toàn hệ thống và hotel_members theo khách sạn phải kiểm tra riêng. Enum nhân sự đã có MANAGER/RECEPTIONIST/STAFF; tên role_key như HOTEL_OWNER là ví dụ ghi chú, chưa chứng minh seed hay quyền API đã được cài.
- Có refresh_tokens chưa chứng minh đăng xuất/khóa/reset password vô hiệu hóa ngay mọi access token. Cần chốt và triển khai chính sách phiên; không suy ra từ cấu trúc bảng.

## 2. Khách sạn, phòng vật lý và media

- Phòng vật lý thuộc cùng hotel của room type nhờ FK ghép; số phòng duy nhất trong khách sạn. Lịch phân công và khoảng phục vụ dùng thời điểm; READY/DIRTY là tình trạng bàn giao hiện tại.
- Khách đặt room type/quantity, nhân viên gán phòng cùng loại trước hoặc khi check-in. Một item quantity = 2 cần hai phòng khác nhau, không thêm room_id duy nhất vào booking/item để thay các phân công.
- Chỉ check-in khi đơn CONFIRMED, đủ phòng hợp lệ, phòng sẵn sàng và nhân viên đã kiểm tra khách. Check-out chuyển phòng đã sử dụng sang DIRTY; sau xác nhận dọn xong mới READY.
- Không gán hai đơn chồng lịch vào cùng phòng, không gán vào lịch chặn. Phải bảo đảm có phương án phân bổ liên tục cả kỳ cho cả các đơn chưa gán số phòng.
- hotel_images, room_type_images và user_images hỗ trợ nhiều ảnh. UNIQUE media_object_id của user_images giới hạn một tệp ảnh thư viện thuộc một user, không giới hạn số ảnh/user.
- Một cover/hotel, cover/room type và avatar/user mới là Note; phải bổ sung partial UNIQUE hoặc cơ chế tương đương. Giữ rõ quyền sở hữu ảnh, trạng thái READY và cách ngừng dùng avatar_url cũ.

## 3. Tồn phòng, giữ chỗ và room_blocks

| Nội dung | Cách hiểu nghiệp vụ |
| --- | --- |
| Đêm lưu trú | [check_in, check_out): nhận 10/11, trả 12/11 dùng đêm 10 và 11/11 |
| Giữ chỗ | Đề xuất 15 phút từ lúc tạo đơn; độc lập giờ nhận phòng. Thử thanh toán lại không gia hạn |
| Chuyển giữ sang xác nhận | Reservation HELD → CONFIRMED; không trừ tồn lần thứ hai |
| Hủy/hết hạn | Giải phóng phần chiếm tồn đúng một lần; không tự khôi phục khi tiền đến muộn |
| Tổng phòng | Tính từ rooms có hiệu lực, đồng bộ vào room_inventory; không nhập tổng độc lập rồi để lệch |
| Gán phòng | Không tạo thêm lượng phòng đã bán hoặc tăng reserved_inventory |

```text
reserved_inventory = tổng quantity còn chiếm tồn của HELD/CONFIRMED
blocked = số phòng vật lý bị chặn cho đêm đang xét, không tính trùng
available = total_inventory - reserved_inventory - blocked
```

Phải có available >= 0 và đủ cho mọi đêm, nhưng chưa đủ nếu các phòng trống bị phân mảnh. Ví dụ 301 bảo trì đêm 10, 302 bảo trì đêm 11 thì mỗi đêm còn một phòng, nhưng chưa có cùng một phòng ở cả hai đêm. Không nhận đơn hai đêm nếu chưa có phương án ở liên tục.

**Room block theo nguồn mới:** room_id và FK ghép đã có; không còn là thiết kế chỉ chặn số lượng theo room type. Tuy nhiên quantity chưa bị buộc bằng 1 và Note vẫn dùng mô tả cũ. Đề xuất một dòng chặn một phòng, quantity = 1; không vừa đếm room_id vừa trừ quantity như hai khoản.

**Quy ước đề xuất:** start_date/end_date là đêm đầu/cuối bị chặn, bao gồm cả hai; quy đổi [start_date, end_date + 1 ngày) khi so sánh với booking. ACTIVE chỉ chặn trong khoảng ngày đó; RELEASED không tiếp tục chặn phần chưa qua. Không sửa tồn lịch sử, không chặn làm mất khả năng phục vụ các đơn đã giữ/xác nhận/đang ở. Lịch chặn hết hạn không tự chứng minh phòng READY.

Chi tiết quyền và xử lý ngoại lệ ở [nhóm BL trong nghiệp vụ](../business/module-scope-and-rules-draft.md#51-chặn-phòng--room_blocks).

## 4. Booking, giá và thanh toán

```text
tiền item = quantity × tổng unit_price của các đêm thuộc item
subtotal_amount = tổng tiền các item
total_amount = subtotal_amount - discount_amount
```

- Giá phòng là giá trọn gói trước voucher, đã gồm khoản bắt buộc. Không cộng khoản bắt buộc chưa được khách chấp nhận tại bước thanh toán.
- booking_night_prices giữ giá từng đêm; promotion_redemptions.discount_amount và bookings.discount_amount giữ số tiền giảm của đơn. Thay đổi giá/voucher sau đó không tự tính lại tiền đơn.
- Các amount là BIGINT; ví dụ VND lưu theo đồng. Giá trị gửi cổng phải chuyển theo giao thức cổng, không thay đơn vị dữ liệu trong DB vì yêu cầu của một provider.
- UNIQUE booking_code không chống gửi lại cùng yêu cầu đặt. Nguồn chưa có idempotency_key cho booking; cần bổ sung cơ chế phù hợp.
- amount/currency/booking/tham chiếu giao dịch phải khớp sau khi xác thực thông báo cổng; trang trình duyệt báo thành công không đủ để xác nhận đơn.
- Tổng hoàn đã thành công và đang yêu cầu không vượt khoản thực thu. refunds.booking_id phải thuộc payment_attempt_id; các FK riêng chưa bảo đảm quan hệ này.
- Tiền đến sau khi đơn đã hết hạn/hủy phải ghi nhận và xử lý hoàn; không tự khôi phục đơn/phòng. NO_SHOW của đơn đã trả đủ không thu thêm và không hoàn theo chính sách đã chốt.

## 5. Voucher đơn giản

**Phạm vi hiện tại:** Có voucher cơ bản theo yêu cầu mới; một booking dùng tối đa một voucher. Dùng các bảng/cột đã có, chưa bổ sung công cụ chiến dịch phức tạp.

**Vai trò:** Quản trị tạo/quản lý mã toàn hệ thống hoặc của khách sạn; quản lý chỉ tạo/quản lý mã của khách sạn được giao; khách áp dụng mã khi đặt. Lễ tân không tự cấp/sửa mức giảm trong đơn. Đây là quyền backend phải kiểm tra, chưa có cột created_by trong promotions để chứng minh đã lưu người tạo.

### 5.1. Cấu hình ở promotions

| Nhóm | Cột trong DB | Cách dùng |
| --- | --- | --- |
| Mã | code, name, description | code là mã duy nhất, khách nhập/chọn để áp dụng |
| Phạm vi | hotel_id | NULL: toàn hệ thống; có giá trị: chỉ khách sạn đó |
| Thời gian | starts_at, ends_at, status | ACTIVE và starts_at <= lúc tạo đơn < ends_at; đề xuất xét lúc đặt, không phải ngày ở |
| Điều kiện áp dụng | min_booking_amount | Tổng giá trọn gói trước giảm >= mức này |
| Giảm phần trăm | discount_type = PERCENTAGE, percentage_off | Tính giảm theo phần trăm; fixed_amount để NULL |
| Giảm số tiền | discount_type = FIXED_AMOUNT, fixed_amount | Giảm số tiền cố định; percentage_off để NULL |
| Trần giảm | max_discount_amount | Có giá trị thì giảm không vượt trần; NULL thì không đặt trần riêng |
| Giới hạn lượt có sẵn | usage_limit, per_user_limit | Nếu cấu hình phải tôn trọng; usage_limit NULL là không giới hạn tổng, per_user_limit mặc định 1 |

Tỷ lệ đề xuất trong (0, 100], số tiền giảm/trần giảm dương khi cấu hình, min_booking_amount >= 0 và starts_at < ends_at. Đây là quy tắc cần kiểm tra; các CHECK trong Note chưa được khai báo thành ràng buộc thực thi.

### 5.2. Công thức giảm

```text
S = subtotal_amount
R = floor(S × percentage_off / 100)     nếu PERCENTAGE
R = fixed_amount                       nếu FIXED_AMOUNT
D = min(R, max_discount_amount)         nếu có trần giảm
D = R                                  nếu không có trần riêng
D = min(D, S)
total_amount = S - D
```

Trần max_discount_amount áp dụng cho cả hai cách giảm nếu được cấu hình. Đề xuất làm tròn xuống đến đồng và yêu cầu 0 < D < S cho luồng thanh toán hiện tại. Voucher làm total = 0 bị từ chối với lý do rõ ràng, không thu một số tiền tự đặt để vượt điều kiện amount > 0. Luồng đơn miễn phí chưa được đặc tả.

| Ví dụ | Trước giảm | Cấu hình | Giảm thực tế | Khách trả |
| --- | ---: | --- | ---: | ---: |
| Phần trăm có trần | 2.000.000 | 10%, tối đa 150.000 | 150.000 | 1.850.000 |
| Phần trăm không chạm trần | 1.000.000 | 10%, tối đa 150.000 | 100.000 | 900.000 |
| Cố định | 1.000.000 | Giảm 100.000, không trần riêng | 100.000 | 900.000 |
| Cố định có trần | 1.000.000 | Giảm 200.000, trần 150.000 | 150.000 | 850.000 |

Nếu min_booking_amount là 1.500.000 đồng thì đơn trước giảm 1.000.000 đồng không được áp mã, dù công thức giảm tính được. Sai điều kiện phải thông báo và cho khách xác nhận phương án khác, không âm thầm đổi tổng cần thanh toán.

### 5.3. Lưu lượt dùng ở promotion_redemptions

| Cột | Ý nghĩa |
| --- | --- |
| promotion_id | Voucher đã áp |
| booking_id | Đơn nhận giảm; UNIQUE nên tối đa một lượt mã/đơn |
| user_id | Phải là customer_id của booking |
| discount_amount | Khoản giảm thực tế D, khớp bookings.discount_amount |
| status | APPLIED, CANCELLED hoặc REFUNDED đúng enum nguồn |
| redeemed_at | Thời điểm ghi nhận áp mã |

Luồng gọn: nhập mã → kiểm tra điều kiện và hạn mức nếu có → tính giảm → khách xác nhận báo giá → tạo booking/giữ phòng và ghi APPLIED nhất quán → thu total_amount. Không cộng dồn mã; gửi lại cùng đơn không tạo thêm redemption hoặc trừ lượt lần hai. Việc đổi mã trên đơn đã tạo chưa thuộc luồng cơ bản.

Nếu dùng giới hạn lượt, cần tính cả lượt đang giữ của đơn chờ thanh toán để tránh bán vượt hạn mức. APPLIED hiện chưa phân biệt đang giữ/đã dùng, phải kết hợp trạng thái booking. Đề xuất hủy/hết hạn trước xác nhận thì CANCELLED và trả lượt; chính sách trả lượt sau khi đã xác nhận/hoàn tiền còn cần chốt. REFUNDED chỉ ghi khi khoản hoàn tương ứng thực sự hoàn tất; chưa dùng giá trị REVERSED vì enum nguồn không có.

Thu/hoàn dựa trên tiền sau giảm đã thực thu. Đơn 2.000.000 giảm 150.000 thì thu 1.850.000; hoàn 100% tối đa 1.850.000, không hoàn cả phần voucher. Tạm dừng/sửa voucher không tự thay đổi đơn đã được chấp nhận.

**Điểm nguồn cần chú ý:** FK promotions.hotel_id đang ON DELETE SET NULL. Vì NULL mang nghĩa toàn hệ thống, xóa khách sạn không được vô tình mở rộng voucher của khách sạn đó. Giữ nguyên hành vi nguồn trong ERD nhưng đánh dấu cần sửa/chốt ở README.

## 6. Review, thông báo và outbox

- Review: mỗi booking tối đa một dòng; chỉ đúng người đặt sau CHECKED_OUT được đánh giá đúng hotel. Rating 1..5 là CHECK ghi chú, chưa được khai báo thực thi. Chỉ PUBLISHED được công khai/tính điểm; HIDDEN không được tính. Lịch sử sửa/ẩn chưa có cấu trúc riêng trong nguồn.
- Notification: read_at khác NULL là đã đọc; recipient_user_id xác định người nhận. dedupe_key duy nhất toàn bảng, nên định nghĩa khóa đủ phân biệt người nhận nếu cùng sự kiện gửi nhiều người.
- Outbox: ghi sự kiện cùng giao dịch nghiệp vụ rồi xử lý sau; aggregate_id không có FK giả đến nhiều bảng. Publisher/consumer cần chống tác động lặp.

## 7. Các vòng đời áp dụng

| Đối tượng | Chuyển trạng thái nghiệp vụ | Tác động |
| --- | --- | --- |
| Booking | PENDING_PAYMENT → CONFIRMED | Thu đủ tiền hợp lệ khi còn hạn; HELD → CONFIRMED, không trừ tồn thêm |
| Booking | PENDING_PAYMENT → CANCELLED/EXPIRED | Trả giữ chỗ; hủy lượt voucher đang giữ theo chính sách |
| Booking | CONFIRMED → CHECKED_IN → CHECKED_OUT | Gán đủ phòng, kiểm tra sẵn sàng; trả phòng chuyển DIRTY |
| Booking | CONFIRMED → NO_SHOW | Nhân viên xác nhận đủ điều kiện, không có thông báo đến muộn còn hiệu lực; không hoàn/thu thêm; trả tồn chưa dùng |
| Booking | CONFIRMED → CANCELLED | Theo chính sách đã lưu, tách việc hủy khỏi hoàn tiền |
| Phân công | ASSIGNED → CHECKED_IN → CHECKED_OUT | Ghi thời gian thực tế và giữ lịch sử |
| Phân công | ASSIGNED → RELEASED | Đổi/hủy/no-show theo phần còn hiệu lực, không trừ/cộng tồn hai lần |
| Chặn phòng | ACTIVE → RELEASED | Giải phóng phần chưa qua, giữ lịch sử; không tự READY |
| Voucher | DRAFT → ACTIVE; ACTIVE ↔ PAUSED; hết hạn → EXPIRED | Chỉ nhận mã mới khi ACTIVE và đúng thời gian |
| Lượt voucher | APPLIED → CANCELLED hoặc REFUNDED | Phân biệt hủy lượt với hoàn tiền đã hoàn tất; không có REVERSED |

Trạng thái thu tiền và hoàn tiền có PROCESSING theo nguồn. Timeout/mất kết nối chưa chứng minh FAILED; phải kiểm tra kết quả cổng trước khi thu lại. Media chỉ có PENDING/READY/DELETED; không ghi FAILED hoặc DELETING là enum đã tồn tại.

## 8. Đầy đủ 20 enum đúng nguồn

Giữ nguyên tên và casing. Đây là danh sách trong DBML mới, không phải giá trị tự đề xuất; chưa xác nhận đã tạo enum trong PostgreSQL.

| Tên kiểu | Các giá trị đúng thứ tự nguồn |
| --- | --- |
| `user_status__t` | `active`, `inactive`, `pending`, `banned` |
| `hotel_status__t` | `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `SUSPENDED` |
| `amenity_category__t` | `HOTEL`, `ROOM` |
| `media_status__t` | `PENDING`, `READY`, `DELETED` |
| `hotel_member_role__t` | `MANAGER`, `RECEPTIONIST`, `STAFF` |
| `hotel_member_status__t` | `INVITED`, `ACTIVE`, `DISABLED` |
| `booking_status__t` | `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `EXPIRED`, `NO_SHOW` |
| `inventory_reservation_status__t` | `HELD`, `CONFIRMED`, `RELEASED` |
| `room_block_status__t` | `ACTIVE`, `RELEASED` |
| `payment_method__t` | `VNPAY`, `MOMO`, `ZALOPAY`, `STRIPE`, `BANK_TRANSFER` |
| `payment_status__t` | `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| `webhook_processing_status__t` | `PENDING`, `PROCESSED`, `IGNORED`, `FAILED` |
| `refund_status__t` | `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| `review_status__t` | `PUBLISHED`, `HIDDEN` |
| `promotion_discount_type__t` | `PERCENTAGE`, `FIXED_AMOUNT` |
| `promotion_status__t` | `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` |
| `promotion_redemption_status__t` | `APPLIED`, `CANCELLED`, `REFUNDED` |
| `outbox_event_status__t` | `PENDING`, `PROCESSING`, `PUBLISHED`, `FAILED` |
| `room_readiness__t` | `READY`, `DIRTY` |
| `room_assignment_status__t` | `ASSIGNED`, `CHECKED_IN`, `CHECKED_OUT`, `RELEASED` |

## 9. Những điểm chưa được giải quyết chỉ bằng schema

| Nội dung | Trạng thái |
| --- | --- |
| Email chưa xác minh | Cần sửa nullable/kiểu email_verified_at, không tự coi đã hợp lệ |
| Chặn phòng vật lý | Đã có bảng/quan hệ; cần chốt quantity = 1, quy ước ngày và sửa Note cũ |
| Voucher cơ bản | Đã yêu cầu có voucher, điều kiện áp dụng/cách giảm/trần; làm tròn, đơn miễn phí và trả lượt sau thanh toán cần chốt chi tiết |
| Giờ, hạn và hủy | Thời lượng giữ chỗ, giờ NO_SHOW, hạn đặt trong ngày và chính sách hủy chưa chốt hết; snapshot chính sách/giờ chưa có |
| Booking gửi lại | Chưa có khóa chống tạo trùng trong bảng booking |
| Lịch và tổng | Tổng số phòng, phân công liên tục, số người và tổng tiền nhiều dòng cần logic/ràng buộc phù hợp |
| Thanh toán | Cần chốt provider thực tế, ánh xạ tham chiếu, tiền trễ, thu trùng và tổng hoàn |
| Media | Cần partial UNIQUE cover/avatar và thống nhất nguồn avatar |
| Quyền và xóa | Cần kiểm tra vai trò/phạm vi; đặc biệt SET NULL voucher khi xóa hotel không được đổi phạm vi mã |

Các kiểm tra này cần được nghiệm thu sau khi triển khai. Bộ docs không chứng minh migration, gửi email, webhook, object storage hoặc hành vi đồng thời đã chạy đúng.
