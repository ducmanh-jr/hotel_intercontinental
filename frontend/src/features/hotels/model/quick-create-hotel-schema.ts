import { z } from 'zod'

export const quickCreateHotelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên khách sạn phải có ít nhất 3 ký tự.')
    .max(255, 'Tên khách sạn tối đa 255 ký tự.'),
  starRating: z
    .number({ error: 'Vui lòng chọn tiêu chuẩn sao từ 1 đến 5.' })
    .int()
    .min(1, 'Tiêu chuẩn sao từ 1 đến 5 sao.')
    .max(5, 'Tiêu chuẩn sao từ 1 đến 5 sao.'),
  cityId: z.string().min(1, 'Vui lòng chọn Tỉnh / Thành phố.'),
  ownerUserId: z
    .string()
    .trim()
    .min(1, 'Chủ sở hữu (Owner User ID) không được để trống.')
    .uuid('Chủ sở hữu (Owner User ID) phải đúng định dạng UUID hợp lệ.'),
})

export type QuickCreateHotelFormValues = z.infer<typeof quickCreateHotelSchema>
