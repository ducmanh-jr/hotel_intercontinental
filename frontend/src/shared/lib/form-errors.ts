import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/shared/api/api-error'

/**
 * Ánh xạ danh sách lỗi trường (errors[field, message]) từ ProblemDetail của Backend
 * vào React Hook Form để hiển thị trực tiếp dưới từng ô nhập liệu.
 * Trả về số lượng lỗi trường đã gắn thành công.
 */
export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  allowedFields?: readonly Path<TFieldValues>[],
): number {
  if (!(error instanceof ApiError) || error.errors.length === 0) {
    return 0
  }

  const allowedSet = allowedFields ? new Set<string>(allowedFields) : null
  let appliedCount = 0

  for (const fieldError of error.errors) {
    const fieldName = fieldError.field.trim()
    if (!fieldName) continue
    if (allowedSet && !allowedSet.has(fieldName)) continue

    setError(fieldName as Path<TFieldValues>, {
      type: 'server',
      message: fieldError.message,
    })
    appliedCount += 1
  }

  return appliedCount
}

