import { z } from 'zod'
import { contractStatusSchema } from './contract'

export const commissionBasisSchema = z.enum(['BEFORE_DISCOUNT', 'AFTER_DISCOUNT', 'AFTER_HOTEL_DISCOUNT'])
export const contractDtoSchema = z.object({
  id: z.uuid(), hotelId: z.uuid(), ownerUserId: z.uuid(), contractCode: z.string(),
  commissionRate: z.number(), commissionBasis: commissionBasisSchema,
  startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }),
  status: contractStatusSchema, createdByUserId: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
})
export const contractPageSchema = z.object({
  content: z.array(contractDtoSchema), page: z.number().int(), size: z.number().int(),
  totalElements: z.number().int(), totalPages: z.number().int(), first: z.boolean(), last: z.boolean(),
})
const localDateTime = z.string().min(1, 'Chọn thời điểm hiệu lực.').refine((value) => Number.isFinite(new Date(value).getTime()), 'Thời điểm không hợp lệ.')
export const createApiContractFormSchema = z.object({
  contractCode: z.string().trim().min(1, 'Nhập mã hợp đồng.').max(50),
  ownerUserId: z.uuid('Nhập UUID chủ sở hữu hợp lệ.'),
  commissionRate: z.number().min(0).max(100), commissionBasis: commissionBasisSchema,
  startsAt: localDateTime, endsAt: localDateTime,
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
  path: ['endsAt'], message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
})
export type ApiContract = z.infer<typeof contractDtoSchema>
export type CreateApiContractFormValues = z.infer<typeof createApiContractFormSchema>
