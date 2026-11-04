# Phân công tuần 2 — Hotel Booking

**Cập nhật:** 02/11/2026 · **Tuần 2:** 02–08/11 · **Thông đồ án:** thứ Năm 05/11 · **Hạn môn:** 20/11.

**Cơ cấu:** Đạt/Mạnh làm backend chính; Bắc/Tuấn làm frontend và hỗ trợ backend theo độ khó; Đăng làm hệ thống và hỗ trợ dữ liệu/demo. Cân cả FE, BE và vận hành, không chỉ đếm API.

**Nguồn:** OpenAPI, hotel, pricing, inventory, booking, media, identity, payment.

## 1. Trạng thái và mục tiêu

- Tuần 1: nhóm đã chọn đề tài, chốt nghiệp vụ/thiết kế DB, cấu hình CI/CD ban đầu và deploy staging theo tiến độ nhóm cung cấp.
- Tuần 2: pipeline đã hoàn thiện; TV2 thông báo code xong auth. TV3 tích hợp, mỗi người test phần mình; TV2 sửa lỗi auth phát sinh khi cần.
- Source có 8 route auth/me. YAML vẫn là contract thiết kế; không lấy DESIGN_NOT_IMPLEMENTED cũ để kết luận auth chưa làm, hoặc coi toàn bộ 15 API Identity đều đã có.
- **P0:** ưu tiên trước buổi thông; **P1:** làm tiếp trong tuần; **P2:** nhận thêm khi đủ đầu vào. Mức ưu tiên là kế hoạch, không phải trạng thái hoàn thành.
- Trước 05/11: demo pipeline/staging HTTPS, auth thật, tạo/xem khách sạn–loại phòng–phòng và đọc/ghi giá. Chốt bản demo hết 04/11.
- Public chỉ trả hotel đủ điều kiện ACTIVE. Nếu publication chưa làm, ghi rõ dữ liệu ACTIVE là fixture đã chuẩn bị; không trình bày việc tạo DRAFT như đã mở bán.
- Cuối 08/11: khép chỉnh sửa, tiện ích, giá, quyền; tích hợp policy/publication, khả dụng và tìm theo kỳ ở khi đủ nền. Booking chỉ nghiệm thu khi giữ chỗ, hết hạn và chống trùng cùng hoạt động.

## 2. Phân vai đã cân lại

| Thành viên | Vai trò | Đầu việc tuần 2 |
| --- | --- | --- |
| **TV1 — Đăng** | Hệ thống | Duy trì CI/CD, HTTPS, Nginx và staging; chuẩn bị bộ dữ liệu demo từ seed BE bàn giao, kiểm tra API qua domain, backup/rollback và trình bày phần hệ thống. Pipeline đã xong thì chỉ sửa lỗi/bổ sung phần thiếu. |
| **TV2 — Đạt** | Backend | Khách sạn, tìm kiếm, chính sách, duyệt/khóa/mở bán; nhận thêm nhân sự khách sạn để đồng bộ phân quyền với Identity. **12 API: HT03, HT06–HT14, HT22–HT23.** |
| **TV3 — Bắc** | Frontend + Backend | FE khách hàng/auth và FE quản lý loại phòng/phòng; code các API đọc danh mục/công khai và danh sách loại phòng/phòng. **6 API đọc: HT01, HT02, HT04, HT05, HT15, HT19.** |
| **TV4 — Tuấn** | Frontend + Backend | FE khách sạn, chính sách, mở bán, giá và nhân sự; code API tạo loại phòng/phòng, bàn giao cho Bắc tích hợp màn phòng. **2 API ghi: HT16, HT20.** |
| **TV5 — Mạnh** | Backend | Sửa loại phòng/tiện ích/phòng, giá theo ngày và khả dụng liên tục cả kỳ. **6 API: HT17, HT18, HT21, PR01–PR02, IV01.** |

Cân theo độ khó và tổng việc FE + BE, không chia đều số endpoint. Bắc nhận nhiều API đọc; Tuấn nhận ít API hơn để có thời gian làm FE quản trị. Mạnh giữ phần lịch/khả dụng khó; Đạt nhận nhân sự vì đang nắm auth/phân quyền. Đăng có đầu ra vận hành và demo cụ thể, không chỉ trực chờ deploy. Khối lượng còn phụ thuộc nền code và thời gian thực tế của từng người.

**So với bản trước:** chuyển HT15/HT19 và FE quản lý phòng từ Tuấn sang Bắc; chuyển HT22/HT23 từ Mạnh sang Đạt. Giữ đủ 26 API, không thêm phạm vi mới.

TV2/TV5 thống nhất schema và contract dùng chung. Tuấn phụ trách nền entity/migration tạo loại phòng và phòng; Bắc/Mạnh phối hợp trước khi sửa cùng nhóm file. Mỗi API có đúng một người chủ trì. HT01/HT02 dùng API client chung; mỗi người kiểm tra chức năng mình làm.
## 3. TV2 — Đạt: backend khách sạn, công khai và nhân sự

| Mã | Method + endpoint (base `/api/v1`) | Nội dung | FE tích hợp | Mức / phụ thuộc |
| --- | --- | --- | --- | --- |
| HT03 | `GET /hotels` | Tìm/lọc khách sạn đủ điều kiện bán | Bắc | P1. Sau giá + IV01; lọc theo kỳ ở phải dùng dữ liệu thật. |
| HT06 | `POST /admin/hotels` | Tạo khách sạn, phân công Owner | Tuấn | **P0**. ADMIN tạo DRAFT; kiểm Owner/city. |
| HT07 | `GET /management/hotels` | Khách sạn được phép vận hành | Tuấn | **P0**. Danh sách theo phạm vi, phân trang. |
| HT08 | `GET /management/hotels/{hotelId}` | Thông tin quản lý khách sạn | Tuấn | **P0**. Theo quyền và validation trong contract. |
| HT09 | `PATCH /management/hotels/{hotelId}` | Sửa nội dung khách sạn | Tuấn | P1. Kiểm expectedVersion; giữ dữ liệu ngoài thao tác. |
| HT10 | `POST /admin/hotels/{hotelId}/publication-decisions` | Duyệt công khai hoặc từ chối nội dung | Tuấn | P1. Cần danh mục/phòng/policy/media và kiểm duyệt theo contract. |
| HT11 | `POST /management/hotels/{hotelId}/sales-suspension` | Quản lý tự tạm ngừng bán | Tuấn | P1. Manager đúng hotel; không hủy đơn cũ. |
| HT12 | `POST /admin/hotels/{hotelId}/sales-control` | Quản trị khóa hoặc mở bán lại | Tuấn | P1. ADMIN; kiểm lý do/version và điều kiện mở bán. |
| HT13 | `PUT /management/hotels/{hotelId}/policy` | Cấu hình giờ và điều khoản áp dụng cho đơn mới | Tuấn | P1. Cần chính sách được nhóm chốt; không dùng số ví dụ. |
| HT14 | `PUT /management/hotels/{hotelId}/amenities` | Gắn tiện ích khách sạn | Tuấn | P1. Tiện ích HOTEL; thay bộ nguyên tử, đúng version. |
| HT22 | `GET /management/hotels/{hotelId}/members` | Nhân sự khách sạn | Tuấn | P1. Đạt phụ trách cùng HT23; chốt membership/quyền sớm cho các API vận hành. |
| HT23 | `PUT /management/hotels/{hotelId}/members/{userId}` | Phân công/thu hồi nhân sự | Tuấn | P1. Đạt phụ trách cùng Identity; ADMIN cấp Manager, Manager chỉ phân công lễ tân đúng contract. |

**Đạt: 12 API, 3 P0 + 9 P1.** Chốt quyền/membership HT22–HT23 sớm cho các API vận hành; phối hợp Mạnh về giá/khả dụng và Đăng về staging. Auth đã code xong, chỉ xử lý lỗi tích hợp phát sinh.

## 4. TV5 — Mạnh: backend giá, khả dụng và sửa phòng

| Mã | Method + endpoint (base `/api/v1`) | Nội dung | FE tích hợp | Mức / phụ thuộc |
| --- | --- | --- | --- | --- |
| HT17 | `PATCH /management/hotels/{hotelId}/room-types/{roomTypeId}` | Sửa/ngừng bán loại phòng | Bắc | P1. Version và kiểm ảnh hưởng khi ngừng bán. |
| HT18 | `PUT /management/hotels/{hotelId}/room-types/{roomTypeId}/amenities` | Gắn tiện ích loại phòng | Bắc | P1. Tiện ích ROOM; đúng version. |
| HT21 | `PATCH /management/hotels/{hotelId}/rooms/{roomId}` | Sửa/ngừng sử dụng phòng với thời điểm hiệu lực | Bắc | P1. Inventory phải kiểm ảnh hưởng đơn/giữ chỗ hiện có. |
| PR01 | `GET /management/hotels/{hotelId}/room-types/{roomTypeId}/rates` | Xem giá theo ngày | Tuấn | **P0**. Đọc khoảng ngày, endDateExclusive không bao gồm. |
| PR02 | `PUT /management/hotels/{hotelId}/room-types/{roomTypeId}/rates` | Đặt giá một ngày hoặc khoảng ngày | Tuấn | **P0**. Thêm vào bản cũ để UI ghi được giá; VND chính xác, batch nguyên tử. |
| IV01 | `GET /hotels/{hotelId}/availability` | Khả dụng toàn bộ kỳ ở theo loại phòng | Bắc | P1. Cần lịch/tồn; kiểm phòng liên tục cả kỳ, không chỉ min tồn đêm. |

**Mạnh: 6 API, 2 P0 + 4 P1.** IV01 và HT21 có độ khó cao vì phải kiểm tra lịch liên tục và ảnh hưởng đơn/giữ chỗ; ưu tiên PR01/PR02 trước buổi thông, phần lịch sau buổi thông. Phối hợp Tuấn về schema phòng và Đạt về quyền/membership.

## 5. TV3 — Bắc: FE khách hàng/phòng + 6 API đọc

### Backend tự triển khai — P0

| Mã | Method + endpoint (base `/api/v1`) | Nội dung | FE tích hợp | Mức / phụ thuộc |
| --- | --- | --- | --- | --- |
| HT01 | `GET /cities` | Danh mục thành phố | Bắc + Tuấn dùng chung | **P0**. Theo quyền và validation trong contract. |
| HT02 | `GET /amenities` | Danh mục tiện ích | Bắc + Tuấn dùng chung | **P0**. Theo quyền và validation trong contract. |
| HT04 | `GET /hotels/{hotelId}` | Chi tiết khách sạn công khai | Bắc | **P0**. Chỉ hotel ACTIVE; không lộ contact/Owner. |
| HT05 | `GET /hotels/{hotelId}/room-types` | Loại phòng khách được xem | Bắc | **P0**. Loại phòng active, hotel đã công khai. |
| HT15 | `GET /management/hotels/{hotelId}/room-types` | Danh sách loại phòng để quản lý | Bắc | **P0**. Theo quyền và validation trong contract. |
| HT19 | `GET /management/hotels/{hotelId}/rooms` | Danh sách phòng vật lý | Bắc | **P0**. Theo quyền và validation trong contract. |

### Frontend trước buổi thông

1. Tích hợp auth đã có và phần thành phố, tiện ích, chi tiết khách sạn/loại phòng công khai.
2. Làm FE danh sách/tạo loại phòng và phòng vật lý: HT15/HT19 do mình code, HT16/HT20 nhận từ Tuấn.
3. Chia sẻ client HT01/HT02 cho Tuấn; chuẩn bị dữ liệu và kịch bản demo khách hàng/phòng.

### Cuối tuần

1. HT17/HT18/HT21 từ Mạnh: FE sửa loại phòng, gắn tiện ích và sửa/ngừng phòng.
2. HT03 từ Đạt + IV01 từ Mạnh: tìm phòng theo kỳ ở và hiển thị khả dụng.
3. Rà mobile và lỗi; checkout chỉ là việc nhận thêm sau khi phần được giao đã ổn định.

**Bàn giao:** 6 API đọc, FE khách hàng/auth và FE quản lý loại phòng/phòng. Không nhận thêm backend booking trong tuần này khi chưa xong các việc trên.
## 6. TV4 — Tuấn: FE khách sạn/giá/nhân sự + 2 API ghi

### Backend tự triển khai — P0

| Mã | Method + endpoint (base `/api/v1`) | Nội dung | FE tích hợp | Mức / phụ thuộc |
| --- | --- | --- | --- | --- |
| HT16 | `POST /management/hotels/{hotelId}/room-types` | Tạo loại phòng | Bắc | **P0**. Theo quyền và validation trong contract. |
| HT20 | `POST /management/hotels/{hotelId}/rooms` | Tạo phòng vật lý | Bắc | **P0**. Đúng hotel/loại phòng, số phòng duy nhất, ngày hiệu lực. |

### Frontend trước buổi thông

1. HT06/HT07/HT08 từ Đạt: tạo, danh sách và chi tiết khách sạn; lookup dùng client chung của Bắc.
2. PR01/PR02 từ Mạnh: xem/ghi giá theo ngày.
3. Bàn giao HT16/HT20 cho Bắc tích hợp; thống nhất schema/DTO phòng với Bắc và Mạnh.

### Cuối tuần

1. HT09/HT14: sửa nội dung và tiện ích khách sạn.
2. HT13 → HT10/HT11/HT12: chính sách, duyệt và khóa/mở bán.
3. HT22/HT23 từ Đạt: FE nhân sự, phân quyền và lỗi version.
4. Rà responsive, quyền và lỗi của backoffice; màn hợp đồng/tài chính chưa tích hợp để ngoài việc bắt buộc tuần 2.

**Bàn giao:** 2 API ghi và FE khách sạn/chính sách/giá/nhân sự. FE quản lý loại phòng/phòng do Bắc chủ trì để giảm tải.
## 7. TV1 — Đăng: hệ thống, dữ liệu demo và kiểm tra tích hợp

| Nhóm | TV1 chủ trì | TV2 phối hợp | Bằng chứng |
| --- | --- | --- | --- |
| CI/CD | Kiểm build/test/publish/deploy, env và rollback; không dựng lại phần đã xong. | Startup/migration và yêu cầu ứng dụng. | Link run, image/digest và bản thực tế đang chạy. |
| HTTP/HTTPS | DNS/Cloudflare/TLS, redirect và URL từng môi trường. | Base URL, Authorization và route FE gọi. | Request qua domain thật, không chỉ localhost. |
| Nginx | Proxy `/api/`, actuator/Swagger theo quyền, forwarded headers, timeout/upload limit khi cần. | Smoke path/status/body/header và lỗi. | Không rewrite sai path hoặc biến lỗi thành HTTP 200. |
| DB/migration | Kết nối, volume, backup và môi trường kiểm thử. | TV2/TV5 viết/kiểm migration và version. | Ghi DB nào đã chạy; chưa chạy ghi chưa kiểm chứng. |
| Storage/mail | Quyền, URL/CORS/env; không lộ secret. | Adapter và dữ liệu cần tích hợp. | Phân biệt cấu hình sẵn với API đã hoạt động. |
| Log/health | Healthcheck, traceId và tra lỗi FE–Nginx–BE. | Phân loại/sửa lỗi ứng dụng. | Tra được lỗi mẫu, không log token/password. |

### Đầu ra Đăng chịu trách nhiệm

1. Trước hết 04/11: bản demo chạy qua domain HTTPS; kiểm tra Nginx giữ đúng path/status/header, auth và các API P0; ghi danh sách lỗi để đúng người xử lý.
2. Chuẩn bị và chạy bộ dữ liệu demo từ seed/migration do BE bàn giao, tài khoản theo vai trò, thứ tự demo và cách đưa dữ liệu về trạng thái ban đầu. Người viết API kiểm tra tính đúng nghiệp vụ của dữ liệu.
3. Sau buổi thông: triển khai từng phần được nhóm bàn giao, kiểm tra sau deploy, hoàn thiện backup/khôi phục hoặc rollback còn thiếu và ghi hướng dẫn vận hành ngắn.
4. Chủ trì phần trình bày hệ thống và hỗ trợ buổi chạy thử chung. Không làm lại pipeline đã hoàn thành hoặc tự mở rộng hạ tầng ngoài nhu cầu tuần này.

Đây là phân công, chưa phải xác nhận staging hay cấu hình đã được thay đổi.

## 8. Lịch thực hiện

| Ngày | Backend | Frontend | Hệ thống |
| --- | --- | --- | --- |
| **02/11** | Chốt schema/contract, chia file/migration; lookup và nền catalog. | Tích hợp auth, rà mock và client chung. | Kiểm pipeline/staging/Nginx. |
| **03/11** | Đạt: khách sạn/quyền; Mạnh: giá và nền khả dụng. | Bắc: 6 API đọc + FE khách/phòng; Tuấn: 2 API tạo phòng + FE khách sạn/giá. | Chuẩn bị dữ liệu/tài khoản demo, log và kiểm tra qua Nginx. |
| **04/11** | Khép P0, đọc/ghi giá, fixture và sửa lỗi. | Chạy thử demo với API thật. | Chạy bộ dữ liệu demo trên staging; chủ trì kiểm tra và chạy thử nhóm. |
| **05/11** | Thông đồ án, ghi góp ý; trước buổi thông chỉ sửa lỗi chặn. | Demo và ghi yêu cầu. | Giữ môi trường ổn định. |
| **06/11** | Đạt: nội dung/policy/membership; Mạnh: sửa phòng/khả dụng theo phụ thuộc. | Tích hợp P1. | Deploy từng phần và smoke. |
| **07–08/11** | Khép tìm kiếm/khả dụng nếu đủ nền; test quyền/concurrency; nhận P2 nếu còn năng lực. | Rà version, responsive và lỗi. | Kiểm backup/log/rollback. |

07–08/11 là cuối tuần: nhóm cần thống nhất thời gian thực tế. Không tự Done theo ngày; tách nhóm việc lớn thành ticket review được trong khoảng 0,5–2 ngày.

## 9. P2 — API có thể nhận thêm trong tuần

| Nhóm | API | Chủ trì | Điều kiện |
| --- | --- | --- | --- |
| Báo giá | PR03 | TV5 | Giá/khả dụng và quy tắc voucher rõ; không giả hỗ trợ voucher đã gửi. |
| Lịch/chặn phòng | IV02–IV06 | TV5 | Quy ước ngày/quyền rõ; bảo vệ mọi đơn và giữ chỗ liên quan. |
| Media hotel/phòng | MD01, MD02, MD07–MD10 | TV2; TV1 storage | Storage, kiểm tệp, liên kết và quyền/hiển thị sẵn sàng. |
| Voucher cơ bản | VC01–VC04 | TV5 | Snapshot bên tài trợ, quota/lượt giữ và quyền đã chốt. |
| Booking đầu tiên | BK01, BK02, BK03, BK05 | TV2; TV5 tồn/giá | Policy, quote, giữ chỗ nguyên tử, idempotency, hết hạn/trả tồn; không nghiệm thu POST đơn rời rạc. |

Chỉ nhận thêm sau khi P0/P1 ổn định. Nhóm quyết định ưu tiên dựa vào kết quả thông đồ án và năng lực còn lại.

### Chuyển sang tuần 3

- Payment provider/callback, hoàn tiền và đối soát.
- Hợp đồng/tài chính FN00/FN01/FN02/FN16 và phần còn lại khi quyền tài chính/mô hình đã chốt. Bản cũ giao bốn API này ở tuần 2; bản mới ưu tiên dữ liệu vận hành, phòng và giá trước.
- Check-in/out, đến muộn, NO_SHOW, sẵn sàng phòng và báo cáo/chi Owner theo phụ thuộc.

## 10. Chênh lệch auth FE cần biết

Giữ nguyên runtime auth trong đợt này; không tự sửa URL/DTO người dùng đã hoàn thành.

| Nội dung | Contract thiết kế | Source hiện tại | Tích hợp tuần 2 |
| --- | --- | --- | --- |
| Quên mật khẩu | `POST /auth/password-reset-requests` | `POST /auth/forgot-password` | FE dùng runtime; theo dõi chênh lệch để nhóm đồng bộ. |
| Reset mật khẩu | `POST /auth/password-resets` | `POST /auth/reset-password` | FE dùng runtime hiện tại. |
| Refresh/logout | Body `token` | Body `refreshToken` | FE gửi đúng DTO source. |
| Identity | 15 endpoint, trạng thái thiết kế | 8 route auth/me trong source | Không coi toàn bộ Identity đã đủ vì auth đã code xong. |

## 11. Điều kiện nghiệm thu

- [ ] Exact method/path/query/status/message/schema theo API được chọn.
- [ ] Public không rò contact/Owner, không trả hotel chưa công khai.
- [ ] Quyền ADMIN/Manager/Receptionist và phạm vi hotel đúng; Owner không tự thành Manager/tài chính.
- [ ] Phân trang ổn định; sort/category/page/size sai trả 400.
- [ ] expectedVersion cũ trả conflict; thay tiện ích/batch giá nguyên tử.
- [ ] Phòng không trùng số trong hotel; room type thuộc đúng hotel.
- [ ] Giá VND chính xác; endDateExclusive không tính ngày kết thúc.
- [ ] IV01 kiểm ca từng đêm còn phòng nhưng không có phòng liên tục.
- [ ] FE/BE qua Nginx/staging; mock và API thật ghi riêng.
- [ ] Ghi kết quả format/test, PostgreSQL/migration/security; báo lỗi có sẵn và phần chưa kiểm chứng.

**Tổng:** 26 API P0/P1 duy nhất: **Đạt 12, Bắc 6, Tuấn 2, Mạnh 6**, gồm 13 P0 và 13 P1. Đăng phụ trách hệ thống/dữ liệu demo/kiểm tra triển khai; Bắc và Tuấn còn có phần FE như bảng phân vai. Đây là kế hoạch phân công, chưa phải tuyên bố các API đã hoàn thành.
