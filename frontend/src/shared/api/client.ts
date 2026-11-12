import type { ZodType } from 'zod'
import { ApiError } from './api-error'
import type { ApiProblem, FieldError } from './types'

interface ClientConfig {
  baseUrl: string
  timeoutMs: number
  fetcher?: typeof fetch
  getAccessToken?: () => string | undefined
  onRefreshToken?: () => Promise<string | null>
}

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  timeoutMs?: number
  schema?: ZodType<T>
  _retryCount?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function problemFrom(payload: unknown): ApiProblem {
  if (!isRecord(payload)) return {}
  const errors: FieldError[] = Array.isArray(payload.errors)
    ? payload.errors.filter((item): item is FieldError =>
        isRecord(item) && typeof item.field === 'string' && typeof item.message === 'string')
    : []
  return {
    detail: typeof payload.detail === 'string' ? payload.detail : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined,
    traceId: typeof payload.traceId === 'string' ? payload.traceId : undefined,
    errors,
  }
}

function fallbackMessage(status: number) {
  switch (status) {
    case 401: return 'Bạn cần đăng nhập để tiếp tục.'
    case 403: return 'Bạn không có quyền thực hiện thao tác này.'
    case 404: return 'Không tìm thấy dữ liệu yêu cầu.'
    case 409: return 'Dữ liệu đã thay đổi. Vui lòng tải lại.'
    case 422: return 'Yêu cầu không đáp ứng quy tắc nghiệp vụ.'
    default: return status >= 500
      ? 'Dịch vụ tạm thời không phản hồi. Vui lòng thử lại.'
      : 'Không thể hoàn tất yêu cầu. Vui lòng kiểm tra dữ liệu.'
  }
}

function invalidResponse(status: number) {
  return new ApiError('Dữ liệu trả về không đúng định dạng đã thống nhất.', {
    kind: 'invalid-response', status, code: 'INVALID_RESPONSE',
  })
}

function getXsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

export function createHttpClient(config: ClientConfig) {
  const fetcher = config.fetcher ?? globalThis.fetch.bind(globalThis)

  async function send<T>(path: string, options: RequestOptions<T>, raw: boolean): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
      throw new Error('HTTP client chỉ nhận path bắt đầu bằng một dấu /, không nhận URL bên ngoài.')
    }
    const url = raw ? path : config.baseUrl.replace(/\/$/, '') + path
    const controller = new AbortController()
    let timedOut = false
    const abort = () => controller.abort(options.signal?.reason)

    if (options.signal?.aborted) {
      throw options.signal.reason ?? new DOMException('Đã hủy yêu cầu.', 'AbortError')
    }
    options.signal?.addEventListener('abort', abort, { once: true })

    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, options.timeoutMs ?? config.timeoutMs)

    try {
      const headers = new Headers(options.headers)
      const token = config.getAccessToken?.()
      if (!raw && !path.startsWith('/auth/') && token) headers.set('Authorization', 'Bearer ' + token)
      if (path === '/auth/logout' && token) headers.set('Authorization', 'Bearer ' + token)
      if (!headers.has('Accept')) headers.set('Accept', 'application/json')
      if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest')
      const xsrfToken = getXsrfToken()
      if (xsrfToken && !headers.has('X-XSRF-TOKEN')) headers.set('X-XSRF-TOKEN', xsrfToken)

      const multipart = options.body instanceof FormData
      if (options.body !== undefined && !multipart && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      const response = await fetcher(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined
          ? undefined
          : multipart ? options.body as FormData : JSON.stringify(options.body),
        signal: controller.signal,
        credentials: 'same-origin',
      })

      let payload: unknown
      if (response.status !== 204) {
        const text = await response.text()
        if (text) {
          try {
            payload = JSON.parse(text) as unknown
          } catch {
            if (response.ok) throw invalidResponse(response.status)
          }
        }
      }

      if (!response.ok) {
        if (
          response.status === 401 &&
          !path.startsWith('/auth/') &&
          config.onRefreshToken &&
          (options._retryCount ?? 0) < 1
        ) {
          try {
            const newToken = await config.onRefreshToken()
            if (newToken) {
              return await send(
                path,
                { ...options, _retryCount: (options._retryCount ?? 0) + 1 },
                raw,
              )
            }
          } catch {
            // Refresh failed or revoked; fall through to throw original ApiError
          }
        }

        const problem = problemFrom(payload)
        throw new ApiError(
          response.status < 500 && problem.detail ? problem.detail : fallbackMessage(response.status),
          { kind: 'http', status: response.status, code: problem.code,
            traceId: problem.traceId, errors: problem.errors },
        )
      }

      if (response.status === 204) return undefined as T

      let data: unknown = payload
      if (!raw) {
        if (!isRecord(payload) || typeof payload.message !== 'string'
          || !Object.hasOwn(payload, 'data')) {
          throw invalidResponse(response.status)
        }
        data = payload.data
      }

      if (options.schema) {
        const parsed = options.schema.safeParse(data)
        if (!parsed.success) throw invalidResponse(response.status)
        return parsed.data
      }
      return data as T
    } catch (error) {
      if (options.signal?.aborted) throw error
      if (timedOut) {
        throw new ApiError('Yêu cầu quá thời gian chờ. Vui lòng thử lại.', {
          kind: 'timeout', code: 'REQUEST_TIMEOUT',
        })
      }
      if (error instanceof ApiError) throw error
      throw new ApiError('Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.', {
        kind: 'network', code: 'NETWORK_ERROR',
      })
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', abort)
    }
  }

  return {
    /** Business API: request('/hotels') -> /api/v1/hotels; unwrap {message,data}. */
    request<T>(path: string, options: RequestOptions<T> = {}) {
      return send(path, options, false)
    },
    /** Explicit exception for same-origin raw JSON endpoints such as Actuator. */
    requestRaw<T>(path: string, options: RequestOptions<T> = {}) {
      return send(path, options, true)
    },
  }
}
