import { z } from 'zod'
import { ApiError } from '@/shared/api/api-error'
import type { ManagementHotelDetail } from './hotel'

const text = z.string().trim().min(1, 'Không hỗ trợ xóa nội dung bằng giá trị trống.')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Nhập giờ HH:mm.')
export const hotelPatchSchema = z.object({
  version: z.number().int().nonnegative(), name: text.max(255).optional(), description: text.optional(),
  address: text.max(255).optional(), contactPhone: text.regex(/^\+?[0-9]{8,15}$/, 'Số điện thoại cần 8–15 chữ số.').optional(), contactEmail: text.max(255).email().optional(),
  latitude: z.number().min(-90).max(90).refine((value) => value === Number(value.toFixed(6)), 'Tối đa 6 chữ số thập phân.').optional(),
  longitude: z.number().min(-180).max(180).refine((value) => value === Number(value.toFixed(6)), 'Tối đa 6 chữ số thập phân.').optional(),
  starRating: z.number().int().min(1).max(5).optional(), checkInTime: time.optional(), checkOutTime: time.optional(),
}).refine((value) => Object.keys(value).some((key) => key !== 'version'), 'Chưa có thông tin cần cập nhật.')
  .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), { message: 'Cần nhập cả vĩ độ và kinh độ.', path: ['latitude'] })
export type HotelPatch = z.infer<typeof hotelPatchSchema>

export function validateHotelPatch(input: unknown): HotelPatch {
  const parsed = hotelPatchSchema.safeParse(input)
  if (!parsed.success) throw new ApiError('Vui lòng kiểm tra thông tin cập nhật.', {
    kind: 'http', status: 400, code: 'VALIDATION_FAILED', errors: parsed.error.issues.map((issue) => ({ field: String(issue.path[0] ?? 'root'), message: issue.message })),
  })
  return parsed.data
}

export function buildHotelPatch(original: ManagementHotelDetail, values: Record<string, unknown>): HotelPatch {
  const patch: Record<string, unknown> = { version: original.version }
  const fields = ['name', 'description', 'address', 'contactPhone', 'contactEmail', 'starRating', 'checkInTime', 'checkOutTime'] as const
  for (const field of fields) {
    if (!(field in values)) continue
    const value = values[field]
    const before = original[field]
    const normalized = typeof value === 'string' ? value.trim() : value
    const previous = typeof before === 'string' ? before.trim() : before
    const equal = field === 'checkInTime' || field === 'checkOutTime'
      ? String(normalized).slice(0, 5) === String(previous).slice(0, 5)
      : normalized === previous || (normalized === '' && previous == null)
    if (!equal) patch[field] = normalized
  }
  if (('latitude' in values && values.latitude !== original.latitude) || ('longitude' in values && values.longitude !== original.longitude)) {
    patch.latitude = values.latitude; patch.longitude = values.longitude
  }
  return validateHotelPatch(patch)
}
