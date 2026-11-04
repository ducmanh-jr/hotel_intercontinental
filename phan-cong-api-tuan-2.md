# API tuần 2 

**P0:** ưu tiên buổi thông. **P1:** hoàn thiện trong tuần.

Phần FE chia theo nhóm màn hình: TV3 phụ trách khách hàng và loại phòng/phòng; TV4 phụ trách khách sạn, giá và tài chính. HT01/HT02 dùng chung phần tích hợp danh mục, không viết hai API client riêng.

## TV2 — Backend khách sạn/phòng

Triển khai 15 API backend sau:

| Mã | Method + endpoint | Mô tả | FE tích hợp | Ưu tiên |
| --- | --- | --- | --- | --- |
| [HT01](hotel.md#ht01) | `GET /api/v1/cities` | Danh mục thành phố | TV3, TV4 | **P0** |
| [HT02](hotel.md#ht02) | `GET /api/v1/amenities` | Danh mục tiện ích | TV3, TV4 | **P0** |
| [HT04](hotel.md#ht04) | `GET /api/v1/hotels/{hotelId}` | Chi tiết khách sạn công khai | TV3 | **P0** |
| [HT05](hotel.md#ht05) | `GET /api/v1/hotels/{hotelId}/room-types` | Loại phòng khách được xem | TV3 | **P0** |
| [HT06](hotel.md#ht06) | `POST /api/v1/admin/hotels` | Tạo khách sạn, phân công Owner | TV4 | **P0** |
| [HT07](hotel.md#ht07) | `GET /api/v1/management/hotels` | Khách sạn được phép vận hành | TV4 | **P0** |
| [HT08](hotel.md#ht08) | `GET /api/v1/management/hotels/{hotelId}` | Thông tin quản lý khách sạn | TV4 | P1 |
| [HT09](hotel.md#ht09) | `PATCH /api/v1/management/hotels/{hotelId}` | Sửa nội dung khách sạn | TV4 | P1 |
| [HT14](hotel.md#ht14) | `PUT /api/v1/management/hotels/{hotelId}/amenities` | Gắn tiện ích khách sạn | TV4 | P1 |
| [HT15](hotel.md#ht15) | `GET /api/v1/management/hotels/{hotelId}/room-types` | Danh sách loại phòng để quản lý | TV3 | **P0** |
| [HT16](hotel.md#ht16) | `POST /api/v1/management/hotels/{hotelId}/room-types` | Tạo loại phòng | TV3 | **P0** |
| [HT17](hotel.md#ht17) | `PATCH /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}` | Sửa/ngừng bán loại phòng | TV3 | P1 |
| [HT18](hotel.md#ht18) | `PUT /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}/amenities` | Gắn tiện ích loại phòng | TV3 | P1 |
| [HT19](hotel.md#ht19) | `GET /api/v1/management/hotels/{hotelId}/rooms` | Danh sách phòng vật lý | TV3 | **P0** |
| [HT20](hotel.md#ht20) | `POST /api/v1/management/hotels/{hotelId}/rooms` | Tạo phòng vật lý | TV3 | **P0** |

## TV3 — Frontend khách hàng và quản lý loại phòng/phòng

Làm giao diện khách hàng và nhóm quản lý loại phòng/phòng; tích hợp 11 API sau. Màn quản lý vẫn áp dụng đúng quyền theo contract.

| Mã | Method + endpoint | Mô tả | Backend phụ trách | Ưu tiên |
| --- | --- | --- | --- | --- |
| [HT01](hotel.md#ht01) | `GET /api/v1/cities` | Danh mục thành phố | TV2 | **P0** |
| [HT02](hotel.md#ht02) | `GET /api/v1/amenities` | Danh mục tiện ích | TV2 | **P0** |
| [HT04](hotel.md#ht04) | `GET /api/v1/hotels/{hotelId}` | Chi tiết khách sạn công khai | TV2 | **P0** |
| [HT05](hotel.md#ht05) | `GET /api/v1/hotels/{hotelId}/room-types` | Loại phòng khách được xem | TV2 | **P0** |
| [IV01](inventory.md#iv01) | `GET /api/v1/hotels/{hotelId}/availability` | Khả dụng toàn bộ kỳ ở theo loại phòng | TV5 | **P0** |
| [HT15](hotel.md#ht15) | `GET /api/v1/management/hotels/{hotelId}/room-types` | Danh sách loại phòng để quản lý | TV2 | **P0** |
| [HT16](hotel.md#ht16) | `POST /api/v1/management/hotels/{hotelId}/room-types` | Tạo loại phòng | TV2 | **P0** |
| [HT17](hotel.md#ht17) | `PATCH /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}` | Sửa/ngừng bán loại phòng | TV2 | P1 |
| [HT18](hotel.md#ht18) | `PUT /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}/amenities` | Gắn tiện ích loại phòng | TV2 | P1 |
| [HT19](hotel.md#ht19) | `GET /api/v1/management/hotels/{hotelId}/rooms` | Danh sách phòng vật lý | TV2 | **P0** |
| [HT20](hotel.md#ht20) | `POST /api/v1/management/hotels/{hotelId}/rooms` | Tạo phòng vật lý | TV2 | **P0** |

## TV4 — Frontend quản trị khách sạn, giá và tài chính

Làm giao diện quản trị khách sạn, xem giá, hợp đồng và cấp quyền tài chính; tích hợp 12 API sau:

| Mã | Method + endpoint | Mô tả | Backend phụ trách | Ưu tiên |
| --- | --- | --- | --- | --- |
| [HT01](hotel.md#ht01) | `GET /api/v1/cities` | Danh mục thành phố | TV2 | **P0** |
| [HT02](hotel.md#ht02) | `GET /api/v1/amenities` | Danh mục tiện ích | TV2 | **P0** |
| [HT06](hotel.md#ht06) | `POST /api/v1/admin/hotels` | Tạo khách sạn, phân công Owner | TV2 | **P0** |
| [HT07](hotel.md#ht07) | `GET /api/v1/management/hotels` | Khách sạn được phép vận hành | TV2 | **P0** |
| [HT08](hotel.md#ht08) | `GET /api/v1/management/hotels/{hotelId}` | Thông tin quản lý khách sạn | TV2 | P1 |
| [HT09](hotel.md#ht09) | `PATCH /api/v1/management/hotels/{hotelId}` | Sửa nội dung khách sạn | TV2 | P1 |
| [HT14](hotel.md#ht14) | `PUT /api/v1/management/hotels/{hotelId}/amenities` | Gắn tiện ích khách sạn | TV2 | P1 |
| [PR01](pricing.md#pr01) | `GET /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}/rates` | Xem giá theo ngày | TV5 | **P0** |
| [FN01](payment.md#fn01) | `GET /api/v1/finance/hotels/{hotelId}/contracts` | Owner/đại diện xem thỏa thuận được phép | TV5 | P1 |
| [FN02](payment.md#fn02) | `POST /api/v1/admin/hotels/{hotelId}/contracts` | Tạo dự thảo hợp đồng hoa hồng | TV5 | P1 |
| [FN00](payment.md#fn00) | `PUT /api/v1/admin/hotels/{hotelId}/financial-access/{userId}` | Cấp/thu hồi quyền đọc tài chính theo thỏa thuận | TV5 | P1 |
| [FN16](payment.md#fn16) | `GET /api/v1/admin/hotels/{hotelId}/financial-access/{userId}` | Đọc cấp quyền tài chính và phiên bản trước sửa | TV5 | P1 |

## TV5 — Backend giá/khả dụng/hợp đồng

Triển khai 6 API backend sau:

| Mã | Method + endpoint | Mô tả | FE tích hợp | Ưu tiên |
| --- | --- | --- | --- | --- |
| [IV01](inventory.md#iv01) | `GET /api/v1/hotels/{hotelId}/availability` | Khả dụng toàn bộ kỳ ở theo loại phòng | TV3 | **P0** |
| [PR01](pricing.md#pr01) | `GET /api/v1/management/hotels/{hotelId}/room-types/{roomTypeId}/rates` | Xem giá theo ngày | TV4 | **P0** |
| [FN01](payment.md#fn01) | `GET /api/v1/finance/hotels/{hotelId}/contracts` | Owner/đại diện xem thỏa thuận được phép | TV4 | P1 |
| [FN02](payment.md#fn02) | `POST /api/v1/admin/hotels/{hotelId}/contracts` | Tạo dự thảo hợp đồng hoa hồng | TV4 | P1 |
| [FN00](payment.md#fn00) | `PUT /api/v1/admin/hotels/{hotelId}/financial-access/{userId}` | Cấp/thu hồi quyền đọc tài chính theo thỏa thuận | TV4 | P1 |
| [FN16](payment.md#fn16) | `GET /api/v1/admin/hotels/{hotelId}/financial-access/{userId}` | Đọc cấp quyền tài chính và phiên bản trước sửa | TV4 | P1 |

TV3/TV4 tích hợp API do TV2/TV5 triển khai. Có **21 API backend duy nhất**; FE được chia **11 API cho TV3, 12 API cho TV4**, gồm HT01/HT02 dùng chung.

Nguồn: [API contract](openapi.yaml). Bấm mã API để xem request, response, quyền và lỗi chi tiết.
