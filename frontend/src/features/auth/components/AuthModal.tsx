import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CloseOutlined, CompassOutlined } from '@ant-design/icons'
import { ClientLoginForm } from './ClientLoginForm'
import { ClientRegisterForm } from './ClientRegisterForm'

export type AuthModalMode = 'login' | 'register'

export interface AuthModalProps {
  isOpen: boolean
  initialMode?: AuthModalMode
  onClose: () => void
  onSuccess?: (user: unknown) => void
}

export function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const titleId = useId()
  const subtitleId = useId()

  const [mode, setMode] = useState<AuthModalMode>(initialMode)
  const [persistedEmail, setPersistedEmail] = useState('')
  const [mounted, setMounted] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  const cardRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const [formHeight, setFormHeight] = useState<number | undefined>(undefined)
  const [transformOrigin, setTransformOrigin] = useState<string>('center center')

  // Đo chiều cao form để transition mượt mà không bị nhảy
  useEffect(() => {
    if (!mounted || !formContainerRef.current) return
    const el = formContainerRef.current

    const updateHeight = () => {
      if (formContainerRef.current) {
        setFormHeight(formContainerRef.current.offsetHeight)
      }
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mounted, mode])

  // Đồng bộ trạng thái mở modal và mode trực tiếp trong chu kỳ render (tránh cascading render)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setMounted(true)
      setIsClosing(false)
      setMode(initialMode)
    }
  }

  // Ghi nhớ phần tử đang focus và tính transform-origin từ vị trí nút đã nhấn
  useEffect(() => {
    if (isOpen) {
      const trigger = document.activeElement as HTMLElement | null
      previousActiveElement.current = trigger

      if (
        trigger &&
        typeof trigger.getBoundingClientRect === 'function' &&
        trigger !== document.body
      ) {
        const triggerRect = trigger.getBoundingClientRect()
        const triggerCenterX = triggerRect.left + triggerRect.width / 2
        const triggerCenterY = triggerRect.top + triggerRect.height / 2

        const cardWidth =
          cardRef.current?.offsetWidth || Math.min(480, window.innerWidth - 32)
        const cardHeight = cardRef.current?.offsetHeight || 500
        const cardLeft = (window.innerWidth - cardWidth) / 2
        const cardTop = (window.innerHeight - cardHeight) / 2
        const originX = Math.round(triggerCenterX - cardLeft)
        const originY = Math.round(triggerCenterY - cardTop)
        setTransformOrigin(`${originX}px ${originY}px`)
      } else {
        setTransformOrigin('center center')
      }
    }
  }, [isOpen])

  // Quản lý animation đóng mượt mà & unmount đúng thời điểm
  useEffect(() => {
    if (!isOpen && mounted) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        const timer = setTimeout(() => {
          setMounted(false)
          setIsClosing(false)
          previousActiveElement.current?.focus?.()
        }, 100)
        return () => clearTimeout(timer)
      }

      const startTimer = setTimeout(() => {
        setIsClosing(true)
      }, 0)

      const endTimer = setTimeout(() => {
        setMounted(false)
        setIsClosing(false)
        previousActiveElement.current?.focus?.()
      }, 150)

      return () => {
        clearTimeout(startTimer)
        clearTimeout(endTimer)
      }
    }
  }, [isOpen, mounted])

  // Khóa cuộn trang nền khi mở modal và hoàn trả khi đóng
  useEffect(() => {
    if (!mounted || !isOpen) return

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [mounted, isOpen])

  // Xử lý phím Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
        return
      }

      // Focus trap (giữ phím Tab bên trong modal)
      if (e.key === 'Tab' && cardRef.current) {
        const focusableElements = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [isOpen, onClose],
  )

  useEffect(() => {
    if (mounted) {
      window.addEventListener('keydown', handleKeyDown)
      // Tự động focus ô Email khi modal mở ra
      const timer = setTimeout(() => {
        if (cardRef.current) {
          const emailInput = cardRef.current.querySelector<HTMLInputElement>(
            'input[type="email"]',
          )
          if (emailInput) {
            emailInput.focus()
          } else {
            const firstInput = cardRef.current.querySelector<HTMLInputElement>(
              'input:not([disabled])',
            )
            firstInput?.focus()
          }
        }
      }, 50)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        clearTimeout(timer)
      }
    }
  }, [mounted, handleKeyDown])

  if (!mounted) return null

  function handleSwitchMode(nextMode: AuthModalMode, currentEmail?: string) {
    if (currentEmail) {
      setPersistedEmail(currentEmail)
    }
    setMode(nextMode)
  }

  function handleLoginSuccess(user: unknown) {
    onSuccess?.(user)
    onClose()
  }

  return (
    <div
      className={`auth-modal-overlay ${isOpen && !isClosing ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
    >
      {/* Backdrop mờ nền */}
      <div
        className="auth-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Thẻ Modal chính */}
      <div
        className="auth-modal-card"
        ref={cardRef}
        style={{ transformOrigin }}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          className="auth-modal-close-btn"
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập"
        >
          <CloseOutlined />
        </button>

        {/* Nội dung modal */}
        <div className="auth-modal-body">
          {/* Huy hiệu thương hiệu */}
          <div className="auth-modal-brand-badge auth-stagger-item auth-stagger-1">
            <span className="auth-modal-compass" aria-hidden="true">
              <CompassOutlined />
            </span>
            <span className="auth-modal-brand-name">StayHub</span>
          </div>

          {/* Tiêu đề & phụ đề */}
          <div className="auth-modal-head auth-stagger-item auth-stagger-2">
            <h2 className="auth-modal-title" id={titleId}>
              {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
            </h2>
            <p className="auth-modal-subtitle" id={subtitleId}>
              {mode === 'login'
                ? 'Đăng nhập để xem đặt phòng và đồng bộ chỗ nghỉ yêu thích'
                : 'Trở thành thành viên để nhận đặc quyền và ưu đãi lưu trú'}
            </p>
          </div>

          {/* Form đăng nhập hoặc đăng ký với container chuyển đổi chiều cao mượt mà */}
          <div
            className="auth-modal-height-animator"
            style={{ height: formHeight ? `${formHeight}px` : undefined }}
          >
            <div ref={formContainerRef} className="auth-form-slide">
              {mode === 'login' ? (
                <ClientLoginForm
                  key="modal-login-form"
                  defaultEmail={persistedEmail}
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={(email) => handleSwitchMode('register', email)}
                  inModal
                />
              ) : (
                <ClientRegisterForm
                  key="modal-register-form"
                  defaultEmail={persistedEmail}
                  onSwitchToLogin={(email) => handleSwitchMode('login', email)}
                  inModal
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
