import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changeInventory, getRoomBlocks, getRoomCalendar, type CalendarQuery, type InventoryChange } from '../api/inventory-api'

export function useInventory(hotelId: string, range: CalendarQuery, enabled = true) {
  const client = useQueryClient()
  const prefix = ['rooms', 'inventory', hotelId]
  const calendar = useQuery({
    queryKey: [...prefix, 'calendar', range],
    queryFn: ({ signal }) => getRoomCalendar(hotelId, range, signal),
    enabled: Boolean(hotelId) && enabled,
    retry: false,
  })
  const blocks = useQuery({
    queryKey: [...prefix, 'blocks', range],
    queryFn: ({ signal }) => getRoomBlocks(hotelId, range, signal),
    enabled: Boolean(hotelId) && enabled,
    retry: false,
  })
  const mutation = useMutation({ mutationFn: (change: InventoryChange) => changeInventory(hotelId, change), retry: false, onSettled: () => Promise.all([
    client.invalidateQueries({ queryKey: prefix }),
    client.invalidateQueries({ queryKey: ['rooms', 'management-list', hotelId] }),
  ]) })
  return { calendar, blocks, mutation }
}
