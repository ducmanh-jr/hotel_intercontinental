import { z } from 'zod'
import { financialAccessStatusSchema } from './financial-access'

/** FN00: PUT /api/v1/admin/hotels/{hotelId}/financial-access/{userId} */
export const updateFinancialAccessFormSchema = z.object({
  contractId: z.string().min(1, 'Vui lòng chọn thỏa thuận/hợp đồng liên kết.'),
  status: financialAccessStatusSchema,
  canReadContracts: z.boolean(),
  canReadSettlements: z.boolean(),
  canExportReports: z.boolean(),
  expectedVersion: z
    .number({ error: 'Phiên bản đối chiếu không hợp lệ.' })
    .int()
    .min(0),
  reason: z
    .string()
    .trim()
    .min(5, 'Nhập lý do cấp/thu hồi quyền (ít nhất 5 ký tự).')
    .max(255, 'Lý do tối đa 255 ký tự.'),
})
export type UpdateFinancialAccessFormValues = z.infer<
  typeof updateFinancialAccessFormSchema
>
