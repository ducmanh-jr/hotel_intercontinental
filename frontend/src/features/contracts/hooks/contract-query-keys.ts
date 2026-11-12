

export const contractKeys = {
  all: ['contracts'] as const,
  byHotel: (mode: string, hotelId: string) =>
    ['contracts', 'by-hotel', mode, hotelId] as const,
}
