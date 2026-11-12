import { useQuery } from '@tanstack/react-query'
import { getBackendHealth } from '../api/get-backend-health'

export const systemStatusKeys = {
  health: ['system-status', 'backend-health'] as const,
}

export function useBackendHealth(refreshSeconds: number) {
  return useQuery({
    queryKey: systemStatusKeys.health,
    queryFn: ({ signal }) => getBackendHealth(signal),
    retry: false,
    staleTime: 0,
    refetchInterval: refreshSeconds === 0 ? false : refreshSeconds * 1_000,
  })
}
