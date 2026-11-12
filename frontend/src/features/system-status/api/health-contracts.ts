import { z } from 'zod'

/** Actuator returns raw JSON, not the business ApiResponse envelope. */
export const healthSchema = z.object({
  status: z.string().min(1),
})

export type BackendHealth = z.infer<typeof healthSchema>
