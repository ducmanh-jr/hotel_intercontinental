import type { FieldError } from './types'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid-response' | 'unsupported'

interface ApiErrorOptions {
  kind: ApiErrorKind
  status?: number
  code?: string
  traceId?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly code?: string
  readonly traceId?: string
  readonly errors: FieldError[]

  constructor(message: string, options: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.kind = options.kind
    this.status = options.status ?? 0
    this.code = options.code
    this.traceId = options.traceId
    this.errors = options.errors ?? []
  }
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'
}
