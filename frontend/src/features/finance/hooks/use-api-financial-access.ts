import { mutationOptions, type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/api-error'
import { getFinancialAccess, updateFinancialAccess } from '../api/financial-access-api'
import type { UpdateApiFinancialAccessFormValues } from '../model/financial-access-api-contract'
import { financialAccessKeys } from './financial-access-query-keys'

export function useApiFinancialAccessQuery(hotelId: string, userId: string, enabled: boolean) {
  return useQuery({
    queryKey: financialAccessKeys.grant('api', hotelId, userId),
    queryFn: ({ signal }) => getFinancialAccess({ hotelId, userId }, signal),
    enabled: enabled && Boolean(hotelId && userId), retry: false,
  })
}
export function apiFinancialAccessMutationOptions(client: QueryClient, hotelId: string, userId: string) {
  const refresh = () => client.invalidateQueries({ queryKey: financialAccessKeys.grant('api', hotelId, userId) })
  return mutationOptions({
    mutationFn: (payload: UpdateApiFinancialAccessFormValues) => updateFinancialAccess({ hotelId, userId }, payload),
    retry: false,
    onSuccess: async () => { await refresh() },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await refresh()
    },
  })
}
export function useUpdateApiFinancialAccessMutation(hotelId: string, userId: string) {
  return useMutation(apiFinancialAccessMutationOptions(useQueryClient(), hotelId, userId))
}
