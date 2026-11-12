# Hotel Booking — Tài liệu tổng thể đề tài

> Cập nhật: 22/10/2026 theo nghiệp vụ v0.8 và DBML 40 bảng/65 FK đã sửa xuống dòng Ref. Đã có thiết kế hotel_contracts, booking_financials, hotel_payouts và bên tài trợ voucher ở promotions. Snapshot bên tài trợ ở promotion_redemptions còn thiếu. Đây là yêu cầu/thiết kế; chưa xác nhận migration hoặc luồng tài chính đã chạy.

## 1. Giới thiệu đề tài

### 1.1. Tổng quan

**Tên đề tài:** Xây dựng hệ thống đặt phòng khách sạn trực tuyến.

Hệ thống giúp khách hàng tìm phòng, xem giá, đặt và thanh toán trực tuyến; đồng thời hỗ trợ nhân sự khách sạn quản lý thông tin, phòng, đơn đặt và quá trình lưu trú.

### 1.2. Mô tả bài toán

Khi có nhu cầu lưu trú, khách hàng cần tìm loại phòng phù hợp với thời gian, số người và ngân sách; biết tổng tiền, điều kiện đặt và tình trạng đơn. Phía khách sạn cần biết số phòng còn có thể bán trong từng đêm, phòng nào đã dành cho khách và phòng nào đang bảo trì hoặc chưa sẵn sàng bàn giao.

Khó khăn cốt lõi là **đồng bộ phòng còn trống, đơn đặt và tiền thanh toán**. Nhiều khách có thể cùng chọn phòng cuối; giá hoặc khả dụng có thể thay đổi trước khi tạo đơn; kết quả thanh toán có thể đến muộn hoặc được gửi lặp. Nếu xử lý không thống nhất, hệ thống có thể nhận đơn vượt khả năng phục vụ, xác nhận sai hoặc hoàn tiền không đúng.

| Đối tượng / nghiệp vụ | Vấn đề hệ thống cần giải quyết |
| --- | --- |
| **Khách hàng** | Tra cứu phòng và giá theo kỳ ở; đặt, thanh toán, theo dõi và hủy đơn theo chính sách. |
| **Quản lý khách sạn** | Quản lý danh mục phòng, giá và lịch ngừng phục vụ; bảo đảm đủ phòng phục vụ các đơn đã nhận. |
| **Lễ tân** | Xác định đơn đủ điều kiện nhận phòng; gán phòng không trùng lịch, kiểm tra sẵn sàng và ghi nhận nhận/trả phòng. |
| **Quản trị hệ thống** | Kiểm soát tài khoản, phân quyền và mở bán; giới hạn thao tác theo vai trò và khách sạn. |
| **Đặt phòng và thanh toán** | Giữ chỗ có thời hạn, chỉ xác nhận khi thu đủ tiền hợp lệ; xử lý hết hạn, thông báo lặp, tiền đến muộn và hoàn tiền. |

**Kết quả cần đạt:** Một quy trình xuyên suốt từ tìm phòng đến trả phòng, trong đó mỗi đơn có thông tin, giá và trạng thái rõ ràng; lượng phòng được kiểm soát và lịch sử giao dịch được bảo toàn.

### 1.3. Mục tiêu MVP — phiên bản khả dụng tối thiểu

- Hoàn thiện luồng **tìm phòng → đặt phòng → thanh toán → nhận phòng → trả phòng**.
- Phân quyền rõ giữa khách hàng, quản lý, lễ tân và quản trị hệ thống.
- Kiểm soát hết phòng, hết hạn, hủy đơn, tiền đến muộn và khách không đến.
- Nền tảng thu hộ/giữ khoản chưa chi, quản lý hoa hồng theo hợp đồng và báo cáo tài chính cho cả nền tảng lẫn Owner; ghi nhận chi trả Owner có lịch sử.

## 2. Các actor chính

| Actor | Nghiệp vụ chính | Giới hạn |
| --- | --- | --- |
| **Khách truy cập** | Xem khách sạn, ảnh, tiện ích, loại phòng, giá và khả dụng; đăng ký tài khoản. | Chưa được đặt khi chưa đăng nhập và xác minh email. |
| **Khách hàng — CUSTOMER** | Quản lý hồ sơ; đặt phòng, áp voucher, thanh toán; xem lịch sử, hủy đơn và theo dõi hoàn tiền. | Chỉ thao tác trên hồ sơ và đơn của mình. |
| **Quản lý khách sạn — HOTEL_MANAGER** | Quản lý thông tin, ảnh, loại phòng, phòng cụ thể, giá, voucher, lịch ngừng phục vụ và lễ tân; xử lý vận hành. | Chỉ khách sạn được giao; không tự cấp quyền quản trị hệ thống. |
| **Chủ/đại diện khách sạn — Owner** | Thỏa thuận hoa hồng, xem phần được hưởng/chờ nhận và lịch sử chi trả của khách sạn thuộc quyền; cam kết phục vụ và giải trình giao dịch. | DBML liên kết Owner qua hotels.owner_user_id và hotel_contracts.owner_user_id; quyền tài chính phải kiểm tra riêng, không mặc định mọi nhân viên quản lý đều được xem hoặc nhận tiền. Chưa xác nhận quyền này đã triển khai. |
| **Lễ tân — RECEPTIONIST** | Xem đơn, gán phòng, nhận/trả phòng; ghi nhận đến muộn, không đến, chờ dọn/sẵn sàng. | Không tự sửa giá, mức giảm hoặc cấp quyền. |
| **Quản trị hệ thống — ADMIN** | Quản lý tài khoản/khách sạn; thỏa thuận hoa hồng; xem tài chính toàn hệ thống, kiểm tra và thực hiện chi trả Owner. | Không bán vượt phòng, tự ghi khách đã trả khi thiếu xác thực cổng hoặc sửa mất lịch sử thu/hoàn/chi. |
| **Cổng thanh toán** | Hệ thống bên ngoài xử lý thu/hoàn tiền và cung cấp kết quả giao dịch. | Không quản lý khách sạn hoặc tự thay đổi đơn. |

- Một tài khoản có thể vừa là khách hàng, vừa là nhân sự khách sạn.
- Quyền nhân sự gắn với từng khách sạn; quản lý khách sạn A không mặc nhiên có quyền tại B.

## 3. Nghiệp vụ từng phần trong MVP

### 3.1. Tài khoản và phân quyền — identity

- **Chức năng:** Đăng ký, đăng nhập/đăng xuất, xác minh email, hồ sơ, đổi mật khẩu và khôi phục mật khẩu qua liên kết email.
- **Quy tắc:** Phải đăng nhập, email đã xác minh và tài khoản không bị khóa mới được đặt phòng. Email chỉ cần xác minh một lần.
- **Quyền:** Quản trị phân công quản lý; quản lý phân công/thu hồi lễ tân tại khách sạn mình. Người dùng không tự chọn quyền nhân sự khi đăng ký.

### 3.2. Khách sạn, loại phòng và phòng cụ thể — hotel

- **Chức năng:** Quản lý thông tin, địa chỉ, tiện ích, loại phòng, sức chứa và danh mục phòng có số phòng/tầng.
- **Phân biệt:** Loại phòng là nhóm như Deluxe; phòng cụ thể là 301, 302 thuộc loại Deluxe.
- **Mở bán:** Quản trị công khai lần đầu; quản lý sửa nội dung hoặc tạm ngừng bán. Ngừng bán chỉ chặn đơn mới, không tự hủy đơn cũ; khóa bán bởi quản trị chỉ quản trị được gỡ.

### 3.3. Tồn phòng, lịch phòng và bảo trì — inventory

- **Chức năng:** Kiểm tra khả dụng theo loại phòng/ngày; giữ, xác nhận, giải phóng tồn; quản lý lịch bảo trì và tình trạng chờ dọn/sẵn sàng.
- **Quy tắc:** Phải đủ phòng phù hợp liên tục cả kỳ ở, không trùng lịch hoặc bảo trì. Hai khách tranh phòng cuối chỉ một yêu cầu được giữ thành công.
- **Phân biệt:** Xem phòng chưa giữ chỗ; tạo đơn thành công mới giữ. Phòng trống lịch chưa chắc đã sẵn sàng bàn giao; phòng chờ dọn phải được xác nhận dọn xong.

### 3.4. Giá phòng và báo giá — pricing

- **Chức năng:** Thiết lập giá theo loại phòng/ngày; báo giá theo số phòng và số đêm, trước và sau voucher.
- **Cách tính:** Tổng trước giảm = tổng của từng loại phòng: số lượng × tổng giá các đêm. Tổng cần trả = tổng trước giảm − tiền giảm.
- **Quy tắc:** Giá trọn gói, đã gồm khoản bắt buộc. Giá thay đổi lúc tạo đơn phải được khách xác nhận lại; đơn đã tạo giữ nguyên giá và điều khoản đã lưu.

### 3.5. Voucher cơ bản — phối hợp giá, đặt phòng và thanh toán

- **Chức năng:** Quản trị quản lý mã toàn hệ thống hoặc theo khách sạn; quản lý chỉ quản lý mã của khách sạn mình. Khách áp tối đa **một mã/đơn**.
- **Điều kiện:** Mã đang hoạt động, đúng thời gian/phạm vi, đạt giá trị tối thiểu và còn lượt nếu có cấu hình giới hạn.
- **Cách giảm:** Theo phần trăm hoặc số tiền cố định, không vượt trần được cấu hình. Lưu khoản giảm vào đơn; thu/hoàn dựa trên số thực thu sau giảm.
- **Bên tài trợ:** funding_source = PLATFORM hoặc HOTEL. Phạm vi sử dụng hotel_id độc lập với bên chịu khoản giảm; quản lý khách sạn chỉ tạo mã HOTEL, quản trị được tạo mã PLATFORM. Chưa đồng tài trợ.
- **Lịch sử:** DBML đã có promotions.funding_source, nhưng chưa có promotion_redemptions.funding_source; phải bổ sung snapshot bên tài trợ khi áp mã. Không lấy cấu hình voucher hiện tại để tính lại bên chịu tiền của đơn cũ.

### 3.6. Đặt phòng và lưu trú — booking

- **Chức năng:** Tạo đơn, lưu người đặt/người ở, xem lịch sử, hủy toàn bộ đơn, xử lý hết hạn, gán phòng, nhận/trả phòng và ghi nhận không đến.
- **Điều kiện:** Ngày trả sau ngày nhận, không đặt ngày đã qua; số phòng/số người hợp lệ và không vượt sức chứa. Người đặt có thể khác người ở, cần thông tin liên hệ tương ứng.
- **Cam kết:** Khách đặt **loại phòng và số lượng**; nhân viên gán số phòng cụ thể sau khi xác nhận đơn. Gán đủ phòng đúng loại, hợp lệ và sẵn sàng mới hoàn tất check-in.
- **Xác nhận:** Trả trước **100% tổng sau giảm** khi giữ chỗ còn hợp lệ. Gán phòng không đổi tiền hoặc trừ tồn thêm; gửi lại cùng yêu cầu không tạo thêm đơn.

### 3.7. Thu/hoàn tiền, hoa hồng và chi trả — payment

- **Chức năng:** Tạo yêu cầu thu toàn bộ tiền đơn, xác thực kết quả cổng, lưu giao dịch và theo dõi hoàn tiền.
- **Quy tắc:** Kết quả phải đúng đơn, số tiền và loại tiền; trình duyệt báo thành công chưa đủ để xác nhận. Thông báo lặp không gây tác động tài chính lần nữa.
- **Ngoại lệ:** Tiền đến sau khi đơn hết hạn/hủy hoặc thu thừa phải được ghi nhận để hoàn. Hủy đơn và hoàn tiền có trạng thái riêng; tổng hoàn không vượt số thực thu.
- **Giữ tiền:** Khoản đã thu được theo dõi trong luồng nền tảng thu hộ, chưa chuyển ngay cho Owner. Đây khác giữ phòng tạm khi chờ trả tiền; bản đầu vẫn thu đủ 100%, chưa đặt cọc một phần.
- **Hợp đồng:** hotel_contracts lưu khách sạn, Owner ký, tỷ lệ/căn cứ hoa hồng, khoảng hiệu lực và trạng thái. Điều khoản đã dùng được giữ lại khi tạo thỏa thuận mới; booking lưu snapshot thỏa thuận áp dụng.
- **Tài chính hai bên:** booking_financials có tối đa một dòng/booking, lưu tiền khách trả, phần voucher mỗi bên chịu, căn cứ/tỷ lệ hoa hồng, platform_fee_amount và hotel_earning_amount. PENDING/FINALIZED là trạng thái chốt tài chính, không phải trạng thái tiền đã trả Owner.
- **Chi trả:** hotel_payouts lưu từng lần thực hiện chuyển cho một booking, tài khoản thụ hưởng tại lúc chi, số tiền, người thực hiện, tham chiếu và kết quả. Chỉ SUCCEEDED được tính đã trả; không chi hai lần do thử lại hoặc mất kết nối.
- **Báo cáo:** Nền tảng xem toàn hệ thống/theo khách sạn; Owner xem đúng phạm vi. Tách tiền thu, hoa hồng, chi phí voucher, khoản được hưởng, thực chi và còn phải trả; báo cáo ròng phải xét hoàn/điều chỉnh, không cộng lại doanh thu khi chuyển Owner. Dữ liệu điều chỉnh sau hoàn/chi chưa đầy đủ, cần đặc tả tiếp.

### 3.8. Hình ảnh — media

- **Chức năng:** Tải lên, liên kết, sắp xếp, chọn ảnh đại diện hiển thị và gỡ ảnh khách sạn/loại phòng; quản lý ảnh tài khoản.
- **Quyền:** Quản lý thao tác ảnh khách sạn được giao; khách thao tác ảnh của mình; lễ tân không quản lý thư viện ảnh.
- **Quy tắc:** Không giới hạn số lượng ảnh. Mỗi khách sạn/loại phòng chọn tối đa một ảnh đại diện hiển thị; mỗi tài khoản chọn một avatar hiện hành. Chỉ sử dụng ảnh thuộc đối tượng có quyền quản lý.

## 4. Quy trình nghiệp vụ tổng thể

| Bước | Actor chính | Xử lý và kết quả |
| --- | --- | --- |
| **1. Chuẩn bị mở bán** | Quản trị, quản lý | Tạo khách sạn; cấu hình thông tin, phòng, ảnh, giá và lịch ngừng phục vụ; quản trị công khai lần đầu. |
| **2. Tìm và chọn phòng** | Khách | Chọn ngày, loại phòng, số lượng, số người; xem khả dụng và báo giá. |
| **3. Tạo đơn, giữ chỗ** | Khách hàng, hệ thống | Kiểm tra tài khoản, giá, voucher và phòng; tạo đơn chờ thanh toán, hiển thị tổng tiền và hạn giữ chỗ. |
| **4. Thanh toán, xác nhận** | Khách hàng, cổng thanh toán, hệ thống | Thu đủ tiền trong hạn, xác thực kết quả và xác nhận đơn; chuyển tồn đang giữ sang đã xác nhận, lưu thỏa thuận/hoa hồng và tài chính gốc cho booking. |
| **5. Gán và nhận phòng** | Lễ tân/quản lý | Gán đủ phòng đúng loại; kiểm tra lịch, tình trạng sẵn sàng và thông tin khách rồi check-in. |
| **6. Trả phòng** | Lễ tân/quản lý | Check-out, hoàn tất lưu trú và chuyển phòng sang chờ dọn. |
| **7. Sẵn sàng phục vụ tiếp** | Lễ tân/quản lý | Xác nhận dọn xong; đánh dấu phòng sẵn sàng bàn giao. |
| **8. Chốt tài chính và chi Owner** | Quản trị, Owner, hệ thống | Kiểm tra điều kiện chốt và hoàn/điều chỉnh; xác định số phải trả; ghi nhận lần chi và xác nhận kết quả. Điều kiện/lịch chi cụ thể còn cần chốt; bước này độc lập việc dọn phòng. |

**Ví dụ xuyên suốt:**

- Đặt 2 phòng Deluxe, nhận 10/11, trả 12/11: sử dụng hai đêm 10 và 11/11.
- Giá mỗi phòng: đêm đầu 800.000 đồng, đêm sau 1.000.000 đồng → trước giảm **3.600.000 đồng**.
- Voucher giảm 10%, trần 150.000 đồng → thanh toán **3.450.000 đồng**.
- Sau xác nhận, lễ tân gán phòng 301 và 302; check-in khi đủ điều kiện, check-out rồi chuyển hai phòng sang chờ dọn.
- Minh họa tài chính nếu hợp đồng quy định 10% AFTER_DISCOUNT và khách sạn tài trợ voucher: lưu hoa hồng 345.000 đồng, phần khách sạn 3.105.000 đồng, chưa xét phí cổng/hoàn. Đây là ví dụ, không chốt tỷ lệ hay căn cứ mặc định; tiền Owner chỉ được ghi đã nhận khi lần chi thành công.

## 5. Các tình huống quan trọng

| Tình huống | Hướng xử lý theo tài liệu nghiệp vụ |
| --- | --- |
| Chưa xác minh email, tài khoản bị khóa hoặc dữ liệu không hợp lệ | Không tạo đơn; thông báo điều kiện cần đáp ứng. |
| Hết phòng khi khách xác nhận đặt | Kiểm tra lại; không tạo đơn giữ chỗ một phần nếu thiếu bất kỳ hạng mục/đêm nào. |
| Mỗi đêm còn phòng nhưng không có phòng ở liên tục | Không nhận đơn nếu bắt buộc chuyển phòng giữa kỳ; MVP chưa hỗ trợ chuyển phòng khi đang ở. |
| Giá thay đổi hoặc voucher không còn hợp lệ | Thông báo và yêu cầu khách xác nhận lại báo giá/phương án thanh toán. |
| Gửi lại cùng yêu cầu do mất kết nối | Trả cùng kết quả, không tạo thêm đơn hoặc giữ thêm phòng. |
| Thanh toán thất bại | Cho thử lại khi lần trước đã được xác định không thể thu tiền và đơn còn hạn; không gia hạn giữ chỗ. |
| Hết hạn chưa xác nhận được thanh toán | Chuyển đơn hết hạn, giải phóng giữ chỗ đúng một lần. |
| Tiền được ghi nhận sau khi đơn hết hạn/hủy | Lưu khoản thu để xử lý hoàn, không tự khôi phục đơn. |
| Cổng báo lặp hoặc thực tế thu hai lần | Thông báo lặp chỉ xử lý một lần; giao dịch thu thừa được theo dõi để hoàn. |
| Khách hủy trước check-in | Hủy toàn bộ theo chính sách áp dụng; theo dõi riêng khoản hoàn. Mức hoàn còn cần chốt. |
| Khách báo đến muộn trước khi bị đánh dấu không đến | Nhân viên ghi nhận lịch đến; giữ đơn xác nhận và tồn còn lại, không tự dời ngày trả. |
| Khách không đến, không có thông báo đến muộn còn hiệu lực | Nhân viên đánh dấu NO_SHOW khi đủ điều kiện; không hoàn/thu thêm, trả tồn các đêm chưa dùng. |
| Phòng chưa sẵn sàng khi khách đến | Chưa check-in; nhân sự phải bố trí đủ phòng hợp lệ. Không giao phòng bảo trì hoặc đang có khách. |
| Thay hợp đồng hoặc bên tài trợ voucher sau khi đơn đã tạo | Giữ thỏa thuận và số tiền đã lưu; không tính lại lịch sử từ cấu hình mới. Snapshot funding_source ở redemption còn phải bổ sung. |
| Mất kết nối khi chuyển Owner | Giữ trạng thái cần kiểm tra, không tự coi FAILED rồi chuyển lần nữa; xác minh kết quả trước khi thử lại. |
| Hoàn khách sau khi đã chi Owner | Giữ lịch sử chi và ghi điều chỉnh/thu hồi hoặc bù trừ theo thỏa thuận; không trì hoãn khoản khách được hoàn chỉ vì chưa thu lại Owner. Dữ liệu điều chỉnh cần thiết kế tiếp. |

**Trạng thái đơn chính:**

| Trạng thái | Ý nghĩa |
| --- | --- |
| PENDING_PAYMENT | Chờ thanh toán, đang giữ chỗ có thời hạn. |
| CONFIRMED | Đã xác nhận sau khi thu đủ tiền hợp lệ. |
| CHECKED_IN / CHECKED_OUT | Đã nhận phòng / đã trả phòng. |
| CANCELLED / EXPIRED | Đã hủy / đã hết hạn chờ thanh toán. |
| NO_SHOW | Nhân viên đã ghi nhận khách không đến theo điều kiện áp dụng. |

## 6. Ràng buộc giữa khách hàng, Owner và nền tảng

**Bài toán:** Khách tìm khách sạn qua hệ thống, sau đó hai bên giao dịch riêng; hoặc Owner đề nghị khách hủy đơn để trả trực tiếp. Nền tảng mất giao dịch, khách khó theo dõi và yêu cầu hỗ trợ cho khoản thanh toán ngoài.

**Nguyên tắc:** Không thể ngăn tuyệt đối bằng cách ẩn liên hệ vì tên và địa chỉ khách sạn vẫn công khai. Cần kết hợp kiểm soát thông tin, quyền lợi đặt qua nền tảng, dấu vết giao dịch và xử lý vi phạm có bằng chứng.

| Nhóm ràng buộc | Quy tắc và chi tiết áp dụng |
| --- | --- |
| **Cam kết ba bên** | Khách thanh toán chính thức; Owner cung cấp đúng phòng, không dẫn khách hủy để trả ngoài; nền tảng công khai giá/phí, lưu giao dịch và xử lý phản ánh theo phạm vi cam kết. |
| **Liên hệ theo trạng thái đơn** | Chưa CONFIRMED: che liên hệ riêng của Owner và khách tại backend; không tạo danh sách khách tiềm năng cho Owner. Sau CONFIRMED: mở thông tin cần thiết để phục vụ lưu trú cho đúng người có quyền. |
| **Nội dung khách sạn** | Không chèn số điện thoại bán riêng, QR chuyển khoản hoặc đường dẫn đặt ngoài trong mô tả/ảnh; kiểm tra nội dung trước công khai. Giữ tên, địa chỉ và thông tin lưu trú chính xác. |
| **Thanh toán bắt buộc qua luồng hệ thống** | Thu đủ 100% mới xác nhận; Owner không tự đánh dấu đã trả bằng tiền mặt, ảnh chuyển khoản hoặc tiền vào tài khoản cá nhân. |
| **Hủy/hoàn có dấu vết** | Lưu người thao tác, thời điểm, lý do và lịch sử; phân biệt khách hủy với khách sạn không thể phục vụ. Theo dõi khách sạn hủy thường xuyên, không tự coi mọi lần hủy là gian lận hoặc giữ tiền hoàn hợp lệ. |
| **Quyền lợi gắn booking** | Voucher, lịch sử đặt và hỗ trợ khiếu nại gắn đơn trên hệ thống. Khách gửi lý do/bằng chứng, quản trị tiếp nhận và ghi kết quả; đánh giá chỉ áp dụng nếu được duyệt. |
| **Kiểm tra và xử lý vi phạm** | Báo cáo của khách, nội dung dẫn ra ngoài và mẫu hủy bất thường là tín hiệu để kiểm tra. Xử lý có lý do, bằng chứng và giải trình; có thể cảnh cáo hoặc dừng nhận đơn mới. Không coi mọi lần hủy là vi phạm. |
| **Thu hộ, phí và chi trả — đã chọn** | Nền tảng nhận tiền khách, giữ khoản chưa chi và trả Owner khi đủ điều kiện. DBML đã có hotel_contracts, booking_financials và hotel_payouts. promotions đã có funding_source; snapshot ở redemption còn thiếu. Mức/căn cứ phí theo hợp đồng, điều kiện/lịch chi, hoàn/điều chỉnh và khả năng nhà cung cấp còn cần chốt; chưa xác nhận migration/runtime. |

**Năm nguyên tắc đã chọn:** Trả trước 100% qua kết quả cổng đã xác thực; hạn chế liên hệ trước xác nhận và kiểm duyệt nội dung; lưu lịch sử hủy/hoàn; phí và chi trả theo mô hình được chọn; voucher, lịch sử đặt và hỗ trợ khiếu nại. Chủ khách sạn không tự đánh dấu đã thu tiền.

**Luồng:** Đặt phòng → trả đủ tiền → xác nhận và lưu phí/thỏa thuận → mở liên hệ cần thiết theo quyền → nhận/trả phòng → đối soát và chi trả Owner khi đủ điều kiện. Thời điểm/lịch chi cụ thể còn cần chốt; không đồng nhất khách đã trả với Owner đã nhận.

**Cách làm bản đầu:** Che liên hệ trước xác nhận ở backend, kiểm tra nội dung thủ công, lưu lịch sử hủy/hoàn, thống kê hủy bất thường và quản trị xử lý khiếu nại. Chat, mã nhận phòng một lần, phát hiện tự động và đối soát tự động là mở rộng.

Chi tiết hiện tại: [Nghiệp vụ v0.8](business/module-scope-and-rules-draft.md#8-module-payment--thuhoàn-tiền-hoa-hồng-và-chi-trả) và [ERD theo DBML 40 bảng](database/erd.md). Các quyết định giao dịch ba bên đã được giữ trong tài liệu nghiệp vụ; chưa xác nhận quyền Owner đã triển khai.

## 7. Ngoài phạm vi phiên bản đầu

- Chủ khách sạn tự đăng ký và duyệt đối tác. Thu hộ/chi trả và quản lý hoa hồng đã thuộc phạm vi; ví Owner, rút tiền tùy ý và kế toán đầy đủ chưa thuộc bản đơn giản.
- Khách tự chọn số phòng; đổi ngày/loại phòng, hủy một phần hoặc rút ngắn kỳ ở.
- Chuyển/nâng hạng phòng khi đang lưu trú; sơ đồ tầng trực quan.
- Đặt hộ qua điện thoại tại quầy, khách đoàn theo hợp đồng và công nợ doanh nghiệp.
- Đặt cọc, trả tại khách sạn, trả góp, dịch vụ phát sinh và hóa đơn thuế.
- Cộng dồn voucher, điểm thưởng, chat; phân công và checklist buồng phòng/bảo trì chi tiết.

**Đánh giá khách sạn — chưa chốt vào MVP:**

- Đề xuất cho người đặt đánh giá sau khi hoàn tất lưu trú; mỗi booking tối đa một đánh giá.
- Khách đọc điểm/nội dung công khai; quản lý xem/báo cáo; quản trị kiểm duyệt.
- Phạm vi MVP và chính sách đăng/sửa/ẩn vẫn chờ duyệt, chưa phải chức năng đã cam kết.

## 8. Các quyết định còn cần chốt

| Nhóm | Nội dung chưa chốt |
| --- | --- |
| Phạm vi chung | Hỗ trợ nhiều khách sạn; một đơn nhiều loại phòng trong cùng kỳ ở. |
| Owner và giao dịch ngoài | Phạm vi liên hệ, thời hạn khiếu nại/giải trình; mức và lựa chọn căn cứ hoa hồng theo hợp đồng, thời điểm chọn hợp đồng, điều kiện/lịch chi, phí cổng, điều chỉnh hủy/hoàn/NO_SHOW và voucher. DBML đã có ba bảng tài chính, nhưng chưa bảo đảm điều chỉnh và chống chi trùng. |
| Tài khoản | Thời hạn liên kết xác minh/reset mật khẩu; dịch vụ gửi email. |
| Khách sạn và lịch phòng | Quyền tự mở bán lại; quyền và quy ước ngày chặn phòng; xử lý bảo trì khẩn cấp. |
| Giờ và thời hạn | Giữ chỗ 15 phút; nhận/trả 14:00/12:00; hạn đặt trong ngày; mốc NO_SHOW và xử lý tiếp khi khách vẫn không đến. |
| Hủy và hoàn tiền | Miễn phí trước 24 giờ, phí hủy muộn và mức hoàn khi khách sạn không thể phục vụ vẫn là đề xuất. |
| Thanh toán | Cổng thanh toán; môi trường thử nghiệm/thu thật; thời gian hoàn tiền. |
| Giá và voucher | Giá cơ bản dự phòng; làm tròn; đơn được giảm về 0; trả lượt sau thanh toán, đổi mã và quy tắc hoa hồng/hoàn theo bên tài trợ. Bổ sung funding_source vào promotion_redemptions để lưu lịch sử. |
| Hình ảnh và đánh giá | Kích thước tệp/quyền hiển thị ảnh tài khoản; có đưa đánh giá vào MVP hay không. |

Các con số đề xuất không phải chính sách đã phê duyệt. Khi triển khai phải dùng quyết định được chốt và lưu điều khoản áp dụng cho từng đơn.

## 9. Nền tảng kỹ thuật và trạng thái triển khai

| Nội dung | Theo README và tài liệu hiện có |
| --- | --- |
| Nền tảng | Backend Spring Boot, Java 21, PostgreSQL; tổ chức theo Modular Monolith. |
| Cấu trúc | 7 module: identity, hotel, inventory, pricing, booking, payment, media; mỗi module chia api/application/domain/infrastructure. |
| Đã có | Khung module và thành phần dùng chung; bảo mật hiện dùng HTTP Basic. |
| Chưa triển khai theo README | JWT, API nghiệp vụ và migration database. |
| Database | ERD cập nhật theo [DBML đã sửa](database/proposals/hotel-booking-current-fixed.dbml): 40 bảng, 348 cột, 65 FK, 25 enum; không có khối checks. Chưa chứng minh schema/migration hoặc các luồng đã chạy thực tế. |
| Chênh lệch thiết kế | promotions có funding_source, redemption chưa có; chưa có ràng buộc hợp đồng chồng kỳ/chống chi trùng và dữ liệu điều chỉnh đầy đủ. README/từ điển DB vẫn theo bản 37 bảng, chưa cập nhật trong lần sửa ba file này. |

## 10. Tài liệu tham chiếu

- [Phạm vi, vai trò và quy tắc nghiệp vụ](business/module-scope-and-rules-draft.md) — nguồn chính về nghiệp vụ và trạng thái chấp thuận.
- [Thuật ngữ dự án](../CONTEXT.md) — loại phòng, phòng cụ thể, giữ chỗ và lưu trú.
- [DBML 40 bảng đã sửa Ref](database/proposals/hotel-booking-current-fixed.dbml) và [ERD hiện tại](database/erd.md) — nguồn đối chiếu cấu trúc trong lần cập nhật này.
- [Tổng quan database](database/README.md), [Từ điển dữ liệu](database/data-dictionary.md) — vẫn theo bản 37 bảng, cần cập nhật riêng để đồng bộ đầy đủ.
- [README dự án](../README.md) — công nghệ, cách chạy và trạng thái khung backend.

Các đối chiếu cũ cho bản 33/37 bảng không thay thế DBML 40 bảng làm nguồn cấu trúc hiện tại.
