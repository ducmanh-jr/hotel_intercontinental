import { z } from 'zod'

export const inventoryRangeSchema = z.object({ startDate: z.iso.date('Chọn ngày bắt đầu.'), endDate: z.iso.date('Chọn ngày kết thúc.') })
  .refine((value) => value.endDate >= value.startDate, { message: 'Ngày kết thúc không được trước ngày bắt đầu.', path: ['endDate'] })
  .refine((value) => (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86400000 <= 90, { message: 'Tra cứu tối đa 90 ngày.', path: ['endDate'] })
export const blockFormSchema = z.object({ roomId: z.uuid('Chọn phòng vật lý.'), startDate: z.iso.date(), endDate: z.iso.date(), reason: z.string().trim().min(1, 'Nhập lý do.').max(255) })
  .refine((value) => value.endDate >= value.startDate, { message: 'Ngày kết thúc không được trước ngày bắt đầu.', path: ['endDate'] })
export const releaseFormSchema = z.object({ reason: z.string().trim().min(1, 'Nhập lý do giải phóng.').max(255) })
