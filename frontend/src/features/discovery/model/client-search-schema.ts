import { z } from 'zod'

export const clientSearchSchema = z.object({
  destination: z.string().trim(),
  checkIn: z.string().trim().min(1, 'Vui lòng chọn ngày nhận phòng'),
  checkOut: z.string().trim().min(1, 'Vui lòng chọn ngày trả phòng'),
  guests: z.string().trim(),
})

export type ClientSearchFormValues = z.infer<typeof clientSearchSchema>

export const newsletterSchema = z.object({
  email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ'),
})

export type NewsletterFormValues = z.infer<typeof newsletterSchema>
