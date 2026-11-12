import { useMemo, useState } from 'react'
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  TableOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App as AntApp,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { errorMessage } from '@/shared/api/api-error'
import { formatCurrencyAmount } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { useRoomTypeDailyRatesQuery } from '../hooks/use-room-type-daily-rates-query'
import { useSetRoomRatesMutation } from '../hooks/use-set-room-rates-mutation'
import {
  localRateDate,
  roomRatesRangeSchema,
  setRoomRatesFormSchema,
  type SetRoomRatesFormValues,
} from '../model/room-rates'
import type { DailyRoomRate, ManagementRoomTypeSummary } from '../model/hotel'

interface RoomTypeDailyRatesPanelProps {
  hotelId: string
  hotelName?: string
  roomTypes?: ManagementRoomTypeSummary[]
  hotelStatus?: string
}

type RateViewMode = 'grid' | 'table'

function getWeekdayName(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const day = date.getUTCDay()
  const names = [
    'Chủ nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ]
  return names[day] ?? ''
}

function isWeekendDate(isoDate: string): boolean {
  const weekday = getWeekdayName(isoDate)
  return weekday === 'Thứ 6' || weekday === 'Thứ 7'
}

function formatDisplayDate(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return isoDate
}

function calculateNights(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0
  const start = new Date(`${startIso}T00:00:00Z`).getTime()
  const end = new Date(`${endIso}T00:00:00Z`).getTime()
  if (isNaN(start) || isNaN(end) || end < start) return 0
  return Math.round((end - start) / 86400000) + 1
}

export function RoomTypeDailyRatesPanel({
  hotelId,
  hotelName,
  roomTypes = [],
  hotelStatus = 'ACTIVE',
}: RoomTypeDailyRatesPanelProps) {
  const { message } = AntApp.useApp()
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(
    roomTypes[0]?.id ?? '',
  )

  // Default range: localRateDate()
  const defaultDate = localRateDate()

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<SetRoomRatesFormValues>({
    resolver: zodResolver(setRoomRatesFormSchema),
    defaultValues: {
      startDate: defaultDate,
      endDate: defaultDate,
      amount: 0,
    },
  })

  const startDate = useWatch({ control, name: 'startDate' }) ?? defaultDate
  const endDate = useWatch({ control, name: 'endDate' }) ?? defaultDate
  const [viewMode, setViewMode] = useState<RateViewMode>('grid')

  // Modal chỉnh sửa 1 đêm lẻ
  const [editingSingleRate, setEditingSingleRate] = useState<DailyRoomRate | null>(null)
  const [singleNightAmount, setSingleNightAmount] = useState<number | null>(null)
  const [isSavingSingle, setIsSavingSingle] = useState(false)

  const activeRoomTypeId =
    roomTypes.some((rt) => rt.id === selectedRoomTypeId)
      ? selectedRoomTypeId
      : (roomTypes[0]?.id ?? '')
  const selectedRoomType = roomTypes.find((rt) => rt.id === activeRoomTypeId)
  const canReadRates = hotelStatus !== 'LOCKED' && selectedRoomType?.isActive === true
  const rateMutation = useSetRoomRatesMutation(hotelId, activeRoomTypeId)
  const validRange = roomRatesRangeSchema.safeParse({ startDate, endDate }).success
  const nightsCount = calculateNights(startDate, endDate)

  const ratesQuery = useRoomTypeDailyRatesQuery(
    {
      hotelId,
      roomTypeId: activeRoomTypeId,
      startDate,
      endDate,
    },
    canReadRates,
  )

  // Phát hiện các hạng phòng bị trùng tên để hiển thị phân biệt
  const duplicateNameCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const rt of roomTypes) {
      counts[rt.name] = (counts[rt.name] ?? 0) + 1
    }
    return counts
  }, [roomTypes])

  function applyPresetRange(startIso: string, days: number) {
    const start = new Date(`${startIso}T00:00:00Z`)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + (days - 1))
    setValue('startDate', start.toISOString().slice(0, 10))
    setValue('endDate', end.toISOString().slice(0, 10))
  }

  // Mở modal sửa 1 đêm lẻ
  const handleOpenSingleNightEdit = (rate: DailyRoomRate) => {
    setEditingSingleRate(rate)
    setSingleNightAmount(rate.amount ?? (selectedRoomType?.basePrice || 0))
  }

  // Lưu giá cho 1 đêm lẻ
  const handleSaveSingleNight = async () => {
    if (!editingSingleRate) return
    if (!singleNightAmount || singleNightAmount <= 0) {
      void message.error('Vui lòng nhập mức giá phòng lớn hơn 0.')
      return
    }

    try {
      setIsSavingSingle(true)
      await rateMutation.mutateAsync({
        startDate: editingSingleRate.rateDate,
        amount: singleNightAmount,
      })
      void message.success(
        `Đã lưu giá đêm ${formatDisplayDate(editingSingleRate.rateDate)} thành công!`,
      )
      setEditingSingleRate(null)
      void ratesQuery.refetch()
    } catch (error) {
      void message.error(errorMessage(error))
    } finally {
      setIsSavingSingle(false)
    }
  }

  if (roomTypes.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#dce7e3] text-center shadow-xs">
        <EmptyState
          title="Khách sạn chưa có hạng phòng nào"
          description="Cần khởi tạo ít nhất 1 hạng phòng trước khi tra cứu và thiết lập biểu giá theo ngày."
          action={
            <Button
              type="primary"
              className="!bg-[#0b5f53] hover:!bg-[#08473e] !rounded-xl font-semibold mt-3"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/hotels/${hotelId}/rooms`
                }
              }}
            >
              Đến trang quản lý phòng
            </Button>
          }
        />
      </div>
    )
  }

  const rates = ratesQuery.data ?? []
  const currency = rates[0]?.currency ?? 'VND'
  const knownAmounts = rates.flatMap((rate) =>
    rate.amount === null ? [] : [rate.amount],
  )
  const minAmount = knownAmounts.length > 0 ? Math.min(...knownAmounts) : null
  const maxAmount = knownAmounts.length > 0 ? Math.max(...knownAmounts) : null
  const configuredCount = rates.filter((r) => r.hasRate && r.amount !== null).length
  const todayIso = localRateDate()

  return (
    <section
      className="bg-white rounded-2xl border border-[#dce7e3] p-6 shadow-xs space-y-6"
      aria-labelledby="daily-rates-title"
    >
      {/* 1. Header tinh gọn của bảng giá */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dce7e3]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b5f53]">
            BIỂU GIÁ PHÒNG THEO NGÀY
          </span>
          <h2
            id="daily-rates-title"
            className="text-xl sm:text-2xl font-bold text-[#12211d] mt-0.5 mb-1"
          >
            {hotelName ? hotelName : 'Chi tiết giá phòng theo đêm'}
          </h2>
          <p className="text-xs text-[#5f736e] m-0">
            Xem lịch giá từng đêm, chỉnh sửa linh hoạt cho 1 đêm lẻ hoặc thiết lập đồng loạt cho cả khoảng thời gian.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Segmented<RateViewMode>
            value={viewMode}
            onChange={setViewMode}
            aria-label="Chọn kiểu hiển thị bảng giá"
            options={[
              {
                value: 'grid',
                label: 'Lưới lịch',
                icon: <AppstoreOutlined aria-hidden="true" />,
              },
              {
                value: 'table',
                label: 'Bảng đối chiếu',
                icon: <TableOutlined aria-hidden="true" />,
              },
            ]}
          />
          <Tooltip title="Tải lại dữ liệu giá">
            <Button
              icon={<ReloadOutlined aria-hidden="true" />}
              onClick={() => void ratesQuery.refetch()}
              loading={ratesQuery.isFetching}
              disabled={!canReadRates || !validRange}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Bộ chọn Hạng phòng (Phân biệt rõ ràng nếu trùng tên) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#5f736e]">
          Chọn loại phòng:
        </div>
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin"
          role="tablist"
          aria-label="Chọn hạng phòng"
        >
          {roomTypes.map((rt) => {
            const isCurrent = rt.id === activeRoomTypeId
            const isDuplicate = (duplicateNameCount[rt.name] ?? 0) > 1

            return (
              <button
                key={rt.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => setSelectedRoomTypeId(rt.id)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'border-[#0b5f53] bg-[#f0fdf9] text-[#0b5f53] shadow-xs'
                    : 'border-[#dce7e3] bg-white text-[#12211d] hover:border-[#83b0a7] hover:bg-[#fafdfc]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span className="font-bold text-sm leading-tight">{rt.name}</span>
                  {isDuplicate && (
                    <Tag className="!text-[10px] !px-1 !py-0 !m-0 !rounded-md bg-gray-100 text-gray-600 border-gray-300">
                      Mã: ...{rt.id.slice(-4)}
                    </Tag>
                  )}
                  {isCurrent && (
                    <CheckCircleOutlined className="text-[#0b5f53] text-xs ml-auto" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#5f736e]">
                  <span>
                    Tối đa {rt.maxAdults} người lớn
                    {(rt.maxChildren ?? 0) > 0 && ` · ${rt.maxChildren} trẻ`}
                  </span>
                  {!rt.isActive && (
                    <Tag color="default" className="!text-[10px] !px-1 !py-0 !m-0">
                      Tạm ngưng
                    </Tag>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Dải tóm tắt thông tin hạng phòng đang chọn */}
      {selectedRoomType && (
        <div className="bg-[#f7fbfa] p-3.5 rounded-xl border border-[#dce7e3] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#344a44]">
            <InfoCircleOutlined className="text-[#0b5f53] shrink-0" />
            <span>
              {selectedRoomType.description ||
                `Hạng phòng "${selectedRoomType.name}".`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedRoomType.basePrice !== undefined && selectedRoomType.basePrice > 0 && (
              <span className="text-[#5f736e]">
                Giá cơ bản:{' '}
                <strong className="text-[#12211d]">
                  {formatCurrencyAmount(selectedRoomType.basePrice, 'VND')}
                </strong>
                /đêm
              </span>
            )}
            <Tag color={selectedRoomType.isActive ? 'green' : 'default'} className="!m-0">
              {selectedRoomType.isActive ? 'Đang mở bán' : 'Tạm ngưng bán'}
            </Tag>
          </div>
        </div>
      )}

      {/* 4. Toolbar Khoảng ngày & Form thiết lập giá hàng loạt */}
      <div className="bg-[#fafdfc] p-4 rounded-xl border border-[#dce7e3] space-y-4">
        {/* Hàng 1: Chọn khoảng ngày & xem nhanh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#e6f0ed]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12211d] whitespace-nowrap">
              Khoảng ngày khảo sát:
            </span>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setValue('startDate', e.target.value)}
                aria-label="Từ ngày"
                className="flex-1 sm:w-36 min-w-[130px] !rounded-lg text-xs"
              />
              <span className="text-[#5f736e] font-semibold">→</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setValue('endDate', e.target.value)}
                aria-label="Đến ngày"
                className="flex-1 sm:w-36 min-w-[130px] !rounded-lg text-xs"
              />
            </div>
            {nightsCount > 0 && (
              <Tag color="cyan" className="!rounded-md text-xs !m-0">
                {nightsCount} đêm
              </Tag>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#5f736e] whitespace-nowrap">Xem nhanh:</span>
            <Button
              size="small"
              onClick={() => applyPresetRange(localRateDate(), 7)}
              className="!rounded-lg text-xs"
            >
              7 đêm
            </Button>
            <Button
              size="small"
              onClick={() => applyPresetRange(localRateDate(), 14)}
              className="!rounded-lg text-xs"
            >
              14 đêm
            </Button>
            <Button
              size="small"
              onClick={() => applyPresetRange(localRateDate(), 30)}
              className="!rounded-lg text-xs"
            >
              30 đêm
            </Button>
          </div>
        </div>

        {/* Hàng 2: Form áp dụng giá cho toàn bộ khoảng ngày (Batch apply) */}
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await rateMutation.mutateAsync({
                startDate: values.startDate,
                endDate: values.endDate,
                amount: values.amount,
              })
              void message.success(
                `Đã áp dụng mức giá ${formatCurrencyAmount(values.amount, 'VND')} cho ${nightsCount} đêm thành công!`,
              )
              void ratesQuery.refetch()
            } catch (error) {
              void message.error(errorMessage(error))
            }
          })}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
            <span className="text-xs font-semibold text-[#12211d] whitespace-nowrap">
              Áp dụng một giá cho toàn bộ khoảng ngày:
            </span>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    min={1}
                    precision={0}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? 0)}
                    aria-label="Giá mỗi đêm"
                    placeholder="VD: 500,000"
                    suffix="VND"
                    className="w-full sm:w-48 !rounded-lg"
                    disabled={!canReadRates || rateMutation.isPending}
                  />
                )}
              />
              <Button
                type="primary"
                htmlType="submit"
                loading={rateMutation.isPending}
                disabled={!canReadRates || !validRange || startDate < localRateDate()}
                className="w-full sm:w-auto !bg-[#0b5f53] hover:!bg-[#08473e] !rounded-lg font-semibold"
              >
                Lưu giá
              </Button>
            </div>
          </div>

          <div className="text-[11px] text-[#5f736e]">
            * Hoặc click trực tiếp vào từng ô ngày bên dưới để chỉnh giá riêng cho 1 đêm.
          </div>
        </form>

        {errors.amount && (
          <p role="alert" className="text-xs text-red-500 m-0">
            {errors.amount.message}
          </p>
        )}
      </div>

      {/* 5. Vùng hiển thị dữ liệu giá */}
      {!canReadRates ? (
        <Alert
          type="info"
          showIcon
          title="Khách sạn bị khóa hoặc hạng phòng đã ngừng bán. Vui lòng kiểm tra trạng thái trước khi quản lý giá."
        />
      ) : !validRange ? (
        <Alert
          type="warning"
          showIcon
          title="Chọn khoảng ngày hợp lệ, tối đa 90 ngày để xem bảng giá."
        />
      ) : ratesQuery.isPending ? (
        <PageLoading />
      ) : ratesQuery.isError ? (
        <ErrorState
          error={ratesQuery.error}
          retrying={ratesQuery.isFetching}
          onRetry={() => void ratesQuery.refetch()}
        />
      ) : rates.length === 0 ? (
        <EmptyState
          title="Không có dữ liệu giá trong khoảng ngày đã chọn"
          description="Vui lòng chọn khoảng thời gian khác hoặc kiểm tra lại cấu hình giá phòng."
        />
      ) : (
        <>
          {/* Dải số liệu KPI tổng quan tinh gọn, đúng bản chất dữ liệu */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f7fbfa] p-3.5 rounded-xl border border-[#dce7e3]"
            role="region"
            aria-label="Tổng quan khoảng giá"
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5f736e]">
                Chu kỳ theo dõi
              </div>
              <div className="text-base font-bold text-[#12211d] mt-0.5">
                {rates.length} đêm
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5f736e]">
                Đã đặt giá
              </div>
              <div className="text-base font-bold text-[#0b5f53] mt-0.5">
                {configuredCount} / {rates.length} đêm
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5f736e]">
                Mức giá thấp nhất
              </div>
              <div className="text-base font-bold text-[#12211d] mt-0.5">
                {minAmount !== null ? formatCurrencyAmount(minAmount, currency) : '—'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5f736e]">
                Mức giá cao nhất
              </div>
              <div className="text-base font-bold text-[#12211d] mt-0.5">
                {maxAmount !== null ? formatCurrencyAmount(maxAmount, currency) : '—'}
              </div>
            </div>
          </div>

          {/* Dạng 1: Lưới lịch ngày trực quan */}
          {viewMode === 'grid' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#5f736e]">
                <span>Nhấn vào từng ô ngày để chỉnh sửa mức giá cho riêng đêm đó:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                    Hôm nay
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    Cuối tuần
                  </span>
                </div>
              </div>

              <div
                className={`grid gap-2.5 ${
                  rates.length <= 4
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-3xl'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7'
                }`}
                role="list"
                aria-label="Lưới lịch giá từng ngày"
              >
                {rates.map((rate) => {
                  const weekday = getWeekdayName(rate.rateDate)
                  const isWeekend = isWeekendDate(rate.rateDate)
                  const isToday = rate.rateDate === todayIso
                  const isSelected = editingSingleRate?.rateDate === rate.rateDate

                  return (
                    <article
                      key={`${rate.roomTypeId}-${rate.rateDate}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenSingleNightEdit(rate)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOpenSingleNightEdit(rate)
                        }
                      }}
                      aria-label={`Giá đêm ${formatDisplayDate(rate.rateDate)}: ${
                        rate.amount !== null ? formatCurrencyAmount(rate.amount, rate.currency) : 'Chưa đặt giá'
                      }`}
                      className={`group relative rounded-xl p-3 border text-left transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-2 border-[#0b5f53] bg-[#f0fdf9] shadow-md ring-2 ring-[#0b5f53]/20'
                          : isToday
                          ? 'border-blue-400 bg-blue-50/20 hover:border-[#0b5f53] hover:shadow-sm'
                          : isWeekend
                          ? 'border-amber-200 bg-amber-50/25 hover:border-[#0b5f53] hover:shadow-sm'
                          : 'border-[#dce7e3] bg-white hover:border-[#0b5f53] hover:shadow-sm'
                      }`}
                    >
                      {/* Top: Weekday & Date */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isWeekend ? 'text-amber-800' : 'text-[#12211d]'
                          }`}
                        >
                          {weekday}
                        </span>
                        <span className="text-[11px] text-[#5f736e] font-mono">
                          {formatDisplayDate(rate.rateDate)}
                        </span>
                      </div>

                      {/* Badges: Hôm nay / Cuối tuần */}
                      <div className="flex items-center gap-1 mb-2 min-h-[18px]">
                        {isToday && (
                          <Tag color="blue" className="!text-[10px] !px-1 !py-0 !m-0 !rounded">
                            Hôm nay
                          </Tag>
                        )}
                        {isWeekend && (
                          <Tag color="gold" className="!text-[10px] !px-1 !py-0 !m-0 !rounded">
                            Cuối tuần
                          </Tag>
                        )}
                      </div>

                      {/* Price */}
                      <div className="my-1">
                        {rate.amount !== null ? (
                          <div className="text-base font-bold text-[#12211d] font-sans tracking-tight">
                            {formatCurrencyAmount(rate.amount, rate.currency)}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-700 italic border border-dashed border-amber-300 rounded px-1.5 py-0.5 inline-block">
                            Chưa đặt giá
                          </div>
                        )}
                      </div>

                      {/* Action cue */}
                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#0b5f53] font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1">
                          <EditOutlined className="text-[10px]" /> Sửa giá
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Dạng 2: Bảng đối chiếu chi tiết */
            <div className="border border-[#dce7e3] rounded-xl overflow-hidden shadow-xs">
              <Table<DailyRoomRate>
                rowKey={(record) => `${record.roomTypeId}-${record.rateDate}`}
                dataSource={rates}
                pagination={{ pageSize: 14, showSizeChanger: false }}
                columns={[
                  {
                    title: 'Ngày lưu trú',
                    dataIndex: 'rateDate',
                    key: 'rateDate',
                    render: (value: string) => (
                      <span className="font-semibold text-sm text-[#12211d]">
                        <CalendarOutlined aria-hidden="true" className="mr-1.5 text-[#0b5f53]" />
                        {formatDisplayDate(value)}
                        {value === todayIso && (
                          <Tag color="blue" className="ml-2 !text-[10px] !px-1.5 !py-0 !m-0">
                            Hôm nay
                          </Tag>
                        )}
                      </span>
                    ),
                  },
                  {
                    title: 'Thứ',
                    key: 'weekday',
                    render: (_, record) => {
                      const weekday = getWeekdayName(record.rateDate)
                      const weekend = isWeekendDate(record.rateDate)
                      return (
                        <Tag color={weekend ? 'gold' : 'default'} className="!rounded-md text-xs">
                          {weekday}
                        </Tag>
                      )
                    },
                  },
                  {
                    title: 'Phân loại',
                    key: 'category',
                    render: (_, record) => {
                      const weekend = isWeekendDate(record.rateDate)
                      return (
                        <span className="text-xs text-[#5f736e]">
                          {weekend ? 'Cuối tuần' : 'Ngày trong tuần'}
                        </span>
                      )
                    },
                  },
                  {
                    title: 'Mức giá niêm yết',
                    dataIndex: 'amount',
                    key: 'amount',
                    align: 'right',
                    render: (amount: number | null, record) => (
                      <span className="font-bold text-sm text-[#12211d]">
                        {amount === null ? (
                          <span className="text-xs text-amber-700 italic font-normal">
                            Chưa đặt giá
                          </span>
                        ) : (
                          formatCurrencyAmount(amount, record.currency)
                        )}
                      </span>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    align: 'center',
                    render: (_, record) => (
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenSingleNightEdit(record)}
                        className="text-xs"
                      >
                        Sửa giá
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* 6. Modal Chỉnh sửa giá cho 1 đêm lẻ */}
      <Modal
        title={
          editingSingleRate
            ? `Chỉnh sửa giá đêm ${formatDisplayDate(editingSingleRate.rateDate)} (${getWeekdayName(
                editingSingleRate.rateDate,
              )})`
            : 'Chỉnh sửa giá đêm'
        }
        open={Boolean(editingSingleRate)}
        onCancel={() => setEditingSingleRate(null)}
        onOk={handleSaveSingleNight}
        confirmLoading={isSavingSingle}
        okText="Lưu giá"
        cancelText="Hủy"
        okButtonProps={{ className: '!bg-[#0b5f53]' }}
      >
        {editingSingleRate && (
          <div className="space-y-4 pt-2">
            <div className="bg-[#f7fbfa] p-3 rounded-xl border border-[#dce7e3] text-xs space-y-1.5">
              <div>
                <span className="text-[#5f736e]">Hạng phòng:</span>{' '}
                <strong className="text-[#12211d]">{selectedRoomType?.name}</strong>
              </div>
              <div>
                <span className="text-[#5f736e]">Ngày lưu trú:</span>{' '}
                <strong className="text-[#12211d]">
                  {formatDisplayDate(editingSingleRate.rateDate)} ({getWeekdayName(editingSingleRate.rateDate)})
                </strong>
              </div>
              <div>
                <span className="text-[#5f736e]">Giá đang áp dụng:</span>{' '}
                <strong className="text-[#12211d]">
                  {editingSingleRate.amount !== null
                    ? formatCurrencyAmount(editingSingleRate.amount, editingSingleRate.currency)
                    : 'Chưa đặt giá (áp dụng giá mặc định)'}
                </strong>
              </div>
            </div>

            <Form layout="vertical">
              <Form.Item
                label="Mức giá mới cho đêm này (VND)"
                required
                help="Giá này chỉ áp dụng riêng cho đêm đã chọn, không thay đổi các đêm khác."
              >
                <InputNumber
                  min={1}
                  precision={0}
                  value={singleNightAmount}
                  onChange={(val) => setSingleNightAmount(val)}
                  suffix="VND"
                  className="w-full !rounded-lg"
                  placeholder="Nhập giá phòng"
                  autoFocus
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </section>
  )
}
