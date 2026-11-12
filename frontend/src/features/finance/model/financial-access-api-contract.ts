import { z } from 'zod'

const accessFields = {
  id: z.uuid(), hotelId: z.uuid(), userId: z.uuid(), isGranted: z.boolean(),
  accessScope: z.string(), reason: z.string().nullable(), grantedByUserId: z.uuid(),
  grantedAt: z.iso.datetime({ offset: true }),
}
export const financialAccessUpdateSchema = z.object({ ...accessFields, version: z.number().int().nonnegative() })
export const financialAccessHistorySchema = z.object({
  id: z.uuid(), version: z.number().int().nonnegative(), isGranted: z.boolean(), accessScope: z.string(),
  reason: z.string().nullable(), changedByUserId: z.uuid(), changedAt: z.iso.datetime({ offset: true }),
})
export const financialAccessDetailSchema = z.object({
  ...accessFields, userName: z.string().nullable(), userEmail: z.string().nullable(),
  currentVersion: z.number().int().nonnegative(), history: z.array(financialAccessHistorySchema),
})
export const updateApiFinancialAccessFormSchema = z.object({
  isGranted: z.boolean(), accessScope: z.string().trim().min(1, 'Nhập phạm vi truy cập.').max(50),
  reason: z.string().trim().min(1, 'Nhập lý do cấp hoặc thu hồi quyền.').max(255),
  expectedVersion: z.number().int().nonnegative(),
})
export type FinancialAccessDetail = z.infer<typeof financialAccessDetailSchema>
export type UpdateApiFinancialAccessFormValues = z.infer<typeof updateApiFinancialAccessFormSchema>
