import { useId } from 'react'
import {
  CloseCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Switch } from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { smartSearchSchema, type SmartSearchFormValues } from '../model/search-form-schema'
import { QUICK_LOCATION_SUGGESTIONS } from '../mocks/stayvibe-mock-data'

interface SmartSearchBarProps {
  onSearchSubmit: (values: SmartSearchFormValues) => void
  onResetSearch: () => void
  activeDestinationFilter: string
}

export function SmartSearchBar({
  onSearchSubmit,
  onResetSearch,
  activeDestinationFilter,
}: SmartSearchBarProps) {
  const formId = useId()

  const {
    control,
    handleSubmit,
    setValue,
    reset,
  } = useForm<SmartSearchFormValues>({
    resolver: zodResolver(smartSearchSchema),
    defaultValues: {
      destination: activeDestinationFilter,
      checkIn: '2026-11-15',
      checkOut: '2026-11-18',
      guests: 2,
      rooms: 1,
      petFriendly: false,
    },
  })

  const petFriendlyValue = useWatch({ control, name: 'petFriendly' })
  const destinationValue = useWatch({ control, name: 'destination' })
  const checkInValue = useWatch({ control, name: 'checkIn' })
  const checkOutValue = useWatch({ control, name: 'checkOut' })
  const guestsValue = useWatch({ control, name: 'guests' })
  const roomsValue = useWatch({ control, name: 'rooms' })

  function handleQuickSelectCity(city: string) {
    setValue('destination', city, { shouldDirty: true })
    onSearchSubmit({
      destination: city,
      checkIn: checkInValue,
      checkOut: checkOutValue,
      guests: guestsValue,
      rooms: roomsValue,
      petFriendly: petFriendlyValue,
    })
  }

  function handleClearDestination() {
    setValue('destination', '', { shouldDirty: true })
    onResetSearch()
    reset({
      destination: '',
      checkIn: checkInValue,
      checkOut: checkOutValue,
      guests: guestsValue,
      rooms: roomsValue,
      petFriendly: false,
    })
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search Input Box */}
      <form
        className="w-full bg-white text-[var(--md-sys-color-on-surface)] rounded-2xl p-2 sm:p-2.5 shadow-sm border border-[var(--md-sys-color-outline-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition-all"
        onSubmit={(event) => void handleSubmit(onSearchSubmit)(event)}
        noValidate
        aria-label="Thanh tìm kiếm chỗ nghỉ StayHub"
      >
        {/* Main Search Input */}
        <div className="flex-1 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)] transition-all min-w-0">
          <SearchOutlined className="text-[var(--md-sys-color-primary)] text-lg shrink-0" aria-hidden="true" />
          <div className="flex flex-col flex-1 min-w-0">
            <label
              htmlFor={`${formId}-destination`}
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]"
            >
              Điểm đến hoặc tên chỗ nghỉ
            </label>
            <Controller
              control={control}
              name="destination"
              render={({ field }) => (
                <input
                  {...field}
                  id={`${formId}-destination`}
                  type="text"
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-semibold text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 p-0"
                  placeholder="Ví dụ: Đà Lạt, Sa Pa, Khách sạn Rex..."
                  autoComplete="off"
                />
              )}
            />
          </div>
          {destinationValue && (
            <button
              type="button"
              className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] text-sm p-1 rounded-full cursor-pointer transition shrink-0"
              aria-label="Xóa nội dung tìm kiếm"
              onClick={handleClearDestination}
            >
              <CloseCircleOutlined />
            </button>
          )}
        </div>

        {/* Pet Friendly Functional Toggle */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-subtle)] shrink-0">
          <label
            htmlFor={`${formId}-pet-friendly`}
            className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] cursor-pointer select-none whitespace-nowrap"
          >
            Thân thiện thú cưng
          </label>
          <Controller
            control={control}
            name="petFriendly"
            render={({ field: { value, onChange } }) => (
              <Switch
                id={`${formId}-pet-friendly`}
                checked={value}
                onChange={onChange}
                size="small"
                aria-label="Chỉ tìm chỗ nghỉ cho phép mang theo thú cưng"
              />
            )}
          />
        </div>

        {/* Submit Search Button */}
        <button
          type="submit"
          className="m3-btn-filled !h-12 !px-6 sm:!px-7 !rounded-xl !text-sm font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm active:scale-98 transition-transform"
        >
          <SearchOutlined aria-hidden="true" />
          <span>Tìm kiếm</span>
        </button>
      </form>

      {/* Quick Location Suggestion Chips */}
      <div className="flex items-center gap-2 flex-wrap pt-1" aria-label="Gợi ý điểm đến thịnh hành">
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 shrink-0">
          <FireOutlined className="text-[var(--md-sys-color-primary)]" />
          Gợi ý nhanh:
        </span>
        {QUICK_LOCATION_SUGGESTIONS.map((city) => {
          const isSelected = destinationValue?.toLowerCase() === city.toLowerCase()
          return (
            <button
              key={city}
              type="button"
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                isSelected
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] font-bold'
                  : 'bg-white text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-subtle)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              onClick={() => handleQuickSelectCity(city)}
            >
              <EnvironmentOutlined className="text-[10px]" />
              <span>{city}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
