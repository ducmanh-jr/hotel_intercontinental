import { useEffect, useId, useState } from 'react'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  HistoryOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  App as AntApp,
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  Space,
  Tag,
} from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { HotelCommissionContract } from '@/features/contracts'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { MOCK_REPRESENTATIVE_CANDIDATES } from '../mocks/financial-access-mock'
import { useFinancialAccessQuery } from '../hooks/use-financial-access-query'
import { useUpdateFinancialAccessMutation } from '../hooks/use-update-financial-access-mutation'
import { updateFinancialAccessFormSchema, type UpdateFinancialAccessFormValues } from '../model/financial-access-form-schema'
import { ApiFinancialAccessSection } from './ApiFinancialAccessSection'

interface FinancialAccessSectionProps {
  hotelId: string
  hotelName?: string
  defaultOwnerUserId: string
  contracts: HotelCommissionContract[]
}

export function FinancialAccessSection(props: FinancialAccessSectionProps) {
  const { mode } = useDataMode()
  return mode === 'api' ? <ApiFinancialAccessSection {...props} /> : <MockFinancialAccessSection {...props} />
}

function MockFinancialAccessSection({
  hotelId,
  hotelName,
  defaultOwnerUserId,
  contracts,
}: FinancialAccessSectionProps) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const [selectedUserByHotel, setSelectedUserByHotel] = useState<
    Record<string, string>
  >({})
  const [searchTerm, setSearchTerm] = useState('')

  const selectedUserId = selectedUserByHotel[hotelId] ?? defaultOwnerUserId
  const setSelectedUserId = (nextUserId: string) => {
    setSelectedUserByHotel((prev) => ({
      ...prev,
      [hotelId]: nextUserId,
    }))
  }

  const accessQuery = useFinancialAccessQuery(hotelId, selectedUserId)
  const updateAccessMutation = useUpdateFinancialAccessMutation(
    hotelId,
    selectedUserId,
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<UpdateFinancialAccessFormValues>({
    resolver: zodResolver(updateFinancialAccessFormSchema),
    defaultValues: {
      contractId: contracts[0]?.id ?? '55555555-5555-4555-8555-555555555501',
      status: 'GRANTED',
      canReadContracts: true,
      canReadSettlements: true,
      canExportReports: false,
      expectedVersion: 1,
      reason: '',
    },
  })

  useEffect(() => {
    if (!accessQuery.data) return
    reset({
      contractId:
        accessQuery.data.contractId ||
        contracts[0]?.id ||
        '55555555-5555-4555-8555-555555555501',
      status: accessQuery.data.status,
      canReadContracts: accessQuery.data.canReadContracts,
      canReadSettlements: accessQuery.data.canReadSettlements,
      canExportReports: accessQuery.data.canExportReports,
      expectedVersion: accessQuery.data.version,
      reason: accessQuery.data.reason ?? '',
    })
  }, [accessQuery.data, contracts, reset])

  const watchedStatus = useWatch({ control, name: 'status' })

  function applyQuickPreset(preset: 'OWNER_FULL' | 'ACCOUNTANT' | 'REVOKE_ALL') {
    if (preset === 'OWNER_FULL') {
      setValue('status', 'GRANTED', { shouldDirty: true })
      setValue('canReadContracts', true, { shouldDirty: true })
      setValue('canReadSettlements', true, { shouldDirty: true })
      setValue('canExportReports', true, { shouldDirty: true })
      setValue(
        'reason',
        'Cấp toàn quyền đọc hợp đồng, đối soát và xuất báo cáo cho Chủ sở hữu.',
        { shouldDirty: true, shouldValidate: true },
      )
    } else if (preset === 'ACCOUNTANT') {
      setValue('status', 'GRANTED', { shouldDirty: true })
      setValue('canReadContracts', true, { shouldDirty: true })
      setValue('canReadSettlements', true, { shouldDirty: true })
      setValue('canExportReports', false, { shouldDirty: true })
      setValue(
        'reason',
        'Cấp quyền tra cứu hợp đồng và kỳ đối soát cho bộ phận Kế toán khách sạn.',
        { shouldDirty: true, shouldValidate: true },
      )
    } else {
      setValue('status', 'REVOKED', { shouldDirty: true })
      setValue('canReadContracts', false, { shouldDirty: true })
      setValue('canReadSettlements', false, { shouldDirty: true })
      setValue('canExportReports', false, { shouldDirty: true })
      setValue(
        'reason',
        'Thu hồi toàn bộ quyền truy cập dữ liệu tài chính theo quyết định quản trị.',
        { shouldDirty: true, shouldValidate: true },
      )
    }
  }

  async function onSubmit(values: UpdateFinancialAccessFormValues) {
    try {
      // Tự động đảm bảo expectedVersion đồng bộ với phiên bản hiện tại trên hệ thống
      const submitData = {
        ...values,
        expectedVersion: accessQuery.data?.version ?? values.expectedVersion,
      }
      const updated = await updateAccessMutation.mutateAsync(submitData)
      void message.success(
        `Đã lưu phân quyền tài chính thành công (phiên bản cập nhật #${updated.version}).`,
      )
    } catch (error) {
      applyApiFieldErrors(error, setError)
    }
  }

  const filteredCandidates = MOCK_REPRESENTATIVE_CANDIDATES.filter((candidate) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      candidate.fullName.toLowerCase().includes(term) ||
      candidate.email.toLowerCase().includes(term) ||
      candidate.roleLabel.toLowerCase().includes(term)
    )
  })

  return (
    <section className="rates-scientific-panel" aria-labelledby="financial-access-title">
      <Alert type="info" showIcon title="Dữ liệu mẫu: các quyền riêng và hợp đồng liên kết trong bản xem trước chưa có trong API." />
      {/* 1. Header tinh gọn của phân quyền tài chính */}
      <div className="rates-panel-header">
        <div>
          <span className="rates-panel-header__kicker">
            PHÂN QUYỀN TRUY CẬP TÀI CHÍNH ĐỐI TÁC
          </span>
          <h2 id="financial-access-title" className="rates-panel-header__title">
            {hotelName ? `Đại diện tài chính — ${hotelName}` : 'Cấp & Thu hồi quyền đọc tài chính'}
          </h2>
        </div>

        <Space wrap size={10}>
          <Tag color="gold" icon={<SafetyCertificateOutlined aria-hidden="true" />}>
            Bảo vệ đối soát đồng thời
          </Tag>
          <Button
            icon={<ReloadOutlined aria-hidden="true" />}
            loading={accessQuery.isFetching}
            onClick={() => void accessQuery.refetch()}
          >
            Tải lại thông tin
          </Button>
        </Space>
      </div>

      {/* 2. Bộ chọn Nhân sự Đại diện trực quan */}
      <div className="fin-reps-section">
        <div className="fin-reps-section__header">
          <div>
            <h3 className="fin-reps-section__title">
              Chọn nhân sự đại diện cần thiết lập quyền
            </h3>
            <span className="muted" style={{ fontSize: '12.5px' }}>
              Nhấp chọn người đại diện từ danh sách ban quản lý hoặc kế toán cơ sở
            </span>
          </div>

          <div className="fin-reps-section__search">
            <Input
              prefix={<SearchOutlined aria-hidden="true" style={{ color: 'var(--text-muted)' }} />}
              placeholder="Tìm theo tên hoặc email đại diện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="fin-search-input"
            />
          </div>
        </div>

        <div
          className="fin-reps-grid"
          role="tablist"
          aria-label="Danh sách nhân sự đại diện cơ sở lưu trú"
        >
          {filteredCandidates.map((candidate) => {
            const isSelected = candidate.userId === selectedUserId
            const roleBadgeColor =
              candidate.memberRole === 'OWNER'
                ? 'gold'
                : candidate.memberRole === 'MANAGER'
                  ? 'blue'
                  : 'default'
            const roleBadgeText =
              candidate.memberRole === 'OWNER'
                ? 'Chủ sở hữu'
                : candidate.memberRole === 'MANAGER'
                  ? 'Quản lý'
                  : 'Kế toán'

            // Tạo chữ viết tắt 2 ký tự đại diện cho avatar
            const initials = candidate.fullName
              .split(' ')
              .filter(Boolean)
              .slice(-2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()

            return (
              <button
                key={candidate.userId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`fin-rep-card ${isSelected ? 'is-active' : ''}`}
                onClick={() => setSelectedUserId(candidate.userId)}
              >
                <div className="fin-rep-card__avatar" aria-hidden="true">
                  {initials || <UserOutlined />}
                </div>

                <div className="fin-rep-card__info">
                  <div className="fin-rep-card__header">
                    <strong className="fin-rep-card__name">{candidate.fullName}</strong>
                    <Tag color={roleBadgeColor}>{roleBadgeText}</Tag>
                  </div>
                  <div className="fin-rep-card__email">{candidate.email}</div>
                  <div className="fin-rep-card__role-label">{candidate.roleLabel}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Bố cục 2 cột: Bản ghi hiện hành & Biểu mẫu cấp/thu hồi */}
      {accessQuery.isPending ? (
        <PageLoading />
      ) : accessQuery.isError ? (
        <div className="surface-card">
          <ErrorState
            error={accessQuery.error}
            retrying={accessQuery.isFetching}
            onRetry={() => void accessQuery.refetch()}
          />
        </div>
      ) : (
        <div className="fin-detail-grid">
          {/* Cột 1: Thông tin phân quyền hiện hành */}
          <div className="fin-status-card">
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-header__title">
                  Quyền Truy Cập Hiện Hành
                </h3>
                <span className="muted" style={{ fontSize: '12px' }}>
                  Trạng thái hiệu lực áp dụng trên hệ thống đối soát
                </span>
              </div>
              <Tag color="gold" style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Lượt cập nhật #{accessQuery.data.version}
              </Tag>
            </div>

            {/* 3 Pill trạng thái quyền chi tiết */}
            <div className="fin-permission-pills">
              <div
                className={`fin-perm-pill ${accessQuery.data.canReadContracts ? 'is-granted' : 'is-denied'}`}
              >
                {accessQuery.data.canReadContracts ? (
                  <CheckCircleFilled aria-hidden="true" />
                ) : (
                  <CloseCircleFilled aria-hidden="true" />
                )}
                <span>Đọc hợp đồng hoa hồng</span>
              </div>

              <div
                className={`fin-perm-pill ${accessQuery.data.canReadSettlements ? 'is-granted' : 'is-denied'}`}
              >
                {accessQuery.data.canReadSettlements ? (
                  <CheckCircleFilled aria-hidden="true" />
                ) : (
                  <CloseCircleFilled aria-hidden="true" />
                )}
                <span>Xem bảng kê đối soát</span>
              </div>

              <div
                className={`fin-perm-pill ${accessQuery.data.canExportReports ? 'is-granted' : 'is-denied'}`}
              >
                {accessQuery.data.canExportReports ? (
                  <CheckCircleFilled aria-hidden="true" />
                ) : (
                  <CloseCircleFilled aria-hidden="true" />
                )}
                <span>Xuất báo cáo tài chính</span>
              </div>
            </div>

            {/* Chi tiết tài khoản đại diện */}
            <dl className="fin-meta-list">
              <div className="fin-meta-item">
                <dt>Tài khoản đại diện</dt>
                <dd>
                  <strong>
                    {accessQuery.data.userFullName ?? 'Đại diện đối tác'}
                  </strong>
                  <div className="muted" style={{ fontSize: '12.5px' }}>
                    {accessQuery.data.userEmail}
                  </div>
                </dd>
              </div>

              <div className="fin-meta-item">
                <dt>Trạng thái truy cập</dt>
                <dd>
                  <Tag
                    color={
                      accessQuery.data.status === 'GRANTED' ? 'success' : 'error'
                    }
                  >
                    {accessQuery.data.status === 'GRANTED'
                      ? 'Đang cấp quyền truy cập'
                      : 'Đã thu hồi quyền'}
                  </Tag>
                </dd>
              </div>

              <div className="fin-meta-item">
                <dt>Hợp đồng / Thỏa thuận liên kết</dt>
                <dd>
                  <Tag color="gold">
                    {accessQuery.data.contractCode
                      ? `Hợp đồng hoa hồng tiêu chuẩn (${accessQuery.data.contractCode})`
                      : 'Hợp đồng hoa hồng tiêu chuẩn'}
                  </Tag>
                </dd>
              </div>

              <div className="fin-meta-item">
                <dt>
                  <HistoryOutlined aria-hidden="true" style={{ marginRight: 4 }} />
                  Lịch sử cập nhật liền trước
                </dt>
                <dd className="fin-history-callout">
                  {accessQuery.data.previousVersionSummary ??
                    'Chưa có lịch sử cập nhật trước.'}
                </dd>
              </div>

              <div className="fin-meta-item">
                <dt>Lý do cập nhật gần nhất</dt>
                <dd>{accessQuery.data.reason ?? 'Cập nhật theo phê duyệt của quản trị viên.'}</dd>
              </div>

              <div className="fin-meta-item">
                <dt>Thời điểm ghi nhận</dt>
                <dd>
                  {new Date(accessQuery.data.updatedAt).toLocaleString('vi-VN')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Cột 2: Biểu mẫu thao tác cấp / thu hồi quyền */}
          <div className="fin-form-card">
            <div className="fin-card-header">
              <div>
                <h3 className="fin-card-header__title">
                  Biểu mẫu Cấp / Thu hồi Quyền đọc Tài chính
                </h3>
                <span className="muted" style={{ fontSize: '12px' }}>
                  Thiết lập phạm vi quyền truy cập dữ liệu và lưu căn cứ phê duyệt
                </span>
              </div>
            </div>

            {/* Mẫu phân quyền nhanh */}
            <div className="fin-presets-bar">
              <span className="fin-presets-label">
                <ThunderboltOutlined aria-hidden="true" /> Mẫu phân quyền nhanh:
              </span>
              <Space wrap size={8}>
                <Button
                  size="small"
                  onClick={() => applyQuickPreset('OWNER_FULL')}
                >
                  Toàn quyền Chủ sở hữu
                </Button>
                <Button
                  size="small"
                  onClick={() => applyQuickPreset('ACCOUNTANT')}
                >
                  Quyền Kế toán đối soát
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined aria-hidden="true" />}
                  onClick={() => applyQuickPreset('REVOKE_ALL')}
                >
                  Thu hồi toàn bộ quyền
                </Button>
              </Space>
            </div>

            {updateAccessMutation.isError && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                title="Không thể cập nhật quyền tài chính"
                description={errorMessage(updateAccessMutation.error)}
              />
            )}

            {watchedStatus === 'REVOKED' && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                title="Chế độ Thu hồi quyền"
                description="Khi lưu ở trạng thái Thu hồi, người dùng này sẽ không thể đọc hợp đồng, bảng kê đối soát và xuất báo cáo tài chính của cơ sở lưu trú."
              />
            )}

            {/* Form cấu hình quyền - Cấu trúc Vertical Layout chuẩn không bao giờ vỡ */}
            <Form
              layout="vertical"
              component="form"
              onSubmitCapture={handleSubmit(onSubmit)}
              noValidate
              className="admin-form fin-vertical-form"
            >
              {/* Controller ẩn để duy trì schema validation cho version */}
              <Controller
                name="expectedVersion"
                control={control}
                render={({ field }) => (
                  <input type="hidden" value={field.value} name={field.name} />
                )}
              />

              {/* Hàng 1: 2 cột - Thỏa thuận & Trạng thái cấp quyền */}
              <div className="fin-form-row-2">
                <Form.Item
                  layout="vertical"
                  label="Thỏa thuận / Hợp đồng áp dụng"
                  htmlFor={`${formId}-contractId`}
                  validateStatus={errors.contractId ? 'error' : undefined}
                  help={errors.contractId?.message}
                  required
                  className="fin-form-item"
                >
                  <Controller
                    name="contractId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id={`${formId}-contractId`}
                        value={field.value}
                        onChange={field.onChange}
                        className="full-width"
                        size="large"
                        options={
                          contracts.length > 0
                            ? contracts.map((c) => ({
                                label: `Hợp đồng hoa hồng ${c.commissionPercentage}% (${c.contractCode})`,
                                value: c.id,
                              }))
                            : [
                                {
                                  label: 'Hợp đồng hoa hồng tiêu chuẩn (15%)',
                                  value: '55555555-5555-4555-8555-555555555501',
                                },
                              ]
                        }
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  layout="vertical"
                  label="Trạng thái cấp quyền"
                  htmlFor={`${formId}-status`}
                  validateStatus={errors.status ? 'error' : undefined}
                  help={errors.status?.message}
                  required
                  className="fin-form-item"
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id={`${formId}-status`}
                        value={field.value}
                        onChange={(nextStatus) => {
                          field.onChange(nextStatus)
                          if (nextStatus === 'REVOKED') {
                            setValue('canReadContracts', false)
                            setValue('canReadSettlements', false)
                            setValue('canExportReports', false)
                          }
                        }}
                        className="full-width"
                        size="large"
                        options={[
                          {
                            label: 'Cấp quyền đọc tài chính',
                            value: 'GRANTED',
                          },
                          {
                            label: 'Thu hồi quyền đọc tài chính',
                            value: 'REVOKED',
                          },
                        ]}
                      />
                    )}
                  />
                </Form.Item>
              </div>

              {/* Hàng 2: Phạm vi quyền đọc chi tiết */}
              <Form.Item
                layout="vertical"
                label="Phạm vi quyền đọc chi tiết"
                className="fin-form-item"
              >
                <div className="fin-checkbox-group">
                  <Controller
                    name="canReadContracts"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        disabled={watchedStatus === 'REVOKED'}
                        onChange={(e) => field.onChange(e.target.checked)}
                      >
                        Cho phép đọc hợp đồng &amp; biểu phí hoa hồng
                      </Checkbox>
                    )}
                  />
                  <Controller
                    name="canReadSettlements"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        disabled={watchedStatus === 'REVOKED'}
                        onChange={(e) => field.onChange(e.target.checked)}
                      >
                        Cho phép xem bảng kê đối soát &amp; doanh thu thực thu
                      </Checkbox>
                    )}
                  />
                  <Controller
                    name="canExportReports"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        disabled={watchedStatus === 'REVOKED'}
                        onChange={(e) => field.onChange(e.target.checked)}
                      >
                        Cho phép xuất báo cáo đối soát tài chính
                      </Checkbox>
                    )}
                  />
                </div>
              </Form.Item>

              {/* Dải thông báo bảo vệ phiên bản tự động (thay thế ô nhập version thủ công) */}
              <div className="fin-version-sync-strip">
                <span className="fin-version-sync-strip__label">
                  Bảo vệ dữ liệu đồng thời:
                </span>
                <span className="fin-version-sync-strip__value">
                  Hệ thống tự động đồng bộ lượt cập nhật #{accessQuery.data.version} để bảo đảm tính toàn vẹn khi lưu.
                </span>
              </div>

              {/* Hàng 3: Căn cứ & Lý do phê duyệt */}
              <Form.Item
                layout="vertical"
                label="Lý do cấp / thu hồi quyền"
                htmlFor={`${formId}-reason`}
                validateStatus={errors.reason ? 'error' : undefined}
                help={errors.reason?.message}
                required
                className="fin-form-item"
              >
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <Input.TextArea
                      {...field}
                      id={`${formId}-reason`}
                      rows={3}
                      placeholder="Nhập căn cứ biên bản, quyết định phân công hoặc phụ lục hợp đồng phê duyệt..."
                    />
                  )}
                />
              </Form.Item>

              {/* Hành động submit */}
              <div className="fin-form-actions">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={updateAccessMutation.isPending}
                >
                  Lưu phân quyền tài chính
                </Button>
                <Button
                  htmlType="button"
                  size="large"
                  disabled={!isDirty}
                  onClick={() => reset()}
                >
                  Hoàn tác
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </section>
  )
}
