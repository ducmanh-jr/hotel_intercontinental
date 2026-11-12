import { z } from 'zod'

export const contractStatusValues = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const
export const contractStatusSchema = z.enum(contractStatusValues)
export type ContractStatus = z.infer<typeof contractStatusSchema>

/** FN01: GET /api/v1/finance/hotels/{hotelId}/contracts */
export const hotelCommissionContractSchema = z.object({
  id: z.string().min(1),
  hotelId: z.string().min(1),
  contractCode: z.string().min(1),
  commissionPercentage: z.number().min(0).max(100),
  currency: z.string().length(3),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().nullable(),
  status: contractStatusSchema,
  termsSummary: z.string().nullable(),
  createdByUserId: z.string().optional(),
  createdAt: z.string(),
})
export type HotelCommissionContract = z.infer<typeof hotelCommissionContractSchema>
