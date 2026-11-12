import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { CreateHotelForm } from '@/features/hotels'
import { PageHeader } from '@/shared/ui/PageHeader'

export function HotelCreatePage() {
  const navigate = useNavigate()

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: 'Thêm mới' },
  ]

  return (
    <div className="hotel-create-page max-w-6xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="KHỞI TẠO HỒ SƠ"
        title="Thêm khách sạn mới"
        description="Điền thông tin định danh, địa chỉ, chọn tọa độ chính xác trên bản đồ, tải bộ sưu tập hình ảnh và quy định giờ lưu trú để tạo hồ sơ khách sạn mới."
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hotels')}
          >
            Quay lại danh sách
          </Button>
        }
      />

      <CreateHotelForm
        onSuccess={(created) => {
          navigate(`/hotels/${created.id}`)
        }}
        onCancel={() => navigate('/hotels')}
      />
    </div>
  )
}
