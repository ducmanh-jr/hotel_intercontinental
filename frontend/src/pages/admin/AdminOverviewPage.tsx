import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CloudServerOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  LoadingOutlined,
  LockOutlined,
  MessageOutlined,
  ShopOutlined,
  TagOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { useCurrentUser } from '@/features/auth'
import { formatRoleLabel } from '@/shared/lib/format'

export function AdminOverviewPage() {
  const navigate = useNavigate()
  const { currentUser, isChecking } = useCurrentUser()
  const [healthModalOpen, setHealthModalOpen] = useState(false)
  const [healthChecking, setHealthChecking] = useState(false)
  const [healthChecked, setHealthChecked] = useState(false)
  const [placeholderModule, setPlaceholderModule] = useState<string | null>(null)

  const userFullName = currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Nguyễn Văn C')
  const userEmail = currentUser?.email || 'an.demo06@example.test'
  const userRoles = currentUser?.roles && currentUser.roles.length > 0 ? currentUser.roles : ['ADMIN', 'HOTEL_OWNER']
  const userInitials =
    userFullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'VC'

  const runSimulatedHealth = () => {
    setHealthModalOpen(true)
    setHealthChecking(true)
    setHealthChecked(false)
    setTimeout(() => {
      setHealthChecking(false)
      setHealthChecked(true)
    }, 900)
  }

  return (
    <div className="flex flex-col gap-7 w-full max-w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#dce7e3]">
        <div>
          <h1
            id="dashboardTitle"
            tabIndex={-1}
            className="text-[28px] sm:text-[32px] font-bold tracking-[-0.035em] text-[#12211d] leading-[1.12] m-0 outline-none"
          >
            Tổng quan
          </h1>
          <p className="text-[15px] text-[#5f736e] mt-1.5 mb-0 max-w-[68ch] leading-relaxed">
            Theo dõi nhu cầu, doanh thu và vận hành StayHub trong một màn hình.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="console-primary-btn shrink-0 self-start sm:self-auto"
          style={{ color: '#ffffff', backgroundColor: '#0b5f53' }}
        >
          <UserAddOutlined className="!text-white text-sm" style={{ color: '#ffffff' }} aria-hidden="true" />
          <span className="!text-white font-semibold" style={{ color: '#ffffff' }}>Quản lý tài khoản</span>
        </button>
      </div>

      {/* 2. Priority Work Queue */}
      <section className="flex flex-col gap-3" aria-labelledby="queue-heading">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h2
            id="queue-heading"
            className="text-[11px] font-bold uppercase tracking-[.12em] text-[#40564f] m-0"
          >
            Công việc cần xử lý
          </h2>
          <span className="text-[12.5px] text-[#5f736e]">
            Dữ liệu minh họa · Ưu tiên theo hạn xử lý
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Queue Card 1: Bookings */}
          <button
            type="button"
            onClick={() => setPlaceholderModule('Đặt phòng')}
            className="queue-card p-4 flex flex-col justify-between text-left cursor-pointer border-[#dce7e3] bg-white group min-h-[108px]"
          >
            <div className="text-[11px] font-bold text-[#5f736e] uppercase tracking-[.11em] text-center mb-1">
              ĐẶT PHÒNG
            </div>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center shrink-0 text-base">
                  <CalendarOutlined />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl font-bold text-[#0b5f53] tabular-nums leading-none tracking-[-0.04em]">
                    28
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#12211d] truncate">
                    đơn chờ xử lý
                  </span>
                </div>
              </div>
              <ArrowRightOutlined className="queue-arrow text-xs text-[#5f736e] transition-transform duration-150 shrink-0" />
            </div>
            <div className="text-[11.5px] font-semibold text-[#8a5a13] mt-2 text-center sm:text-left truncate">
              7 đơn quá 12 giờ
            </div>
          </button>

          {/* Queue Card 2: Complaints */}
          <button
            type="button"
            onClick={() => setPlaceholderModule('Khiếu nại')}
            className="queue-card p-4 flex flex-col justify-between text-left cursor-pointer border-[#dce7e3] bg-white group min-h-[108px]"
          >
            <div className="text-[11px] font-bold text-[#5f736e] uppercase tracking-[.11em] text-center mb-1">
              KHIẾU NẠI
            </div>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center shrink-0 text-base">
                  <MessageOutlined />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl font-bold text-[#0b5f53] tabular-nums leading-none tracking-[-0.04em]">
                    6
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#12211d] truncate">
                    khiếu nại mở
                  </span>
                </div>
              </div>
              <ArrowRightOutlined className="queue-arrow text-xs text-[#5f736e] transition-transform duration-150 shrink-0" />
            </div>
            <div className="text-[11.5px] font-semibold text-[#8a5a13] mt-2 text-center sm:text-left truncate">
              2 quá SLA
            </div>
          </button>

          {/* Queue Card 3: Finance */}
          <button
            type="button"
            onClick={() => setPlaceholderModule('Tài chính')}
            className="queue-card p-4 flex flex-col justify-between text-left cursor-pointer border-[#dce7e3] bg-white group min-h-[108px]"
          >
            <div className="text-[11px] font-bold text-[#5f736e] uppercase tracking-[.11em] text-center mb-1">
              TÀI CHÍNH
            </div>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center shrink-0 text-base">
                  <CreditCardOutlined />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl font-bold text-[#0b5f53] tabular-nums leading-none tracking-[-0.04em]">
                    4
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#12211d] truncate">
                    hoàn tiền chờ duyệt
                  </span>
                </div>
              </div>
              <ArrowRightOutlined className="queue-arrow text-xs text-[#5f736e] transition-transform duration-150 shrink-0" />
            </div>
            <div className="text-[11.5px] text-[#5f736e] mt-2 text-center sm:text-left truncate">
              Tổng 12,6 triệu
            </div>
          </button>

          {/* Queue Card 4: Vouchers */}
          <button
            type="button"
            onClick={() => setPlaceholderModule('Voucher')}
            className="queue-card p-4 flex flex-col justify-between text-left cursor-pointer border-[#dce7e3] bg-white group min-h-[108px]"
          >
            <div className="text-[11px] font-bold text-[#5f736e] uppercase tracking-[.11em] text-center mb-1">
              VOUCHER
            </div>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center shrink-0 text-base">
                  <TagOutlined />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl font-bold text-[#0b5f53] tabular-nums leading-none tracking-[-0.04em]">
                    3
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#12211d] truncate">
                    voucher sắp hết h...
                  </span>
                </div>
              </div>
              <ArrowRightOutlined className="queue-arrow text-xs text-[#5f736e] transition-transform duration-150 shrink-0" />
            </div>
            <div className="text-[11.5px] text-[#5f736e] mt-2 text-center sm:text-left truncate">
              Trong 7 ngày
            </div>
          </button>
        </div>
      </section>

      {/* 3. Business Analytics Visualizations */}
      <section className="flex flex-col gap-3" aria-labelledby="analytics-heading">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h2
            id="analytics-heading"
            className="text-[11px] font-bold uppercase tracking-[.12em] text-[#40564f] m-0"
          >
            Hiệu suất kinh doanh
          </h2>
          <span className="text-[12.5px] text-[#5f736e]">
            Tháng 5–10/2026 · Dữ liệu minh họa
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Chart 1: Bookings over time (Wide 7/12) */}
          <figure className="console-card lg:col-span-7 p-5 flex flex-col justify-between gap-4 m-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#5f736e]">
                    NHU CẦU ĐẶT PHÒNG
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#12211d] m-0 mt-0.5">
                    Lượng đặt phòng theo thời gian
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tracking-[-0.035em] text-[#12211d] tabular-nums">
                    1.429
                  </span>
                  <span className="text-xs text-[#5f736e] ml-1">lượt / 6 tháng</span>
                </div>
              </div>

              {/* Trend indicator */}
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf6f1] text-[#0f7a5f]">
                  +18,6%
                </span>
                <span className="text-xs text-[#5f736e]">so với 6 tháng trước</span>
              </div>
            </div>

            {/* Vertical Bar Chart Visual */}
            <div
              className="h-[188px] flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-1 px-2 border-b border-[#dce7e3]"
              role="img"
              aria-label="Biểu đồ cột thể hiện lượt đặt phòng qua các tháng từ T5 đến T10 năm 2026. T5: 186, T6: 224, T7: 268, T8 đạt đỉnh 295, T9: 242, T10: 214 lượt."
            >
              {[
                { month: 'T5', value: 186, height: '63.1%' },
                { month: 'T6', value: 224, height: '75.9%' },
                { month: 'T7', value: 268, height: '90.8%' },
                { month: 'T8', value: 295, height: '100%', isPeak: true },
                { month: 'T9', value: 242, height: '82%' },
                { month: 'T10', value: 214, height: '72.5%' },
              ].map((bar) => (
                <div key={bar.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-semibold text-[#12211d] tabular-nums mb-1 opacity-90">
                    {bar.value}
                  </span>
                  <div className="w-full max-w-[38px] bg-[#eef8f5] rounded-t-md overflow-hidden flex items-end h-[140px]">
                    <div
                      style={{ height: bar.height }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        bar.isPeak ? 'bg-[#08473e]' : 'bg-[#0b5f53] opacity-85 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#5f736e] mt-2">
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>

            <figcaption className="text-xs text-[#5f736e] pt-1 leading-relaxed">
              Tháng 8 là cao điểm với 295 lượt; nhu cầu vẫn duy trì trên 200 lượt/tháng trong toàn bộ giai đoạn.
            </figcaption>
          </figure>

          {/* Chart 2: Platform revenue over time (Narrow 5/12) */}
          <figure className="console-card lg:col-span-5 p-5 flex flex-col justify-between gap-4 m-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#5f736e]">
                    PHÍ NỀN TẢNG
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#12211d] m-0 mt-0.5">
                    Doanh thu nền tảng theo thời gian
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tracking-[-0.035em] text-[#12211d] tabular-nums">
                    4,75 tỷ
                  </span>
                  <span className="text-xs text-[#5f736e] ml-1">đồng / 6 tháng</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf6f1] text-[#0f7a5f]">
                  +12,4%
                </span>
                <span className="text-xs text-[#5f736e]">phí & hoa hồng StayHub</span>
              </div>
            </div>

            {/* SVG Line / Area Visual with points and data labels */}
            <div
              className="h-[188px] flex flex-col justify-end relative pt-2"
              role="img"
              aria-label="Biểu đồ đường thể hiện doanh thu phí từ T5 đến T10. T5: 620tr, T6: 748tr, T7: 892tr, T8 cao nhất 968tr, T9: 806tr, T10: 712 triệu đồng."
            >
              <div className="relative w-full h-[140px]">
                {/* Point Labels above circles */}
                <div className="absolute inset-0 pointer-events-none flex justify-between px-2 text-[10.5px] font-semibold text-[#12211d] tabular-nums">
                  <span style={{ transform: 'translate(-2px, 32px)' }}>620</span>
                  <span style={{ transform: 'translate(0px, 14px)' }}>748</span>
                  <span style={{ transform: 'translate(0px, -2px)' }}>892</span>
                  <span style={{ transform: 'translate(0px, -12px)' }} className="font-bold text-[#08473e]">968</span>
                  <span style={{ transform: 'translate(0px, 10px)' }}>806</span>
                  <span style={{ transform: 'translate(2px, 20px)' }}>712</span>
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0b5f53" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#0b5f53" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 12 76 L 72 58 L 132 40 L 192 24 L 252 50 L 308 62 L 308 120 L 12 120 Z"
                    fill="url(#revenueFill)"
                  />
                  <path
                    d="M 12 76 L 72 58 L 132 40 L 192 24 L 252 50 L 308 62"
                    fill="none"
                    stroke="#0b5f53"
                    strokeWidth="2"
                  />
                  {/* Points with white center and teal border */}
                  <circle cx="12" cy="76" r="3.5" fill="#ffffff" stroke="#0b5f53" strokeWidth="2" />
                  <circle cx="72" cy="58" r="3.5" fill="#ffffff" stroke="#0b5f53" strokeWidth="2" />
                  <circle cx="132" cy="40" r="3.5" fill="#ffffff" stroke="#0b5f53" strokeWidth="2" />
                  <circle cx="192" cy="24" r="4.5" fill="#ffffff" stroke="#08473e" strokeWidth="2.5" />
                  <circle cx="252" cy="50" r="3.5" fill="#ffffff" stroke="#0b5f53" strokeWidth="2" />
                  <circle cx="308" cy="62" r="3.5" fill="#ffffff" stroke="#0b5f53" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between items-center px-2 text-[11.5px] font-semibold text-[#5f736e] border-t border-[#dce7e3] pt-2">
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>T8</span>
                <span>T9</span>
                <span>T10</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[10.5px] text-[#5f736e] mt-1">
                <span>Đơn vị: triệu đ</span>
                <span>Cao nhất: T8 · 968</span>
              </div>
            </div>

            <figcaption className="text-xs text-[#5f736e] pt-1 leading-relaxed">
              Tháng 8 thu 968 triệu đ phí nền tảng; tổng 6 tháng đạt 4,75 tỷ đ.
            </figcaption>
          </figure>

          {/* Chart 3: Booking status composition (Narrow 5/12) */}
          <figure className="console-card lg:col-span-5 p-5 flex flex-col justify-between gap-4 m-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#5f736e]">
                    CƠ CẤU ĐƠN THÁNG 10
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#12211d] m-0 mt-0.5">
                    Tỷ lệ trạng thái đặt phòng
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tracking-[-0.035em] text-[#12211d] tabular-nums">
                    214
                  </span>
                  <span className="text-xs text-[#5f736e] ml-1">đơn tháng 10</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fbf2e2] text-[#946412]">
                  10,3% hủy
                </span>
                <span className="text-xs text-[#5f736e]">trong ngưỡng kiểm soát</span>
              </div>
            </div>

            {/* SVG Donut Visual and Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
              <div className="relative w-[150px] h-[150px] shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Segment 1: Completed 52.3% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="transparent"
                    stroke="#0b5f53"
                    strokeWidth="18"
                    strokeDasharray="51.3 48.7"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Confirmed 24.3% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="transparent"
                    stroke="#4e9b86"
                    strokeWidth="18"
                    strokeDasharray="23.3 76.7"
                    strokeDashoffset="-52.3"
                  />
                  {/* Segment 3: Pending 13.1% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="transparent"
                    stroke="#946412"
                    strokeWidth="18"
                    strokeDasharray="12.1 87.9"
                    strokeDashoffset="-76.6"
                  />
                  {/* Segment 4: Cancelled 10.3% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="transparent"
                    stroke="#b45143"
                    strokeWidth="18"
                    strokeDasharray="9.3 90.7"
                    strokeDashoffset="-89.7"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-bold text-[#12211d] tabular-nums leading-none">
                    214
                  </span>
                  <span className="text-[10.5px] text-[#5f736e] mt-0.5">
                    đơn tháng 10
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <ul className="flex flex-col gap-2 p-0 m-0 list-none text-xs w-full sm:w-auto">
                <li className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0b5f53] shrink-0" />
                    <span className="text-[#344a44]">Đã hoàn tất</span>
                  </div>
                  <span className="font-bold text-[#12211d] tabular-nums">112 (52,3%)</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4e9b86] shrink-0" />
                    <span className="text-[#344a44]">Đã xác nhận</span>
                  </div>
                  <span className="font-bold text-[#12211d] tabular-nums">52 (24,3%)</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#946412] shrink-0" />
                    <span className="text-[#344a44]">Chờ xử lý</span>
                  </div>
                  <span className="font-bold text-[#12211d] tabular-nums">28 (13,1%)</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b45143] shrink-0" />
                    <span className="text-[#344a44]">Đã hủy</span>
                  </div>
                  <span className="font-bold text-[#12211d] tabular-nums">22 (10,3%)</span>
                </li>
              </ul>
            </div>

            <figcaption className="text-xs text-[#5f736e] pt-1 leading-relaxed">
              Tỷ lệ hủy tháng 10 ở mức 10,3% (22 đơn); 164 đơn đã xác nhận hoặc hoàn tất.
            </figcaption>
          </figure>

          {/* Chart 4: Top hotels by booking value (Wide 7/12) */}
          <figure className="console-card lg:col-span-7 p-5 flex flex-col justify-between gap-4 m-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#5f736e]">
                    TOP KHÁCH SẠN THÁNG 10
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#12211d] m-0 mt-0.5">
                    Doanh thu đặt phòng theo khách sạn
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tracking-[-0.035em] text-[#12211d] tabular-nums">
                    1,78 tỷ
                  </span>
                  <span className="text-xs text-[#5f736e] ml-1">top 5 / tháng 10</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf6f1] text-[#0f7a5f]">
                  The Anam dẫn đầu
                </span>
                <span className="text-xs text-[#5f736e]">đóng góp 27,3% doanh số top 5</span>
              </div>
            </div>

            {/* Ranked Horizontal Bars */}
            <ol className="flex flex-col gap-3 p-0 m-0 list-none">
              {[
                { rank: 1, name: 'The Anam Resort', value: '486 triệu', width: '100%', isLead: true },
                { rank: 2, name: 'Furama Đà Nẵng', value: '412 triệu', width: '85%' },
                { rank: 3, name: 'Sunset Sanato', value: '338 triệu', width: '70%' },
                { rank: 4, name: 'Vinpearl Nha Trang', value: '296 triệu', width: '61%' },
                { rank: 5, name: 'InterContinental Phú Quốc', value: '251 triệu', width: '52%' },
              ].map((item) => (
                <li key={item.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-[#eef8f5] text-[#0b5f53] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {item.rank}
                      </span>
                      <span className="font-semibold text-[#12211d] truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-[#12211d] tabular-nums shrink-0 ml-2">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full h-[7px] rounded-full bg-[#eef8f5] overflow-hidden">
                    <div
                      style={{ width: item.width }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isLead ? 'bg-[#08473e]' : 'bg-[#0b5f53] opacity-80'
                      }`}
                    />
                  </div>
                </li>
              ))}
            </ol>

            <figcaption className="text-xs text-[#5f736e] pt-1 leading-relaxed">
              Top 5 đóng góp 1,78 tỷ đ doanh số; The Anam Resort đạt cao nhất với 486 triệu đ.
            </figcaption>
          </figure>

          {/* Chart 5: Cancellation rate over time (Full width 12/12) */}
          <figure className="console-card lg:col-span-12 p-5 flex flex-col justify-between gap-4 m-0">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#5f736e]">
                    RỦI RO HỦY ĐƠN
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#12211d] m-0 mt-0.5">
                    Tỷ lệ hủy phòng theo tháng
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tracking-[-0.035em] text-[#12211d] tabular-nums">
                    9,4%
                  </span>
                  <span className="text-xs text-[#5f736e] ml-1">trung bình 6 tháng</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fbf2e2] text-[#946412]">
                  Đỉnh T8 (12,8%)
                </span>
                <span className="text-xs text-[#5f736e]">ảnh hưởng thời tiết mưa bão</span>
              </div>
            </div>

            {/* Area Line SVG Chart for Cancellations */}
            <div
              className="h-[150px] flex flex-col justify-end relative pt-2"
              role="img"
              aria-label="Biểu đồ tỷ lệ hủy phòng: T5 8.4%, T6 7.9%, T7 10.6%, T8 cao nhất 12.8%, T9 9.2%, T10 7.4%."
            >
              <svg className="w-full h-[110px] overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cancelFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b45143" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#b45143" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 62 Q 130 68 240 40 T 360 12 T 480 52 T 580 72 L 580 100 L 20 100 Z"
                  fill="url(#cancelFill)"
                />
                <path
                  d="M 20 62 Q 130 68 240 40 T 360 12 T 480 52 T 580 72"
                  fill="none"
                  stroke="#b45143"
                  strokeWidth="2.5"
                />
                {/* Dots with values */}
                <circle cx="20" cy="62" r="3.5" fill="#b45143" />
                <circle cx="130" cy="68" r="3.5" fill="#b45143" />
                <circle cx="240" cy="40" r="3.5" fill="#b45143" />
                <circle cx="360" cy="12" r="5" fill="#b45143" stroke="#ffffff" strokeWidth="2" />
                <circle cx="480" cy="52" r="3.5" fill="#b45143" />
                <circle cx="580" cy="72" r="3.5" fill="#b45143" />
              </svg>

              <div className="flex justify-between items-center px-3 text-[11.5px] font-semibold text-[#5f736e] border-t border-[#dce7e3] pt-2">
                <span>T5 (8,4%)</span>
                <span>T6 (7,9%)</span>
                <span>T7 (10,6%)</span>
                <span className="text-[#946412] font-bold">T8 (12,8%)</span>
                <span>T9 (9,2%)</span>
                <span>T10 (7,4%)</span>
              </div>
            </div>

            <figcaption className="text-xs text-[#5f736e] pt-1 leading-relaxed">
              Đợt hủy tăng mạnh trong tháng 8 do thời tiết bão; tỷ lệ đã giảm về 7,4% trong tháng 10.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 4. Session and Infrastructure Status */}
      <section className="flex flex-col gap-3" aria-labelledby="status-heading">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h2
            id="status-heading"
            className="text-[11px] font-bold uppercase tracking-[.12em] text-[#40564f] m-0"
          >
            Phiên quản trị & Hạ tầng
          </h2>
          <span className="text-[12.5px] text-[#5f736e]">
            Bản xem trước · dữ liệu mô phỏng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Current Admin Account */}
          <div className="console-card p-5 flex flex-col justify-between gap-4 min-h-[190px]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-[#0b5f53] uppercase tracking-wider">
                  Tài khoản phiên làm việc
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5f736e]" />
                  <span>Phiên demo</span>
                </span>
              </div>

              <div className="flex items-center gap-3.5 mt-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#0b5f53] text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-[#12211d] truncate m-0 leading-snug">
                    {isChecking ? 'Đang kiểm tra...' : userFullName}
                  </h3>
                  <span className="text-xs text-[#5f736e] truncate mt-0.5">
                    {userEmail}
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {userRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#d9f0ea] text-[#08473e]"
                      >
                        {formatRoleLabel(role)}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#eef8f5] text-[#0b5f53] border border-[#d6ebe5]">
                      Phiên demo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dce7e3] flex items-center justify-between text-xs">
              <span className="text-[#5f736e]">Thông tin quyền hạn được cấp</span>
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="text-[#0b5f53] hover:underline font-semibold cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1"
              >
                <span>Xem hồ sơ</span>
                <ArrowRightOutlined className="text-[10px]" />
              </button>
            </div>
          </div>

          {/* Card: Spring Boot Backend Health */}
          <div className="console-card p-5 flex flex-col justify-between gap-4 min-h-[190px]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-[#5f736e] uppercase tracking-wider">
                  Trạng thái máy chủ
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5f736e]" />
                  <span>Chưa kết nối</span>
                </span>
              </div>

              <div className="flex items-center gap-3.5 mt-3 min-w-0">
                <div className="w-12 h-12 rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-xl shrink-0">
                  <CloudServerOutlined />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-[#12211d] truncate m-0 leading-snug">
                    Spring Boot Backend
                  </h3>
                  <span className="text-xs text-[#5f736e] truncate mt-0.5">
                    Endpoint Actuator /health
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#5f736e]">
                    <LockOutlined className="text-xs" />
                    <span>Spring Boot Actuator</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dce7e3] flex items-center justify-between text-xs">
              <span className="text-[#5f736e]">Mô phỏng phản hồi trạng thái</span>
              <button
                type="button"
                onClick={runSimulatedHealth}
                className="text-[#0b5f53] hover:underline font-semibold cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1"
              >
                <span>Chạy kiểm tra mô phỏng</span>
                <ArrowRightOutlined className="text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Seven Module Operational Cards */}
      <section className="flex flex-col gap-3" aria-labelledby="modules-heading">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h2
            id="modules-heading"
            className="text-[11px] font-bold uppercase tracking-[.12em] text-[#40564f] m-0"
          >
            Tác vụ vận hành theo phân hệ
          </h2>
          <span className="text-[12.5px] text-[#5f736e]">
            7 phân hệ tính năng quản trị
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Users */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <TeamOutlined />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef8f5] text-[#0b5f53] border border-[#d6ebe5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0b5f53]" />
                  <span>Dữ liệu minh họa</span>
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Người dùng & Phân quyền
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Quản lý tài khoản, khóa/mở khóa và phân quyền quản trị viên, chủ khách sạn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Quản lý người dùng</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 2: Hotels */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <ShopOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Khách sạn
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Danh sách, phê duyệt chỗ nghỉ, tạm dừng kinh doanh và phân công nhân sự quản lý.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/management/hotels')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Quản lý khách sạn</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 3: Bookings */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <CalendarOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Đặt phòng
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Tra cứu đơn đặt theo khách sạn, xếp phòng, check-in/out, quá giờ nhận, NO_SHOW, hủy phòng.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderModule('Đặt phòng')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Quản lý đặt phòng</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 4: Vouchers */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <TagOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Voucher
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Danh sách mã giảm giá, thiết lập điều kiện áp dụng, hạn mức sử dụng và kích hoạt/tạm dừng.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderModule('Voucher')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Quản lý voucher</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 5: Complaints */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <MessageOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Khiếu nại
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Tiếp nhận phản ánh từ khách hàng, kiểm tra bằng chứng, cập nhật tiến độ và giải quyết.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderModule('Khiếu nại')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Xử lý khiếu nại</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 6: Finance */}
          <div className="module-card p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <CreditCardOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Tài chính
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Giao dịch dòng tiền, đối soát thanh toán, hoàn tiền, hợp đồng hoa hồng và quyết toán.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderModule('Tài chính')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Báo cáo tài chính</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>

          {/* Module 7: Reports (Centered in desktop 3-col layout: lg:col-start-2) */}
          <div className="module-card lg:col-start-2 p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-[42px] h-[42px] rounded-[11px] bg-[#eef8f5] border border-[#d6ebe5] text-[#0b5f53] flex items-center justify-center text-lg">
                  <LineChartOutlined />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7fbfa] text-[#5f736e] border border-[#dce7e3]">
                  Dữ liệu minh họa
                </span>
              </div>
              <div>
                <h3 className="text-[17.5px] font-semibold tracking-[-0.02em] text-[#12211d] m-0">
                  Báo cáo
                </h3>
                <p className="text-[14.5px] text-[#5f736e] mt-1.5 mb-0 leading-[22px]">
                  Báo cáo tài chính nền tảng, doanh số khách sạn đối tác và thống kê tỷ lệ hủy phòng.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlaceholderModule('Báo cáo')}
              className="w-full min-h-[44px] px-4 rounded-[8px] bg-[#eef8f5] hover:bg-[#d9f0ea] text-[#0b5f53] font-semibold text-[13px] flex items-center justify-between cursor-pointer border-0 transition-colors"
            >
              <span>Xem báo cáo</span>
              <ArrowRightOutlined className="module-cta-arrow transition-transform duration-150" />
            </button>
          </div>
        </div>
      </section>

      {/* Simulated Health Check Dialog */}
      {healthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071c18]/48 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="healthDialogTitle"
        >
          <div className="w-full max-w-[500px] p-6 sm:p-7 border border-[#dce7e3] rounded-[16px] bg-white text-[#12211d] shadow-2xl flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce7e3]">
              <h2 id="healthDialogTitle" className="text-xl font-bold text-[#12211d] m-0">
                Kiểm tra máy chủ
              </h2>
              <button
                type="button"
                onClick={() => setHealthModalOpen(false)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-[#5f736e] hover:text-[#12211d] hover:bg-[#f7fbfa] transition-colors border-0 bg-transparent cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <CloseOutlined />
              </button>
            </div>

            {healthChecking ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6" role="status">
                <LoadingOutlined className="text-2xl text-[#0b5f53] animate-spin" />
                <span className="text-sm font-medium text-[#5f736e]">
                  Đang mô phỏng kiểm tra /actuator/health…
                </span>
              </div>
            ) : healthChecked ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="p-4 rounded-xl bg-[#eef8f5] border border-[#d6ebe5] flex items-start gap-3">
                  <CheckCircleOutlined className="text-xl text-[#0f7a5f] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#08473e]">
                      Phản hồi mô phỏng: 200 OK
                    </span>
                    <span className="text-xs text-[#5f736e] mt-1 leading-relaxed">
                      Dịch vụ máy chủ StayHub Backend phản hồi mô phỏng bình thường. Chưa có cuộc gọi mạng thực tế nào được thực hiện trong bản xem trước này.
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHealthModalOpen(false)}
                className="min-h-[40px] px-5 border border-[#bfd3cd] hover:border-[#0b5f53] rounded-[9px] text-sm font-semibold text-[#12211d] bg-transparent transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Placeholder Dialog */}
      {placeholderModule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071c18]/48 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="placeholderDialogTitle"
        >
          <div className="w-full max-w-[500px] p-6 sm:p-7 border border-[#dce7e3] rounded-[16px] bg-white text-[#12211d] shadow-2xl flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce7e3]">
              <h2 id="placeholderDialogTitle" className="text-xl font-bold text-[#12211d] m-0">
                Phân hệ {placeholderModule}
              </h2>
              <button
                type="button"
                onClick={() => setPlaceholderModule(null)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-[#5f736e] hover:text-[#12211d] hover:bg-[#f7fbfa] transition-colors border-0 bg-transparent cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#f7fbfa] border border-[#dce7e3] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eef8f5] text-[#0b5f53] border border-[#d6ebe5]">
                  Dữ liệu minh họa
                </span>
                <span className="text-xs text-[#5f736e]">Chưa có dữ liệu trong bản xem trước</span>
              </div>
              <p className="text-sm text-[#344a44] m-0 leading-relaxed">
                Phân hệ <strong>{placeholderModule}</strong> sẽ được kết nối với API backend StayHub khi các dịch vụ nghiệp vụ tương ứng sẵn sàng.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPlaceholderModule(null)}
                className="min-h-[40px] px-5 bg-[#0b5f53] hover:bg-[#08473e] !text-white rounded-[9px] text-sm font-semibold transition-colors cursor-pointer border-0"
                style={{ color: '#ffffff' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
