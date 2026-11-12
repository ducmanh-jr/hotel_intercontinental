import { http } from '@/shared/api/http'
import { financialAccessDetailSchema, financialAccessUpdateSchema, updateApiFinancialAccessFormSchema, type UpdateApiFinancialAccessFormValues } from '../model/financial-access-api-contract'

function accessPath(params: { hotelId: string; userId: string }) {
  return `/admin/hotels/${encodeURIComponent(params.hotelId)}/financial-access/${encodeURIComponent(params.userId)}`
}
export function getFinancialAccess(params: { hotelId: string; userId: string }, signal?: AbortSignal) {
  return http.request(accessPath(params), { signal, schema: financialAccessDetailSchema })
}
export function updateFinancialAccess(params: { hotelId: string; userId: string }, payload: UpdateApiFinancialAccessFormValues, signal?: AbortSignal) {
  return http.request(accessPath(params), { method: 'PUT', signal, body: updateApiFinancialAccessFormSchema.parse(payload), schema: financialAccessUpdateSchema })
}
