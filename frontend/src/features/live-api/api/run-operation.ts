import { http } from '@/shared/api/http'
import { runAuthAction } from '@/features/auth'
import { inputSchema, type Operation } from '../model/operations'

export async function runOperation(operation: Operation, values: Record<string, string>, signal?: AbortSignal) {
  const parsed = inputSchema(operation).parse(values)
  if (operation.kind === 'auth') return runAuthAction(operation.id, parsed, signal)
  return http.request(operation.path(parsed), {
    method: operation.method, body: operation.body?.(parsed), schema: operation.response, signal,
  })
}
