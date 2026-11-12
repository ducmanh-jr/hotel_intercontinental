import { createContext, useContext } from 'react'
import type { ManagementHotelDetail } from '../model/hotel'

export interface HotelCompletionStatus {
  percent: number
  sections: {
    info: boolean
    photos: boolean
    amenities: boolean
    rooms: boolean
    pricing: boolean
    policies: boolean
    bookings: boolean
    reviews: boolean
  }
}

export interface HotelWorkspaceContextValue {
  hotel: ManagementHotelDetail | undefined
  hotelId: string
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  completion: HotelCompletionStatus
  isDraft: boolean
  isActive: boolean
}

export const HotelWorkspaceContext = createContext<HotelWorkspaceContextValue | null>(null)

export function useHotelWorkspace(): HotelWorkspaceContextValue {
  const context = useContext(HotelWorkspaceContext)
  if (!context) {
    throw new Error('useHotelWorkspace must be used within a HotelWorkspaceProvider')
  }
  return context
}

export function calculateHotelCompletion(
  hotel?: Partial<ManagementHotelDetail> | null,
): HotelCompletionStatus {
  if (!hotel) {
    return {
      percent: 0,
      sections: {
        info: false,
        photos: false,
        amenities: false,
        rooms: false,
        pricing: false,
        policies: false,
        bookings: false,
        reviews: false,
      },
    }
  }

  const infoDone = Boolean(hotel.name && hotel.address && hotel.cityId && hotel.description)
  const photosDone = hotel.imageCount !== undefined ? hotel.imageCount > 0 : Boolean(hotel.coverImageUrl)
  const amenitiesDone = Boolean(hotel.amenityIds && hotel.amenityIds.length > 0)
  const roomsDone = Boolean(hotel.roomTypes && hotel.roomTypes.length > 0)
  const pricingDone = hotel.hasConfiguredRates === true
  const policiesDone = Boolean(hotel.checkInTime && hotel.checkOutTime)
  const bookingsDone = hotel.status === 'ACTIVE'
  const reviewsDone = hotel.status === 'ACTIVE'

  let score = 0
  if (infoDone) score += 25
  if (photosDone) score += 20
  if (amenitiesDone) score += 15
  if (roomsDone) score += 20
  if (pricingDone) score += 10
  if (policiesDone) score += 10

  return {
    percent: Math.min(100, score),
    sections: {
      info: infoDone,
      photos: photosDone,
      amenities: amenitiesDone,
      rooms: roomsDone,
      pricing: pricingDone,
      policies: policiesDone,
      bookings: bookingsDone,
      reviews: reviewsDone,
    },
  }
}
