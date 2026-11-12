import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { message } from 'antd'
import { setAuthStatus, setSession } from '@/shared/api/session'
import { queryClient } from '@/shared/lib/query-client'
import { broadcastAuth, VerifyEmailView, type VerifyEmailResult } from '@/features/auth'

export interface VerifyEmailPageProps {
  overrideToken?: string
}

export function VerifyEmailPage({ overrideToken }: VerifyEmailPageProps = {}) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState<number | null>(null)
  const handledRef = useRef(false)
  const redirectedRef = useRef(false)

  const handleSuccess = (result: VerifyEmailResult) => {
    if (handledRef.current) return
    handledRef.current = true

    if (result.session) {
      queryClient.clear()
      setSession(result.session)
      setAuthStatus('authenticated')
      broadcastAuth('SESSION_UPDATED', result.session)
    }

    // Khởi động đếm ngược chuyển về trang chủ trong 3 giây
    setCountdown(3)
  }

  const navigateToHome = useCallback(() => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    void message.success('Xác minh email thành công! Chào mừng bạn đến với StayHub.')
    navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (countdown === null) return

    if (countdown <= 0) {
      navigateToHome()
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, navigateToHome])

  return (
    <VerifyEmailView
      overrideToken={overrideToken}
      countdown={countdown}
      onSuccess={handleSuccess}
      onNavigateHome={navigateToHome}
    />
  )
}
