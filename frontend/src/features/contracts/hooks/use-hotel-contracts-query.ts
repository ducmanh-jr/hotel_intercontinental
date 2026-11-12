import { useQuery } from '@tanstack/react-query'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { unsupportedApi } from '@/shared/api/unsupported-api'
import { getMockHotelContracts } from '../mocks/contract-mock'
import { contractKeys } from './contract-query-keys'

export function useHotelContractsQuery(hotelId: string) {
  const { mode } = useDataMode()
  return useQuery({
    queryKey: contractKeys.byHotel(mode, hotelId),
    queryFn: () =>
      mode === 'mock'
        ? getMockHotelContracts(hotelId)
        : unsupportedApi<Awaited<ReturnType<typeof getMockHotelContracts>>>('chế độ xem hợp đồng mẫu'),
    enabled: mode === 'mock' && Boolean(hotelId),
    retry: false,
  })
}
