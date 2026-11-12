

export const financialAccessKeys = {
  all: ['finance'] as const,
  grant: (mode: string, hotelId: string, userId: string) =>
    ['finance', 'access-grant', mode, hotelId, userId] as const,
}
