import type { AdminUsersQuery } from '../api/user-contracts'

export const userKeys = {
  all: ['users'] as const,
  list: (session: string | undefined, query: AdminUsersQuery) =>
    ['users', session, 'list', query] as const,
  roles: (session: string | undefined) => ['users', session, 'roles'] as const,
}
