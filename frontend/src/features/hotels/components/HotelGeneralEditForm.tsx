import { useEffect, useId, useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Input,
  InputNumber,
  Rate,
  Select,
  Tag,
  Tooltip,
} from 'antd'
import { Controller, useForm } from 'react-hook-form'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  SaveOutlined,
  ShopOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { errorMessage } from '@/shared/api/api-error'
import { buildHotelPatch } from '../model/hotel-update'
import { useUpdateManagementHotelMutation } from '../hooks/use-update-hotel-mutation'
import { SectionCard } from '@/shared/ui/SectionCard'
import type { CityItem, ManagementHotelDetail } from '../model/hotel'
import { HotelStatusBadge } from './HotelStatusBadge'

interface HotelGeneralEditFormProps {
  hotel: ManagementHotelDetail
  cities: CityItem[]
}

const CHECK_IN_CHIPS = ['13:00', '14:00', '15:00']
const CHECK_OUT_CHIPS = ['10:00', '11:00', '12:00']

export function HotelGeneralEditForm({ hotel, cities }: HotelGeneralEditFormProps) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const mutation = useUpdateManagementHotelMutation(hotel.id)
  const [copied, setCopied] = useState(false)

  // -------------------------------------------------------------
  // Form State Thống nhất (Single Unified Form)
  // -------------------------------------------------------------
  const defaultValues = useMemo(
    () => ({
      name: hotel.name,
      starRating: hotel.starRating,
      cityId: hotel.cityId,
      address: hotel.address,
      contactPhone: hotel.contactPhone ?? '',
      contactEmail: hotel.contactEmail ?? '',
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      checkInTime: hotel.checkInTime ? hotel.checkInTime.slice(0, 5) : '14:00',
      checkOutTime: hotel.checkOutTime ? hotel.checkOutTime.slice(0, 5) : '12:00',
      ownerUserId: hotel.ownerUserId,
      description: hotel.description ?? '',
    }),
    [hotel],
  )

  const form = useForm({
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues, { keepDirtyValues: true })
  }, [defaultValues, form])

  // Cảnh báo người dùng khi reload hoặc đóng tab nếu còn thay đổi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [form.formState.isDirty])

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleSaveAll = async (values: typeof defaultValues) => {
    if (mutation.isPending) return
    form.clearErrors('root')
    try {
      const updated = await mutation.mutateAsync(buildHotelPatch(hotel, values))
      form.reset({ ...values, name: updated.name, description: updated.description ?? '' })
      void message.success('Đã lưu hồ sơ khách sạn lên máy chủ.')
    } catch (error) {
      applyApiFieldErrors(error, form.setError)
      form.setError('root', { message: errorMessage(error) })
    }
  }

  const handleCopyOwnerId = (idToCopy: string) => {
    if (!idToCopy) return
    void navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    message.success('Đã sao chép Owner User ID vào bộ nhớ tạm!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenGoogleMaps = () => {
    const lat = form.getValues('latitude')
    const lng = form.getValues('longitude')
    const address = form.getValues('address')
    const cityName = cities.find((c) => c.id === form.getValues('cityId'))?.name || ''
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank')
    } else if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${cityName}`)}`,
        '_blank',
      )
    }
  }

  // Đo mức độ hoàn thiện các trường
  const profileChecks = [
    { label: 'Tên cơ sở lưu trú', done: Boolean(hotel.name) },
    { label: 'Tỉnh / Thành phố', done: Boolean(hotel.cityId) },
    { label: 'Địa chỉ chi tiết', done: Boolean(hotel.address) },
    { label: 'Tọa độ GPS bản đồ', done: Boolean(hotel.latitude && hotel.longitude) },
    { label: 'Quy định giờ nhận / trả phòng', done: Boolean(hotel.checkInTime && hotel.checkOutTime) },
    { label: 'Đoạn văn mô tả giới thiệu', done: Boolean(hotel.description && hotel.description.length > 20) },
  ]
  const completedChecksCount = profileChecks.filter((c) => c.done).length

  return (
    <div className="hotel-general-edit-form space-y-6">
      {Object.entries(form.formState.errors).map(([field, error]) => <p key={field} role="alert">{error?.message}</p>)}
      <p className="muted">Thành phố và chủ sở hữu được giữ theo hồ sơ hiện tại. Các giá trị trống không dùng để xóa thông tin đã lưu.</p>
      {/* Form bọc toàn bộ bố cục 2 cột */}
      <form onSubmit={(e) => void form.handleSubmit(handleSaveAll)(e)}>
        <fieldset disabled={mutation.isPending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================= */}
            {/* CỘT TRÁI (8 / 12) - THÔNG TIN ĐỊNH DANH & VỊ TRÍ CƠ SỞ     */}
            {/* ========================================================= */}
            <div className="lg:col-span-8 space-y-6">
              {/* KHỐI 1: ĐỊNH DANH & GIỚI THIỆU */}
              <SectionCard
                id="identity-section"
                title="Thông tin định danh & Giới thiệu"
                description="Tên thương hiệu, tiêu chuẩn sao và đoạn văn mô tả không gian lưu trú để thu hút du khách."
                extra={<HotelStatusBadge status={hotel.status} />}
              >
                <div className="space-y-4">
                  {/* Tên khách sạn */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tên khách sạn <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          size="large"
                          prefix={<ShopOutlined className="text-slate-400" />}
                          placeholder="Ví dụ: StayHub Grand Luxury Hotel"
                          className="!rounded-xl font-medium"
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label>Số điện thoại liên hệ
                      <Controller name="contactPhone" control={form.control} render={({ field }) => <Input {...field} maxLength={16} aria-label="Số điện thoại liên hệ" />} />
                    </label>
                    <label>Email liên hệ
                      <Controller name="contactEmail" control={form.control} render={({ field }) => <Input {...field} type="email" maxLength={255} aria-label="Email liên hệ" />} />
                    </label>
                  </div>
                  {/* Xếp hạng sao */}
                  <div>
                    <label
                      htmlFor={`${formId}-starRating`}
                      className="block text-xs font-bold text-slate-800 mb-1.5"
                    >
                      Tiêu chuẩn sao khách sạn (1 - 5 sao)
                    </label>
                    <Controller
                      name="starRating"
                      control={form.control}
                      render={({ field }) => (
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <InputNumber
                              id={`${formId}-starRating`}
                              min={1}
                              max={5}
                              value={field.value}
                              onChange={(val) => field.onChange(val)}
                              className="w-16 !rounded-lg text-xs"
                            />
                            <Rate
                              value={field.value ?? undefined}
                              onChange={(val) => field.onChange(val)}
                              className="text-amber-500 text-base"
                            />
                          </div>
                          <span className="text-xs font-bold text-[#0b5f53] bg-[#eef8f5] px-2.5 py-1 rounded-full border border-[#bcd8cf]">
                            {field.value ? `${field.value} Sao tiêu chuẩn` : 'Chưa xếp hạng'}
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Mô tả & Điểm nổi bật */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Mô tả &amp; Điểm nổi bật
                      </label>
                      <span className="text-[11px] text-slate-400">Tối đa 2.000 ký tự</span>
                    </div>
                    <Controller
                      name="description"
                      control={form.control}
                      render={({ field }) => (
                        <Input.TextArea
                          {...field}
                          rows={6}
                          showCount
                          maxLength={2000}
                          placeholder="Giới thiệu về phong cách kiến trúc, view ban công, tiện ích xung quanh, khoảng cách tới bãi biển hoặc trung tâm thành phố..."
                          className="!rounded-xl text-xs leading-relaxed"
                        />
                      )}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* KHỐI 2: ĐỊA CHỈ & BẢN ĐỒ VỊ TRÍ */}
              <SectionCard
                id="location-section"
                title="Vị trí & Bản đồ địa lý"
                description="Khu vực hành chính, địa chỉ chi tiết và tọa độ GPS giúp định vị cơ sở trên bản đồ."
                extra={
                  <Tooltip title="Mở địa chỉ này trên Google Maps">
                    <Button
                      type="default"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={handleOpenGoogleMaps}
                      className="!text-xs !rounded-lg !text-slate-600 hover:!text-[#0b5f53]"
                    >
                      Xem bản đồ
                    </Button>
                  </Tooltip>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tỉnh / Thành phố */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <Controller
                        name="cityId"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            size="large"
                            showSearch
                            className="w-full"
                            disabled
                            placeholder="Thành phố đã đăng ký"
                            optionFilterProp="label"
                            options={cities.map((c) => ({ value: c.id, label: c.name }))}
                          />
                        )}
                      />
                    </div>

                    {/* Địa chỉ chi tiết */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Địa chỉ chi tiết <span className="text-rose-500">*</span>
                      </label>
                      <Controller
                        name="address"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            size="large"
                            prefix={<EnvironmentOutlined className="text-slate-400" />}
                            placeholder="Số nhà, tên đường, phường/xã..."
                            className="!rounded-xl"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Tọa độ GPS */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Tọa độ GPS định vị chính xác
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Vĩ độ GPS (Latitude)
                        </label>
                        <Controller
                          name="latitude"
                          control={form.control}
                          render={({ field }) => (
                            <InputNumber
                              {...field}
                              value={field.value ?? undefined}
                              step={0.0001}
                              className="w-full !rounded-xl"
                              prefix={<CompassOutlined className="text-slate-400" />}
                              placeholder="16.0544"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Kinh độ GPS (Longitude)
                        </label>
                        <Controller
                          name="longitude"
                          control={form.control}
                          render={({ field }) => (
                            <InputNumber
                              {...field}
                              value={field.value ?? undefined}
                              step={0.0001}
                              className="w-full !rounded-xl"
                              prefix={<CompassOutlined className="text-slate-400" />}
                              placeholder="108.2022"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ========================================================= */}
            {/* CỘT PHẢI (4 / 12) - QUY ĐỊNH LƯU TRÚ & THÔNG TIN QUẢN TRỊ */}
            {/* ========================================================= */}
            <div className="lg:col-span-4 space-y-6">
              {/* KHỐI 3: QUY ĐỊNH GIỜ LƯU TRÚ */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-[#eef8f5] text-[#0b5f53] flex items-center justify-center shrink-0">
                    <ClockCircleOutlined className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0">Quy định giờ lưu trú</h3>
                    <p className="text-[11px] text-slate-500 m-0">Khung giờ đón và trả khách tiêu chuẩn</p>
                  </div>
                </div>

                {/* Giờ nhận phòng */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Giờ nhận phòng (Check-in) <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="checkInTime"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size="middle"
                        prefix={<ClockCircleOutlined className="text-slate-400 text-xs" />}
                        placeholder="14:00"
                        className="!rounded-lg font-mono text-xs"
                      />
                    )}
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10.5px] text-slate-400">Gợi ý:</span>
                    {CHECK_IN_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => form.setValue('checkInTime', chip, { shouldDirty: true })}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-[#eef8f5] hover:text-[#0b5f53] transition-colors cursor-pointer border-0 text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Giờ trả phòng */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800">
                    Giờ trả phòng (Check-out) <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="checkOutTime"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size="middle"
                        prefix={<ClockCircleOutlined className="text-slate-400 text-xs" />}
                        placeholder="12:00"
                        className="!rounded-lg font-mono text-xs"
                      />
                    )}
                  />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10.5px] text-slate-400">Gợi ý:</span>
                    {CHECK_OUT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => form.setValue('checkOutTime', chip, { shouldDirty: true })}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-[#eef8f5] hover:text-[#0b5f53] transition-colors cursor-pointer border-0 text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KHỐI 4: CHỦ SỞ HỮU CƠ SỞ (OWNER CARD) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <UserOutlined className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0">Chủ sở hữu cơ sở</h3>
                    <p className="text-[11px] text-slate-500 m-0">Thông tin pháp lý người đại diện</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      {hotel.ownerName || 'Chủ cơ sở StayHub'}
                    </span>
                    <Tag color="cyan" className="!m-0 !text-[10.5px] !rounded-full">
                      Chủ cơ sở
                    </Tag>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <span className="truncate max-w-[170px]" title={hotel.ownerUserId}>
                      {hotel.ownerUserId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyOwnerId(hotel.ownerUserId)}
                      className="text-xs text-[#0b5f53] hover:text-[#08473e] font-medium flex items-center gap-1 border-0 bg-transparent cursor-pointer p-0 shrink-0"
                    >
                      {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                      <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KHỐI 5: MỨC ĐỘ HOÀN THIỆN HỒ SƠ */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tiến độ hồ sơ cơ bản
                  </span>
                  <span className="text-xs font-bold text-[#0b5f53] bg-[#eef8f5] px-2 py-0.5 rounded-full">
                    {completedChecksCount} / {profileChecks.length}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {profileChecks.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {item.done ? (
                        <CheckCircleOutlined className="text-[#0b5f53] shrink-0 text-xs" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={item.done ? 'text-slate-700' : 'text-slate-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* THANH THAO TÁC HỢP NHẤT DUY NHẤT (UNIFIED ACTION BAR)    */}
          {/* ========================================================= */}
          <div className="mt-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  form.formState.isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span>
                {form.formState.isDirty
                  ? 'Đang có chỉnh sửa chưa lưu cho hồ sơ cơ sở này.'
                  : 'Dữ liệu hồ sơ đã được đồng bộ với máy chủ.'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                icon={<UndoOutlined />}
                disabled={!form.formState.isDirty || mutation.isPending}
                onClick={() => form.reset()}
                className="!rounded-xl"
              >
                Hoàn tác
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                disabled={!form.formState.isDirty || mutation.isPending}
                className="!bg-[#0b5f53] hover:!bg-[#08473e] !rounded-xl font-semibold disabled:!bg-[#f0f2f1] disabled:!text-[#8c9e99] disabled:!border-[#dce7e3]"
              >
                Lưu toàn bộ thay đổi
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
