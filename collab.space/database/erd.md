# ERD và quan hệ — Hotel Booking

[Tổng quan](README.md) · [Từ điển](data-dictionary.md) · [Quy tắc](business-rules.md)

Theo DBML mới: **37 bảng, 57 FK**. Bốn vùng sơ đồ hiển thị khóa và một số cột; đủ 300 cột nằm trong từ điển. Bảng ngoài vùng có thể xuất hiện làm điểm nối. Mỗi FK có đúng một dòng trong danh sách ở mục 5; không suy thêm FK cho outbox aggregate_id hoặc refresh token family_id.

Ký hiệu: đúng một `||`, không/một `|o` hoặc `o|`, không/nhiều `o{`. Nullable và UNIQUE quyết định lực lượng quan hệ; FK không buộc cha phải có bản ghi con. PK/UK nhiều cột xem từ điển, không hiểu mỗi cột là duy nhất riêng.

## 1. Identity

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        user_status__t status
        timestamp email_verified_at
    }
    roles {
        integer id PK
    }
    permissions {
        integer id PK
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        integer role_id FK
    }
    role_permissions {
        integer role_id PK,FK
        integer permission_id PK,FK
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
    }
    password_reset_tokens {
        uuid id PK
        uuid user_id FK
    }
    email_verification_tokens {
        uuid id PK
        uuid user_id FK
    }
    users ||--o{ user_roles : user_roles_user
    roles ||--o{ user_roles : user_roles_role
    roles ||--o{ role_permissions : role_permissions_role
    permissions ||--o{ role_permissions : role_permissions_permission
    users ||--o{ refresh_tokens : refresh_tokens_user
    users ||--o{ password_reset_tokens : password_reset_tokens_user
    users ||--o{ email_verification_tokens : email_verification_tokens_user
```

## 2. Hotel và Media

```mermaid
erDiagram
    hotels {
        uuid id PK
        uuid owner_user_id FK
        uuid city_id FK
        varchar name
        hotel_status__t status
    }
    room_types {
        uuid id PK
        uuid hotel_id FK
        varchar name
    }
    rooms {
        uuid id PK
        uuid hotel_id FK
        uuid room_type_id FK
        varchar room_number
        room_readiness__t readiness
    }
    hotel_members {
        uuid hotel_id PK,FK
        uuid user_id PK,FK
        hotel_member_status__t status
        uuid invited_by_user_id FK
    }
    cities {
        uuid id PK
        varchar name
    }
    amenities {
        uuid id PK
        varchar name
    }
    hotel_amenities {
        uuid hotel_id PK,FK
        uuid amenity_id PK,FK
    }
    room_type_amenities {
        uuid room_type_id PK,FK
        uuid amenity_id PK,FK
    }
    media_objects {
        uuid id PK
        media_status__t status
        uuid created_by_user_id FK
    }
    hotel_images {
        uuid hotel_id PK,FK
        uuid media_object_id PK,FK
        boolean is_cover
    }
    room_type_images {
        uuid room_type_id PK,FK
        uuid media_object_id PK,FK
        boolean is_cover
    }
    user_images {
        uuid user_id PK,FK
        uuid media_object_id PK,FK,UK
        boolean is_avatar
    }
    users {
        uuid id PK
        varchar email UK
        user_status__t status
        timestamp email_verified_at
    }
    users ||--o{ hotels : hotels_owner
    cities ||--o{ hotels : hotels_city
    hotels ||--o{ room_types : room_types_hotel
    hotels ||--o{ hotel_amenities : hotel_amenities_hotel
    amenities ||--o{ hotel_amenities : hotel_amenities_amenity
    room_types ||--o{ room_type_amenities : room_type_amenities_room_type
    amenities ||--o{ room_type_amenities : room_type_amenities_amenity
    users ||--o{ media_objects : media_objects_created_by
    hotels ||--o{ hotel_images : hotel_images_hotel
    media_objects ||--o{ hotel_images : hotel_images_media
    room_types ||--o{ room_type_images : room_type_images_room_type
    media_objects ||--o{ room_type_images : room_type_images_media
    hotels ||--o{ hotel_members : hotel_members_hotel
    users ||--o{ hotel_members : hotel_members_user
    users |o--o{ hotel_members : hotel_members_invited_by
    hotels ||--o{ rooms : rooms_hotel
    room_types ||--o{ rooms : rooms_room_type_hotel
    users |o--o{ rooms : rooms_readiness_updated_by
    users ||--o{ user_images : user_images_user
    media_objects ||--o| user_images : user_images_media
```

## 3. Inventory, Pricing và Booking

```mermaid
erDiagram
    room_inventory {
        uuid room_type_id PK,FK
        date inventory_date PK
    }
    room_blocks {
        uuid id PK
        uuid room_type_id FK
        date start_date
        uuid room_id FK
        date end_date
        integer quantity
    }
    inventory_reservations {
        uuid booking_item_id PK,FK
        uuid room_type_id FK
        date stay_date PK,FK
        inventory_reservation_status__t status
    }
    room_rates {
        uuid room_type_id PK,FK
        date rate_date PK
    }
    bookings {
        uuid id PK
        uuid customer_id FK
        uuid hotel_id FK
        date check_in
        date check_out
        booking_status__t status
        bigint total_amount
    }
    booking_items {
        uuid id PK
        uuid booking_id FK
        uuid hotel_id FK
        uuid room_type_id FK
    }
    booking_night_prices {
        uuid booking_item_id PK,FK
        date stay_date PK
    }
    booking_status_history {
        uuid id PK
        uuid booking_id FK
        uuid changed_by_user_id FK
    }
    room_assignments {
        uuid id PK
        uuid booking_item_id FK
        uuid room_type_id FK
        uuid room_id FK
        timestamptz starts_at
        timestamptz ends_at
        room_assignment_status__t status
    }
    hotels {
        uuid id PK
        varchar name
        hotel_status__t status
    }
    room_types {
        uuid id PK
        varchar name
    }
    rooms {
        uuid id PK
        uuid hotel_id FK
        uuid room_type_id FK
        varchar room_number
        room_readiness__t readiness
    }
    users {
        uuid id PK
        varchar email UK
        user_status__t status
        timestamp email_verified_at
    }
    room_types ||--o{ room_rates : room_rates_room_type
    room_types ||--o{ room_inventory : room_inventory_room_type
    room_types ||--o{ room_blocks : room_blocks_room_type
    users ||--o{ room_blocks : room_blocks_created_by
    users ||--o{ bookings : bookings_customer
    hotels ||--o{ bookings : bookings_hotel
    bookings ||--o{ booking_items : booking_items_booking_hotel
    room_types ||--o{ booking_items : booking_items_room_type_hotel
    booking_items ||--o{ booking_night_prices : booking_night_prices_booking_item
    booking_items ||--o{ inventory_reservations : inventory_reservations_booking_item_room_type
    room_inventory ||--o{ inventory_reservations : inventory_reservations_inventory_row
    bookings ||--o{ booking_status_history : booking_status_history_booking
    users |o--o{ booking_status_history : booking_status_history_actor
    booking_items ||--o{ room_assignments : room_assignments_booking_item_type
    rooms ||--o{ room_assignments : room_assignments_room_type
    users ||--o{ room_assignments : room_assignments_assigned_by
    users |o--o{ room_assignments : room_assignments_released_by
    rooms ||--o{ room_blocks : room_blocks_physical_room_type
```

## 4. Payment, Review, Promotion và sự kiện

```mermaid
erDiagram
    payment_attempts {
        uuid id PK
        uuid booking_id FK
        payment_status__t status
    }
    payment_webhook_events {
        uuid id PK
        uuid payment_attempt_id FK
    }
    refunds {
        uuid id PK
        uuid payment_attempt_id FK
        uuid booking_id FK
        refund_status__t status
    }
    reviews {
        uuid id PK
        uuid booking_id FK,UK
        uuid customer_id FK
        uuid hotel_id FK
        review_status__t status
    }
    promotions {
        uuid id PK
        uuid hotel_id FK
        varchar code UK
        promotion_discount_type__t discount_type
        bigint max_discount_amount
        bigint min_booking_amount
        promotion_status__t status
    }
    promotion_redemptions {
        uuid id PK
        uuid promotion_id FK
        uuid booking_id FK,UK
        uuid user_id FK
        bigint discount_amount
        promotion_redemption_status__t status
    }
    notifications {
        uuid id PK
        uuid recipient_user_id FK
    }
    outbox_events {
        uuid id PK
        outbox_event_status__t status
    }
    bookings {
        uuid id PK
        uuid customer_id FK
        uuid hotel_id FK
        date check_in
        date check_out
        booking_status__t status
        bigint total_amount
    }
    hotels {
        uuid id PK
        varchar name
        hotel_status__t status
    }
    users {
        uuid id PK
        varchar email UK
        user_status__t status
        timestamp email_verified_at
    }
    bookings ||--o| reviews : reviews_booking
    users ||--o{ reviews : reviews_customer
    hotels ||--o{ reviews : reviews_hotel
    bookings ||--o{ payment_attempts : payment_attempts_booking
    payment_attempts |o--o{ payment_webhook_events : payment_webhook_events_attempt
    payment_attempts ||--o{ refunds : refunds_payment_attempt
    bookings ||--o{ refunds : refunds_booking
    hotels |o--o{ promotions : promotions_hotel
    promotions ||--o{ promotion_redemptions : promotion_redemptions_promotion
    bookings ||--o| promotion_redemptions : promotion_redemptions_booking
    users ||--o{ promotion_redemptions : promotion_redemptions_user
    users ||--o{ notifications : notifications_recipient
```

## 5. Đủ 57 khóa ngoại theo nguồn

Hành vi xóa/cập nhật dưới đây được đọc từ `Ref`, không còn là chính sách tự đề xuất của bản docs cũ. Đây là cấu hình DBML, chưa xác nhận đã áp dụng vào PostgreSQL.

| FK | Bảng con(cột) → bảng cha(cột) | Cha/dòng con | Con/cha | ON DELETE | ON UPDATE |
| --- | --- | --- | --- | --- | --- |
| `fk_user_roles_user` | `user_roles(user_id) → users(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_user_roles_role` | `user_roles(role_id) → roles(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_role_permissions_role` | `role_permissions(role_id) → roles(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_role_permissions_permission` | `role_permissions(permission_id) → permissions(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_refresh_tokens_user` | `refresh_tokens(user_id) → users(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_password_reset_tokens_user` | `password_reset_tokens(user_id) → users(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_hotels_owner` | `hotels(owner_user_id) → users(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_hotels_city` | `hotels(city_id) → cities(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_room_types_hotel` | `room_types(hotel_id) → hotels(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_hotel_amenities_hotel` | `hotel_amenities(hotel_id) → hotels(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_hotel_amenities_amenity` | `hotel_amenities(amenity_id) → amenities(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_room_type_amenities_room_type` | `room_type_amenities(room_type_id) → room_types(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_room_type_amenities_amenity` | `room_type_amenities(amenity_id) → amenities(id)` | 1 | 0..N | NO ACTION | NO ACTION |
| `fk_media_objects_created_by` | `media_objects(created_by_user_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_hotel_images_hotel` | `hotel_images(hotel_id) → hotels(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_hotel_images_media` | `hotel_images(media_object_id) → media_objects(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_type_images_room_type` | `room_type_images(room_type_id) → room_types(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_room_type_images_media` | `room_type_images(media_object_id) → media_objects(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_hotel_members_hotel` | `hotel_members(hotel_id) → hotels(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_hotel_members_user` | `hotel_members(user_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_hotel_members_invited_by` | `hotel_members(invited_by_user_id) → users(id)` | 0..1 | 0..N | SET NULL | NO ACTION |
| `fk_room_rates_room_type` | `room_rates(room_type_id) → room_types(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_room_inventory_room_type` | `room_inventory(room_type_id) → room_types(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_blocks_room_type` | `room_blocks(room_type_id) → room_types(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_blocks_created_by` | `room_blocks(created_by_user_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_bookings_customer` | `bookings(customer_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_bookings_hotel` | `bookings(hotel_id) → hotels(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_booking_items_booking_hotel` | `booking_items(booking_id, hotel_id) → bookings(id, hotel_id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_booking_items_room_type_hotel` | `booking_items(room_type_id, hotel_id) → room_types(id, hotel_id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_booking_night_prices_booking_item` | `booking_night_prices(booking_item_id) → booking_items(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_inventory_reservations_booking_item_room_type` | `inventory_reservations(booking_item_id, room_type_id) → booking_items(id, room_type_id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_inventory_reservations_inventory_row` | `inventory_reservations(room_type_id, stay_date) → room_inventory(room_type_id, inventory_date)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_booking_status_history_booking` | `booking_status_history(booking_id) → bookings(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_booking_status_history_actor` | `booking_status_history(changed_by_user_id) → users(id)` | 0..1 | 0..N | SET NULL | NO ACTION |
| `fk_reviews_booking` | `reviews(booking_id) → bookings(id)` | 1 | 0..1 | RESTRICT | NO ACTION |
| `fk_reviews_customer` | `reviews(customer_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_reviews_hotel` | `reviews(hotel_id) → hotels(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_payment_attempts_booking` | `payment_attempts(booking_id) → bookings(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_payment_webhook_events_attempt` | `payment_webhook_events(payment_attempt_id) → payment_attempts(id)` | 0..1 | 0..N | SET NULL | NO ACTION |
| `fk_refunds_payment_attempt` | `refunds(payment_attempt_id) → payment_attempts(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_refunds_booking` | `refunds(booking_id) → bookings(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_promotions_hotel` | `promotions(hotel_id) → hotels(id)` | 0..1 | 0..N | SET NULL | NO ACTION |
| `fk_promotion_redemptions_promotion` | `promotion_redemptions(promotion_id) → promotions(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_promotion_redemptions_booking` | `promotion_redemptions(booking_id) → bookings(id)` | 1 | 0..1 | RESTRICT | NO ACTION |
| `fk_promotion_redemptions_user` | `promotion_redemptions(user_id) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_notifications_recipient` | `notifications(recipient_user_id) → users(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_rooms_hotel` | `rooms(hotel_id) → hotels(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_rooms_room_type_hotel` | `rooms(room_type_id, hotel_id) → room_types(id, hotel_id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_rooms_readiness_updated_by` | `rooms(readiness_updated_by) → users(id)` | 0..1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_assignments_booking_item_type` | `room_assignments(booking_item_id, room_type_id) → booking_items(id, room_type_id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_assignments_room_type` | `room_assignments(room_id, room_type_id) → rooms(id, room_type_id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_assignments_assigned_by` | `room_assignments(assigned_by) → users(id)` | 1 | 0..N | RESTRICT | NO ACTION |
| `fk_room_assignments_released_by` | `room_assignments(released_by) → users(id)` | 0..1 | 0..N | RESTRICT | NO ACTION |
| `fk_email_verification_tokens_user` | `email_verification_tokens(user_id) → users(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_user_images_user` | `user_images(user_id) → users(id)` | 1 | 0..N | CASCADE | NO ACTION |
| `fk_user_images_media` | `user_images(media_object_id) → media_objects(id)` | 1 | 0..1 | RESTRICT | NO ACTION |
| `fk_room_blocks_physical_room_type` | `room_blocks(room_id, room_type_id) → rooms(id, room_type_id)` | 1 | 0..N | RESTRICT | NO ACTION |

## 6. Các FK ghép cần giữ

| Quan hệ | Ý nghĩa |
| --- | --- |
| `booking_items.(booking_id, hotel_id) → bookings.(id, hotel_id)` | Hạng mục thuộc đúng hotel của đơn |
| `booking_items.(room_type_id, hotel_id) → room_types.(id, hotel_id)` | Loại phòng cùng hotel với đơn |
| `inventory_reservations.(booking_item_id, room_type_id) → booking_items.(id, room_type_id)` | Ledger cùng loại phòng với hạng mục |
| `inventory_reservations.(room_type_id, stay_date) → room_inventory.(room_type_id, inventory_date)` | Ledger trỏ đúng dòng tồn/ngày |
| `rooms.(room_type_id, hotel_id) → room_types.(id, hotel_id)` | Phòng vật lý thuộc đúng hotel của loại phòng |
| `room_assignments.(booking_item_id, room_type_id) → booking_items.(id, room_type_id)` | Phân công đúng loại phòng đã mua |
| `room_assignments.(room_id, room_type_id) → rooms.(id, room_type_id)` | Phòng được gán đúng loại; qua room type bảo đảm cùng hotel |
| `room_blocks.(room_id, room_type_id) → rooms.(id, room_type_id)` | Lịch chặn đúng phòng vật lý và loại phòng |

`booking_items` không cần một room_id vì quantity có thể lớn hơn 1. Hai phòng được gán tạo hai room_assignments; một phòng có nhiều phân công qua các kỳ, nhưng các kỳ đang chiếm phòng không được chồng nhau.

## 7. Các quan hệ cần đọc cẩn thận

- `reviews.booking_id` UNIQUE: mỗi booking có tối đa một review.
- `promotion_redemptions.booking_id` UNIQUE: mỗi booking có tối đa một voucher đã áp.
- `user_images.media_object_id` UNIQUE: mỗi media object thuộc tối đa một dòng ảnh tài khoản; một user vẫn có nhiều ảnh.
- `promotions.hotel_id` nullable: không hotel là mã toàn hệ thống. ON DELETE SET NULL hiện tại có rủi ro đổi ý nghĩa mã riêng thành toàn hệ thống khi xóa hotel; xem DB-06 trong README.
- CASCADE xóa liên kết trong DB không tự xóa tệp trên object storage. Chính sách nghiệp vụ vẫn cần giữ lịch sử booking, giao dịch và phân công.

## 8. Những gì FK chưa bảo đảm

FK riêng của review/redemption chưa kiểm tra user/hotel khớp booking; refund chưa kiểm tra booking khớp payment attempt. FK không kiểm tra vai trò, email đã xác minh, trạng thái READY, thời gian voucher, hạn mức, tổng tiền liên bảng, số phân công hoặc chống trùng lịch. Các điều kiện này cần ràng buộc bổ sung hoặc logic giao dịch nhất quán.
