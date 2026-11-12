import type { ManagementHotelDetail } from '../model/hotel'
import { CreateHotelForm } from './CreateHotelForm'

export interface QuickCreateHotelFormProps {
  onSuccess: (created: ManagementHotelDetail) => void
  onCancel: () => void
}

export function QuickCreateHotelForm(props: QuickCreateHotelFormProps) {
  return <CreateHotelForm {...props} />
}
