import type { ComponentType } from 'react'
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  EditOutlined,
  FileTextOutlined,
  HomeOutlined,
  InsertRowAboveOutlined,
  MessageOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
  CloudServerOutlined,
  DollarOutlined,
} from '@ant-design/icons'

export interface MainNavItem {
  key: string
  label: string
  to: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  adminOnly?: boolean
  ownerOnly?: boolean
  exact?: boolean
  matchPrefix?: string
}

export interface MainNavGroup {
  title: string
  adminOnly?: boolean
  items: MainNavItem[]
}

export interface HotelWorkspaceSubNavItem {
  key: string
  label: string
  path: string // sub-path relative to /hotels/:hotelId/
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  requireApproved?: boolean // Bị mờ và tooltip nếu khách sạn là DRAFT
  children?: {
    key: string
    label: string
    path: string
  }[]
}

/**
 * CẤP 1: Danh mục điều hướng thanh bên toàn hệ thống
 */
export const MAIN_NAV_GROUPS: MainNavGroup[] = [
  {
    title: 'Bảng điều khiển',
    items: [
      {
        key: 'overview',
        label: 'Tổng quan',
        to: '/admin/overview',
        icon: AppstoreOutlined,
        exact: true,
      },
    ],
  },
  {
    title: 'Quản lý cơ sở & Vận hành',
    items: [
      {
        key: 'hotels',
        label: 'Khách sạn',
        to: '/hotels',
        icon: ShopOutlined,
        matchPrefix: '/hotels',
      },
      {
        key: 'bookings',
        label: 'Đặt phòng',
        to: '/bookings',
        icon: CalendarOutlined,
      },
      {
        key: 'customers',
        label: 'Khách hàng',
        to: '/customers',
        icon: UserOutlined,
      },
      {
        key: 'vouchers',
        label: 'Voucher & Ưu đãi',
        to: '/vouchers',
        icon: TagOutlined,
      },
      {
        key: 'complaints',
        label: 'Khiếu nại',
        to: '/complaints',
        icon: MessageOutlined,
      },
    ],
  },
  {
    title: 'Quản lý doanh thu & Tài chính',
    items: [
      {
        key: 'finance',
        label: 'Quản lý doanh thu',
        to: '/finance',
        icon: CreditCardOutlined,
      },
      {
        key: 'reports',
        label: 'Báo cáo doanh thu',
        to: '/reports',
        icon: BarChartOutlined,
      },
      {
        key: 'contracts',
        label: 'Hợp đồng lưu trú',
        to: '/contracts',
        icon: FileTextOutlined,
      },
      {
        key: 'financial-access',
        label: 'Phân quyền tài chính',
        to: '/financial-access',
        icon: SafetyCertificateOutlined,
      },
    ],
  },
  {
    title: 'Hệ thống & Quản trị',
    adminOnly: true,
    items: [
      {
        key: 'users',
        label: 'Người dùng & Phân quyền',
        to: '/admin/users',
        icon: TeamOutlined,
        adminOnly: true,
      },
      {
        key: 'system-status',
        label: 'Trạng thái máy chủ',
        to: '/system-status',
        icon: CloudServerOutlined,
        adminOnly: true,
      },
    ],
  },
]

/**
 * CẤP 2: Danh mục điều hướng trong ngữ cảnh khách sạn (/hotels/:hotelId/*)
 */
export const HOTEL_WORKSPACE_NAV_ITEMS: HotelWorkspaceSubNavItem[] = [
  {
    key: 'overview',
    label: 'Tổng quan',
    path: '',
    icon: HomeOutlined,
  },
  {
    key: 'info',
    label: 'Thông tin chung',
    path: 'info',
    icon: EditOutlined,
  },
  {
    key: 'photos',
    label: 'Hình ảnh',
    path: 'photos',
    icon: PictureOutlined,
  },
  {
    key: 'amenities',
    label: 'Tiện ích khách sạn',
    path: 'amenities',
    icon: AppstoreAddOutlined,
  },
  {
    key: 'rooms',
    label: 'Phòng',
    path: 'rooms',
    icon: InsertRowAboveOutlined,
    children: [
      {
        key: 'rooms-list',
        label: 'Loại phòng',
        path: 'rooms',
      },
      {
        key: 'rooms-amenities',
        label: 'Tiện ích phòng',
        path: 'rooms/amenities',
      },
    ],
  },
  {
    key: 'pricing',
    label: 'Giá & Tồn kho',
    path: 'pricing',
    icon: DollarOutlined,
  },
  {
    key: 'policies',
    label: 'Chính sách',
    path: 'policies',
    icon: SafetyCertificateOutlined,
  },
  {
    key: 'bookings',
    label: 'Đặt phòng',
    path: 'bookings',
    icon: CalendarOutlined,
    requireApproved: true,
  },
  {
    key: 'reviews',
    label: 'Đánh giá',
    path: 'reviews',
    icon: StarOutlined,
    requireApproved: true,
  },
]
