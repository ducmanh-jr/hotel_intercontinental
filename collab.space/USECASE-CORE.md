# Sơ Đồ Use Case Chuẩn UML (Hotel Booking System)

> **Quy chuẩn thiết kế:** Tuân thủ 100% chuẩn **UML 2.5** (tương đương mô hình vẽ trên Draw.io / StarUML):
> - **Use Case:** Biểu diễn bằng hình Oval / Elip `([ ... ])`.
> - **Actor:** Nằm ngoài đường biên hệ thống (System Boundary).
> - **Association (Liên kết):** Đường nét liền (`---`) giữa Actor và Use Case.
> - **`<<include>>`:** Quan hệ bắt buộc (mũi tên nét đứt hướng từ Use Case cơ sở đến Use Case được bao hàm).
> - **`<<extend>>`:** Quan hệ mở rộng/tùy chọn (mũi tên nét đứt kèm điểm mở rộng Extension Point).
> - **Generalization:** Quan hệ kế thừa giữa các Actor (`Customer` kế thừa `Guest`).

---

## 1. Sơ Đồ Use Case Tổng Quan (UML Standard Diagram)

```mermaid
graph LR
    %% Định nghĩa System Boundary
    subgraph SystemBoundary [" Hệ Thống Đặt Phòng Khách Sạn (System Boundary) "]
        
        %% Use Cases chính (Hình Oval/Elip chuẩn UML)
        UC1(["UC-01: Tìm kiếm & Tra cứu phòng"])
        UC2(["UC-02: Đặt phòng & Giữ chỗ"])
        UC2_1(["UC-02.1: Khóa tồn kho (Hold 15')"]):::subUC
        UC2_2(["UC-02.2: Áp dụng Voucher"]):::subUC
        UC3(["UC-03: Thanh toán trực tuyến"])
        UC3_1(["UC-03.1: Xác thực Webhook IPN"]):::subUC
        UC4(["UC-04: Hủy đơn & Hoàn tiền"])
        UC5(["UC-05: Gán phòng vật lý"])
        UC6(["UC-06: Check-in / Nhận phòng"])
        UC7(["UC-07: Check-out / Trả phòng"])
        UC8(["UC-08: Đánh dấu NO_SHOW"])
        UC9(["UC-09: Quản lý phòng & Chặn bảo trì"])
        UC10(["UC-10: Tự động hủy đơn hết hạn"]):::subUC
    end

    %% Định nghĩa Actors
    Guest["🧑 Khách vãng lai (Guest)"]
    Customer["🧑 Khách hàng (Customer)"]
    Receptionist["🧑 Lễ tân (Receptionist)"]
    Manager["🧑 Quản lý KS (Hotel Manager)"]
    Admin["🧑 Quản trị viên (Admin)"]
    VNPAY["🏦 Cổng VNPAY (External System)"]
    Scheduler["⏰ Bộ lập lịch (System Timer)"]

    %% Kế thừa Actor (Generalization)
    Customer --|> Guest

    %% Liên kết giữa Actor và Use Case (Association - Nét liền)
    Guest --- UC1
    Customer --- UC2
    Customer --- UC3
    Customer --- UC4

    Receptionist --- UC5
    Receptionist --- UC6
    Receptionist --- UC7
    Receptionist --- UC8

    Manager --- UC4
    Manager --- UC9
    Admin --- UC9

    VNPAY --- UC3_1
    Scheduler --- UC10

    %% Quan hệ <<include>> (Bắt buộc)
    UC2 -.->|"<<include>>"| UC1
    UC2 -.->|"<<include>>"| UC2_1
    UC3 -.->|"<<include>>"| UC3_1
    UC6 -.->|"<<include>>"| UC5

    %% Quan hệ <<extend>> (Tùy chọn)
    UC2_2 -.->|"<<extend>>"| UC2
    UC4 -.->|"<<extend>>"| UC3

    %% Styling chuẩn Draw.io
    classDef subUC fill:#f9f0ff,stroke:#800080,stroke-dasharray: 3 3;
```

---

## 2. Sơ Đồ Phân Rã Chi Tiết Cho Từng Phân Hệ Cốt Lõi

---

### Phân hệ A: Khách hàng — Tra cứu, Đặt phòng & Thanh toán

Sơ đồ thể hiện đầy đủ quan hệ **`<<include>>`** (các điều kiện bắt buộc) và **`<<extend>>`** (các luồng tùy chọn mở rộng):

```mermaid
graph LR
    subgraph BookingBoundary [" Phân Hệ Đặt Phòng & Thanh Toán (Customer Subsystem) "]
        UC_Search(["Tìm kiếm khách sạn & phòng trống"])
        UC_ViewDetail(["Xem chi tiết loại phòng & giá"])
        
        UC_CreateBooking(["Đặt phòng (Create Booking)"])
        UC_CheckAvail(["Khóa & giữ chỗ tồn kho (Hold 15')"])
        UC_SnapshotPrice(["Chốt snapshot giá cố định"])
        UC_ApplyVoucher(["Nhập mã Voucher giảm giá"])
        
        UC_Payment(["Thanh toán qua VNPAY"])
        UC_VerifyIPN(["Xác thực giao dịch qua IPN Webhook"])
        UC_AutoRefundLate(["Tự động hoàn tiền khi thanh toán trễ"])
        
        UC_CancelBooking(["Yêu cầu hủy đặt phòng"])
        UC_RefundPolicy(["Tính toán hoàn tiền theo mốc 24h"])
    end

    Customer["🧑 Khách hàng (Customer)"]
    VNPAY["🏦 Cổng VNPAY"]

    %% Association
    Customer --- UC_Search
    Customer --- UC_ViewDetail
    Customer --- UC_CreateBooking
    Customer --- UC_Payment
    Customer --- UC_CancelBooking
    VNPAY --- UC_VerifyIPN

    %% Include relationships
    UC_ViewDetail -.->|"<<include>>"| UC_Search
    UC_CreateBooking -.->|"<<include>>"| UC_CheckAvail
    UC_CreateBooking -.->|"<<include>>"| UC_SnapshotPrice
    UC_Payment -.->|"<<include>>"| UC_VerifyIPN
    UC_CancelBooking -.->|"<<include>>"| UC_RefundPolicy

    %% Extend relationships
    UC_ApplyVoucher -.->|"<<extend>>"| UC_CreateBooking
    UC_AutoRefundLate -.->|"<<extend>>"| UC_VerifyIPN
```

---

### Phân hệ B: Lễ tân & Quản lý — Điều phối phòng, Check-in & Bảo trì

Sơ đồ thể hiện nghiệp vụ nội bộ khách sạn giữa Lễ tân và Quản trị:

```mermaid
graph LR
    subgraph HotelOpsBoundary [" Phân Hệ Vận Hành & Lễ Tân (Hotel Operations Subsystem) "]
        UC_AssignRoom(["Gán phòng vật lý cụ thể (Room Assignment)"])
        UC_ChangeRoom(["Đổi gán phòng vật lý trước Check-in"])
        UC_CheckIn(["Thực hiện Check-in"])
        UC_VerifyReady(["Kiểm tra phòng đạt chuẩn READY"])
        
        UC_CheckOut(["Thực hiện Check-out"])
        UC_MarkDirty(["Tự động chuyển phòng sang DIRTY"])
        
        UC_MarkNoShow(["Đánh dấu khách không đến (NO_SHOW)"])
        UC_LateNotice(["Ghi nhận khách báo đến muộn"])
        
        UC_BlockRoom(["Chặn phòng bảo trì (Room Block)"])
        UC_ReleaseBlock(["Mở chặn & khôi phục tồn kho"])
    end

    Receptionist["🧑 Lễ tân (Receptionist)"]
    Manager["🧑 Quản lý KS (Hotel Manager)"]

    %% Association
    Receptionist --- UC_AssignRoom
    Receptionist --- UC_CheckIn
    Receptionist --- UC_CheckOut
    Receptionist --- UC_MarkNoShow
    Manager --- UC_BlockRoom
    Manager --- UC_ReleaseBlock

    %% Include relationships
    UC_CheckIn -.->|"<<include>>"| UC_AssignRoom
    UC_CheckIn -.->|"<<include>>"| UC_VerifyReady
    UC_CheckOut -.->|"<<include>>"| UC_MarkDirty

    %% Extend relationships
    UC_ChangeRoom -.->|"<<extend>>"| UC_AssignRoom
    UC_LateNotice -.->|"<<extend>>"| UC_MarkNoShow
```

---

## 3. Bảng Đặc Tả Ý Nghĩa Các Mối Quan Hệ Chuẩn UML

| Quan hệ | Use Case nguồn | Use Case đích | Ý nghĩa nghiệp vụ thực tế |
|---|---|---|---|
| **`<<include>>`** | Đặt phòng (`UC-02`) | Khóa tồn kho 15' (`UC-02.1`) | **Bắt buộc:** Không thể tạo đơn nếu hệ thống không đồng thời giữ được chỗ trên kho phòng. |
| **`<<include>>`** | Thanh toán (`UC-03`) | Xác thực IPN (`UC-03.1`) | **Bắt buộc:** Đơn chỉ được xác nhận thành công thông qua Webhook IPN có ký số hợp lệ từ VNPAY. |
| **`<<include>>`** | Check-in (`UC-06`) | Gán phòng vật lý (`UC-05`) | **Bắt buộc:** Khách không thể nhận chìa khóa/check-in nếu lễ tân chưa gán số phòng cụ thể. |
| **`<<include>>`** | Check-in (`UC-06`) | Kiểm tra phòng READY | **Bắt buộc:** Chỉ phòng đã dọn dẹp sạch sẽ mới được phép check-in cho khách. |
| **`<<include>>`** | Check-out (`UC-07`) | Đổi phòng sang DIRTY | **Bắt buộc:** Khi khách trả phòng, trạng thái buồng phòng lập tức chuyển về chưa dọn (`DIRTY`). |
| **`<<extend>>`** | Áp dụng Voucher | Đặt phòng (`UC-02`) | **Tùy chọn:** Khách có thể nhập hoặc không nhập mã giảm giá khi đặt phòng. |
| **`<<extend>>`** | Tự động hoàn tiền trễ | Xác thực IPN | **Ngoại lệ:** Chỉ kích hoạt khi tiền thanh toán thành công gửi về sau khi đơn đã bị hủy/hết hạn. |
| **`<<extend>>`** | Ghi nhận đến muộn | Đánh dấu NO_SHOW | **Tùy chọn/Ngoại lệ:** Nếu khách có gọi điện báo muộn, hệ thống ngăn chặn việc đánh dấu NO_SHOW theo mốc mặc định. |
| **`Generalization`** | Khách hàng (`Customer`) | Khách vãng lai (`Guest`) | **Kế thừa:** Khách hàng có tài khoản kế thừa toàn bộ quyền tra cứu của khách vãng lai. |
