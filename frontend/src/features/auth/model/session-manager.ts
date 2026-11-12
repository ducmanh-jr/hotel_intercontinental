import { setAuthStatus, setSession, type Session } from '@/shared/api/session'
import { ApiError } from '@/shared/api/api-error'
import { queryClient } from '@/shared/lib/query-client'
import { setTokenRefresher } from '@/shared/api/http'
import { refreshSession } from '../api/auth-api'
import { loginResponseSchema } from '../api/auth-contracts'

const CHANNEL_NAME = 'stayhub_auth_channel'
let channel: BroadcastChannel | null = null

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<{ type?: string; session?: Session }>) => {
      if (event.data?.type === 'SESSION_UPDATED' && event.data?.session) {
        setSession(event.data.session)
      } else if (event.data?.type === 'LOGOUT') {
        setSession(null)
        setAuthStatus('unauthenticated')
        queryClient.clear()
      }
    }
  } catch {
    channel = null
  }
}

export function broadcastAuth(type: 'SESSION_UPDATED' | 'LOGOUT', session?: Session | null) {
  try {
    channel?.postMessage({ type, session })
  } catch {
    // Ignore broadcast errors
  }
}

let restoreInFlight: Promise<Session | null> | null = null
let refreshInFlight: Promise<string | null> | null = null
let logoutRequested = false

export function markLogoutRequested() {
  logoutRequested = true
}

export async function restoreSession(): Promise<Session | null> {
  if (restoreInFlight) {
    return restoreInFlight
  }

  logoutRequested = false
  setAuthStatus('restoring')

  restoreInFlight = (async () => {
    try {
      const response = await refreshSession()
      const parsed = loginResponseSchema.parse(response)

      if (logoutRequested) {
        setSession(null)
        setAuthStatus('unauthenticated')
        return null
      }

      const newSession: Session = {
        accessToken: parsed.accessToken,
        expiresAt: parsed.expiresAt,
      }
      setSession(newSession)
      broadcastAuth('SESSION_UPDATED', newSession)
      return newSession
    } catch (err) {
      if (logoutRequested) {
        setSession(null)
        setAuthStatus('unauthenticated')
        return null
      }

      if (err instanceof ApiError) {
        if (
          err.status === 401 ||
          err.code === 'INVALID_REFRESH_TOKEN' ||
          err.code === 'AUTH_REQUIRED'
        ) {
          setSession(null)
          setAuthStatus('unauthenticated')
          return null
        }
        if (
          err.kind === 'network' ||
          err.kind === 'timeout' ||
          (err.status !== undefined && err.status >= 500)
        ) {
          setAuthStatus('restore-error', err)
          return null
        }
      }
      setSession(null)
      setAuthStatus('unauthenticated')
      return null
    } finally {
      restoreInFlight = null
    }
  })()

  return restoreInFlight
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      const response = await refreshSession()
      const parsed = loginResponseSchema.parse(response)

      const newSession: Session = {
        accessToken: parsed.accessToken,
        expiresAt: parsed.expiresAt,
      }
      setSession(newSession)
      broadcastAuth('SESSION_UPDATED', newSession)
      return parsed.accessToken
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.code === 'INVALID_REFRESH_TOKEN')
      ) {
        setSession(null)
        setAuthStatus('unauthenticated')
        queryClient.clear()
        broadcastAuth('LOGOUT')
      }
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

// Register token refresher into HTTP client
setTokenRefresher(refreshAccessToken)

// Automatically initiate session restore on startup in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void restoreSession()
}
