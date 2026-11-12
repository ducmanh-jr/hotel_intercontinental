import type { CreateHotelContractFormValues } from '../model/contract-form-schema'
import type { HotelCommissionContract } from '../model/contract'

let mockContractsStore: HotelCommissionContract[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    hotelId: '33333333-3333-4333-8333-333333333301',
    contractCode: 'CTR-2026-IHG-01',
    commissionPercentage: 12.5,
    currency: 'VND',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    termsSummary:
      'Thỏa thuận hoa hồng tiêu chuẩn đối tác chiến lược 5 sao IHG. Đối soát định kỳ ngày 05 và 20 hàng tháng dựa trên khoản thực thu sau voucher của khách sạn.',
    createdByUserId: '88888888-8888-4888-8888-888888888801',
    createdAt: '2025-12-20T09:00:00Z',
  },
]

export async function getMockHotelContracts(
  hotelId: string,
): Promise<HotelCommissionContract[]> {
  return mockContractsStore.filter((item) => item.hotelId === hotelId)
}

export async function createMockHotelContractDraft(
  hotelId: string,
  payload: CreateHotelContractFormValues,
): Promise<HotelCommissionContract> {
  const created: HotelCommissionContract = {
    id: `55555555-5555-4555-8555-${String(Date.now()).slice(-12).padStart(12, '0')}`,
    hotelId,
    contractCode: payload.contractCode,
    commissionPercentage: payload.commissionPercentage,
    currency: payload.currency,
    effectiveFrom: payload.effectiveFrom,
    effectiveTo: payload.effectiveTo,
    status: 'DRAFT',
    termsSummary: payload.termsSummary,
    createdByUserId: '88888888-8888-4888-8888-888888888801',
    createdAt: new Date().toISOString(),
  }
  mockContractsStore = [created, ...mockContractsStore]
  return created
}
