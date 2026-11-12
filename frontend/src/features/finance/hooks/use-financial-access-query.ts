import { useQuery } from '@tanstack/react-query'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { unsupportedApi } from '@/shared/api/unsupported-api'
import { getMockFinancialAccess } from '../mocks/financial-access-mock'
import { financialAccessKeys } from './financial-access-query-keys'

export function useFinancialAccessQuery(hotelId: string, userId: string) {
  const { mode } = useDataMode()
  return useQuery({
    queryKey: financialAccessKeys.grant(mode, hotelId, userId),
    queryFn: () =>
      mode === 'mock'
        ? getMockFinancialAccess({ hotelId, userId })
        : unsupportedApi<Awaited<ReturnType<typeof getMockFinancialAccess>>>('chế độ xem phân quyền mẫu'),
    enabled: mode === 'mock' && Boolean(hotelId && userId.trim()),
    retry: false,
  })
}
