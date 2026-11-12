import { z } from 'zod'

const publicEnvSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).max(80).default('Hotel Booking'),
  VITE_API_BASE_URL: z.string()
    .regex(/^\/api(?:\/[a-zA-Z0-9_-]+)*\/?$/, 'API base phải là đường dẫn cùng origin, ví dụ /api/v1.')
    .default('/api/v1'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
})

export function parsePublicEnv(input: Record<string, unknown>) {
  const result = publicEnvSchema.safeParse(input)
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error('Cấu hình môi trường không hợp lệ: ' + fields + '. Kiểm tra .env.example.')
  }
  return Object.freeze({
    appName: result.data.VITE_APP_NAME,
    apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/$/, ''),
    apiTimeoutMs: result.data.VITE_API_TIMEOUT_MS,
  })
}

export function parseProxyTarget(value: string | undefined) {
  const target = new URL(value || 'http://localhost:8080')
  if (!['http:', 'https:'].includes(target.protocol)
    || target.username || target.password || target.search || target.hash
    || target.pathname !== '/') {
    throw new Error('API_PROXY_TARGET phải là HTTP(S) origin, ví dụ http://localhost:8080.')
  }
  return target.origin
}
