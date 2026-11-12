# AgentRules — Hotel Booking Backend

Đối chiếu source ngày **2026-11-02**, nền commit `c39f072` và working tree. MUST là bắt buộc; SHOULD là mặc định nên theo. Source/test là bằng chứng implementation; không xem tài liệu thiết kế là chức năng đã chạy.

## 1. Cách làm việc

- MUST đọc file này, [mẫu code thật](AgentExamples.md), source liên quan và Git diff trước khi sửa. Không lấy lỗi cũ/ngoại lệ cũ làm convention.
- Giữ phạm vi được giao và thay đổi của người khác; không tự commit/push/reset/đổi nhánh hoặc refactor hàng loạt.
- Không tự thêm framework, dependency, test kiến trúc, script hay sửa CI nếu nhiệm vụ chỉ yêu cầu viết tài liệu.
- Không sửa rule để hợp thức hóa implementation. Xung đột kiến trúc/contract phải nêu rõ; tiếp tục phần độc lập được phép.
- Giữ nguyên URL/method/status/header/message, field/null/enum/nested/list/thứ tự/kiểu ngày khi chỉ refactor.
- [AGENTS.md](AGENTS.md) là điểm vào; [CLAUDE.md](CLAUDE.md) import file này; [Copilot instructions](.github/copilot-instructions.md) dẫn cùng nguồn. Với công cụ khác, cấu hình đọc AGENTS/AgentRules, không duy trì bản quy tắc riêng.
- Mốc kiểm tra trong tài liệu là snapshot, không tự bảo đảm còn đúng. Khi thay source mẫu, cập nhật tham chiếu và ngày đối chiếu.

## 2. Kiến trúc và vị trí file — MUST

Package gốc `com.team.hotelbooking`; Java/Spring và phiên bản thư viện lấy từ [pom.xml](pom.xml). Modular Monolith chạy chung ứng dụng; không tự tạo HTTP call giữa module.

| Vị trí trong module | Chứa gì |
| --- | --- |
| `api.controller` | Nhận/validate HTTP, gọi UseCase interface, mapping response, status/header |
| `api.dto.request` | Request record và Bean Validation |
| `api.dto.response` | Response record, nested API DTO, factory from(result) |
| `api.exception` | Map lỗi module → HTTP/ProblemDetail |
| `application.command` | Command hoặc Query thuần Java |
| `application.result` | Output ứng dụng, factory from(domain), nested application DTO |
| `application.usecase` | Interface hành động, method execute(...) |
| `application.usecase.impl` | Service triển khai interface, điều phối domain/repository/port |
| `application.port` | Interface nhu cầu email/token/password/tích hợp |
| `domain.model/service` | Mô hình, bất biến, quy tắc nghiệp vụ |
| `domain.repository` | Interface truy xuất/lưu domain model |
| `domain.exception` | Mã lỗi và exception thuần Java |
| `infrastructure.config` | Bean, transaction và cấu hình framework |
| `infrastructure.persistence.entity/repository/adapter/mapper` | JPA entity, Spring Data, triển khai repository, chuyển domain ↔ entity |
| `infrastructure.integration/security` | SMTP/JWT/tích hợp/security cụ thể |

- Application/domain không import API/infrastructure; domain không import application. Không dùng Spring/JPA/Servlet/Bean Validation HTTP trong application/domain.
- Controller không gọi domain model/service, repository, JPA entity hoặc service implementation.
- Module chỉ giao tiếp qua contract công khai đã chốt; không import entity/repository/implementation nội bộ của module khác hoặc đưa nghiệp vụ riêng vào shared để lách ranh giới.
- Giữ các module identity/hotel/inventory/pricing/booking/payment/media và shared. Tạo package khi có chức năng, không sinh file rỗng cho đủ sơ đồ.
- Kiểm tra source/test hiện tại để biết module nào đã triển khai; không đoán từ thư mục hoặc README. Không tự thêm ArchUnit/Modulith hoặc tuyên bố tất cả quy tắc đã được CI cưỡng chế.

## 3. Tên, ngôn ngữ và logging

- MUST: `<Action>UseCase`, `<Action>Service`, `<Action>Command`, `<Action>Result`, `<Action>Request`, `<Action>Response`; method `execute`, factory `from`.
- Input đơn ID/email/token có thể truyền trực tiếp; input đọc nhiều trường dùng `<Action>Query` trong application.command, không tạo wrapper chỉ để tăng số lớp.
- SHOULD dùng record cho command/result/DTO; constructor injection, field private final. Service được tạo trong ModuleConfig, không đồng thời đăng ký @Service.
- Entity tên `<Entity>JpaEntity`; Spring Data tên `<Entity>JpaRepository`; adapter mới tên `Jpa<Entity>RepositoryAdapter`; mapper mới dùng hậu tố `PersistenceMapper`.
- Ngoại lệ cũ: `PasswordResetTokenRepositoryAdapter` chưa có tiền tố Jpa; `PasswordResetTokenMapper` chưa có hậu tố PersistenceMapper. Không copy các ngoại lệ cho code mới và không tự rename ngoài nhiệm vụ.
- Message nghiệp vụ/validation và @DisplayName dùng tiếng Việt có dấu; tên Java/package/log kỹ thuật dùng tiếng Anh. Comment giải thích nghiệp vụ/transaction dùng tiếng Việt, không mô tả lại code hiển nhiên. Refactor giữ message contract cũ.
- Logging theo SLF4J LoggerFactory hiện có, dùng placeholder {}; không System.out, không nối chuỗi. DEBUG chẩn đoán, INFO mốc vận hành, WARN side effect thất bại có kiểm soát, ERROR lỗi bất ngờ tại handler; tránh log cùng lỗi nhiều tầng.
- Không log request body, Authorization, password/hash/raw token, link chứa token hoặc secret. Record nhạy cảm che toString(); dùng ID/traceId để đối chiếu.

## 4. HTTP, validation và exception

Luồng bắt buộc: Request/param → Command/input → UseCase → Service → application Result → Response.from(result) → ApiResponse → ResponseEntity.

- Result có dữ liệu thuộc application.result; không trả domain/JPA cho controller, kể cả nested/list/Optional. Logout void giữ nguyên.
- Domain → result nằm trong application; result → response nằm trong API factory. Controller không new Response(...) hoặc tự map danh sách. Factory chỉ chuyển dữ liệu, không I/O/nghiệp vụ.
- Response và nested DTO đều thuộc API, không giữ LoginResult.UserInfo làm field response. Thành công dùng {message,data}; logout giữ ApiResponse<Void>/data null; lỗi dùng ProblemDetail, không bọc ApiResponse.
- Giữ Cache-Control/Pragma của login/refresh và header hiện có của endpoint khác; thời gian serialize qua JacksonConfig chung. PageResponse dùng sau khi map nội dung thành API DTO.
- **Controller hiện tại không dùng @Validated; controller mới không thêm @Validated cấp class.** Body dùng @Valid; constraint trực tiếp trên query/path dùng Spring MVC method validation và handler hiện tại. Không tự chuyển sang AOP validation.
- Query/path khai báo tên rõ ràng; không đổi tên parameter/default khi refactor. LocalDate cho ngày nghiệp vụ; Instant cho thời điểm. Giới hạn lấy từ contract, không tự đoán.
- HTTP kiểm thiếu/sai định dạng; domain/application vẫn bảo vệ bất biến khi use case được gọi ngoài HTTP. Lỗi binding/HTTP constraint → 400; lỗi nghiệp vụ theo code/status module.
- Module mới có `<Module>ErrorCode implements ErrorCode`, gồm `String code()` và `String defaultMessage()`; enum không chứa HttpStatus.
- `<Module>Exception extends RuntimeException` lưu enum, có code() và constructor nhận code/code+message. `<Module>ExceptionHandler` trong api.exception map enum → HttpStatus bằng switch, dùng ProblemDetailFactory. Copy mẫu Identity trong [AgentExamples.md](AgentExamples.md).
- Giữ IdentityException hiện có, không refactor toàn bộ sang DomainException. Controller không catch lỗi nghiệp vụ để dựng response; không nuốt lỗi hoặc đổi mọi lỗi thành 400/500.
- Lỗi security filter đi qua RestAuthenticationEntryPoint/RestAccessDeniedHandler; endpoint public vẫn có thể nhận 401 nếu gửi Bearer token sai.
- Case riêng cho tra cứu phòng trống nằm ở [InventoryAgentExample.md](InventoryAgentExample.md), không phải checklist bắt buộc của mọi API.

## 5. Transaction, persistence và security

- TransactionTemplate nằm trong infrastructure.config.ModuleConfig; bean trả UseCase interface. Không @Transactional ở API/application hoặc tạo transaction wrapper riêng cho từng API.
- Use case chỉ đọc đặt setReadOnly(true), không khóa ghi cho truy vấn thông thường. Các thay đổi cùng hành động nghiệp vụ phải cùng transaction.
- **Ngoại lệ refresh:** commit thu hồi family khi REFRESH_TOKEN_REUSED, rồi mới ném lỗi ra ngoài transaction. Copy RefreshExecution trong IdentityConfig; không ném lỗi này ngay trong callback và không áp dụng ngoại lệ cho mọi lỗi.
- Identity khóa theo thứ tự: scalar query lấy userId không khóa → khóa user → khóa/đọc lại token → kiểm owner/trạng thái/hạn → cập nhật. Lấy now sau khi lấy khóa; không load token sớm thay scalar query.
- Dùng Clock inject/clock.instant(), không Instant.now() trong nghiệp vụ. Giữ phân biệt optimistic version (@Version) và authVersion vô hiệu hóa JWT.
- Email gửi afterCommit trong adapter, không SMTP trong service/controller. EmailQueue hiện không đồng nghĩa durable queue/retry/outbox.
- Domain và JPA model riêng; mapper không chứa nghiệp vụ. Khi update giữ field ngoài thao tác, vai trò/emailVerifiedAt/authVersion/version.
- Migration là file SQL mới V<timestamp>__<description>.sql, version chưa dùng và đúng thứ tự tích hợp. Không sửa/xóa migration đã áp dụng; không repair checksum để che lỗi hoặc đổi ddl-auto validate sang update/create.
- Thêm cột xét dữ liệu cũ/null/default/length/enum/FK/index/unique và mapping Java. UUID cho ID, UTC cho thời điểm; tiền dùng kiểu chính xác theo contract, không float/double.
- Giữ JWT Resource Server/stateless; quyền sở hữu lấy từ principal, matcher đúng method/path. Không permitAll toàn bộ để né lỗi. Reset password giữ tăng authVersion và thu hồi refresh token; token opaque chỉ lưu hash.
- Biến bắt buộc mới phải rà soát env mẫu/test/Compose/smoke CI liên quan. Không đọc/đưa secret thật vào Git/log/câu trả lời.

## 6. Công thức theo loại việc và test

- **Endpoint đọc:** đọc contract → Query/input → Result → UseCase → Service → query/adapter nếu thiếu → bean read-only → Response factory → controller/security → test dữ liệu/lỗi/phân quyền.
- **Endpoint ghi:** đọc contract → hành vi domain/ErrorCode → Command/Result/UseCase → Service → migration/entity/repository/mapper/adapter nếu cần → bean transaction → Request/Response/controller/handler → test thành công/lỗi/concurrency theo rủi ro.
- **Thêm cột DB:** xem migration đã áp dụng/dữ liệu cũ → migration version mới và backfill/default → JpaEntity → domain/result/DTO khi contract yêu cầu → mapper/adapter → test migration với PostgreSQL và dữ liệu cũ.
- **Module mới:** chốt contract/quyền sở hữu → tạo package cho chức năng đầu tiên → ErrorCode/Exception/Handler → một use case xuyên suốt → ModuleConfig → contract tích hợp nếu có → test ranh giới/nghiệp vụ.
- Không tạo lại thành phần dùng được và không tự triển khai API tiếp theo.
- Test Java ở src/test/java, package tương ứng, hậu tố Tests; tên should<Expected>When<Condition>, // Given / // When / // Then, @Nested nhóm hành động, @DisplayName rõ hành động/path.
- Mock bằng MockitoExtension/@Mock; @InjectMocks khi phù hợp. Với Clock/Duration dùng constructor + giá trị thật trong setUp, không mock mọi thứ. Stub theo BDDMockito given/willReturn/willThrow; void dùng willDoNothing/willThrow.
- Fixture chung ở setUp, stub riêng ở case; không lenient để che stub thừa. Test domain/factory thuần không cần Spring/Mockito.
- Controller test phải kiểm JSON/nested/list/null/ngày/status/header/message. Standalone MockMvc không chứng minh security chain/transaction thật; query/lock/migration dùng PostgreSQL/Testcontainers, không H2 thay thế.
- Test tích hợp cần Docker/profile test. Markdown này không tự cưỡng chế rule; chỉ nói có kiểm tra tự động khi source test/CI thực tế làm việc đó và đã có kết quả chạy.

## 7. Sai → Đúng

| Sai | Đúng |
| --- | --- |
| Controller new Response(...) hoặc map từng item | Response.from(result), map item trong factory |
| UseCase trả domain/JPA model | Application Result riêng, kể cả nested/list |
| Response giữ nested application result | Nested API response DTO |
| Controller inject ActionService | Inject ActionUseCase |
| @Service/@Transactional trong application | Bean + TransactionTemplate trong ModuleConfig |
| Instant.now() trong nghiệp vụ | Clock inject → clock.instant() |
| Ném lỗi reused ngay trong callback | Commit revoke family rồi ném ra ngoài |
| Import entity/repository nội bộ module khác | Contract công khai và adapter tích hợp |
| Sửa migration đã chạy | Migration version mới |
| Thêm env bắt buộc chỉ trong dev | Rà soát env mẫu/test/Compose/CI liên quan |

## 8. Checklist bàn giao

Một checklist duy nhất; đánh dấu **Đạt / Không áp dụng / Chưa kiểm chứng** kèm bằng chứng.

- [ ] Interface → Service → Result → Response.from đúng; nested/list không rò domain/application qua HTTP.
- [ ] Transaction/khóa/commit/rollback/afterCommit giữ đúng; ngoại lệ refresh không bị rút gọn.
- [ ] Contract, validation, quyền, secret và migration đã kiểm theo phần sửa; test đúng boundary.
- [ ] Các đường dẫn/mẫu source còn tồn tại; không khẳng định ví dụ đề xuất là implementation.
- [ ] Code thay đổi: format/test phù hợp và verify khi môi trường cho phép. Chỉ sửa Markdown: kiểm nội dung/link/diff, không cần chạy ứng dụng.
- [ ] Giữ .editorconfig: UTF-8/LF, Java 2 spaces, XML 4 spaces, newline cuối file; không format/ghi đè phần ngoài phạm vi.
- [ ] Review diff/check/status; không stage/commit/push ngoài yêu cầu.
- [ ] Báo ngắn tiếng Việt: file sửa, lý do, lệnh/kết quả thực tế, lỗi có sẵn và phần chưa kiểm chứng.
