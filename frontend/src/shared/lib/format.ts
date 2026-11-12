/**
 * Định dạng số tiền hiển thị theo đơn vị tiền tệ (không tự tính toán lại giá/tồn/voucher).
 */
export function formatCurrencyAmount(amount: number, currency = 'VND'): string {
  const normalizedCurrency = currency.trim().toUpperCase() || 'VND'
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === 'VND' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${normalizedCurrency}`
  }
}

/**
 * Chuẩn hóa chuỗi tên khách sạn thành slug URL thân thiện (hỗ trợ tiếng Việt).
 */
export function slugifyHotelName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Chuẩn hóa mã vai trò (Role) sang tên hiển thị tiếng Việt thân thiện.
 */
export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return '—'
  const normalized = role.trim().toUpperCase()
  switch (normalized) {
    case 'ADMIN':
    case 'ROLE_ADMIN':
      return 'Quản trị viên'
    case 'HOTEL_OWNER':
    case 'ROLE_HOTEL_OWNER':
    case 'OWNER':
    case 'ROLE_OWNER':
      return 'Chủ khách sạn'
    case 'CUSTOMER':
    case 'ROLE_CUSTOMER':
    case 'USER':
    case 'ROLE_USER':
      return 'Khách hàng'
    default:
      return role
  }
}

/**
 * Định dạng số điện thoại hiển thị đẹp mắt và dễ đọc (VD: +84 123 456 788 hoặc 0901 234 567).
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—'
  const trimmed = phone.trim()
  if (!trimmed) return '—'

  // Chuỗi dạng +84xxxxxxxxx
  if (trimmed.startsWith('+84') && trimmed.length >= 11) {
    const rest = trimmed.slice(3)
    if (rest.length === 9) {
      return `+84 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
    }
    if (rest.length === 10) {
      return `+84 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
    }
  }

  // Chuỗi dạng 0xxxxxxxxx (10 số)
  if (trimmed.startsWith('0') && trimmed.length === 10) {
    return `${trimmed.slice(0, 4)} ${trimmed.slice(4, 7)} ${trimmed.slice(7)}`
  }

  return trimmed
}
