import { useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { loginRequestSchema, type LoginRequest } from '../api/auth-contracts'
import { useAuthAction } from '../hooks/use-auth-action'

export function AdminLoginForm() {
  const id = useId()
  const inFlight = useRef(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [remember, setRemember] = useState(false)
  const mutation = useAuthAction('login')
  const { control, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  })
  const busy = isSubmitting || mutation.isPending

  async function submit(values: LoginRequest) {
    if (inFlight.current) return
    inFlight.current = true
    try {
      await mutation.mutateAsync({ ...values, rememberMe: remember })
      resetField('password')
    } catch (error) {
      applyApiFieldErrors(error, setError, ['email', 'password'])
    } finally {
      inFlight.current = false
    }
  }

  return (
    <form
      className="flex flex-col gap-5 w-full"
      onSubmit={(event) => { void handleSubmit(submit)(event) }}
      noValidate
      aria-busy={busy}
    >
      {/* Email field */}
      <div className="flex flex-col gap-1.5 group">
        <label
          htmlFor={`${id}-email`}
          className={`admin-field-label ${errors.email ? 'is-error' : ''}`}
        >
          Email
        </label>
        <div className={`relative border-b transition-colors ${errors.email ? 'border-warm-danger' : 'border-warm-border-strong focus-within:border-warm-accent'}`}>
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
                disabled={busy}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                className="admin-field-input disabled:opacity-50"
              />
            )}
          />
          <div
            className={`absolute right-0 bottom-[-1px] left-0 h-[2px] pointer-events-none origin-left transition-transform duration-[260ms] ease-[cubic-bezier(.16,1,.3,1)] ${
              errors.email
                ? 'bg-warm-danger scale-x-100'
                : 'bg-warm-accent scale-x-0 group-focus-within:scale-x-100'
            }`}
          />
        </div>
        <div className="min-h-[18px]">
          {errors.email && (
            <p className="m-0 text-xs leading-[18px] text-warm-danger" id={`${id}-email-error`} role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Password field */}
      <div className="flex flex-col gap-1.5 group">
        <label
          htmlFor={`${id}-password`}
          className={`admin-field-label ${errors.password ? 'is-error' : ''}`}
        >
          Mật khẩu
        </label>
        <div className={`relative border-b transition-colors ${errors.password ? 'border-warm-danger' : 'border-warm-border-strong focus-within:border-warm-accent'}`}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id={`${id}-password`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={busy}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={`${id}-password-error ${id}-caps-hint`}
                onKeyDown={(e) => {
                  if (typeof e.getModifierState === 'function') {
                    setCapsLock(e.getModifierState('CapsLock'))
                  }
                }}
                onKeyUp={(e) => {
                  if (typeof e.getModifierState === 'function') {
                    setCapsLock(e.getModifierState('CapsLock'))
                  }
                }}
                onBlur={() => setCapsLock(false)}
                className="admin-field-input pr-[52px] disabled:opacity-50"
              />
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={busy}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
            className="absolute right-[-4px] bottom-[3px] grid place-items-center w-10 h-10 p-0 border-0 rounded-md bg-transparent text-warm-muted hover:text-warm-accent transition-colors cursor-pointer"
          >
            {showPassword ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.7A10.5 10.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.1 3.8" />
                <path d="M6.5 6.5A17.3 17.3 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.3 3.3-.7" />
              </svg>
            )}
          </button>
          <div
            className={`absolute right-0 bottom-[-1px] left-0 h-[2px] pointer-events-none origin-left transition-transform duration-[260ms] ease-[cubic-bezier(.16,1,.3,1)] ${
              errors.password
                ? 'bg-warm-danger scale-x-100'
                : 'bg-warm-accent scale-x-0 group-focus-within:scale-x-100'
            }`}
          />
        </div>
        <div className="min-h-[18px] flex flex-col gap-0.5">
          {capsLock && (
            <p className="m-0 text-xs leading-[18px] text-[#82501c] italic" id={`${id}-caps-hint`}>
              Caps Lock đang bật.
            </p>
          )}
          {errors.password && (
            <p className="m-0 text-xs leading-[18px] text-warm-danger" id={`${id}-password-error`} role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      {/* Row: Remember me + Forgot password */}
      <div className="flex items-center justify-between gap-2 flex-wrap -mt-1">
        <label className="inline-flex items-center gap-2.5 min-h-[44px] py-1 cursor-pointer select-none">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={busy}
            className="w-[18px] h-[18px] m-0 border border-warm-border-strong rounded-[2px] bg-transparent text-warm-accent focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#9b5b32]"
          />
          <span className="admin-remember-label">Ghi nhớ đăng nhập</span>
        </label>
        <Link
          to="/forgot-password"
          className="admin-link-btn ml-auto py-2.5"
        >
          Quên mật khẩu?
        </Link>
      </div>

      {/* Server error alert */}
      {mutation.isError && (
        <div
          className="p-3 border border-warm-danger/30 rounded-[8px] bg-warm-surface flex items-center gap-2.5 text-warm-danger text-sm"
          role="alert"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-snug">{errorMessage(mutation.error)}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={busy}
        className="admin-primary-btn group shadow-sm disabled:cursor-wait"
      >
        {busy ? (
          <div className="w-full flex items-center justify-center gap-2.5">
            <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" aria-hidden="true" />
            <span>Đang xác thực…</span>
          </div>
        ) : (
          <>
            <span>Đăng nhập</span>
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-[3px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12h16" />
              <path d="m14 6 6 6-6 6" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
