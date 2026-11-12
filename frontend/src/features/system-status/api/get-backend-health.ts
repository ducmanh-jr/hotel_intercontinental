import { http } from '@/shared/api/http'
import { healthSchema } from './health-contracts'

export function getBackendHealth(signal?: AbortSignal) {
  return http.requestRaw('/actuator/health', { signal, schema: healthSchema })
}
