import { http } from '@/shared/api/http'
import type { ContractStatus } from '../model/contract'
import { contractDtoSchema, contractPageSchema, createApiContractFormSchema, type CreateApiContractFormValues } from '../model/contract-api-contract'

export interface ContractPageParams { page: number; size: number; status?: ContractStatus }
export function getHotelContracts(hotelId: string, params: ContractPageParams = { page: 0, size: 10 }, signal?: AbortSignal) {
  const search = new URLSearchParams({ page: String(params.page), size: String(params.size) })
  if (params.status) search.set('status', params.status)
  return http.request(`/finance/hotels/${encodeURIComponent(hotelId)}/contracts?${search}`, { signal, schema: contractPageSchema })
}

export async function createHotelContractDraft(hotelId: string, payload: CreateApiContractFormValues, signal?: AbortSignal) {
  const values = createApiContractFormSchema.parse(payload)
  return http.request(`/admin/hotels/${encodeURIComponent(hotelId)}/contracts`, {
    method: 'POST', signal, schema: contractDtoSchema,
    body: { ...values, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString(), status: 'DRAFT' },
  })
}
