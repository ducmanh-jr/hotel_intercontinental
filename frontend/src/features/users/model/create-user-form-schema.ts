import { z } from 'zod'

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên cần ít nhất 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  email: z
    .string()
    .trim()
    .email('Địa chỉ email không hợp lệ')
    .max(255, 'Email tối đa 255 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, 'Số điện thoại phải bắt đầu bằng 0 và gồm 10–11 số'),
  role: z.enum(['CUSTOMER', 'HOTEL_OWNER', 'ADMIN'], {
    message: 'Vui lòng chọn vai trò hợp lệ',
  }),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
