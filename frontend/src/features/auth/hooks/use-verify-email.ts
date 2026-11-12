import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@/shared/api/session'
import {
  clearTokenVerification,
  executeEmailVerification,
  isTokenVerified,
  type VerifyEmailResult,
  type VerifyEmailStatus,
} from '../model/verify-email-state'
import { useAuthLinkToken } from './use-auth-link-token'

export type { VerifyEmailStatus, VerifyEmailResult }

export interface UseVerifyEmailOptions {
  overrideToken?: string
  onSuccess?: (result: VerifyEmailResult) => void
}

export interface VerifyEmailState {
  status: VerifyEmailStatus
  errorMessage: string | null
  isVerifying: boolean
  retry: () => void
  session?: Session | null
}

export function useVerifyEmail(
  optionsOrToken?: string | UseVerifyEmailOptions,
): VerifyEmailState {
  const options =
    typeof optionsOrToken === 'string'
      ? { overrideToken: optionsOrToken }
      : optionsOrToken
  const linkToken = useAuthLinkToken()
  const token = options?.overrideToken !== undefined ? options.overrideToken : linkToken
  const onSuccess = options?.onSuccess

  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  const [status, setStatus] = useState<VerifyEmailStatus>(() => {
    if (!token) return 'missing-token'
    if (isTokenVerified(token)) return 'success'
    return 'verifying'
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [session, setSessionState] = useState<Session | null>(null)

  useEffect(() => {
    if (!token) return

    let active = true
    void executeEmailVerification(token).then((result) => {
      if (!active) return
      setStatus(result.status)
      setErrorMessage(result.errorMessage)
      if (result.session) {
        setSessionState(result.session)
      }
      if (result.status === 'success') {
        onSuccessRef.current?.(result)
      }
    })

    return () => {
      active = false
    }
  }, [token])

  const retry = useCallback(() => {
    if (!token) return
    clearTokenVerification(token)
    setStatus('verifying')
    setErrorMessage(null)
    void executeEmailVerification(token).then((result) => {
      setStatus(result.status)
      setErrorMessage(result.errorMessage)
      if (result.session) {
        setSessionState(result.session)
      }
      if (result.status === 'success') {
        onSuccessRef.current?.(result)
      }
    })
  }, [token])

  return {
    status,
    errorMessage,
    isVerifying: status === 'verifying',
    retry,
    session,
  }
}
