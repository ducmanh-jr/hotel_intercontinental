import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderAddOutlined,
  FolderOutlined,
  PictureOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd'
import type { UploadFile } from 'antd'
import {
  uploadHotelMedia,
  useHotelImagesQuery,
  useHotelWorkspace,
  useHotelAlbums,
} from '@/features/hotels'
import { ApiError } from '@/shared/api/api-error'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PageLoading } from '@/shared/ui/PageLoading'

export interface AlbumItem {
  id: string
  name: string
  description?: string
  isSystem?: boolean
}

export function HotelPhotosPage() {
  const { hotel, hotelId } = useHotelWorkspace()
  const albums = useHotelAlbums(hotelId)
  const activeWrite = useRef(false)
  const uploadedIds = useRef(new Map<string, string>())
  const imagesQuery = useHotelImagesQuery(hotelId)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false)

  const [activeAlbumId, setActiveAlbumId] = useState('all')
  const [selectedUploadTarget, setUploadTarget] = useState('ungrouped')
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
  const [albumDescription, setAlbumDescription] = useState('')

  // Create album modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [albumNameError, setAlbumNameError] = useState<string | null>(null)

  const existingImages = useMemo(() => imagesQuery.data ?? [], [imagesQuery.data])
  const coverImage =
    existingImages.find((img) => img.cover) || (existingImages.length > 0 ? existingImages[0] : null)
  const displayCoverUrl = coverImage?.url || hotel?.coverImageUrl

  const writesDisabled = !imagesQuery.canWrite || !albums.query.isSuccess || isUploading || isUpdatingGallery || albums.mutation.isPending

  // All combined albums
  const allAlbums: AlbumItem[] = useMemo(() => [
    ...(albums.query.data ?? []).map((album) => ({ ...album, description: album.description ?? undefined })),
    { id: 'ungrouped', name: 'Chưa phân loại', description: 'Ảnh chưa được gán vào album', isSystem: true },
  ], [albums.query.data])
  const uploadTarget = allAlbums.some((album) => album.id === selectedUploadTarget) ? selectedUploadTarget : 'ungrouped'

  // Count photos per album
  const albumCounts = useMemo(() => {
    const counts: Record<string, number> = { all: existingImages.length }
    allAlbums.forEach((a) => {
      counts[a.id] = 0
    })
    existingImages.forEach((img) => {
      const aId = (img.albumId ?? 'ungrouped')
      counts[aId] = (counts[aId] || 0) + 1
    })
    return counts
  }, [existingImages, allAlbums])

  // Filtered images for display
  const displayedImages = useMemo(() => {
    if (activeAlbumId === 'all') {
      return existingImages.map((img, idx) => ({
        ...img,
        albumId: (img.albumId ?? 'ungrouped'),
        originalIndex: idx,
      }))
    }
    return existingImages
      .map((img, idx) => ({
        ...img,
        albumId: (img.albumId ?? 'ungrouped'),
        originalIndex: idx,
      }))
      .filter((img) => img.albumId === activeAlbumId)
  }, [existingImages, activeAlbumId])

  // Preview groups for guest view: only non-empty albums!
  const previewGroups = useMemo(() => {
    return allAlbums
      .map((album) => {
        const items = existingImages
          .map((img, idx) => ({
            ...img,
            albumId: (img.albumId ?? 'ungrouped'),
            originalIndex: idx,
          }))
          .filter((img) => img.albumId === album.id)
        return { album, items }
      })
      .filter((group) => group.items.length > 0)
  }, [allAlbums, existingImages])

  const activeAlbum = allAlbums.find((a) => a.id === activeAlbumId)

  if (!hotel) return null

  const breadcrumbItems = [
    { label: 'Khách sạn', to: '/hotels' },
    { label: hotel.name, to: `/hotels/${hotelId}` },
    { label: 'Hình ảnh' },
  ]

  // Mutator runner
  const runWrite = async (upload: boolean, operation: () => Promise<unknown>, success: string) => {
    if (activeWrite.current || writesDisabled) return
    activeWrite.current = true
    if (upload) setIsUploading(true)
    else setIsUpdatingGallery(true)
    try {
      await operation()
      message.success(success)
      if (upload) {
        uploadedIds.current.clear()
        setFileList([])
      }
    } catch (error) {
      message.error(
        error instanceof ApiError && error.status === 409
          ? 'Dữ liệu ảnh hoặc phiên bản đã thay đổi. Đã yêu cầu tải lại; hãy kiểm tra thư viện rồi thử lại thao tác.'
          : error instanceof Error
            ? error.message
            : 'Không thể lưu thư viện ảnh.',
      )
    } finally {
      activeWrite.current = false
      setIsUploading(false)
      setIsUpdatingGallery(false)
    }
  }

  // Handle uploading photos to the target album
  const handleUpload = () => {
    const targetAlbumName = allAlbums.find((a) => a.id === uploadTarget)?.name || 'album'
    return runWrite(
      true,
      async () => {
        await imagesQuery.saveGallery(async (current) => {
          for (const item of fileList) {
            const uploadKey = `${hotelId}:${item.uid}`
            if (!uploadedIds.current.has(uploadKey)) {
              if (!item.originFileObj)
                throw new Error(`Không đọc được tệp ${item.name}. Vui lòng chọn lại.`)
              const uploaded = await uploadHotelMedia({ file: item.originFileObj, hotelId })
              uploadedIds.current.set(uploadKey, uploaded.id)
            }
          }
          const newIds = fileList
            .map((item) => uploadedIds.current.get(`${hotelId}:${item.uid}`)!)
            .filter((id) => !current.some((image) => image.mediaId === id))
          return [
            ...current,
            ...newIds.map((mediaId, index) => ({
              mediaId,
              albumId: uploadTarget === 'ungrouped' ? null : uploadTarget,
              sortOrder: 0,
              cover: !current.some((image) => image.cover) && index === 0,
            })),
          ].map((image, sortOrder) => ({ ...image, sortOrder }))
        })

      },
      `Đã tải lên và lưu ${fileList.length} hình ảnh vào album "${targetAlbumName}"!`,
    )
  }

  const handleSetCover = (targetMediaId: string) =>
    runWrite(
      false,
      () =>
        imagesQuery.saveGallery((current) => {
          if (!current.some((image) => image.mediaId === targetMediaId))
            throw new Error('Ảnh đã bị thay đổi. Vui lòng kiểm tra thư viện vừa tải lại.')
          return current.map((image) => ({ ...image, cover: image.mediaId === targetMediaId }))
        }),
      'Đã cập nhật ảnh bìa đại diện của khách sạn!',
    )

  const handleDeleteImage = (targetMediaId: string) =>
    runWrite(
      false,
      () =>
        imagesQuery.saveGallery((current) => {
          const remaining = current.filter((image) => image.mediaId !== targetMediaId)
          const hasCover = remaining.some((image) => image.cover)
          return remaining.map((image, sortOrder) => ({
            ...image,
            sortOrder,
            cover: image.cover || (!hasCover && sortOrder === 0),
          }))
        }),
      'Đã gỡ ảnh khỏi thư viện!',
    )

  const handleMoveOrder = (indexInExisting: number, direction: 'left' | 'right') => {
    const mediaId = existingImages[indexInExisting]?.mediaId
    return runWrite(
      false,
      () =>
        imagesQuery.saveGallery((current) => {
          const from = current.findIndex((image) => image.mediaId === mediaId)
          const to = direction === 'left' ? from - 1 : from + 1
          if (from < 0 || to < 0 || to >= current.length)
            throw new Error('Thứ tự ảnh đã thay đổi. Vui lòng kiểm tra thư viện vừa tải lại.')
          const reordered = [...current]
          const previous = reordered[from]
          reordered[from] = reordered[to]
          reordered[to] = previous
          return reordered.map((image, sortOrder) => ({ ...image, sortOrder }))
        }),
      'Đã thay đổi thứ tự ảnh!',
    )
  }

  const handleReassignPhotoAlbum = (mediaId: string, albumId: string) => runWrite(false, () =>
    imagesQuery.saveGallery((current) => {
      if (!current.some((image) => image.mediaId === mediaId)) throw new Error('Ảnh đã thay đổi. Vui lòng tải lại.')
      return current.map((image) => image.mediaId === mediaId ? { ...image, albumId: albumId === 'ungrouped' ? null : albumId } : image)
    }), 'Đã lưu phân loại ảnh lên máy chủ.')

  const handleCreateAlbum = () => {
    const name = newAlbumName.trim()
    if (!name || name.length > 100) { setAlbumNameError('Nhập tên album từ 1 đến 100 ký tự.'); return }
    return runWrite(false, async () => {
      const result = await albums.mutation.mutateAsync(editingAlbumId
        ? { kind: 'update', albumId: editingAlbumId, name, description: albumDescription }
        : { kind: 'create', name, description: albumDescription })
      if ('id' in result) { setActiveAlbumId(result.id); setUploadTarget(result.id) }
      setCreateModalOpen(false)
      setEditingAlbumId(null)
      setNewAlbumName('')
      setAlbumDescription('')
    }, editingAlbumId ? 'Đã cập nhật album.' : 'Đã tạo album.')
  }

  const handleDeleteCustomAlbum = (albumId: string) => runWrite(false, async () => {
    await albums.mutation.mutateAsync({ kind: 'delete', albumId })
    setActiveAlbumId('all')
    setUploadTarget('ungrouped')
  }, 'Đã xóa album. Ảnh được giữ lại trong nhóm Chưa phân loại.')

  const handleMoveAlbum = (direction: -1 | 1) => {
    const ids = (albums.query.data ?? []).map((album) => album.id)
    const from = ids.indexOf(activeAlbumId)
    const to = from + direction
    if (from < 0 || to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    return runWrite(false, () => albums.mutation.mutateAsync({ kind: 'order', albumIds: ids }), 'Đã lưu thứ tự album.')
  }

  const scrollToUpload = () => {
    const el = document.getElementById('upload-card-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="hotel-photos-page max-w-6xl mx-auto space-y-6">
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        kicker="BỘ SƯU TẬP &amp; HÌNH ẢNH"
        title="Hình ảnh khách sạn theo album"
        description="Quản lý ảnh đại diện và phân bổ hình ảnh vào các album chuyên biệt (Phòng ngủ, Phòng tắm, Tiện ích...). Phân loại ảnh để khách dễ xem thông tin cơ sở lưu trú."
        extra={
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={scrollToUpload}
            className="!bg-[#0b5f53] !rounded-lg font-medium"
          >
            Tải ảnh vào album
          </Button>
        }
      />

      {albums.query.isPending && <PageLoading />}
      {albums.query.isError && <ErrorState error={albums.query.error} onRetry={() => void albums.query.refetch()} />}
      {activeAlbum && !activeAlbum.isSystem && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={writesDisabled} onClick={() => {
            setEditingAlbumId(activeAlbum.id); setNewAlbumName(activeAlbum.name)
            setAlbumDescription(activeAlbum.description ?? ''); setCreateModalOpen(true)
          }}>Sửa tên và mô tả album</Button>
          <Button disabled={writesDisabled || albums.query.data?.[0]?.id === activeAlbumId} onClick={() => void handleMoveAlbum(-1)}>Album lên trước</Button>
          <Button disabled={writesDisabled || albums.query.data?.at(-1)?.id === activeAlbumId} onClick={() => void handleMoveAlbum(1)}>Album xuống sau</Button>
        </div>
      )}

      {/* KHỐI 1: TỔNG QUAN BỘ SƯU TẬP & ẢNH BÌA ĐẠI DIỆN */}
      <section className="bg-white p-5 rounded-2xl border border-[#dce7e3] shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Trái: Ảnh bìa đại diện thu gọn + Xem to */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 w-full lg:w-auto">
            <div className="relative w-32 sm:w-36 h-24 rounded-xl overflow-hidden bg-[#eef8f5] border border-[#dce7e3] shrink-0 group">
              {displayCoverUrl ? (
                <Image
                  src={displayCoverUrl}
                  alt={`Ảnh bìa ${hotel.name}`}
                  className="w-full h-full object-cover"
                  rootClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#8c9e99]">
                  <PictureOutlined className="text-xl mb-1 text-[#0b5f53]" />
                  <span>Chưa có bìa</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0b5f53] text-white flex items-center gap-1 shadow-xs pointer-events-none">
                <StarFilled className="text-[9px]" /> Ảnh bìa
              </span>
            </div>

            {/* Thông tin nhanh & Chỉ số */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#12211d] m-0 break-words">
                  Bộ sưu tập {hotel.name}
                </h2>
                {coverImage && (
                  <Tag color="success" className="!rounded-md !bg-[#eef8f5] !text-[#0b5f53] !border-[#bcd8cf] !text-[11px] !m-0">
                    Đã thiết lập ảnh bìa
                  </Tag>
                )}
              </div>

              <p className="text-xs text-[#5f736e] m-0 leading-relaxed">
                Ảnh bìa hiển thị đầu tiên trên kết quả tìm kiếm. Để chọn ảnh bìa mới, bấm nút <strong>"Đặt bìa"</strong> ở bức ảnh mong muốn bên dưới.
              </p>

              <div className="flex items-center gap-2.5 pt-1 text-xs text-[#5f736e] flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#f7fbfa] px-2.5 py-1 rounded-lg border border-[#e4e9e7]">
                  <PictureOutlined className="text-[#0b5f53]" />
                  <span><strong>{existingImages.length}</strong> ảnh tổng cộng</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#f7fbfa] px-2.5 py-1 rounded-lg border border-[#e4e9e7]">
                  <FolderOutlined className="text-[#0b5f53]" />
                  <span><strong>{previewGroups.length}</strong> / {allAlbums.length} album có ảnh</span>
                </span>
              </div>
            </div>
          </div>

          {/* Phải: Phím tắt thao tác nhanh */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => {
                setEditingAlbumId(null)
                setAlbumDescription('')
                setNewAlbumName('')
                setAlbumNameError(null)
                setCreateModalOpen(true)
              }}
              className="!rounded-xl text-xs font-medium"
            >
              Tạo album mới
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={scrollToUpload}
              className="!bg-[#0b5f53] !rounded-xl text-xs font-medium"
            >
              Tải ảnh mới
            </Button>
          </div>
        </div>
      </section>

      {/* KHỐI 2: KHÔNG GIAN QUẢN LÝ ALBUM & LƯỚI ẢNH (HỢP NHẤT TRONG 1 THẺ) */}
      <section className="bg-white rounded-2xl border border-[#dce7e3] shadow-xs overflow-hidden">
        {/* Hàng A: Thanh chọn Album dạng Chips */}
        <div className="p-4 sm:p-5 border-b border-[#f2f6f5] bg-[#fafcfb]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#12211d] uppercase tracking-wider flex items-center gap-2">
              <FolderOutlined className="text-[#0b5f53]" />
              <span>Phân loại album ảnh</span>
            </span>
            <span className="text-[11px] text-[#5f736e]">
              Bấm vào từng album để lọc ảnh hoặc sắp xếp thứ tự
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chip Tất cả */}
            <button
              type="button"
              onClick={() => setActiveAlbumId('all')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                activeAlbumId === 'all'
                  ? 'bg-[#eef8f5] border-[#0b5f53] text-[#0b5f53] font-semibold ring-1 ring-[#0b5f53]/20 shadow-2xs'
                  : 'bg-white border-[#dce7e3] text-[#5f736e] hover:border-[#bcd8cf] hover:text-[#12211d]'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeAlbumId === 'all' ? 'bg-[#0b5f53] text-white' : 'bg-[#f4f8f7] text-[#8c9e99]'
                }`}
              >
                {albumCounts.all ?? 0}
              </span>
            </button>

            {/* Các album hệ thống và tùy chỉnh */}
            {allAlbums.map((album) => {
              const isActive = activeAlbumId === album.id
              const count = albumCounts[album.id] ?? 0
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => {
                    setActiveAlbumId(album.id)
                    setUploadTarget(album.id)
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-[#eef8f5] border-[#0b5f53] text-[#0b5f53] font-semibold ring-1 ring-[#0b5f53]/20 shadow-2xs'
                      : 'bg-white border-[#dce7e3] text-[#5f736e] hover:border-[#bcd8cf] hover:text-[#12211d]'
                  }`}
                >
                  <span>{album.name}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#0b5f53] text-white' : 'bg-[#f4f8f7] text-[#8c9e99]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}

            {/* Nút Tạo album mới */}
            <button
              type="button"
              onClick={() => {
                setEditingAlbumId(null)
                setAlbumDescription('')
                setNewAlbumName('')
                setAlbumNameError(null)
                setCreateModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border border-dashed border-[#0b5f53]/60 bg-[#f7fbfa] text-[#0b5f53] hover:bg-[#eef8f5] hover:border-[#0b5f53]"
            >
              <PlusOutlined className="text-[11px]" />
              <span>Tạo album mới</span>
            </button>
          </div>
        </div>

        {/* Hàng B: Header Album đang chọn & Thao tác */}
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-[#f2f6f5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold text-[#12211d] m-0">
              {activeAlbumId === 'all' ? 'Tất cả hình ảnh cơ sở' : activeAlbum?.name}
            </h3>
            {activeAlbum && (
              <>
                <Tag>{displayedImages.length} ảnh</Tag>
                {activeAlbum.isSystem ? (
                  <span className="text-[11px] text-[#8c9e99] bg-[#f4f8f7] px-2 py-0.5 rounded-md font-medium">
                    Mặc định
                  </span>
                ) : (
                  <Popconfirm
                    title={`Xóa album "${activeAlbum.name}"?`}
                    description="Ảnh được giữ lại và chuyển về nhóm Chưa phân loại."
                    okText="Xóa album"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDeleteCustomAlbum(activeAlbum.id)}
                  >
                    <Button disabled={writesDisabled} size="small" danger type="text" icon={<DeleteOutlined />} className="text-xs">
                      Xóa album này
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}
            {activeAlbum?.description && (
              <span className="text-xs text-[#5f736e] hidden md:inline-block border-l border-[#dce7e3] pl-2.5 ml-1">
                {activeAlbum.description}
              </span>
            )}
          </div>

          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (activeAlbumId !== 'all') {
                setUploadTarget(activeAlbumId)
              }
              scrollToUpload()
            }}
            className="!bg-[#0b5f53] !rounded-lg text-xs shrink-0 self-start sm:self-auto font-medium"
          >
            Thêm ảnh vào album này
          </Button>
        </div>

        {/* Hàng C: Lưới ảnh trong Album */}
        <div className="p-4 sm:p-5">
          {imagesQuery.isPending ? (
            <PageLoading />
          ) : imagesQuery.isError ? (
            <ErrorState error={imagesQuery.error} onRetry={() => void imagesQuery.refetch()} />
          ) : displayedImages.length === 0 ? (
            <div className="py-10 text-center bg-[#f7fbfa] rounded-xl border border-dashed border-[#dce7e3]">
              <EmptyState
                title={`Chưa có ảnh nào trong album ${activeAlbum?.name || ''}`}
                description="Hãy chọn hoặc kéo thả các tệp ảnh ở phần tải lên bên dưới để đưa ảnh vào album này."
              />
              <Button
                type="primary"
                size="small"
                icon={<UploadOutlined />}
                onClick={() => {
                  if (activeAlbumId !== 'all') setUploadTarget(activeAlbumId)
                  scrollToUpload()
                }}
                className="mt-4 !bg-[#0b5f53] !rounded-lg"
              >
                Tải ảnh vào album ngay
              </Button>
            </div>
          ) : (
            <Image.PreviewGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedImages.map((img) => {
                  const isCover = img.cover || (img.originalIndex === 0 && !existingImages.some((i) => i.cover))
                  const currentImgAlbum = allAlbums.find((a) => a.id === img.albumId)

                  return (
                    <div
                      key={img.mediaId}
                      className={`rounded-xl border overflow-hidden bg-white shadow-xs transition-shadow hover:shadow-md flex flex-col ${
                        isCover ? 'border-[#0b5f53] ring-2 ring-[#0b5f53]/20' : 'border-[#dce7e3]'
                      }`}
                    >
                      <div className="relative h-40 bg-[#f7fbfa] overflow-hidden group">
                        {img.url ? (
                          <Image
                            src={img.url}
                            alt={`Ảnh khách sạn ${img.originalIndex + 1}`}
                            className="w-full h-40 object-cover"
                            rootClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#8c9e99] bg-[#eef8f5]">
                            <PictureOutlined className="text-2xl mb-1 text-[#0b5f53]" />
                            <span>Ảnh #{img.originalIndex + 1}</span>
                          </div>
                        )}

                        {/* Badges góc trên */}
                        <div className="absolute top-2 left-2 flex gap-1 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
                            #{img.originalIndex + 1}
                          </span>
                          {isCover && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0b5f53] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs">
                              <StarFilled /> Bìa
                            </span>
                          )}
                        </div>

                        {/* Nhãn tên album ở góc dưới ảnh khi xem tất cả */}
                        {activeAlbumId === 'all' && currentImgAlbum && (
                          <div className="absolute bottom-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-md bg-white/90 text-[#0b5f53] text-[10px] font-semibold backdrop-blur-xs shadow-xs">
                              {currentImgAlbum.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Menu điều khiển của bức ảnh */}
                      <div className="p-2.5 bg-white flex flex-col gap-2 border-t border-[#edf4f1] mt-auto">
                        {/* Hàng chuyển đổi album */}
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="text-[#8c9e99] flex items-center gap-1 shrink-0">
                            <SwapOutlined /> Album:
                          </span>
                          <Select
                            size="small"
                            value={img.albumId}
                            disabled={writesDisabled}
                            onChange={(newVal) => handleReassignPhotoAlbum(img.mediaId, newVal)}
                            className="w-[140px] text-xs"
                            options={allAlbums.map((a) => ({
                              value: a.id,
                              label: a.name,
                            }))}
                          />
                        </div>

                        {/* Hàng thao tác thứ tự & đặt bìa & xóa */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#f4f8f7]">
                          <div className="flex items-center gap-1">
                            <Tooltip title="Chuyển về trước">
                              <Button
                                size="small"
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                disabled={img.originalIndex === 0 || writesDisabled}
                                onClick={() => handleMoveOrder(img.originalIndex, 'left')}
                                className="!w-8 !h-8 !min-w-[32px] !flex !items-center !justify-center !p-0"
                              />
                            </Tooltip>
                            <Tooltip title="Chuyển về sau">
                              <Button
                                size="small"
                                type="text"
                                icon={<ArrowRightOutlined />}
                                disabled={img.originalIndex === existingImages.length - 1 || writesDisabled}
                                onClick={() => handleMoveOrder(img.originalIndex, 'right')}
                                className="!w-8 !h-8 !min-w-[32px] !flex !items-center !justify-center !p-0"
                              />
                            </Tooltip>
                          </div>

                          <div className="flex items-center gap-1">
                            {!isCover && (
                              <Tooltip title="Đặt làm ảnh bìa">
                                <Button
                                  size="small"
                                  icon={<StarOutlined />}
                                  disabled={writesDisabled}
                                  onClick={() => handleSetCover(img.mediaId)}
                                  className="text-xs !h-8"
                                >
                                  Đặt bìa
                                </Button>
                              </Tooltip>
                            )}
                            <Popconfirm
                              title="Gỡ ảnh này khỏi khách sạn?"
                              okText="Gỡ"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => handleDeleteImage(img.mediaId)}
                            >
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={writesDisabled}
                                className="!w-8 !h-8 !min-w-[32px] !flex !items-center !justify-center !p-0"
                              />
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Image.PreviewGroup>
          )}
        </div>
      </section>

      {/* THẺ 4: Tải lên bộ ảnh mới (#upload-card) */}
      <section id="upload-card-section" className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e4e9e7] shadow-xs">
        {/* Card Head matching prototype */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#12211d] m-0 flex items-center gap-2">
              <UploadOutlined className="text-[#0b5f53] text-lg" />
              <span>Tải lên bộ ảnh mới</span>
            </h2>
            <p className="text-xs text-[#6a7a74] mt-1 mb-0">
              JPG, PNG, WEBP, tối đa 10MB mỗi ảnh.
            </p>
          </div>

          {/* Ô chọn Album đích nhận ảnh tải lên */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-[#6a7a74] font-normal">Tải vào album</span>
            <Select
              value={uploadTarget}
              onChange={setUploadTarget}
              className="w-[170px] sm:w-[190px]"
              options={allAlbums.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
          </div>
        </div>

        {/* Dropzone container */}
        <div className="custom-dropzone-uploader">
          <Upload.Dragger
            disabled={writesDisabled}
            fileList={fileList}
            onChange={({ fileList: nextList }) => setFileList(nextList)}
            beforeUpload={() => false}
            multiple
            accept="image/jpeg,image/png,image/webp"
            showUploadList={false}
          >
            <div className="py-7 px-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer">
              <UploadOutlined className="text-2xl text-[#0b5f53] mb-1" />
              <strong className="text-sm font-semibold text-[#12211d]">
                Kéo ảnh vào đây hoặc bấm để chọn
              </strong>
              <span className="text-xs text-[#6a7a74]">
                Hỗ trợ nhiều ảnh cùng lúc · JPG, PNG, WEBP · tối đa 10MB mỗi ảnh
              </span>
            </div>
          </Upload.Dragger>
        </div>

        {/* Danh sách ảnh chờ tải lên */}
        {fileList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e4e9e7]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#344a44]">
                  Danh sách ảnh chờ tải lên
                </span>
                <span className="text-xs text-[#6a7a74]">({fileList.length} ảnh)</span>
              </div>
              <Button
                size="small"
                type="text"
                danger
                onClick={() => setFileList([])}
                disabled={writesDisabled}
              >
                Xóa tất cả
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {fileList.map((file) => {
                const previewUrl = file.originFileObj ? URL.createObjectURL(file.originFileObj) : ''
                const sizeMb = file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : ''

                return (
                  <div
                    key={file.uid}
                    className="flex items-center justify-between gap-3 p-2 bg-[#fbfcfb] rounded-xl border border-[#e4e9e7]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="w-12 h-10 object-cover rounded-lg shrink-0 bg-[#eef1f0]"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#12211d] truncate m-0">{file.name}</p>
                        <span className="text-[11px] text-[#6a7a74]">{sizeMb}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#0b5f53] bg-[#eef8f5] px-2 py-0.5 rounded-md font-medium">
                        {allAlbums.find((a) => a.id === uploadTarget)?.name}
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={writesDisabled}
                        onClick={() => setFileList((prev) => prev.filter((f) => f.uid !== file.uid))}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f2f6f5] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#5f736e]">
                Sẵn sàng tải <strong>{fileList.length}</strong> hình ảnh vào album{' '}
                <strong className="text-[#0b5f53]">
                  "{allAlbums.find((a) => a.id === uploadTarget)?.name}"
                </strong>
              </div>

              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={isUploading}
                disabled={writesDisabled}
                onClick={handleUpload}
                className="!bg-[#0b5f53] !rounded-lg"
              >
                Xác nhận tải lên ({fileList.length} ảnh)
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* THẺ 5: Xem trước giao diện khách (Guest Preview) */}
      <section className="bg-white p-5 rounded-2xl border border-[#e4e9e7] shadow-xs">
        {/* 1. Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#12211d] m-0 flex items-center gap-2">
              <EyeOutlined className="text-[#0f5c4d]" />
              <span>Xem trước giao diện khách</span>
            </h2>
            <p className="text-xs text-[#6a7a74] mt-1 mb-0">
              Ảnh được nhóm theo album. Album rỗng sẽ không hiển thị ở giao diện khách.
            </p>
          </div>
        </div>

        {previewGroups.length === 0 ? (
          /* Trạng thái rỗng */
          <div className="p-8 text-center bg-[#f7fbfa] rounded-xl border border-dashed border-[#e4e9e7]">
            <p className="text-sm font-bold text-[#12211d] mb-1">Chưa có ảnh nào để hiển thị</p>
            <p className="text-xs text-[#6a7a74] m-0">Tải ảnh lên album để xem trước giao diện khách.</p>
          </div>
        ) : (
          <div>
            {/* 2. Album Strip */}
            <div className="preview-strip" role="navigation" aria-label="Danh sách album xem trước">
              {previewGroups.map((group) => (
                <button
                  key={group.album.id}
                  type="button"
                  className="strip-item"
                  onClick={() => {
                    const el = document.getElementById(`sec-${group.album.id}`)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  title={`Cuộn tới album ${group.album.name}`}
                >
                  <img
                    src={group.items[0].url}
                    alt={group.album.name}
                    loading="lazy"
                  />
                  <span className="strip-name">{group.album.name}</span>
                  <span className="strip-count">{group.items.length} ảnh</span>
                </button>
              ))}
            </div>

            {/* 3. Danh sách section theo album */}
            <div className="preview-sections">
              {previewGroups.map((group) => {
                const { album, items } = group

                return (
                  <section key={album.id} id={`sec-${album.id}`} className="preview-sec">
                    {/* Cột trái 250px */}
                    <div className="preview-info">
                      <h4>{album.name}</h4>
                      {album.description && <p>{album.description}</p>}
                      <span className="pill-count">{items.length} ảnh</span>
                    </div>

                    {/* Cột phải: Mosaic ảnh */}
                    <div className="preview-media">
                      <Image.PreviewGroup>
                        {/* Biến thể 1 ảnh */}
                        {items.length === 1 && (
                          <div className="mosaic one">
                            <div className="cell" role="button" tabIndex={0}>
                              <Image
                                src={items[0].url}
                                alt={album.name}
                                rootClassName="w-full h-full"
                              />
                            </div>
                          </div>
                        )}

                        {/* Biến thể 2 ảnh */}
                        {items.length === 2 && (
                          <div className="mosaic two">
                            {items.map((item, idx) => (
                              <div key={item.mediaId} className="cell" role="button" tabIndex={0}>
                                <Image
                                  src={item.url}
                                  alt={`${album.name} ${idx + 1}`}
                                  rootClassName="w-full h-full"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mosaic mặc định ≥ 3 ảnh */}
                        {items.length >= 3 && (
                          <>
                            <div className="mosaic">
                              {/* Ảnh đầu chiếm 2 hàng (ảnh lớn) */}
                              <div className="cell big" role="button" tabIndex={0}>
                                <Image
                                  src={items[0].url}
                                  alt={`${album.name} 1`}
                                  rootClassName="w-full h-full"
                                />
                              </div>
                              {/* 2 ảnh nhỏ bên phải */}
                              <div className="cell" role="button" tabIndex={0}>
                                <Image
                                  src={items[1].url}
                                  alt={`${album.name} 2`}
                                  rootClassName="w-full h-full"
                                />
                              </div>
                              <div className="cell" role="button" tabIndex={0}>
                                <Image
                                  src={items[2].url}
                                  alt={`${album.name} 3`}
                                  rootClassName="w-full h-full"
                                />
                              </div>
                            </div>

                            {/* Nếu còn ảnh, thêm hàng 4 cột cao 96px bên dưới */}
                            {items.length > 3 && (
                              <div className="mosaic-more">
                                {items.slice(3).map((item, idx) => (
                                  <div key={item.mediaId} className="cell" role="button" tabIndex={0}>
                                    <Image
                                      src={item.url}
                                      alt={`${album.name} ${idx + 4}`}
                                      rootClassName="w-full h-full"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </Image.PreviewGroup>
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* MODAL TẠO ALBUM MỚI */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#12211d]">
            <FolderAddOutlined className="text-[#0b5f53]" />
            <span>{editingAlbumId ? 'Sửa album ảnh' : 'Tạo album ảnh mới'}</span>
          </div>
        }
        open={createModalOpen}
        onOk={handleCreateAlbum}
        onCancel={() => {
          setCreateModalOpen(false)
          setEditingAlbumId(null)
          setNewAlbumName('')
          setAlbumNameError(null)
        }}
        okText={editingAlbumId ? 'Lưu album' : 'Tạo album'}
        confirmLoading={isUpdatingGallery}
        okButtonProps={{ disabled: writesDisabled, className: '!bg-[#0b5f53]' }}
        cancelText="Hủy"
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-[#5f736e] leading-relaxed">
            Nhập tên album chuyên biệt (ví dụ: <em>Hồ bơi vô cực, Quầy bar tầng thượng, Spa &amp; Massage, Phòng hội nghị</em>).
          </p>
          <div>
            <label className="block text-xs font-semibold text-[#12211d] mb-1">
              Tên album <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Hồ bơi vô cực, Nhà hàng Skyview..."
              value={newAlbumName}
              maxLength={100}
              onChange={(e) => {
                setNewAlbumName(e.target.value)
                if (albumNameError) setAlbumNameError(null)
              }}
              onPressEnter={handleCreateAlbum}
              status={albumNameError ? 'error' : ''}
              autoFocus
            />
            {albumNameError && (
              <span className="text-xs text-red-500 mt-1 block">{albumNameError}</span>
            )}
          </div>
          <label className="block">Mô tả album
            <Input.TextArea rows={3} maxLength={2000} value={albumDescription} onChange={(event) => setAlbumDescription(event.target.value)} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
