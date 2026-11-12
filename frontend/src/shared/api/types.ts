/** Contract hiện có trong backend shared.web.ApiResponse. */
export interface ApiResponse<T> {
  message: string
  data: T
}

/** Page bắt đầu từ 0, theo backend shared.web.PageResponse. */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiProblem {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  traceId?: string
  errors?: FieldError[]
}
