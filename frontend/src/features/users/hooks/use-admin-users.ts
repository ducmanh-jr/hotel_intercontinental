import { useEffect, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { useCurrentUser, useSession } from '@/features/auth'
import { ApiError, errorMessage } from '@/shared/api/api-error'
import { unsupportedApi } from '@/shared/api/unsupported-api'
import { listAdminRoles, listAdminUsers } from '../api/users-api'
import type { AdminUsersQuery } from '../api/user-contracts'
import type { AdminUser, UserFilterTab, UserRole } from '../model/user'
import { dateRange, pageNumbers, tabStatuses, toAdminUser } from '../model/admin-user-mapping'
import { userKeys } from './user-query-keys'
import { useUserActions } from './use-user-actions'

const tabs: UserFilterTab[] = ['all', 'active', 'pending', 'inactive', 'locked']

function retryQuery(count: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return count < 1
}

export function useAdminUsers() {
  const session = useSession()
  const { currentUser, isAdmin } = useCurrentUser()
  const token = session?.accessToken
  const [filters, setFilters] = useState({
    activeTab: 'all' as UserFilterTab,
    searchTerm: '', roleFilter: 'ALL', dateFilter: 'ALL',
    dateAnchor: new Date(), sort: 'createdAt,desc' as 'createdAt,desc' | 'createdAt,asc',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [selection, setSelection] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [roleId, setRoleId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.searchTerm.trim()), 300)
    return () => clearTimeout(timer)
  }, [filters.searchTerm])

  const common = {
    search: debouncedSearch || undefined,
    role: filters.roleFilter === 'ALL' ? undefined : filters.roleFilter,
    ...dateRange(filters.dateFilter, filters.dateAnchor),
    sort: filters.sort,
  }
  const params: AdminUsersQuery = {
    ...common, status: tabStatuses[filters.activeTab], page, size: pageSize,
  }
  const query = useQuery({
    queryKey: userKeys.list(token, params),
    queryFn: ({ signal }) => listAdminUsers(params, signal),
    enabled: Boolean(token) && isAdmin,
    retry: retryQuery,
  })
  // Backend chưa có API thống kê riêng: dùng totalElements của từng bộ lọc, chỉ lấy 1 dòng.
  const counts = useQueries({
    queries: tabs.map((tab) => {
      const countParams: AdminUsersQuery = { ...common, status: tabStatuses[tab], page: 0, size: 1 }
      return {
        queryKey: userKeys.list(token, countParams),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminUsers(countParams, signal),
        enabled: Boolean(token) && isAdmin,
        staleTime: 30_000,
        retry: retryQuery,
      }
    }),
  })
  const rolesQuery = useQuery({
    queryKey: userKeys.roles(token),
    queryFn: ({ signal }) => listAdminRoles(signal),
    enabled: Boolean(token) && isAdmin,
    staleTime: 60_000,
    retry: retryQuery,
  })
  const { runAction, isMutating } = useUserActions(currentUser?.id)

  const data = query.isError ? undefined : query.data
  const users = data?.content.map(toAdminUser) ?? []
  const selectedIds = selection.filter((id) => users.some((user) => user.id === id))
  const tabCounts = Object.fromEntries(tabs.map((tab, index) => [
    tab, tab === filters.activeTab && data
      ? data.totalElements : counts[index].isError ? undefined : counts[index].data?.totalElements,
  ])) as Record<UserFilterTab, number | undefined>

  const changeFilters = (patch: Partial<typeof filters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
    setPage(0)
    setSelection([])
  }
  const setCurrentPage = (next: number) => {
    setPage(Math.max(0, Math.min(next, Math.max(0, (data?.totalPages ?? 1) - 1))))
    setSelection([])
  }
  const setSize = (size: number) => {
    setPageSize(size)
    setPage(0)
    setSelection([])
  }

  const viewState = query.isPending ? 'loading' : query.isError ? 'error'
    : users.length === 0 ? 'empty' : null
  const currentPage = data?.page ?? page
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id))
  const isAllSelected = users.length > 0 && selectedIds.length === users.length
  const isBusy = isMutating || query.isFetching || filters.searchTerm.trim() !== debouncedSearch

  const handleToggleLockUser = (user: AdminUser) => {
    if (!isBusy) void runAction({ kind: 'status', user })
  }
  const handleResendEmail = (user: AdminUser) => {
    if (!isBusy) void runAction({ kind: 'resend', user })
  }
  const handleSaveRole = async (userId: string, role: UserRole) => {
    const user = users.find((item) => item.id === userId)
    if (!user || isBusy) return false
    return runAction({ kind: 'role', user, role })
  }
  const handleCreateUser = async () => {
    try {
      await unsupportedApi('tạo tài khoản từ trang quản trị')
    } catch (error) {
      void message.error(errorMessage(error))
    }
    return false
  }
  const handleRetryConnection = async () => {
    const [result] = await Promise.all([
      query.refetch(), rolesQuery.refetch(), ...counts.map((count) => count.refetch()),
    ])
    if (result.error) void message.error(errorMessage(result.error))
  }

  const roleOptions = (rolesQuery.data ?? []).flatMap<{ value: UserRole; label: string }>((role) =>
    role.roleKey === 'CUSTOMER' || role.roleKey === 'HOTEL_OWNER' || role.roleKey === 'ADMIN'
      ? [{ value: role.roleKey, label: role.roleName }] : [])

  return {
    users, filteredUsers: users, selectedIds, tabCounts,
    activeTab: filters.activeTab,
    setActiveTab: (activeTab: UserFilterTab) => changeFilters({ activeTab }),
    searchTerm: filters.searchTerm,
    setSearchTerm: (searchTerm: string) => changeFilters({ searchTerm }),
    roleFilter: filters.roleFilter,
    setRoleFilter: (roleFilter: string) => changeFilters({ roleFilter }),
    dateFilter: filters.dateFilter,
    setDateFilter: (dateFilter: string) => changeFilters({ dateFilter, dateAnchor: new Date() }),
    sort: filters.sort,
    toggleSort: () => changeFilters({ sort: filters.sort === 'createdAt,desc' ? 'createdAt,asc' : 'createdAt,desc' }),
    roleOptions, roleFilterOptions: (rolesQuery.data ?? []).map((role) => ({ value: role.roleKey, label: role.roleName })),
    rolesLoading: rolesQuery.isPending || rolesQuery.isFetching, rolesError: rolesQuery.error,
    viewState, errorText: query.error ? errorMessage(query.error) : null,
    isRetrying: query.isFetching, isBusy, isMutating, currentUserId: currentUser?.id,
    isCreateModalOpen, setIsCreateModalOpen,
    selectedUserForDetail: users.find((user) => user.id === detailId) ?? null,
    setSelectedUserForDetail: (user: AdminUser | null) => setDetailId(user?.id ?? null),
    selectedUserForRole: users.find((user) => user.id === roleId) ?? null,
    setSelectedUserForRole: (user: AdminUser | null) => {
      setRoleId(user?.id ?? null)
      if (user && rolesQuery.isError) {
        void rolesQuery.refetch().then((result) => {
          if (result.error) void message.error(errorMessage(result.error))
        })
      }
    },
    isAllSelected, isIndeterminate: selectedIds.length > 0 && !isAllSelected,
    handleToggleSelectAll: (event: React.ChangeEvent<HTMLInputElement>) =>
      setSelection(event.target.checked ? users.map((user) => user.id) : []),
    handleToggleSelectRow: (id: string) => setSelection((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]),
    handleToggleLockUser, handleResendEmail, handleSaveRole, handleCreateUser, handleRetryConnection,
    handleBulkLock: () => { if (!isBusy && selectedUsers.length) void runAction({ kind: 'bulk-lock', users: selectedUsers }) },
    handleBulkResendEmail: () => { if (!isBusy && selectedUsers.length) void runAction({ kind: 'bulk-resend', users: selectedUsers }) },
    page: currentPage, pageSize, setPage: setCurrentPage, setPageSize: setSize,
    totalElements: data?.totalElements,
    totalPages: data?.totalPages ?? 0,
    pageNumbers: pageNumbers(currentPage, data?.totalPages ?? 0),
    rangeStart: users.length ? currentPage * pageSize + 1 : 0,
    rangeEnd: users.length ? currentPage * pageSize + users.length : 0,
    hasPrevious: currentPage > 0 && !isBusy,
    hasNext: Boolean(data && !data.last) && !isBusy,
  }
}
