import { sanitizeReturnTo } from './sanitize-return-to'

export interface AdminLoginDestinationOptions {
  allowManagement?: boolean
  isOwnerOnly?: boolean
}

/** Only admin & management destinations can follow an admin/owner login; never return to the login itself. */
export function adminLoginDestination(
  value: unknown,
  options?: AdminLoginDestinationOptions,
): string {
  const allowManagement = options?.allowManagement ?? false
  const isOwnerOnly = options?.isOwnerOnly ?? false
  const defaultFallback = isOwnerOnly ? '/management/hotels' : '/admin/overview'

  const destination = sanitizeReturnTo(value)
  if (destination) {
    try {
      const pathname = decodeURIComponent(new URL(destination, 'https://stayhub.internal').pathname)
      if (/^\/admin\/.+/i.test(pathname) && !/^\/admin\/login(?:\/|$)/i.test(pathname)) {
        if (isOwnerOnly && /^\/admin\/users(?:\/|$)/i.test(pathname)) {
          return '/management/hotels'
        }
        return destination
      }
      if (allowManagement && /^\/management\/.+/i.test(pathname)) {
        return destination
      }
    } catch {
      // Đường dẫn lỗi hoặc chưa xác định sẽ về trang Tổng quan hoặc Quản lý khách sạn.
    }
  }
  return defaultFallback
}
