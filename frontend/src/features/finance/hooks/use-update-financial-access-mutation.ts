import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { unsupportedApi } from '@/shared/api/unsupported-api'
import { updateMockFinancialAccess } from '../mocks/financial-access-mock'
import type { UpdateFinancialAccessFormValues } from '../model/financial-access-form-schema'
import { financialAccessKeys } from './financial-access-query-keys'

export function useUpdateFinancialAccessMutation(hotelId: string, userId: string) {
  const { mode } = useDataMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateFinancialAccessFormValues) =>
      mode === 'mock'
        ? updateMockFinancialAccess({ hotelId, userId }, payload)
        : unsupportedApi<Awaited<ReturnType<typeof updateMockFinancialAccess>>>('biểu mẫu phân quyền mẫu'),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialAccessKeys.grant(mode, hotelId, userId),
      })
    },
  })
}
