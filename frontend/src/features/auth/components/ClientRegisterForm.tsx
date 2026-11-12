import { useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LoadingOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { registerRequestSchema, type RegisterRequest } from '../api/auth-contracts'
import { useAuthAction } from '../hooks/use-auth-action'

export interface ClientRegisterFormProps {
  defaultEmail?: string
  onSuccess?: (registeredEmail: string) => void
  onSwitchToLogin?: (currentEmail?: string) => void
  inModal?: boolean
}

export function ClientRegisterForm({
  defaultEmail = '',
  onSuccess,
  onSwitchToLogin,
}: ClientRegisterFormProps) {
  const id = useId()
  const inFlight = useRef(false)

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  const mutation = useAuthAction('register')
  const {
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      fullName: '',
      email: defaultEmail,
      phone: '',
      password: '',
    },
  })

  const busy = isSubmitting || mutation.isPending

  async function onSubmit(values: RegisterRequest) {
    if (inFlight.current) return
    inFlight.current = true
    setApiError(null)

    try {
      await mutation.mutateAsync(values)
      // Đăng ký thành công: hiển thị hướng dẫn xác thực email theo luồng BE
      setRegisteredEmail(values.email)
      onSuccess?.(values.email)
    } catch (error) {
      const applied = applyApiFieldErrors(error, setError, [
        'fullName',
        'email',
        'phone',
        'password',
      ])
      if (applied === 0) {
        setApiError(
          errorMessage(error) ||
            'Không thể đăng ký tài khoản lúc này. Vui lòng thử lại sau.',
        )
      }
    } finally {
      inFlight.current = false
    }
  }

  function handleSwitchLogin() {
    const currentEmail = getValues('email')
    onSwitchToLogin?.(currentEmail)
  }

  // Màn hình thông báo xác minh email khi đăng ký thành công
  if (registeredEmail) {
    return (
      <div className="auth-form-slide auth-success-card" role="region" aria-live="polite">
        <div className="auth-success-icon-wrap" aria-hidden="true">
          <CheckCircleOutlined />
        </div>
        <h3 className="auth-success-title">Kiểm tra hộp thư của bạn</h3>
        <p className="auth-success-desc">
          StayHub đã gửi liên kết xác thực tới hòm thư{' '}
          <strong>{registeredEmail}</strong>.<br />
          Vui lòng mở thư và nhấp vào liên kết để kích hoạt tài khoản của bạn
          trước khi đăng nhập.
        </p>
        <p className="text-xs text-[var(--muted)] mb-5">
          Nếu chưa thấy thư, bạn vui lòng kiểm tra kỹ mục <em>Spam / Thư rác</em>.
        </p>
        <button
          type="button"
          className="auth-btn-primary"
          onClick={() => onSwitchToLogin?.(registeredEmail)}
        >
          <span>Đến form đăng nhập</span>
          <ArrowRightOutlined />
        </button>
      </div>
    )
  }

  return (
    <form
      className="auth-form-slide flex flex-col gap-3.5 w-full"
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      noValidate
      aria-busy={busy}
    >
      {apiError && (
        <div className="auth-alert-box" role="alert">
          <WarningOutlined className="mt-0.5 shrink-0 text-base" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Full Name Field */}
      <div className="auth-field-group auth-stagger-item auth-stagger-3">
        <label htmlFor={`${id}-fullName`} className="auth-field-label">
          Họ và tên
        </label>
        <div className="auth-input-container">
          <span className="auth-input-icon" aria-hidden="true">
            <UserOutlined />
          </span>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id={`${id}-fullName`}
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                disabled={busy}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? `${id}-fullName-error` : undefined
                }
                className={`auth-input ${errors.fullName ? 'is-invalid' : ''}`}
              />
            )}
          />
        </div>
        {errors.fullName && (
          <p
            className="auth-field-error"
            id={`${id}-fullName-error`}
            role="alert"
          >
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="auth-field-group auth-stagger-item auth-stagger-3">
        <label htmlFor={`${id}-email`} className="auth-field-label">
          Email
        </label>
        <div className="auth-input-container">
          <span className="auth-input-icon" aria-hidden="true">
            <MailOutlined />
          </span>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="ten@example.com"
                disabled={busy}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
              />
            )}
          />
        </div>
        {errors.email && (
          <p className="auth-field-error" id={`${id}-email-error`} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone Field */}
      <div className="auth-field-group auth-stagger-item auth-stagger-4">
        <label htmlFor={`${id}-phone`} className="auth-field-label">
          Số điện thoại
        </label>
        <div className="auth-input-container">
          <span className="auth-input-icon" aria-hidden="true">
            <PhoneOutlined />
          </span>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id={`${id}-phone`}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="0912 345 678"
                disabled={busy}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
                className={`auth-input ${errors.phone ? 'is-invalid' : ''}`}
              />
            )}
          />
        </div>
        {errors.phone && (
          <p className="auth-field-error" id={`${id}-phone-error`} role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="auth-field-group auth-stagger-item auth-stagger-4">
        <label htmlFor={`${id}-password`} className="auth-field-label">
          Mật khẩu
        </label>
        <div className="auth-input-container">
          <span className="auth-input-icon" aria-hidden="true">
            <LockOutlined />
          </span>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id={`${id}-password`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Tối thiểu 15 ký tự"
                disabled={busy}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? `${id}-password-error`
                    : `${id}-password-hint`
                }
                className={`auth-input has-toggle ${errors.password ? 'is-invalid' : ''}`}
              />
            )}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={0}
          >
            <span
              key={showPassword ? 'pwd-hidden' : 'pwd-visible'}
              className="auth-toggle-pwd-icon"
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          </button>
        </div>
        <p className="auth-field-hint" id={`${id}-password-hint`}>
          Mật khẩu cần tối thiểu 15 ký tự theo quy định bảo mật hệ thống.
        </p>
        {errors.password && (
          <p
            className="auth-field-error"
            id={`${id}-password-error`}
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button & Switch Line */}
      <div className="auth-stagger-item auth-stagger-5 flex flex-col w-full">
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={busy}
          aria-disabled={busy}
        >
          {busy ? (
            <>
              <LoadingOutlined />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký</span>
              <ArrowRightOutlined />
            </>
          )}
        </button>

        {/* Switch to Login */}
        <div className="auth-switch-line">
          <span>Đã có tài khoản?</span>
          <button
            type="button"
            className="auth-switch-btn"
            onClick={handleSwitchLogin}
            disabled={busy}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </form>
  )
}
