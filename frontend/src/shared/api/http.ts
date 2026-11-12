import { getSession } from './session'
import { env } from '@/shared/config/env'
import { createHttpClient } from './client'

let tokenRefresher: (() => Promise<string | null>) | undefined

export function setTokenRefresher(refresher: () => Promise<string | null>) {
  tokenRefresher = refresher
}

export const http = createHttpClient({
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
  getAccessToken: () => getSession()?.accessToken,
  onRefreshToken: () => (tokenRefresher ? tokenRefresher() : Promise.resolve(null)),
})
