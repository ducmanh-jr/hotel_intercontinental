import { z } from 'zod'
import { amenitySchema } from './hotel'

/** Schema tiện ích riêng (CustomAmenity) từ backend Scoped Amenity API */
export const customAmenitySchema = z.object({
  id: z.string().uuid(),
  hotelId: z.string().uuid(),
  roomId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  attached: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().nonnegative(),
})

export type CustomAmenity = z.infer<typeof customAmenitySchema>

/** Schema dữ liệu tiện ích tổng hợp trả về từ GET / PUT R */
export const managementAmenitiesResponseSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid().nullable().optional(),
  catalogAmenities: z.array(amenitySchema),
  customAmenities: z.array(customAmenitySchema),
  inheritedAmenities: z.array(amenitySchema),
})

export type ManagementAmenities = z.infer<typeof managementAmenitiesResponseSchema>

/** Form schema tạo tiện ích riêng (RHF + Zod) */
export const createCustomAmenityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên tiện ích là bắt buộc.')
    .max(100, 'Tên tiện ích tối đa 100 ký tự.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Mô tả tiện ích tối đa 2000 ký tự.')
    .optional()
    .or(z.literal('')),
})

export type CreateCustomAmenityFormValues = z.infer<typeof createCustomAmenityFormSchema>

/** Form schema sửa tiện ích riêng (RHF + Zod) */
export const updateCustomAmenityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên tiện ích không được để trống.')
    .max(100, 'Tên tiện ích tối đa 100 ký tự.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Mô tả tiện ích tối đa 2000 ký tự.')
    .optional()
    .or(z.literal('')),
})

export type UpdateCustomAmenityFormValues = z.infer<typeof updateCustomAmenityFormSchema>
