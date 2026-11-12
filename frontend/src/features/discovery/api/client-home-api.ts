import type { ClientDestination, ClientStay } from '../model/client-home'
import { CLIENT_HOME_DESTINATIONS, CLIENT_HOME_HOTELS } from '../mocks/client-home-data'
import { getPublicHotels } from '@/features/hotels'

export async function fetchClientStays(signal?: AbortSignal): Promise<ClientStay[]> {
  try {
    const page = await getPublicHotels({ page: 0, size: 20 }, signal)
    if (page && page.content.length > 0) {
      return page.content.map((h, index) => {
        const fallback = CLIENT_HOME_HOTELS[index % CLIENT_HOME_HOTELS.length]
        return {
          id: h.id,
          name: h.name,
          city: h.address.split(',').pop()?.trim() || fallback.city,
          region: 'Việt Nam',
          location: h.address,
          type: 'Khách sạn',
          rating: h.starRating ? Number(h.starRating) : 5,
          reviews: 1,
          price: fallback.price,
          oldPrice: 0,
          badge: 'Đã xác minh',
          badgeClass: 'dark',
          note: `Nhận phòng ${h.checkInTime.slice(0, 5)} · Trả phòng ${h.checkOutTime.slice(0, 5)}`,
          amenities: ['Wi-Fi tốc độ cao', 'Máy lạnh', 'Lễ tân 24/7'],
          vibes: ['all'],
          image: fallback.image,
          desc: h.description || fallback.desc,
        }
      })
    }
  } catch {
    // Khi Backend chưa có khách sạn Active hoặc chưa kết nối, fallback dữ liệu mẫu
  }

  return [...CLIENT_HOME_HOTELS]
}

export async function fetchClientDestinations(signal?: AbortSignal): Promise<ClientDestination[]> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  await new Promise((resolve) => setTimeout(resolve, 60))

  return [...CLIENT_HOME_DESTINATIONS]
}
