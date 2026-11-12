import { useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  ArrowRightOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LoadingOutlined,
  LockOutlined,
  MailOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { loginRequestSchema, type LoginRequest } from '../api/auth-contracts'
import { useAuthAction } from '../hooks/use-auth-action'
import { sanitizeReturnTo } from '../model/sanitize-return-to'

export interface ClientLoginFormProps {
  defaultEmail?: string
  onSuccess?: (user: unknown) => void
  onSwitchToRegister?: (currentEmail?: string) => void
  inModal?: boolean
}

export function ClientLoginForm({
  defaultEmail = '',
  onSuccess,
  onSwitchToRegister,
}: ClientLoginFormProps) {
  const id = useId()
  const inFlight = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const mutation = useAuthAction('login')
  const {
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: defaultEmail, password: '' },
  })

  const busy = isSubmitting || mutation.isPending

  async function onSubmit(values: LoginRequest) {
    if (inFlight.current) return
    inFlight.current = true
    setApiError(null)

    try {
      const result = await mutation.mutateAsync({ ...values, rememberMe })

      // Xử lý returnTo nếu có
      const rawReturnTo =
        (location.state as { from?: string } | null)?.from ??
        searchParams.get('returnTo')
      const returnTo = sanitizeReturnTo(rawReturnTo)

      onSuccess?.(result)

      if (returnTo && returnTo !== location.pathname) {
        navigate(returnTo, { replace: true })
      }
    } catch (error) {
      const applied = applyApiFieldErrors(error, setError, ['email', 'password'])
      if (applied === 0) {
        setApiError(
          errorMessage(error) ||
            'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.',
        )
      }
    } finally {
      inFlight.current = false
    }
  }

  function handleSwitchRegister() {
    const currentEmail = getValues('email')
    onSwitchToRegister?.(currentEmail)
  }

  return (
    <form
      className="auth-form-slide flex flex-col gap-4 w-full"
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
                autoComplete="username"
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
                autoComplete="current-password"
                placeholder="••••••••••••"
                disabled={busy}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? `${id}-password-error` : undefined
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

      {/* Remember me & Forgot password */}
      <div className="auth-stagger-item auth-stagger-4 flex items-center justify-between gap-2 -mt-1 select-none">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--color-ink-muted)]">
          <input
            type="checkbox"
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={busy}
            className="w-4 h-4 rounded cursor-pointer accent-[#9b5b32]"
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          Quên mật khẩu?
        </Link>
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
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRightOutlined />
            </>
          )}
        </button>

        {/* Switch to Register */}
        <div className="auth-switch-line">
          <span>Chưa có tài khoản?</span>
          <button
            type="button"
            className="auth-switch-btn"
            onClick={handleSwitchRegister}
            disabled={busy}
          >
            Đăng ký
          </button>
        </div>
      </div>
    </form>
  )
}
