import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { setSession } from '@/shared/api/session'
import { ApiError } from '@/shared/api/api-error'
import { getCurrentUser } from '../api/auth-api'
import { useSession } from './use-session'

export function useCurrentUser() {
  const session = useSession()
  const token = session?.accessToken
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['auth', 'current-user', token],
    queryFn: ({ signal }) => getCurrentUser(signal),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false
      return failureCount < 1
    },
  })

  // Khi /users/me trả 401: phiên không hợp lệ, tự động xóa session và xóa toàn bộ cache phiên
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      setSession(null)
      queryClient.clear()
    }
  }, [query.error, queryClient])

  const isChecking = Boolean(token) && (query.isLoading || (query.isPending && query.fetchStatus !== 'idle'))
  const isAdmin = Boolean(query.data?.roles?.includes('ADMIN'))
  const isOwner = Boolean(
    query.data?.roles?.includes('HOTEL_OWNER') || query.data?.roles?.includes('OWNER'),
  )
  const isAuthorized = isAdmin || isOwner

  return {
    ...query,
    currentUser: query.data,
    isChecking,
    isAdmin,
    isOwner,
    isAuthorized,
  }
}
