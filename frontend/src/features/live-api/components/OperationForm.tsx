import { ActionForm } from '@/shared/ui/ActionForm'
import { AuthActionLinks, useSession } from '@/features/auth'
import type { Operation } from '../model/operations'
import { useOperation } from '../hooks/use-operation'

export function OperationForm({ operation, token = '' }: { operation: Operation; token?: string }) {
  const session = useSession()
  const mutation = useOperation(operation)
  return <ActionForm action={operation} token={token} mutation={mutation} hasSession={Boolean(session)}
    danger={operation.method === 'DELETE'} links={<AuthActionLinks actionId={operation.id} />} />
}
