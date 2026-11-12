import { describe, expect, it } from 'vitest'
import { createUserSchema } from './create-user-form-schema'

describe('createUserSchema validation', () => {
  it('validates a correct user payload successfully', () => {
    const validData = {
      fullName: 'Nguyễn Văn An',
      email: 'nguyenvanan@stayhub.vn',
      phone: '0912345678',
      role: 'CUSTOMER' as const,
    }

    const result = createUserSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Nguyễn Văn An')
      expect(result.data.role).toBe('CUSTOMER')
    }
  })

  it('rejects empty or too short full name', () => {
    const invalidData = {
      fullName: ' ',
      email: 'an@gmail.com',
      phone: '0912345678',
      role: 'ADMIN' as const,
    }

    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email address', () => {
    const invalidData = {
      fullName: 'Trần Bích Thảo',
      email: 'invalid-email-format',
      phone: '0988765432',
      role: 'HOTEL_OWNER' as const,
    }

    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone number that does not start with 0 or has invalid length', () => {
    const invalidData = {
      fullName: 'Lê Hoàng Nam',
      email: 'nam@gmail.com',
      phone: '123456',
      role: 'CUSTOMER' as const,
    }

    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
