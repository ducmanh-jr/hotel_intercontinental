import { z } from 'zod'

export const smartSearchSchema = z
  .object({
    destination: z.string().trim().max(120),
    checkIn: z.string().min(1, 'Chọn ngày nhận phòng'),
    checkOut: z.string().min(1, 'Chọn ngày trả phòng'),
    guests: z.number().int().min(1).max(16),
    rooms: z.number().int().min(1).max(8),
    petFriendly: z.boolean(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'Ngày trả phòng phải sau ngày nhận phòng',
    path: ['checkOut'],
  })

export type SmartSearchFormValues = z.infer<typeof smartSearchSchema>
