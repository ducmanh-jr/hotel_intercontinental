import { z } from 'zod'

export const financialAccessStatusValues = ['GRANTED', 'REVOKED'] as const
export const financialAccessStatusSchema = z.enum(financialAccessStatusValues)
export type FinancialAccessStatus = z.infer<typeof financialAccessStatusSchema>

/** FN16: GET /api/v1/admin/hotels/{hotelId}/financial-access/{userId} */
export const financialAccessGrantSchema = z.object({
  hotelId: z.string().min(1),
  userId: z.string().min(1),
  userFullName: z.string().optional(),
  userEmail: z.string().optional(),
  contractId: z.string().min(1),
  contractCode: z.string().optional(),
  status: financialAccessStatusSchema,
  canReadContracts: z.boolean(),
  canReadSettlements: z.boolean(),
  canExportReports: z.boolean(),
  version: z.number().int().min(0),
  previousVersionSummary: z.string().nullable().optional(),
  updatedAt: z.string(),
  reason: z.string().nullable().optional(),
})
export type FinancialAccessGrant = z.infer<typeof financialAccessGrantSchema>
