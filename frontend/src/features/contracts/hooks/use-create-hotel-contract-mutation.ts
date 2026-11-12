import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { unsupportedApi } from '@/shared/api/unsupported-api'
import { createMockHotelContractDraft } from '../mocks/contract-mock'
import type { CreateHotelContractFormValues } from '../model/contract-form-schema'
import { contractKeys } from './contract-query-keys'

export function useCreateHotelContractMutation(hotelId: string) {
  const { mode } = useDataMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateHotelContractFormValues) =>
      mode === 'mock'
        ? createMockHotelContractDraft(hotelId, payload)
        : unsupportedApi<Awaited<ReturnType<typeof createMockHotelContractDraft>>>('biểu mẫu hợp đồng mẫu'),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contractKeys.byHotel(mode, hotelId),
      })
    },
  })
}
