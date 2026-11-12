import { z } from 'zod'
import { hotelStatusSchema } from './hotel'

const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** HT06: POST /api/v1/management/hotels — Tạo khách sạn và phân công Owner */
export const createAdminHotelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên khách sạn cần ít nhất 3 ký tự.')
    .max(255, 'Tên khách sạn tối đa 255 ký tự.'),
  slug: z.string().trim().max(255),
  cityId: z.string().min(1, 'Vui lòng chọn thành phố.'),
  ownerUserId: z
    .string()
    .trim()
    .regex(uuidRegex, 'Owner User ID phải đúng định dạng UUID.'),
  address: z
    .string()
    .trim()
    .min(5, 'Địa chỉ cần ít nhất 5 ký tự.')
    .max(255, 'Địa chỉ tối đa 255 ký tự.'),
  starRating: z
    .number({ error: 'Chọn hạng sao từ 1 đến 5.' })
    .int()
    .min(1, 'Hạng sao từ 1 đến 5.')
    .max(5, 'Hạng sao từ 1 đến 5.'),
  checkInTime: z
    .string()
    .regex(timeFormatRegex, 'Giờ nhận phòng theo định dạng HH:mm (ví dụ 14:00).'),
  checkOutTime: z
    .string()
    .regex(timeFormatRegex, 'Giờ trả phòng theo định dạng HH:mm (ví dụ 12:00).'),
  description: z.string().trim().max(2000, 'Mô tả tối đa 2000 ký tự.').optional(),
  latitude: z
    .number({ error: 'Vĩ độ phải là số hợp lệ.' })
    .min(-90, 'Vĩ độ trong khoảng -90 đến 90.')
    .max(90, 'Vĩ độ trong khoảng -90 đến 90.')
    .nullable()
    .optional(),
  longitude: z
    .number({ error: 'Kinh độ phải là số hợp lệ.' })
    .min(-180, 'Kinh độ trong khoảng -180 đến 180.')
    .max(180, 'Kinh độ trong khoảng -180 đến 180.')
    .nullable()
    .optional(),
})
export type CreateAdminHotelFormValues = z.infer<typeof createAdminHotelFormSchema>

/** API mode uses real city UUIDs and lets the backend generate the slug. */
export const createAdminHotelApiFormSchema = createAdminHotelFormSchema.extend({
  name: z.string().trim().min(1, 'Nhập tên khách sạn.').max(255),
  slug: z.string().trim().max(255),
  cityId: z.string().trim().uuid('City ID phải đúng định dạng UUID.'),
  address: z.string().trim().min(1, 'Nhập địa chỉ.').max(255),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90)
    .refine((value) => value === Number(value.toFixed(6)), 'Vĩ độ tối đa 6 chữ số thập phân.')
    .nullable().optional(),
  longitude: z.number().min(-180).max(180)
    .refine((value) => value === Number(value.toFixed(6)), 'Kinh độ tối đa 6 chữ số thập phân.')
    .nullable().optional(),
})

/** HT09: PATCH /api/v1/management/hotels/{hotelId} — Sửa nội dung khách sạn */
export const updateManagementHotelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên khách sạn cần ít nhất 3 ký tự.')
    .max(255, 'Tên khách sạn tối đa 255 ký tự.'),
  cityId: z.string().min(1, 'Vui lòng chọn thành phố.'),
  address: z
    .string()
    .trim()
    .min(5, 'Địa chỉ cần ít nhất 5 ký tự.')
    .max(255, 'Địa chỉ tối đa 255 ký tự.'),
  starRating: z.number().int().min(1).max(5).nullable(),
  checkInTime: z
    .string()
    .regex(timeFormatRegex, 'Giờ nhận phòng theo định dạng HH:mm.'),
  checkOutTime: z
    .string()
    .regex(timeFormatRegex, 'Giờ trả phòng theo định dạng HH:mm.'),
  description: z.string().trim().max(2000, 'Mô tả tối đa 2000 ký tự.'),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  status: hotelStatusSchema,
})
export type UpdateManagementHotelFormValues = z.infer<typeof updateManagementHotelFormSchema>

/** HT14: PUT /api/v1/management/hotels/{hotelId}/amenities */
export const updateHotelAmenitiesFormSchema = z.object({
  amenityIds: z.array(z.string().min(1)),
})
export type UpdateHotelAmenitiesFormValues = z.infer<typeof updateHotelAmenitiesFormSchema>
