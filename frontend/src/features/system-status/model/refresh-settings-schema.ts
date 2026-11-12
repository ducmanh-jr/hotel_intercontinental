import { z } from 'zod'

export const settingsSchema = z.object({
  refreshSeconds: z.number({ error: 'Nhập số giây hợp lệ.' }).int().min(0).max(300)
    .refine((value) => value === 0 || value >= 15, 'Nhập 0 hoặc từ 15 đến 300 giây.'),
})
export type Settings = z.infer<typeof settingsSchema>
