# Mẫu code chuẩn để agent bắt chước

Đối chiếu source ngày 2026-11-02, nền commit `c39f072`. Đọc file source thật trước khi copy; bảng này là đường dẫn tham chiếu, không phải một implementation khác cần duy trì.

## 1. Vertical slice Register — nguồn copy cho từng lớp

| Thành phần | Copy cấu trúc từ file thật |
| --- | --- |
| UseCase interface | [RegisterUseCase.java](src/main/java/com/team/hotelbooking/identity/application/usecase/RegisterUseCase.java) |
| Service | [RegisterService.java](src/main/java/com/team/hotelbooking/identity/application/usecase/impl/RegisterService.java) |
| Command | [RegisterCommand.java](src/main/java/com/team/hotelbooking/identity/application/command/RegisterCommand.java) |
| Result và from(domain) | [RegisterResult.java](src/main/java/com/team/hotelbooking/identity/application/result/RegisterResult.java) |
| Request và validation | [RegisterRequest.java](src/main/java/com/team/hotelbooking/identity/api/dto/request/RegisterRequest.java) |
| Response và from(result) | [RegisterResponse.java](src/main/java/com/team/hotelbooking/identity/api/dto/response/RegisterResponse.java) |
| Controller | Method register trong [AuthController.java](src/main/java/com/team/hotelbooking/identity/api/controller/AuthController.java) |
| Wiring/transaction | Method registerUseCase trong [IdentityConfig.java](src/main/java/com/team/hotelbooking/identity/infrastructure/config/IdentityConfig.java) |
| Domain model | [User.java](src/main/java/com/team/hotelbooking/identity/domain/model/User.java) |
| Domain repository | [UserRepository.java](src/main/java/com/team/hotelbooking/identity/domain/repository/UserRepository.java) |
| JpaEntity | [UserJpaEntity.java](src/main/java/com/team/hotelbooking/identity/infrastructure/persistence/entity/UserJpaEntity.java) |
| Spring Data repository | [UserJpaRepository.java](src/main/java/com/team/hotelbooking/identity/infrastructure/persistence/repository/UserJpaRepository.java) |
| Repository adapter | [JpaUserRepositoryAdapter.java](src/main/java/com/team/hotelbooking/identity/infrastructure/persistence/adapter/JpaUserRepositoryAdapter.java) |
| Persistence mapper | [UserPersistenceMapper.java](src/main/java/com/team/hotelbooking/identity/infrastructure/persistence/mapper/UserPersistenceMapper.java) |
| ErrorCode contract | [ErrorCode.java](src/main/java/com/team/hotelbooking/shared/exception/ErrorCode.java) |
| Enum mã lỗi | [IdentityErrorCode.java](src/main/java/com/team/hotelbooking/identity/domain/exception/IdentityErrorCode.java) |
| Exception | [IdentityException.java](src/main/java/com/team/hotelbooking/identity/domain/exception/IdentityException.java) |
| HTTP exception handler | [IdentityExceptionHandler.java](src/main/java/com/team/hotelbooking/identity/api/exception/IdentityExceptionHandler.java) |
| Test HTTP hoàn chỉnh | Nhóm RegisterApiTests trong [AuthControllerResponseTests.java](src/test/java/com/team/hotelbooking/identity/api/controller/AuthControllerResponseTests.java) |

Không copy riêng user entity rồi bỏ vai trò/token/email của registration. Đọc Service và Config để hiểu toàn bộ transaction. Khi viết chức năng khác chỉ tạo thành phần thực sự cần.

## 2. Mẫu Controller và mapping

Copy từ method register của AuthController và factory RegisterResponse trong bảng trên; đây là đoạn trích, không phải controller đầy đủ:

```java
RegisterResult result =
    registerUseCase.execute(
        new RegisterCommand(
            request.email(), request.password(), request.fullName(), request.phone()));

RegisterResponse response = RegisterResponse.from(result);

return ResponseEntity.status(HttpStatus.CREATED)
    .body(ApiResponse.success("Đăng ký thành công.", response));
```

Factory copy từ RegisterResponse; domain → result copy riêng từ RegisterResult:

```java
public static RegisterResponse from(RegisterResult result) {
  return new RegisterResponse(
      result.id(), result.email(), result.fullName(), result.phone(),
      result.status(), result.emailVerified(), result.version());
}
```

Với nested DTO, copy [LoginResponse.java](src/main/java/com/team/hotelbooking/identity/api/dto/response/LoginResponse.java); không dùng LoginResult.UserInfo làm kiểu field của response.

## 3. Transaction ghi, đọc và ngoại lệ refresh

Nguồn copy cho cả ba: [IdentityConfig.java](src/main/java/com/team/hotelbooking/identity/infrastructure/config/IdentityConfig.java). Các đoạn trích dưới được đặt bên trong bean config; không đưa vào application service.

### Ghi — registerUseCase

```java
RegisterService service =
    new RegisterService(
        users, tokens, passwords, opaqueTokens, emails, clock, Duration.parse(ttl));
TransactionTemplate transaction = new TransactionTemplate(transactionManager);
return command ->
    Objects.requireNonNull(transaction.execute(status -> service.execute(command)));
```

Bean có kiểu trả về RegisterUseCase; Spring cung cấp dependency qua tham số method @Bean. Không thêm @Service vào RegisterService.

### Chỉ đọc — getCurrentUserUseCase

Copy method getCurrentUserUseCase cùng constructor [GetCurrentUserService.java](src/main/java/com/team/hotelbooking/identity/application/usecase/impl/GetCurrentUserService.java):

```java
@Bean
public GetCurrentUserUseCase getCurrentUserUseCase(
    UserRepository userRepository, PlatformTransactionManager transactionManager) {
  GetCurrentUserService service = new GetCurrentUserService(userRepository);
  TransactionTemplate transaction = new TransactionTemplate(transactionManager);
  transaction.setReadOnly(true);
  return userId -> Objects.requireNonNull(transaction.execute(status -> service.execute(userId)));
}
```

### Refresh — commit revoke trước khi ném lỗi

Copy **toàn bộ** method refreshTokenUseCase và record RefreshExecution trong IdentityConfig; nghiệp vụ nằm ở [RefreshTokenService.java](src/main/java/com/team/hotelbooking/identity/application/usecase/impl/RefreshTokenService.java). Mẫu rút gọn dưới chỉ minh họa phần điều khiển transaction:

```java
RefreshExecution execution = Objects.requireNonNull(transaction.execute(status -> {
  try {
    return new RefreshExecution(service.execute(rawToken), null);
  } catch (IdentityException error) {
    if (error.code() == IdentityErrorCode.REFRESH_TOKEN_REUSED) {
      return new RefreshExecution(null, error); // Cho phép commit việc thu hồi family.
    }
    throw error; // Lỗi khác vẫn rollback.
  }
}));
if (execution.error() != null) {
  throw execution.error(); // Transaction của luồng API hiện tại đã commit.
}
return execution.result();
```

Không đổi thành transaction.execute(status -> service.execute(rawToken)) cho refresh và không dùng mẫu đặc biệt này cho mọi lỗi của API khác.

## 4. Module mới: mẫu lỗi phải theo

Nguồn copy: ErrorCode/IdentityErrorCode/IdentityException/IdentityExceptionHandler ở bảng Register.

```java
// Contract chung đã có; không tạo lại ở từng module.
public interface ErrorCode {
  String code();
  String defaultMessage();
}
```

Đổi tiền tố Identity thành tên module khi tạo bộ lỗi mới. Enum implements ErrorCode; exception extends RuntimeException giữ enum/code(); handler đặt ở api.exception, dùng @ExceptionHandler cho exception của module và switch code sang HttpStatus, rồi gọi ProblemDetailFactory. Không đặt HttpStatus vào enum và không đổi global handler để che lỗi.

## 5. Một file test mẫu hoàn chỉnh

Copy quy ước Given/When/Then, BDDMockito, @Nested từ [AuthControllerResponseTests.java](src/test/java/com/team/hotelbooking/identity/api/controller/AuthControllerResponseTests.java); constructor và hành vi từ [RegisterService.java](src/main/java/com/team/hotelbooking/identity/application/usecase/impl/RegisterService.java).

Đây là mẫu tài liệu cho RegisterServiceTests, chưa tự tạo file Java trong repo. Dùng constructor trong setUp vì Clock và Duration phải là giá trị thật, không ép @InjectMocks rồi để dependency null. Khi thêm test thật, đối chiếu constructor/source mới nhất và chạy test.

```java
package com.team.hotelbooking.identity.application.usecase.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.team.hotelbooking.identity.application.command.RegisterCommand;
import com.team.hotelbooking.identity.application.port.OpaqueTokens;
import com.team.hotelbooking.identity.application.port.PasswordHasher;
import com.team.hotelbooking.identity.application.port.VerificationEmailQueue;
import com.team.hotelbooking.identity.application.result.RegisterResult;
import com.team.hotelbooking.identity.domain.exception.IdentityErrorCode;
import com.team.hotelbooking.identity.domain.exception.IdentityException;
import com.team.hotelbooking.identity.domain.model.User;
import com.team.hotelbooking.identity.domain.repository.UserRepository;
import com.team.hotelbooking.identity.domain.repository.VerificationTokenRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("Đăng ký tài khoản")
class RegisterServiceTests {
  @Mock UserRepository users;
  @Mock VerificationTokenRepository tokens;
  @Mock PasswordHasher passwords;
  @Mock OpaqueTokens opaqueTokens;
  @Mock VerificationEmailQueue emails;

  private RegisterService service;
  private RegisterCommand command;

  @BeforeEach
  void setUp() {
    Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
    service = new RegisterService(
        users, tokens, passwords, opaqueTokens, emails, clock, Duration.ofHours(24));
    command = new RegisterCommand(
        "USER@example.com", "very-long-password-2026", "Nguyễn Văn A", "0912345678");
  }

  @Nested
  @DisplayName("RegisterUseCase.execute")
  class RegisterTests {
    @Test
    void shouldReturnPendingUserWhenRegistrationSucceeds() {
      // Given
      given(passwords.hash("very-long-password-2026")).willReturn("encoded-password");
      given(users.add(any(User.class))).willAnswer(invocation -> invocation.getArgument(0));
      given(opaqueTokens.generate())
          .willReturn(new OpaqueTokens.IssuedToken("raw-token", "token-hash"));

      // When
      RegisterResult result = service.execute(command);

      // Then
      assertNotNull(result.id());
      assertEquals("user@example.com", result.email());
      assertEquals("+84912345678", result.phone());
      assertEquals("pending", result.status());
      assertFalse(result.emailVerified());
    }

    @Test
    void shouldRejectRegistrationWhenEmailAlreadyExists() {
      // Given
      given(users.existsByEmail("user@example.com")).willReturn(true);

      // When
      IdentityException error =
          assertThrows(IdentityException.class, () -> service.execute(command));

      // Then
      assertEquals(IdentityErrorCode.EMAIL_ALREADY_USED, error.code());
    }
  }
}
```

Test mẫu kiểm hành vi use case, không chứng minh transaction/DB/SMTP thật. Với HTTP mapping, copy bộ test controller thật ở bảng trên thay vì chỉ gọi trực tiếp controller.
