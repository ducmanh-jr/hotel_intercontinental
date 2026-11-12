import { useId, useState } from 'react'
import {
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  App as AntApp,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
} from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { useDataMode } from '@/shared/lib/data-mode-context'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { useCreateHotelContractMutation } from '../hooks/use-create-hotel-contract-mutation'
import { useHotelContractsQuery } from '../hooks/use-hotel-contracts-query'
import { type ContractStatus, contractStatusValues, type HotelCommissionContract } from '../model/contract'
import { createHotelContractFormSchema, type CreateHotelContractFormValues } from '../model/contract-form-schema'
import { ApiHotelContractsSection } from './ApiHotelContractsSection'

interface HotelContractsSectionProps {
  hotelId: string
  hotelName?: string
  ownerUserId?: string
}

const CONTRACT_STATUS_COLOR: Record<
  ContractStatus,
  'success' | 'processing' | 'default' | 'error'
> = {
  ACTIVE: 'success',
  DRAFT: 'processing',
  EXPIRED: 'default',
  TERMINATED: 'error',
}

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: 'Đang hiệu lực',
  DRAFT: 'Dự thảo',
  EXPIRED: 'Hết hiệu lực',
  TERMINATED: 'Đã chấm dứt',
}

export function HotelContractsSection(props: HotelContractsSectionProps) {
  const { mode } = useDataMode()
  return mode === 'api' ? <ApiHotelContractsSection {...props} /> : <MockHotelContractsSection {...props} />
}

function MockHotelContractsSection({
  hotelId,
  hotelName,
}: HotelContractsSectionProps) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [inspectingContract, setInspectingContract] =
    useState<HotelCommissionContract | null>(null)

  const contractsQuery = useHotelContractsQuery(hotelId)
  const createContractMutation = useCreateHotelContractMutation(hotelId)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateHotelContractFormValues>({
    resolver: zodResolver(createHotelContractFormSchema),
    defaultValues: {
      contractCode: 'CTR-2027-PARTNER-01',
      commissionPercentage: 12,
      currency: 'VND',
      effectiveFrom: '2027-01-01',
      effectiveTo: '2027-12-31',
      termsSummary: '',
    },
  })

  async function onSubmit(values: CreateHotelContractFormValues) {
    try {
      const created = await createContractMutation.mutateAsync(values)
      void message.success(
        `Đã tạo dự thảo hợp đồng "${created.contractCode}".`,
      )
      reset({
        contractCode: 'CTR-2027-PARTNER-02',
        commissionPercentage: 12,
        currency: 'VND',
        effectiveFrom: '2027-01-01',
        effectiveTo: '2027-12-31',
        termsSummary: '',
      })
    } catch (error) {
      applyApiFieldErrors(error, setError)
    }
  }

  const allContracts = contractsQuery.data ?? []
  const activeContracts = allContracts.filter((item) => item.status === 'ACTIVE')
  const draftContracts = allContracts.filter((item) => item.status === 'DRAFT')

  const filteredContracts = allContracts.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase()
      const text = `${item.contractCode} ${item.termsSummary ?? ''}`.toLowerCase()
      if (!text.includes(kw)) return false
    }
    return true
  })

  return (
    <>
      <Alert type="info" showIcon title="Dữ liệu mẫu: hợp đồng trong màn hình này chỉ dùng để xem trước." />
      <div className="detail-grid-layout">
        <section className="surface-card" aria-labelledby="contracts-list-title">
          <div className="section-header">
            <div>
              <h2 id="contracts-list-title">
                Thỏa thuận &amp; Hợp đồng hoa hồng
                {hotelName ? ` — ${hotelName}` : ''}
              </h2>
              <p className="muted">
                Quản lý danh sách thỏa thuận hoa hồng và điều khoản đối soát của
                khách sạn.
              </p>
            </div>
            <Button
              icon={<ReloadOutlined aria-hidden="true" />}
              onClick={() => void contractsQuery.refetch()}
              loading={contractsQuery.isFetching}
            >
              Tải lại
            </Button>
          </div>

          {!contractsQuery.isPending && !contractsQuery.isError && (
            <div className="kpi-summary-grid" style={{ marginBottom: 18 }}>
              <div className="kpi-summary-card">
                <span className="kpi-summary-card__label">Tổng thỏa thuận</span>
                <strong className="kpi-summary-card__value">
                  {allContracts.length} hợp đồng
                </strong>
                <span className="kpi-summary-card__sub">
                  Gồm {activeContracts.length} đang hiệu lực,{' '}
                  {draftContracts.length} dự thảo
                </span>
              </div>
              <div className="kpi-summary-card">
                <span className="kpi-summary-card__label">
                  Tỷ lệ hoa hồng đang áp dụng
                </span>
                <strong className="kpi-summary-card__value is-brand">
                  {activeContracts[0]
                    ? `${activeContracts[0].commissionPercentage}%`
                    : 'Chưa kích hoạt'}
                </strong>
                <span className="kpi-summary-card__sub">
                  {activeContracts[0]
                    ? `Theo mã ${activeContracts[0].contractCode}`
                    : 'Chỉ có bản dự thảo'}
                </span>
              </div>
              <div className="kpi-summary-card">
                <span className="kpi-summary-card__label">Tiền tệ đối soát</span>
                <strong className="kpi-summary-card__value">
                  {allContracts[0]?.currency ?? 'VND'}
                </strong>
                <span className="kpi-summary-card__sub">
                  Đối soát trên khoản thực thu sau ưu đãi
                </span>
              </div>
            </div>
          )}

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label
                htmlFor={`${formId}-search`}
                className="muted"
                style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
              >
                Tìm theo mã hợp đồng hoặc nội dung điều khoản
              </label>
              <Input
                id={`${formId}-search`}
                allowClear
                prefix={<SearchOutlined aria-hidden="true" />}
                placeholder="Ví dụ: CTR-2026, IHG, đối soát..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-status-filter`}
                className="muted"
                style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
              >
                Lọc theo trạng thái hợp đồng
              </label>
              <Select
                id={`${formId}-status-filter`}
                value={statusFilter}
                onChange={setStatusFilter}
                className="full-width"
                options={[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  ...contractStatusValues.map((s) => ({
                    label: CONTRACT_STATUS_LABEL[s],
                    value: s,
                  })),
                ]}
              />
            </div>
          </div>

          {contractsQuery.isPending ? (
            <PageLoading />
          ) : contractsQuery.isError ? (
            <ErrorState
              error={contractsQuery.error}
              retrying={contractsQuery.isFetching}
              onRetry={() => void contractsQuery.refetch()}
            />
          ) : filteredContracts.length === 0 ? (
            <EmptyState
              title="Không có hợp đồng hoa hồng phù hợp"
              description="Khách sạn này hiện chưa có thỏa thuận hoa hồng hoặc không khớp bộ lọc."
            />
          ) : (
            <div className="contracts-stack" role="list">
              {filteredContracts.map((contract) => (
                <article
                  key={contract.id}
                  role="listitem"
                  className="contract-item-card"
                >
                  <div className="contract-item-card__header">
                    <div>
                      <span className="contract-item-card__code">
                        <FileTextOutlined aria-hidden="true" />{' '}
                        {contract.contractCode}
                      </span>
                    </div>
                    <Space wrap size={6}>
                      <Tag color="gold">
                        Hoa hồng: {contract.commissionPercentage}%
                      </Tag>
                      <Tag color={CONTRACT_STATUS_COLOR[contract.status]}>
                        {CONTRACT_STATUS_LABEL[contract.status]}
                      </Tag>
                    </Space>
                  </div>
                  <p className="contract-item-card__terms">
                    {contract.termsSummary ?? 'Không có mô tả điều khoản bổ sung.'}
                  </p>
                  <div className="contract-item-card__meta">
                    <span>
                      Hiệu lực: <strong>{contract.effectiveFrom}</strong> →{' '}
                      <strong>{contract.effectiveTo ?? 'Không thời hạn'}</strong>
                    </span>
                    <Space>
                      <span>Tiền tệ: {contract.currency}</span>
                      <Button
                        size="small"
                        icon={<EyeOutlined aria-hidden="true" />}
                        onClick={() => setInspectingContract(contract)}
                      >
                        Chi tiết điều khoản
                      </Button>
                    </Space>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="surface-card" aria-labelledby="contract-create-title">
          <h2 id="contract-create-title">
            Tạo dự thảo hợp đồng hoa hồng
          </h2>
          <p className="muted">
            Thiết lập biểu phí hoa hồng và điều khoản đối soát mới cho đối tác.
          </p>

          {createContractMutation.isError && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              title="Không thể tạo dự thảo hợp đồng"
              description={errorMessage(createContractMutation.error)}
            />
          )}

          <Form
            layout="vertical"
            component="form"
            onSubmitCapture={handleSubmit(onSubmit)}
            noValidate
            className="admin-form"
          >
            <Form.Item
              layout="vertical"
              label="Mã hợp đồng thỏa thuận"
              htmlFor={`${formId}-contractCode`}
              validateStatus={errors.contractCode ? 'error' : undefined}
              help={errors.contractCode?.message}
              required
            >
              <Controller
                name="contractCode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`${formId}-contractCode`}
                    placeholder="CTR-2027-IHG-01"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <div className="form-grid-2">
              <Form.Item
                layout="vertical"
                label="Tỷ lệ hoa hồng (%)"
                htmlFor={`${formId}-commissionPercentage`}
                validateStatus={errors.commissionPercentage ? 'error' : undefined}
                help={errors.commissionPercentage?.message}
                required
              >
                <Controller
                  name="commissionPercentage"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id={`${formId}-commissionPercentage`}
                      min={1}
                      max={50}
                      step={0.5}
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 10)}
                      className="full-width"
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                layout="vertical"
                label="Đơn vị tiền tệ"
                htmlFor={`${formId}-currency`}
                validateStatus={errors.currency ? 'error' : undefined}
                help={errors.currency?.message}
                required
              >
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={`${formId}-currency`}
                      maxLength={3}
                      placeholder="VND"
                      size="large"
                    />
                  )}
                />
              </Form.Item>
            </div>

            <div className="form-grid-2">
              <Form.Item
                layout="vertical"
                label="Hiệu lực từ ngày"
                htmlFor={`${formId}-effectiveFrom`}
                validateStatus={errors.effectiveFrom ? 'error' : undefined}
                help={errors.effectiveFrom?.message}
                required
              >
                <Controller
                  name="effectiveFrom"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id={`${formId}-effectiveFrom`} type="date" size="large" />
                  )}
                />
              </Form.Item>

              <Form.Item
                layout="vertical"
                label="Hiệu lực đến ngày"
                htmlFor={`${formId}-effectiveTo`}
                validateStatus={errors.effectiveTo ? 'error' : undefined}
                help={errors.effectiveTo?.message}
                required
              >
                <Controller
                  name="effectiveTo"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id={`${formId}-effectiveTo`} type="date" size="large" />
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item
              layout="vertical"
              label="Tóm tắt điều khoản đối soát & thanh toán"
              htmlFor={`${formId}-termsSummary`}
              validateStatus={errors.termsSummary ? 'error' : undefined}
              help={errors.termsSummary?.message}
              required
            >
              <Controller
                name="termsSummary"
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    id={`${formId}-termsSummary`}
                    rows={4}
                    placeholder="Ghi rõ chu kỳ đối soát, điều kiện khấu trừ hoa hồng..."
                  />
                )}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<PlusOutlined aria-hidden="true" />}
              loading={createContractMutation.isPending}
              className="full-width"
            >
              Tạo dự thảo hợp đồng
            </Button>
          </Form>
        </aside>
      </div>

      <Modal
        title={
          inspectingContract
            ? `Chi tiết Hợp đồng Hoa hồng: ${inspectingContract.contractCode}`
            : 'Chi tiết Hợp đồng'
        }
        open={Boolean(inspectingContract)}
        onCancel={() => setInspectingContract(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setInspectingContract(null)}>
            Đóng
          </Button>,
        ]}
      >
        {inspectingContract && (
          <dl className="meta-list">
            <div>
              <dt>Mã hợp đồng</dt>
              <dd>
                <strong>{inspectingContract.contractCode}</strong>
              </dd>
            </div>
            <div>
              <dt>Trạng thái hiệu lực</dt>
              <dd>
                <Tag color={CONTRACT_STATUS_COLOR[inspectingContract.status]}>
                  {CONTRACT_STATUS_LABEL[inspectingContract.status]}
                </Tag>
              </dd>
            </div>
            <div>
              <dt>Tỷ lệ hoa hồng nền tảng</dt>
              <dd>
                <strong style={{ color: 'var(--color-primary)', fontSize: 18 }}>
                  {inspectingContract.commissionPercentage}%
                </strong>{' '}
                ({inspectingContract.currency})
              </dd>
            </div>
            <div>
              <dt>Thời hạn hiệu lực</dt>
              <dd>
                Từ <strong>{inspectingContract.effectiveFrom}</strong> đến{' '}
                <strong>{inspectingContract.effectiveTo ?? 'Không thời hạn'}</strong>
              </dd>
            </div>
            <div>
              <dt>Điều khoản đối soát &amp; thanh toán</dt>
              <dd>{inspectingContract.termsSummary}</dd>
            </div>
            <div>
              <dt>Thời điểm khởi tạo</dt>
              <dd>{new Date(inspectingContract.createdAt).toLocaleString('vi-VN')}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  )
}
