import { mutationOptions, type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createHotelContractDraft, getHotelContracts, type ContractPageParams } from '../api/contract-api'
import type { CreateApiContractFormValues } from '../model/contract-api-contract'
import { contractKeys } from './contract-query-keys'

export function useApiHotelContractsQuery(hotelId: string, params: ContractPageParams) {
  return useQuery({
    queryKey: [...contractKeys.byHotel('api', hotelId), 'page', params],
    queryFn: ({ signal }) => getHotelContracts(hotelId, params, signal),
    enabled: Boolean(hotelId), retry: false,
  })
}
export function apiContractMutationOptions(client: QueryClient, hotelId: string) {
  return mutationOptions({
    mutationFn: (payload: CreateApiContractFormValues) => createHotelContractDraft(hotelId, payload),
    retry: false,
    onSuccess: async () => { await client.invalidateQueries({ queryKey: contractKeys.byHotel('api', hotelId) }) },
  })
}
export function useCreateApiHotelContractMutation(hotelId: string) {
  return useMutation(apiContractMutationOptions(useQueryClient(), hotelId))
}
