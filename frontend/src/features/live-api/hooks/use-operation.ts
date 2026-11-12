import { useAbortableMutation } from '@/shared/hooks/use-abortable-mutation'
import { runOperation } from '../api/run-operation'
import type { Operation } from '../model/operations'

export function useOperation(operation: Operation) {
  return useAbortableMutation(['live-api', operation.id], (values: Record<string, string>, signal) =>
    runOperation(operation, values, signal))
}
