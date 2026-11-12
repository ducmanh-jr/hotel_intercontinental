import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/api-error'
import { applyApiFieldErrors } from './form-errors'
import { formatCurrencyAmount, formatPhoneNumber, formatRoleLabel, slugifyHotelName } from './format'

describe('shared format & form-errors utilities', () => {
  it('converts Vietnamese hotel names into URL-safe slugs', () => {
    expect(slugifyHotelName('Khách sạn Đồi Thông Đà Lạt & Spa!')).toBe(
      'khach-san-doi-thong-da-lat-spa',
    )
    expect(slugifyHotelName('  InterContinental Hanoi Westlake  ')).toBe(
      'intercontinental-hanoi-westlake',
    )
  })

  it('formats currency amounts without altering numerical value', () => {
    const formatted = formatCurrencyAmount(1850000, 'VND')
    expect(formatted).toContain('1.850.000')
  })

  it('formats role labels into user-friendly Vietnamese', () => {
    expect(formatRoleLabel('HOTEL_OWNER')).toBe('Chủ khách sạn')
    expect(formatRoleLabel('OWNER')).toBe('Chủ khách sạn')
    expect(formatRoleLabel('ADMIN')).toBe('Quản trị viên')
    expect(formatRoleLabel('USER')).toBe('Khách hàng')
    expect(formatRoleLabel('CUSTOMER')).toBe('Khách hàng')
    expect(formatRoleLabel(null)).toBe('—')
  })

  it('formats phone numbers into readable spaced groups', () => {
    expect(formatPhoneNumber('+84123456788')).toBe('+84 123 456 788')
    expect(formatPhoneNumber('0901234567')).toBe('0901 234 567')
    expect(formatPhoneNumber(null)).toBe('—')
    expect(formatPhoneNumber('')).toBe('—')
  })

  it('maps ApiError field errors onto react-hook-form setError', () => {
    const calls: Array<{ field: string; message?: string }> = []
    const apiError = new ApiError('Dữ liệu không hợp lệ.', {
      kind: 'http',
      status: 400,
      errors: [
        { field: 'slug', message: 'Slug đã tồn tại trong hệ thống.' },
        { field: 'ownerUserId', message: 'Owner không tồn tại.' },
      ],
    })

    const count = applyApiFieldErrors<{ slug: string; ownerUserId: string }>(
      apiError,
      (field, option) => {
        calls.push({ field, message: option.message })
      },
      ['slug', 'ownerUserId'],
    )

    expect(count).toBe(2)
    expect(calls).toEqual([
      { field: 'slug', message: 'Slug đã tồn tại trong hệ thống.' },
      { field: 'ownerUserId', message: 'Owner không tồn tại.' },
    ])
  })
})
