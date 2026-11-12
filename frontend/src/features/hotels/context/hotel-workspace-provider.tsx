import { useMemo, type ReactNode } from 'react'
import type { ManagementHotelDetail } from '../model/hotel'
import {
  HotelWorkspaceContext,
  calculateHotelCompletion,
  type HotelWorkspaceContextValue,
} from './hotel-workspace-context'

export interface HotelWorkspaceProviderProps {
  children: ReactNode
  hotel: ManagementHotelDetail | undefined
  hotelId: string
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

export function HotelWorkspaceProvider({
  children,
  hotel,
  hotelId,
  isLoading,
  isError,
  error,
  refetch,
}: HotelWorkspaceProviderProps) {
  const completion = useMemo(() => calculateHotelCompletion(hotel), [hotel])
  const isDraft = hotel?.status === 'DRAFT'
  const isActive = hotel?.status === 'ACTIVE'

  const value = useMemo<HotelWorkspaceContextValue>(
    () => ({
      hotel,
      hotelId,
      isLoading,
      isError,
      error,
      refetch,
      completion,
      isDraft,
      isActive,
    }),
    [hotel, hotelId, isLoading, isError, error, refetch, completion, isDraft, isActive],
  )

  return (
    <HotelWorkspaceContext.Provider value={value}>
      {children}
    </HotelWorkspaceContext.Provider>
  )
}
