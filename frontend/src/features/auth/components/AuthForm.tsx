import { ActionForm } from '@/shared/ui/ActionForm'
import { getAuthAction, type AuthActionId } from '../model/auth-actions'
import { useAuthAction } from '../hooks/use-auth-action'
import { useSession } from '../hooks/use-session'
import { AuthActionLinks } from './AuthActionLinks'

export function AuthForm({ actionId, token = '' }: { actionId: AuthActionId; token?: string }) {
  const action = getAuthAction(actionId)
  const mutation = useAuthAction(actionId)
  const session = useSession()
  return <ActionForm action={action} token={token} mutation={mutation} hasSession={Boolean(session)}
    links={<AuthActionLinks actionId={actionId} />} />
}
