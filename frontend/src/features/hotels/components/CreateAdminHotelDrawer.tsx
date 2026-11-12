import { Drawer } from 'antd'
import type { CityItem, ManagementHotelDetail } from '../model/hotel'
import { CreateHotelForm } from './CreateHotelForm'

interface CreateAdminHotelDrawerProps {
  open: boolean
  onClose: () => void
  cities: CityItem[]
  onCreated?: (hotel: ManagementHotelDetail) => void
}

export function CreateAdminHotelDrawer({ open, onClose, onCreated }: CreateAdminHotelDrawerProps) {
  return (
    <Drawer title="Tạo khách sạn mới" size="large" open={open} onClose={onClose} destroyOnHidden>
      <CreateHotelForm onCancel={onClose} onSuccess={(hotel) => {
        onCreated?.(hotel)
        onClose()
      }} />
    </Drawer>
  )
}
