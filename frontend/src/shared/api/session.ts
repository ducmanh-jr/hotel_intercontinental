export interface Session {
  accessToken: string
  refreshToken?: string | null
  expiresAt: string
}

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated' | 'restore-error'

let session: Session | null = null
let authStatus: AuthStatus = 'restoring'
let restoreError: unknown = null

const listeners = new Set<() => void>()

export const getSession = () => session
export const getAuthStatus = () => authStatus
export const getRestoreError = () => restoreError

export function setSession(value: Session | null) {
  session = value
  if (value) {
    authStatus = 'authenticated'
    restoreError = null
  } else if (authStatus !== 'restoring' && authStatus !== 'restore-error') {
    authStatus = 'unauthenticated'
  }
  listeners.forEach((listener) => listener())
}

export function setAuthStatus(status: AuthStatus, error?: unknown) {
  authStatus = status
  restoreError = error ?? null
  if (status === 'unauthenticated') {
    session = null
  }
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
