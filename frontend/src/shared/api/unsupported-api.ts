import { ApiError } from './api-error'

/** Reject locally: the current backend has no endpoint for this capability. */
export async function unsupportedApi<T>(feature: string): Promise<T> {
  throw new ApiError(`Backend hiện chưa hỗ trợ ${feature}.`, {
    kind: 'unsupported',
    code: 'API_NOT_IMPLEMENTED',
  })
}
