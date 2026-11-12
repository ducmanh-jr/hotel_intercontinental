import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Tooltip } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { HOTEL_WORKSPACE_NAV_ITEMS } from '@/config/navigation.config'
import { useHotelWorkspace } from '../context/hotel-workspace-context'

export function HotelSubNav() {
  const location = useLocation()
  const { hotelId, isDraft, completion } = useHotelWorkspace()
  const isRoomsRoute = location.pathname.includes('/rooms')
  const [userToggledRooms, setUserToggledRooms] = useState<boolean | null>(null)
  const roomsExpanded = userToggledRooms !== null ? userToggledRooms : isRoomsRoute

  return (
    <nav className="hotel-sub-nav flex flex-col gap-1 p-2 flex-1 overflow-y-auto" aria-label="Thanh điều hướng khách sạn">
      {HOTEL_WORKSPACE_NAV_ITEMS.map((item) => {
        const IconComponent = item.icon
        const targetPath = item.path ? `/hotels/${hotelId}/${item.path}` : `/hotels/${hotelId}`
        const isExact = !item.path
        const isItemActive = isExact
          ? location.pathname === `/hotels/${hotelId}` || location.pathname === `/hotels/${hotelId}/`
          : location.pathname.startsWith(targetPath)

        const isSectionDone = completion.sections[item.key as keyof typeof completion.sections] ?? false
        const isDisabled = isDraft && Boolean(item.requireApproved)

        // Item có submenu (nhóm Phòng)
        if (item.children && item.children.length > 0) {
          return (
            <div key={item.key} className="flex flex-col">
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isItemActive
                    ? 'bg-[#d9f0ea] text-[#08473e] font-semibold'
                    : 'text-[#12211d] hover:bg-[#f7fbfa]'
                }`}
                onClick={() => setUserToggledRooms((prev) => !(prev !== null ? prev : isRoomsRoute))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setUserToggledRooms((prev) => !(prev !== null ? prev : isRoomsRoute))
                  }
                }}
                aria-expanded={roomsExpanded}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className="text-sm shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] ${
                      isSectionDone ? 'text-[#0f7a5f] font-bold' : 'text-[#8c9e99]'
                    }`}
                    title={isSectionDone ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                  >
                    {isSectionDone ? '✓' : '○'}
                  </span>
                  {roomsExpanded ? (
                    <DownOutlined className="text-[9px] text-[#5f736e]" />
                  ) : (
                    <RightOutlined className="text-[9px] text-[#5f736e]" />
                  )}
                </div>
              </div>

              {roomsExpanded && (
                <div className="pl-6 pr-1 py-1 flex flex-col gap-1 border-l-2 border-[#dce7e3] ml-4 mt-1">
                  {item.children.map((sub) => {
                    const subPath = `/hotels/${hotelId}/${sub.path}`
                    const isSubActive =
                      sub.path === 'rooms'
                        ? location.pathname === subPath ||
                          location.pathname === `${subPath}/new` ||
                          (location.pathname.startsWith(`${subPath}/`) && !location.pathname.includes('/amenities'))
                        : location.pathname.startsWith(subPath)

                    return (
                      <Link
                        key={sub.key}
                        to={subPath}
                        className={`px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between no-underline ${
                          isSubActive
                            ? 'bg-[#0b5f53] text-white font-medium'
                            : 'text-[#5f736e] hover:text-[#12211d] hover:bg-[#f7fbfa]'
                        }`}
                        aria-current={isSubActive ? 'page' : undefined}
                      >
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        // Item thông thường (không có submenu)
        if (isDisabled) {
          return (
            <Tooltip
              key={item.key}
              title="Khả dụng sau khi khách sạn được duyệt"
              placement="right"
            >
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs opacity-45 cursor-not-allowed select-none text-[#5f736e]"
                aria-disabled="true"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className="text-sm shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="text-[11px] text-[#8c9e99]">○</span>
              </div>
            </Tooltip>
          )
        }

        return (
          <Link
            key={item.key}
            to={targetPath}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors no-underline ${
              isItemActive
                ? 'bg-[#d9f0ea] text-[#08473e] font-semibold'
                : 'text-[#12211d] hover:bg-[#f7fbfa]'
            }`}
            aria-current={isItemActive ? 'page' : undefined}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent className="text-sm shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </div>

            <span
              className={`text-[11px] shrink-0 ${
                isSectionDone ? 'text-[#0f7a5f] font-bold' : 'text-[#8c9e99]'
              }`}
              title={isSectionDone ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
            >
              {isSectionDone ? '✓' : '○'}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
