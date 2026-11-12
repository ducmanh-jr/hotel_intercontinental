import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { App } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { HotelAmenitiesManager } from './HotelAmenitiesManager'
import { hotelManagementKeys } from '../hooks/hotel-query-keys'

const hotelId = '11111111-1111-4111-8111-111111111111'
const roomId201 = '22222222-2222-4222-8222-222222222201'
const roomId202 = '22222222-2222-4222-8222-222222222202'

const catalogHotelAmenities = [
  { id: 'h-1', code: 'PARKING', name: 'Bãi đỗ xe miễn phí', category: 'HOTEL' as const },
  { id: 'h-2', code: 'POOL', name: 'Hồ bơi ngoài trời', category: 'HOTEL' as const },
]

const catalogRoomAmenities = [
  { id: 'r-1', code: 'WIFI', name: 'Wi-Fi tốc độ cao', category: 'ROOM' as const },
  { id: 'r-2', code: 'MINIBAR', name: 'Quầy bar mini', category: 'ROOM' as const },
  { id: 'r-3', code: 'BALCONY', name: 'Ban công hướng biển', category: 'ROOM' as const },
]

function renderComponent(ui: React.ReactElement, client: QueryClient) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <App>{ui}</App>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('HotelAmenitiesManager with Scoped Amenities API', () => {
  it('renders hotel amenities with catalog and custom sections without draft warnings', () => {
    const client = new QueryClient()

    // Mock catalog HOTEL amenities
    client.setQueryData(hotelManagementKeys.amenities('api:HOTEL'), catalogHotelAmenities)

    // Mock scoped hotel amenities (GET H)
    client.setQueryData(hotelManagementKeys.scopedAmenities(hotelId, undefined), {
      hotelId,
      roomId: null,
      catalogAmenities: [catalogHotelAmenities[0]],
      customAmenities: [
        {
          id: 'c-1',
          hotelId,
          roomId: null,
          name: 'Hồ bơi nước khoáng riêng',
          description: 'Dành riêng cho khách lưu trú',
          attached: true,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:00:00Z',
          version: 0,
        },
      ],
      inheritedAmenities: [],
    })

    const html = renderComponent(<HotelAmenitiesManager hotelId={hotelId} />, client)

    // Catalog section
    expect(html).toContain('Tiện ích có sẵn')
    expect(html).toContain('Bãi đỗ xe miễn phí')
    expect(html).toContain('Hồ bơi ngoài trời')
    expect(html).toContain('Đã chọn: 1 / 2')

    // Custom section
    expect(html).toContain('Tiện ích riêng')
    expect(html).toContain('Hồ bơi nước khoáng riêng')
    expect(html).toContain('Đang gắn: 1')

    // Absolutely NO obsolete warnings about draft hotels or replace confirmation checkbox
    expect(html).not.toContain('Chưa đọc được tiện ích')
    expect(html).not.toContain('Tôi muốn thay thế toàn bộ')
  })

  it('renders physical room amenities with inherited, catalog, and custom sections', () => {
    const client = new QueryClient()

    // Mock catalog ROOM amenities
    client.setQueryData(hotelManagementKeys.amenities('api:ROOM'), catalogRoomAmenities)

    // Mock scoped room amenities for room 201 (GET R)
    client.setQueryData(hotelManagementKeys.scopedAmenities(hotelId, roomId201), {
      hotelId,
      roomId: roomId201,
      catalogAmenities: [catalogRoomAmenities[2]], // r-3 (BALCONY) attached directly
      customAmenities: [
        {
          id: 'cr-201',
          hotelId,
          roomId: roomId201,
          name: 'Bồn tắm đá tự nhiên 201',
          description: 'Đặc thù phòng 201',
          attached: true,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:00:00Z',
          version: 0,
        },
      ],
      inheritedAmenities: [catalogRoomAmenities[0]], // r-1 (WIFI) inherited from room type
    })

    const html = renderComponent(
      <HotelAmenitiesManager
        hotelId={hotelId}
        roomId={roomId201}
        roomNumber="201"
        roomTypeName="Deluxe Hướng Biển"
      />,
      client,
    )

    // Inherited section
    expect(html).toContain('Tiện ích kế thừa từ hạng phòng')
    expect(html).toContain('Deluxe Hướng Biển')
    expect(html).toContain('Wi-Fi tốc độ cao')

    // Direct catalog section
    expect(html).toContain('Bổ sung từ danh mục')
    expect(html).toContain('Ban công hướng biển')

    // Custom room section
    expect(html).toContain('Tiện ích riêng')
    expect(html).toContain('Bồn tắm đá tự nhiên 201')
    expect(html).toContain('phòng 201')
  })

  it('isolates room 201 custom amenities from room 202', () => {
    const client = new QueryClient()

    client.setQueryData(hotelManagementKeys.amenities('api:ROOM'), catalogRoomAmenities)

    client.setQueryData(hotelManagementKeys.scopedAmenities(hotelId, roomId201), {
      hotelId,
      roomId: roomId201,
      catalogAmenities: [],
      customAmenities: [
        {
          id: 'c-201',
          hotelId,
          roomId: roomId201,
          name: 'Đèn ngủ phong cách vintage 201',
          description: null,
          attached: true,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:00:00Z',
          version: 0,
        },
      ],
      inheritedAmenities: [],
    })

    client.setQueryData(hotelManagementKeys.scopedAmenities(hotelId, roomId202), {
      hotelId,
      roomId: roomId202,
      catalogAmenities: [],
      customAmenities: [
        {
          id: 'c-202',
          hotelId,
          roomId: roomId202,
          name: 'Ghế massage cao cấp 202',
          description: null,
          attached: true,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:00:00Z',
          version: 0,
        },
      ],
      inheritedAmenities: [],
    })

    const html201 = renderComponent(
      <HotelAmenitiesManager hotelId={hotelId} roomId={roomId201} roomNumber="201" />,
      client,
    )
    const html202 = renderComponent(
      <HotelAmenitiesManager hotelId={hotelId} roomId={roomId202} roomNumber="202" />,
      client,
    )

    expect(html201).toContain('Đèn ngủ phong cách vintage 201')
    expect(html201).not.toContain('Ghế massage cao cấp 202')

    expect(html202).toContain('Ghế massage cao cấp 202')
    expect(html202).not.toContain('Đèn ngủ phong cách vintage 201')
  })

  it('renders detached custom amenities in the collapsible detached section with reattach button', () => {
    const client = new QueryClient()
    client.setQueryData(hotelManagementKeys.amenities('api:HOTEL'), catalogHotelAmenities)

    client.setQueryData(hotelManagementKeys.scopedAmenities(hotelId, undefined), {
      hotelId,
      roomId: null,
      catalogAmenities: [],
      customAmenities: [
        {
          id: 'c-detached',
          hotelId,
          roomId: null,
          name: 'Dịch vụ trà chiều',
          description: 'Tạm ngưng phục vụ',
          attached: false,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:05:00Z',
          version: 1,
        },
      ],
      inheritedAmenities: [],
    })

    const html = renderComponent(<HotelAmenitiesManager hotelId={hotelId} />, client)

    expect(html).toContain('Danh sách tiện ích đã tháo (1)')
    expect(html).toContain('Dịch vụ trà chiều')
    expect(html).toContain('Gắn lại')
    expect(html).toContain('Đang gắn: 0')
  })

  it('renders Room Type amenities mode without custom amenity section', () => {
    const client = new QueryClient()
    const roomTypeId = 'rt-101'
    client.setQueryData(hotelManagementKeys.amenities('api:ROOM'), catalogRoomAmenities)
    client.setQueryData(hotelManagementKeys.roomTypeAmenities(hotelId, roomTypeId), [
      catalogRoomAmenities[0],
    ])

    const html = renderComponent(
      <HotelAmenitiesManager
        hotelId={hotelId}
        roomTypeId={roomTypeId}
        roomTypeName="Deluxe King"
      />,
      client,
    )

    expect(html).toContain('Tiện ích có sẵn của hạng phòng')
    expect(html).toContain('Deluxe King')
    expect(html).toContain('Wi-Fi tốc độ cao')
    // Room type mode only configures catalog amenities, not custom amenities
    expect(html).not.toContain('Thêm tiện ích riêng')
  })
})
