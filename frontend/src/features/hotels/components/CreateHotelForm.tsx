import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  App as AntApp,
  Select,
  TimePicker,
} from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  ShopOutlined,
  StarFilled,
  SyncOutlined,
} from '@ant-design/icons'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { errorMessage } from '@/shared/api/api-error'
import { useCurrentUser } from '@/features/auth'
import { useCitiesQuery } from '../hooks/use-cities-query'
import { useCreateAdminHotelMutation } from '../hooks/use-create-hotel-mutation'
import { updateHotelGallery, uploadHotelMedia } from '../api/hotel-media-api'
import { completeHotelCreation, type HotelCreationSession } from '../model/hotel-create-media-session'
import { hotelManagementKeys } from '../hooks/hotel-query-keys'
import { geocodeAddress, isCityMatch } from '../api/geocoding-api'
import type { ManagementHotelDetail } from '../model/hotel'
import { InteractiveHotelMap } from './InteractiveHotelMap'
import {
  createAdminHotelApiFormSchema,
  type CreateAdminHotelFormValues,
} from '../model/hotel-form-schemas'

export interface CreateHotelFormProps {
  onSuccess?: (created: ManagementHotelDetail) => void
  onCancel?: () => void
}

interface SelectedPhoto {
  id: string
  file: File
  previewUrl: string
  isCover: boolean
  name: string
  sizeFormatted: string
}

const STAR_LABELS: Record<number, string> = {
  1: '1 Sao tiêu chuẩn',
  2: '2 Sao tiện nghi',
  3: '3 Sao chất lượng',
  4: '4 Sao cao cấp',
  5: '5 Sao đẳng cấp',
}

export function CreateHotelForm({ onSuccess, onCancel }: CreateHotelFormProps) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const { currentUser, isAdmin, isOwner, isChecking, isAuthorized } = useCurrentUser()
  const citiesQuery = useCitiesQuery()
  const createMutation = useCreateAdminHotelMutation()
  const queryClient = useQueryClient()
  const creationSession = useRef<HotelCreationSession>({ mediaIds: {} })
  const submitting = useRef(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [createdHotelId, setCreatedHotelId] = useState<string | null>(null)

  // Photo management state
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null)

  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    getValues,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<CreateAdminHotelFormValues>({
    resolver: zodResolver(createAdminHotelApiFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      cityId: '',
      ownerUserId: isOwner ? (currentUser?.id ?? '') : '',
      address: '',
      starRating: 4,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      description: '',
      latitude: null,
      longitude: null,
    },
  })

  // Watch fields for dynamic reactive features (pin label, progress bar, checklist)
  const hotelName = useWatch({ control, name: 'name' }) ?? ''
  const currentCityId = useWatch({ control, name: 'cityId' })
  const currentAddress = useWatch({ control, name: 'address' })
  const currentOwnerUserId = useWatch({ control, name: 'ownerUserId' })
  const currentLat = useWatch({ control, name: 'latitude' })
  const currentLng = useWatch({ control, name: 'longitude' })
  const currentCheckIn = useWatch({ control, name: 'checkInTime' })
  const currentCheckOut = useWatch({ control, name: 'checkOutTime' })

  // A self-creating owner uses their real account; an admin assigns a real owner.
  useEffect(() => {
    if (!currentOwnerUserId && isOwner && currentUser?.id) {
      setValue('ownerUserId', currentUser.id, { shouldValidate: false })
    }
  }, [currentUser, currentOwnerUserId, isOwner, setValue])

  const selectedCityName = useMemo(() => {
    return cities.find((c) => c.id === currentCityId)?.name
  }, [cities, currentCityId])

  // Geocoding and City Mismatch State
  interface CityMismatchAlert {
    detectedCityName: string
    detectedCityId?: string
    lat: number
    lng: number
    fullAddress: string
  }

  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [cityMismatchAlert, setCityMismatchAlert] = useState<CityMismatchAlert | null>(null)

  const handleSearchAddress = async () => {
    const addressToSearch = currentAddress?.trim()
    if (!addressToSearch || addressToSearch.length < 3) {
      void message.warning('Vui lòng nhập đầy đủ địa chỉ chi tiết trước khi tìm kiếm.')
      return
    }

    try {
      setIsSearchingAddress(true)
      const results = await geocodeAddress(addressToSearch)
      if (results.length === 0) {
        void message.warning('Không tìm thấy tọa độ khớp với địa chỉ này. Bạn có thể nhấp trực tiếp trên bản đồ để cắm ghim.')
        return
      }

      const best = results[0]
      if (!best) return

      // Compare detected city with selected city
      if (isCityMatch(best.detectedCityName, selectedCityName)) {
        setValue('latitude', best.lat, { shouldValidate: true })
        setValue('longitude', best.lng, { shouldValidate: true })
        setCityMismatchAlert(null)
        void message.success(`Đã định vị thành công: ${best.displayAddress}`)
      } else {
        const detectedName = best.detectedCityName || 'khu vực khác'
        const matchedCity = cities.find((c) => isCityMatch(detectedName, c.name))

        setCityMismatchAlert({
          detectedCityName: detectedName,
          detectedCityId: matchedCity?.id,
          lat: best.lat,
          lng: best.lng,
          fullAddress: best.displayAddress,
        })
        void message.warning(`Địa chỉ tìm thấy thuộc "${detectedName}", khác với thành phố bạn đang chọn!`)
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm địa chỉ:', err)
      void message.error('Không thể kết nối đến dịch vụ định vị địa chỉ.')
    } finally {
      setIsSearchingAddress(false)
    }
  }

  const handleSyncCity = (cityId: string, cityName: string, lat: number, lng: number) => {
    setValue('cityId', cityId, { shouldValidate: true })
    setValue('latitude', lat, { shouldValidate: true })
    setValue('longitude', lng, { shouldValidate: true })
    setCityMismatchAlert(null)
    void message.success(`Đã tự động đổi thành phố sang "${cityName}" và cập nhật vị trí ghim.`)
  }

  const handleKeepCityAndPin = (lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true })
    setValue('longitude', lng, { shouldValidate: true })
    setCityMismatchAlert(null)
    void message.info('Đã ghim tọa độ này và giữ nguyên thành phố đã chọn.')
  }

  // File selection handlers
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const incomingFiles = Array.from(fileList)
    const validPhotos: SelectedPhoto[] = []

    for (const file of incomingFiles) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        void message.warning(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WebP.`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        void message.warning(`Tệp "${file.name}" vượt quá dung lượng 5MB cho phép.`)
        continue
      }

      validPhotos.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isCover: false,
        name: file.name,
        sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      })
    }

    if (validPhotos.length > 0) {
      setPhotos((prev) => {
        const next = [...prev, ...validPhotos]
        // Ensure at least one photo is designated as cover
        if (!next.some((p) => p.isCover) && next[0]) {
          next[0].isCover = true
        }
        return next
      })
      void message.success(`Đã thêm ${validPhotos.length} ảnh vào danh sách tải lên.`)
    }
  }

  const handleSetCover = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) => ({
        ...photo,
        isCover: photo.id === photoId,
      })),
    )
    void message.info('Đã thay đổi ảnh bìa đại diện cho khách sạn.')
  }

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      const next = prev.filter((p) => p.id !== photoId)
      if (next.length > 0 && !next.some((p) => p.isCover) && next[0]) {
        next[0].isCover = true
      }
      return next
    })
  }

  // Calculate dynamic completion percentage
  let completedWeight = 0
  if (hotelName && hotelName.trim().length >= 3) completedWeight += 20
  if (currentCityId) completedWeight += 15
  if (currentAddress && currentAddress.trim().length >= 5) completedWeight += 15
  if (currentOwnerUserId && currentOwnerUserId.trim().length > 0) completedWeight += 15
  if (currentCheckIn && currentCheckOut) completedWeight += 10
  if (currentLat != null && currentLng != null) completedWeight += 10
  if (photos.length > 0) completedWeight += 15

  async function onSubmit(values: CreateAdminHotelFormValues) {
    if (submitting.current) return
    if (!isAuthorized || (!creationSession.current.created && (!citiesQuery.isSuccess || cities.length === 0))) return
    submitting.current = true
    setRecoveryError(null)
    clearErrors('root')
    try {
      setUploadingStatus(creationSession.current.created ? 'Đang thử lưu lại hình ảnh...' : 'Đang khởi tạo hồ sơ cơ sở lưu trú...')
      const isSelfOwner = !values.ownerUserId || values.ownerUserId === currentUser?.id
      const payload = { ...values, ownerUserId: !isAdmin && isSelfOwner ? '' : values.ownerUserId }
      const created = await completeHotelCreation(creationSession.current, photos, {
        create: () => createMutation.mutateAsync(payload),
        upload: uploadHotelMedia,
        save: (hotelId, transform) => updateHotelGallery(hotelId, transform, () => queryClient.invalidateQueries({ queryKey: hotelManagementKeys.all })),
      })
      void message.success(photos.length > 0
        ? `Đã tạo khách sạn "${created.name}" và lưu ${photos.length} ảnh thành công!`
        : `Đã tạo khách sạn "${created.name}" thành công!`)
      reset()
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
      setPhotos([])
      creationSession.current = { mediaIds: {} }
      setCreatedHotelId(null)
      onSuccess?.(created)
    } catch (error) {
      if (creationSession.current.created) {
        const id = creationSession.current.created.id
        setCreatedHotelId(id)
        setRecoveryError(`Đã tạo khách sạn ${id}. Bộ ảnh chưa được lưu đầy đủ. ${error instanceof Error ? error.message : 'Lưu ảnh thất bại.'} Thử lại chỉ xử lý ảnh cho khách sạn này; thông tin hồ sơ đã được lưu trước đó.`)
      } else {
        applyApiFieldErrors(error, setError)
        setError('root', { type: 'server', message: errorMessage(error) })
      }
    } finally {
      setUploadingStatus(null)
      submitting.current = false
    }
  }
  const isSubmitting = Boolean(uploadingStatus) || createMutation.isPending
  const cannotSubmit = isSubmitting || isChecking || !isAuthorized
    || (!createdHotelId && (citiesQuery.isPending || citiesQuery.isError || cities.length === 0))

  return (
    <form
      id={`${formId}-hotel-form`}
      onSubmit={(event) => {
        if (createdHotelId) {
          event.preventDefault()
          void onSubmit(getValues())
        } else {
          void handleSubmit(onSubmit)(event)
        }
      }}
      noValidate
      className="w-full flex flex-col gap-6"
    >
      {!isAdmin && <input type="hidden" {...register('ownerUserId')} />}

      {/* 1. Header & Actions Bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge badge-neutral">Quản lý khách sạn</span>
            <span className="text-[#bfd3cd] text-xs">/</span>
            <span
              className="badge font-semibold"
              style={{ background: 'var(--teal-tint)', color: 'var(--teal)', border: '1px solid #c6e5dc' }}
            >
              Thêm khách sạn mới
            </span>
          </div>
          <h1
            className="page-title flex items-center gap-2.5"
            tabIndex={-1}
            style={{ fontSize: '26px' }}
          >
            <ShopOutlined className="text-[#0b5f53]" aria-hidden="true" />
            <span>Tạo hồ sơ khách sạn</span>
          </h1>
          <p className="page-desc">
            Điền đầy đủ thông tin chuẩn hóa để đăng ký cơ sở lưu trú vào hệ thống và chuẩn bị mở bán phòng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onCancel && (
            <button
              type="button"
              className="secondary-btn"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Hủy / Quay lại
            </button>
          )}
          <button
            type="submit"
            className="primary-btn"
            disabled={cannotSubmit}
          >
            {isSubmitting ? (
              <>
                <LoadingOutlined aria-hidden="true" />
                <span>{uploadingStatus || 'Đang tạo khách sạn...'}</span>
              </>
            ) : (
              <>
                <SendOutlined aria-hidden="true" />
                <span>{createdHotelId ? 'Thử lưu lại hình ảnh' : 'Tạo khách sạn'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Verification note */}
      <div
        className="p-4 rounded-xl flex items-start gap-3 border text-[13px] leading-relaxed"
        style={{ background: '#f0faf6', borderColor: '#c8e8dd' }}
      >
        <InfoCircleOutlined className="text-[#0b5f53] text-base mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <strong className="text-[#08473e] block mb-0.5 font-semibold">
            Quy trình tạo hồ sơ khách sạn StayHub:
          </strong>
          <span className="text-[#344a44]">
            Hồ sơ khách sạn sau khi tạo thành công sẽ được khởi tạo ở trạng thái <strong>Bản nháp (DRAFT)</strong>.
             Hình ảnh được tải và liên kết sau khi tạo hồ sơ; nếu lưu ảnh thất bại, bạn có thể thử lại cho cùng khách sạn.
          </span>
        </div>
      </div>

      {citiesQuery.isPending && <p role="status">Đang tải danh sách thành phố...</p>}
      {citiesQuery.isError && (
        <div role="alert">
          <p>Không tải được danh sách thành phố. {errorMessage(citiesQuery.error)}</p>
          <button type="button" className="secondary-btn" onClick={() => void citiesQuery.refetch()}>Tải lại thành phố</button>
        </div>
      )}
      {citiesQuery.isSuccess && cities.length === 0 && <p role="status">Chưa có thành phố khả dụng. Vui lòng liên hệ quản trị viên.</p>}
      {!isChecking && !isAuthorized && <p role="alert">Vui lòng đăng nhập bằng tài khoản quản trị viên hoặc chủ khách sạn để tạo hồ sơ.</p>}
      {recoveryError && <p role="alert" className="text-red-600">{recoveryError}</p>}
      {errors.root?.message && <p role="alert" className="text-red-600">{errors.root.message}</p>}

      {/* 3. Main Form Grid */}
      <div className="form-layout">
        {/* Main Column */}
        <div className="form-main-col">
          {/* STEP 1: Thông tin chung & Nhận diện */}
          <div className="form-card">
            <div className="form-card-head">
              <div className="form-card-head-left">
                <span className="step-num">1</span>
                <div>
                  <h2 className="form-card-title">Thông tin chung &amp; Nhận diện</h2>
                  <p className="form-card-desc">
                    Tên cơ sở lưu trú, tiêu chuẩn xếp hạng sao và tỉnh/thành phố trực thuộc.
                  </p>
                </div>
              </div>
              <span className="badge badge-neutral">Bắt buộc</span>
            </div>

            <div className="flex flex-col gap-4">
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label" htmlFor={`${formId}-ownerUserId`}>Chủ sở hữu (Owner User ID) <span className="req">*</span></label>
                  <input
                    id={`${formId}-ownerUserId`}
                    {...register('ownerUserId')}
                    className={`form-input ${errors.ownerUserId ? 'is-error' : ''}`}
                    placeholder="UUID tài khoản chủ khách sạn"
                    disabled={isSubmitting || Boolean(createdHotelId)}
                    aria-invalid={Boolean(errors.ownerUserId)}
                  />
                  <span className="form-help">Nhập UUID tài khoản có vai trò HOTEL_OWNER, đang hoạt động và đã xác minh email.</span>
                  {errors.ownerUserId && <span className="form-field-error" role="alert">{errors.ownerUserId.message}</span>}
                </div>
              )}
              {/* Hotel Name */}
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-name`}>
                  <span>Tên khách sạn chính thức <span className="req">*</span></span>
                  <span className="char-count">{hotelName.length}/255</span>
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id={`${formId}-name`}
                      type="text"
                      maxLength={255}
                      className={`form-input ${errors.name ? 'is-error' : ''}`}
                      placeholder="Ví dụ: Khách sạn Grand Mercure Đà Nẵng, Solis Heritage Hội An..."
                    />
                  )}
                />
                {errors.name ? (
                  <span className="form-field-error" role="alert">{errors.name.message}</span>
                ) : (
                  <span className="form-help">
                    Tên thương hiệu hiển thị trên trang tìm kiếm và chứng nhận pháp lý đối tác.
                  </span>
                )}
              </div>

              {/* Star Rating & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Star Rating */}
                <div className="form-group">
                  <label className="form-label" id={`${formId}-starRating-label`}>
                    <span>Tiêu chuẩn sao <span className="req">*</span></span>
                  </label>
                  <Controller
                    name="starRating"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <div
                          className="star-rating-box"
                          role="radiogroup"
                          aria-labelledby={`${formId}-starRating-label`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= (field.value ?? 0) ? 'is-active' : ''}`}
                              onClick={() => field.onChange(star)}
                              aria-label={`${star} sao`}
                            >
                              <StarFilled />
                            </button>
                          ))}
                        </div>
                        <span className="star-rating-label">
                          {STAR_LABELS[field.value ?? 4] ?? `${field.value} sao`}
                        </span>
                      </div>
                    )}
                  />
                  {errors.starRating && (
                    <span className="form-field-error" role="alert">{errors.starRating.message}</span>
                  )}
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor={`${formId}-cityId`}>
                    <span>Tỉnh / Thành phố <span className="req">*</span></span>
                  </label>
                  <Controller
                    name="cityId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id={`${formId}-cityId`}
                        value={field.value || undefined}
                        onChange={(val) => field.onChange(val)}
                        placeholder="-- Chọn tỉnh / thành phố --"
                        className="w-full !h-11"
                        status={errors.cityId ? 'error' : undefined}
                        options={cities.map((city) => ({
                          label: `${city.name} (${city.countryCode})`,
                          value: city.id,
                        }))}
                      />
                    )}
                  />
                  {errors.cityId ? (
                    <span className="form-field-error" role="alert">{errors.cityId.message}</span>
                  ) : (
                    <span className="form-help">
                      Thành phố đăng ký kinh doanh và định tuyến tìm kiếm.
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor={`${formId}-description`}>
                  <span>Mô tả &amp; Điểm nổi bật</span>
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id={`${formId}-description`}
                      rows={4}
                      className={`form-textarea ${errors.description ? 'is-error' : ''}`}
                      placeholder="Mô tả không gian, tầm nhìn, phong cách kiến trúc và những nét đặc sắc thu hút du khách..."
                    />
                  )}
                />
                {errors.description ? (
                  <span className="form-field-error" role="alert">{errors.description.message}</span>
                ) : (
                  <span className="form-help">
                    Nội dung tóm tắt sẽ xuất hiện trong chi tiết khách sạn và trên voucher khuyến mãi.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Vị trí & Tọa độ định vị GPS */}
          <div className="form-card">
            <div className="form-card-head">
              <div className="form-card-head-left">
                <span className="step-num">2</span>
                <div>
                  <h2 className="form-card-title">Vị trí &amp; Tọa độ định vị GPS</h2>
                  <p className="form-card-desc">
                    Địa chỉ chi tiết và tọa độ kinh độ / vĩ độ hỗ trợ du khách tìm kiếm vị trí lưu trú.
                  </p>
                </div>
              </div>
              <span className="badge badge-neutral">Định vị GPS</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Detailed Address */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="form-label" htmlFor={`${formId}-address`} style={{ margin: 0 }}>
                    <span>Địa chỉ chi tiết <span className="req">*</span></span>
                  </label>
                  {selectedCityName && (
                    <span className="text-xs text-[#64748b]">
                      Khu vực tìm kiếm: <strong className="text-[#0b5f53]">{selectedCityName}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`${formId}-address`}
                        type="text"
                        className={`form-input flex-1 ${errors.address ? 'is-error' : ''}`}
                        placeholder="Ví dụ: 123 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleSearchAddress()
                          }
                        }}
                      />
                    )}
                  />
                  <button
                    type="button"
                    className="address-search-btn"
                    onClick={() => void handleSearchAddress()}
                    disabled={isSearchingAddress || !currentAddress || currentAddress.trim().length < 4}
                    title={currentAddress && currentAddress.trim().length >= 4 ? 'Định vị tọa độ trên bản đồ từ địa chỉ này' : 'Vui lòng nhập địa chỉ chi tiết trước'}
                  >
                    {isSearchingAddress ? (
                      <>
                        <LoadingOutlined spin />
                        <span>Đang tìm...</span>
                      </>
                    ) : (
                      <>
                        <SearchOutlined />
                        <span>Định vị từ địa chỉ</span>
                      </>
                    )}
                  </button>
                </div>

                {errors.address ? (
                  <span className="form-field-error" role="alert">{errors.address.message}</span>
                ) : (
                  <span className="form-help">
                    Điền đầy đủ số nhà, tên đường và bấm <strong>"Định vị từ địa chỉ"</strong> để tự động ghim vị trí lên bản đồ.
                  </span>
                )}

                {/* City Mismatch Warning Banner (Task 3: 1-Click Sync) */}
                {cityMismatchAlert && (
                  <div className="mt-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-600 text-lg leading-none" aria-hidden="true">⚠️</span>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-amber-900 m-0 mb-1">
                          Phát hiện địa chỉ nằm ngoài thành phố đã chọn
                        </h4>
                        <p className="text-xs text-amber-800 m-0 mb-2 leading-relaxed">
                          Địa chỉ <strong>"{cityMismatchAlert.fullAddress}"</strong> được xác định thuộc khu vực{' '}
                          <strong className="text-amber-950 underline font-semibold">{cityMismatchAlert.detectedCityName}</strong>, 
                          trong khi thành phố bạn đang chọn ở trên là <strong>"{selectedCityName || 'Chưa chọn'}"</strong>.
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {cityMismatchAlert.detectedCityId && (
                            <button
                              type="button"
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                              onClick={() => handleSyncCity(cityMismatchAlert.detectedCityId!, cityMismatchAlert.detectedCityName, cityMismatchAlert.lat, cityMismatchAlert.lng)}
                            >
                              <SyncOutlined />
                              <span>1-Click: Đổi thành phố sang "{cityMismatchAlert.detectedCityName}" &amp; cắm ghim</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors"
                            onClick={() => handleKeepCityAndPin(cityMismatchAlert.lat, cityMismatchAlert.lng)}
                          >
                            Vẫn giữ thành phố &amp; cắm ghim tọa độ này
                          </button>
                          <button
                            type="button"
                            className="text-xs text-amber-700 hover:underline bg-transparent border-0 cursor-pointer p-0 ml-1"
                            onClick={() => setCityMismatchAlert(null)}
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coordinates: Lat & Long */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor={`${formId}-latitude`}>
                    <span>Vĩ độ (Latitude)</span>
                  </label>
                  <Controller
                    name="latitude"
                    control={control}
                    render={({ field }) => (
                      <input
                        id={`${formId}-latitude`}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        type="number"
                        step="0.000001"
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        className={`form-input font-mono ${errors.latitude ? 'is-error' : ''}`}
                        placeholder="16.054407"
                      />
                    )}
                  />
                  {errors.latitude && (
                    <span className="form-field-error" role="alert">{errors.latitude.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor={`${formId}-longitude`}>
                    <span>Kinh độ (Longitude)</span>
                  </label>
                  <Controller
                    name="longitude"
                    control={control}
                    render={({ field }) => (
                      <input
                        id={`${formId}-longitude`}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        type="number"
                        step="0.000001"
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        className={`form-input font-mono ${errors.longitude ? 'is-error' : ''}`}
                        placeholder="108.202167"
                      />
                    )}
                  />
                  {errors.longitude && (
                    <span className="form-field-error" role="alert">{errors.longitude.message}</span>
                  )}
                </div>
              </div>

              {/* Interactive Nationwide Map (OpenStreetMap with Zoom & Pan) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="form-label" style={{ margin: 0 }}>
                    Bản đồ tương tác toàn quốc (Thu phóng &amp; Di chuyển để chọn mọi khu vực)
                  </span>
                  {selectedCityName && (
                    <span
                      className="badge font-semibold text-xs"
                      style={{ background: 'var(--teal-tint)', color: 'var(--teal)', border: '1px solid #c6e5dc' }}
                    >
                      Khu vực: {selectedCityName}
                    </span>
                  )}
                </div>

                <InteractiveHotelMap
                  latitude={currentLat ?? undefined}
                  longitude={currentLng ?? undefined}
                  hotelName={hotelName}
                  cityName={selectedCityName}
                  onChangeCoordinates={({ lat, lng }) => {
                    setValue('latitude', lat, { shouldValidate: true })
                    setValue('longitude', lng, { shouldValidate: true })
                  }}
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Thư viện hình ảnh khách sạn */}
          <div className="form-card">
            <div className="form-card-head">
              <div className="form-card-head-left">
                <span className="step-num">3</span>
                <div>
                  <h2 className="form-card-title">Thư viện hình ảnh khách sạn</h2>
                  <p className="form-card-desc">
                    Tải lên hình ảnh khuôn viên, phòng nghỉ và tiện ích để thu hút du khách đặt phòng.
                  </p>
                </div>
              </div>
              <span className="badge badge-neutral">Tối đa 5MB/ảnh</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Upload Dropzone */}
              <label className="upload-dropzone" htmlFor={`${formId}-photo-upload`}>
                <input
                  id={`${formId}-photo-upload`}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  disabled={isSubmitting}
                />
                <div className="w-11 h-11 rounded-full bg-[#eaf6f1] text-[#0b5f53] flex items-center justify-center text-xl">
                  <PictureOutlined />
                </div>
                <strong>Kéo thả ảnh vào đây hoặc nhấp để chọn tệp</strong>
                <span>Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 5MB mỗi ảnh, tối đa 16 Megapixels)</span>
              </label>

              {/* Photo Gallery Grid */}
              {photos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#12211d]">
                      Đã chọn {photos.length} hình ảnh
                    </span>
                    <span className="text-[11px] text-[#5f736e]">
                      Rê chuột vào ảnh để chọn làm Ảnh bìa hoặc Xóa
                    </span>
                  </div>

                  <div className="photo-gallery">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`photo-item ${photo.isCover ? 'is-cover' : ''}`}
                      >
                        {photo.isCover && (
                          <span className="photo-cover-badge">⭐ Ảnh bìa</span>
                        )}
                        <img src={photo.previewUrl} alt={photo.name} />
                        <span className="photo-item-tag">{photo.name}</span>
                        <div className="photo-overlay-actions">
                          {!photo.isCover ? (
                            <button
                              type="button"
                              className="photo-btn"
                              onClick={() => handleSetCover(photo.id)}
                            >
                              Đặt làm ảnh bìa
                            </button>
                          ) : (
                            <span className="text-white text-[11px] font-semibold">Đã là ảnh bìa</span>
                          )}
                          <button
                            type="button"
                            className="photo-btn photo-btn--danger"
                            onClick={() => handleRemovePhoto(photo.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}

                    <label className="photo-add-box" htmlFor={`${formId}-photo-add-more`}>
                      <input
                        id={`${formId}-photo-add-more`}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        disabled={isSubmitting}
                      />
                      <PlusOutlined className="text-lg" />
                      <span>Thêm ảnh</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Column (Sticky) */}
        <div className="form-side-col">
          {/* CARD 1: Quy định giờ lưu trú (Thiết kế lại tối ưu, rõ ràng, không bị ngắt dòng) */}
          <div className="form-card stay-policy-card">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#dce7e3]">
              <ClockCircleOutlined className="text-[#0b5f53]" style={{ fontSize: '16px' }} aria-hidden="true" />
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Quy định giờ lưu trú
                </h3>
                <span style={{ fontSize: '11px', color: '#5F6B76' }}>
                  Khung giờ nhận &amp; trả phòng tiêu chuẩn
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Check-in Box */}
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '11px 13px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: '#E6F4EA',
                        color: '#137333',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        login
                      </span>
                    </span>
                    <label
                      className="form-label"
                      htmlFor={`${formId}-checkInTime`}
                      style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
                    >
                      Giờ nhận phòng (Check-in)
                    </label>
                  </div>
                  <span style={{ fontSize: '11px', color: '#5F6B76' }}>Từ thời điểm này</span>
                </div>

                <Controller
                  name="checkInTime"
                  control={control}
                  render={({ field }) => {
                    const timeVal = field.value ? dayjs(field.value, 'HH:mm') : null
                    return (
                      <div>
                        <TimePicker
                          id={`${formId}-checkInTime`}
                          value={timeVal && timeVal.isValid() ? timeVal : dayjs('14:00', 'HH:mm')}
                          format="HH:mm"
                          minuteStep={15}
                          showNow={false}
                          needConfirm={false}
                          inputReadOnly
                          allowClear={false}
                          className={`hotel-time-picker ${errors.checkInTime ? 'is-error' : ''}`}
                          onChange={(val) => {
                            if (val && val.isValid()) {
                              field.onChange(val.format('HH:mm'))
                            }
                          }}
                        />
                        <div className="flex items-center gap-1.5 mt-2">
                          <span style={{ fontSize: '11px', color: '#5F6B76', flexShrink: 0 }}>Gợi ý:</span>
                          <div className="flex gap-1.5 flex-1">
                            {['14:00', '13:00', '15:00'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                className={`time-preset-pill ${preset === '14:00' ? 'flex-[1.3]' : 'flex-1'} text-center ${field.value === preset ? 'active' : ''}`}
                                onClick={() => field.onChange(preset)}
                                style={{ padding: '4px 2px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                {preset}
                                {preset === '14:00' && ' (Chuẩn)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                {errors.checkInTime && (
                  <span className="form-field-error" role="alert">{errors.checkInTime.message}</span>
                )}
              </div>

              {/* Check-out Box */}
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '11px 13px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF3F2',
                        color: '#B42318',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        logout
                      </span>
                    </span>
                    <label
                      className="form-label"
                      htmlFor={`${formId}-checkOutTime`}
                      style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
                    >
                      Giờ trả phòng (Check-out)
                    </label>
                  </div>
                  <span style={{ fontSize: '11px', color: '#5F6B76' }}>Trước thời điểm này</span>
                </div>

                <Controller
                  name="checkOutTime"
                  control={control}
                  render={({ field }) => {
                    const timeVal = field.value ? dayjs(field.value, 'HH:mm') : null
                    return (
                      <div>
                        <TimePicker
                          id={`${formId}-checkOutTime`}
                          value={timeVal && timeVal.isValid() ? timeVal : dayjs('12:00', 'HH:mm')}
                          format="HH:mm"
                          minuteStep={15}
                          showNow={false}
                          needConfirm={false}
                          inputReadOnly
                          allowClear={false}
                          className={`hotel-time-picker ${errors.checkOutTime ? 'is-error' : ''}`}
                          onChange={(val) => {
                            if (val && val.isValid()) {
                              field.onChange(val.format('HH:mm'))
                            }
                          }}
                        />
                        <div className="flex items-center gap-1.5 mt-2">
                          <span style={{ fontSize: '11px', color: '#5F6B76', flexShrink: 0 }}>Gợi ý:</span>
                          <div className="flex gap-1.5 flex-1">
                            {['12:00', '11:00', '10:00'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                className={`time-preset-pill ${preset === '12:00' ? 'flex-[1.3]' : 'flex-1'} text-center ${field.value === preset ? 'active' : ''}`}
                                onClick={() => field.onChange(preset)}
                                style={{ padding: '4px 2px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              >
                                {preset}
                                {preset === '12:00' && ' (Chuẩn)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                {errors.checkOutTime && (
                  <span className="form-field-error" role="alert">{errors.checkOutTime.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Tiến độ hoàn thiện & Hành động (Chỉ hiển thị % hoàn thiện và trạng thái) */}
          <div
            className="form-card"
            style={{ background: 'var(--teal-tint)', borderColor: '#c8e8dd' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="eyebrow" style={{ color: 'var(--teal-dark)' }}>
                Tiến độ hoàn thiện hồ sơ
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--teal)' }}>
                {Math.min(100, completedWeight)}%
              </span>
            </div>

            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, completedWeight)}%` }} />
            </div>

            <ul className="kv-list mb-4">
              <li className="kv-row">
                <span className="kv-key">Trạng thái hồ sơ:</span>
                <span
                  className="badge"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                >
                  Bản nháp (DRAFT)
                </span>
              </li>
            </ul>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="primary-btn w-full justify-center"
                disabled={cannotSubmit}
              >
                {isSubmitting ? (
                  <>
                    <LoadingOutlined aria-hidden="true" />
                    <span>{uploadingStatus || 'Đang khởi tạo...'}</span>
                  </>
                ) : (
                  <>
                    <SendOutlined aria-hidden="true" />
                    <span>{createdHotelId ? 'Thử lưu lại hình ảnh' : 'Tạo khách sạn'}</span>
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  className="secondary-btn w-full justify-center"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Quay lại danh sách
                </button>
              )}
            </div>
          </div>

          {/* CARD 4: Checklist tiêu chuẩn */}
          <div className="form-card">
            <span className="eyebrow block mb-1">Checklist thẩm định StayHub</span>
            <div className="checklist-box">
              <div className="checklist-item">
                {hotelName.trim().length >= 3 ? (
                  <CheckCircleFilled className="chk-ok" aria-hidden="true" />
                ) : (
                  <MinusCircleOutlined className="chk-pending" aria-hidden="true" />
                )}
                <span>Tên khách sạn chính thức</span>
              </div>
              <div className="checklist-item">
                {currentCityId ? (
                  <CheckCircleFilled className="chk-ok" aria-hidden="true" />
                ) : (
                  <MinusCircleOutlined className="chk-pending" aria-hidden="true" />
                )}
                <span>Thuộc tỉnh/thành phố hợp lệ</span>
              </div>
              <div className="checklist-item">
                {currentAddress && currentAddress.trim().length >= 5 ? (
                  <CheckCircleFilled className="chk-ok" aria-hidden="true" />
                ) : (
                  <MinusCircleOutlined className="chk-pending" aria-hidden="true" />
                )}
                <span>Địa chỉ chi tiết cơ sở lưu trú</span>
              </div>
              <div className="checklist-item">
                {currentLat != null && currentLng != null ? (
                  <CheckCircleFilled className="chk-ok" aria-hidden="true" />
                ) : (
                  <MinusCircleOutlined className="chk-pending" aria-hidden="true" />
                )}
                <span>Tọa độ định vị GPS đã ghim</span>
              </div>
              <div className="checklist-item">
                {photos.length > 0 ? (
                  <CheckCircleFilled className="chk-ok" aria-hidden="true" />
                ) : (
                  <MinusCircleOutlined className="chk-pending" aria-hidden="true" />
                )}
                <span>Hình ảnh đại diện ({photos.length} ảnh đã chọn)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}


