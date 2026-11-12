import { useId, useState } from 'react'
import { PlusOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, App as AntApp, Button, Form, Input, InputNumber, Pagination, Select, Space, Tag } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useCurrentUser } from '@/features/auth'
import { errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { useApiHotelContractsQuery, useCreateApiHotelContractMutation } from '../hooks/use-api-hotel-contracts'
import { contractStatusValues, type ContractStatus } from '../model/contract'
import { commissionBasisSchema, createApiContractFormSchema, type CreateApiContractFormValues } from '../model/contract-api-contract'

interface Props { hotelId: string; hotelName?: string; ownerUserId?: string }
const basisLabels = { BEFORE_DISCOUNT: 'Trước giảm giá', AFTER_DISCOUNT: 'Sau giảm giá', AFTER_HOTEL_DISCOUNT: 'Sau giảm giá của khách sạn' }
const statusLabels = { DRAFT: 'Dự thảo', ACTIVE: 'Đang hiệu lực', EXPIRED: 'Hết hiệu lực', TERMINATED: 'Đã chấm dứt' }

export function ApiHotelContractsSection({ hotelId, hotelName, ownerUserId = '' }: Props) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const { isAdmin } = useCurrentUser()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState<ContractStatus | undefined>()
  const query = useApiHotelContractsQuery(hotelId, { page, size, status })
  const mutation = useCreateApiHotelContractMutation(hotelId)
  const { control, handleSubmit, reset, setError, formState: { errors } } = useForm<CreateApiContractFormValues>({
    resolver: zodResolver(createApiContractFormSchema),
    defaultValues: { contractCode: '', ownerUserId, commissionRate: 12, commissionBasis: 'AFTER_DISCOUNT', startsAt: '', endsAt: '' },
  })

  async function submit(values: CreateApiContractFormValues) {
    if (!isAdmin) return
    try {
      const created = await mutation.mutateAsync(values)
      void message.success(`Đã tạo dự thảo hợp đồng "${created.contractCode}".`)
      reset({ ...values, contractCode: '' })
      setPage(0)
    } catch (error) { applyApiFieldErrors(error, setError) }
  }

  return <div className="detail-grid-layout">
    <section className="surface-card" aria-labelledby={`${formId}-list`}>
      <div className="section-header">
        <div><h2 id={`${formId}-list`}>Thỏa thuận &amp; Hợp đồng hoa hồng{hotelName ? ` — ${hotelName}` : ''}</h2><p className="muted">Danh sách thỏa thuận từ hệ thống tài chính.</p></div>
        <Button icon={<ReloadOutlined />} loading={query.isFetching} onClick={() => void query.refetch()}>Tải lại</Button>
      </div>
      {query.data && <div className="kpi-summary-grid" style={{ marginBottom: 18 }}>
        <div className="kpi-summary-card"><span className="kpi-summary-card__label">Tổng thỏa thuận khớp bộ lọc</span><strong className="kpi-summary-card__value">{query.data.totalElements} hợp đồng</strong></div>
        <div className="kpi-summary-card"><span className="kpi-summary-card__label">Đang hiển thị</span><strong className="kpi-summary-card__value">{query.data.content.length} hợp đồng</strong><span className="kpi-summary-card__sub">Trang {query.data.page + 1}</span></div>
        <div className="kpi-summary-card"><span className="kpi-summary-card__label">Tỷ lệ hoa hồng</span><strong className="kpi-summary-card__value is-brand">Theo từng hợp đồng</strong><span className="kpi-summary-card__sub">Không suy ra tỷ lệ áp dụng từ một trang dữ liệu.</span></div>
      </div>}
      <div className="form-grid-2" style={{ marginBottom: 16 }}>
        <div><label htmlFor={`${formId}-search`} className="muted">Tìm theo mã hợp đồng</label><Input id={`${formId}-search`} disabled placeholder="API chưa hỗ trợ tìm theo mã" /></div>
        <div><label htmlFor={`${formId}-filter`} className="muted">Lọc theo trạng thái hợp đồng</label><Select<ContractStatus | 'ALL'> id={`${formId}-filter`} className="full-width" value={status ?? 'ALL'} onChange={(value) => { setStatus(value === 'ALL' ? undefined : value); setPage(0) }} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, ...contractStatusValues.map((value) => ({ value, label: statusLabels[value] }))]} /></div>
      </div>
      {query.isPending ? <PageLoading /> : query.isError ? <ErrorState error={query.error} retrying={query.isFetching} onRetry={() => void query.refetch()} /> : query.data.content.length === 0 ? <EmptyState title="Không có hợp đồng hoa hồng phù hợp" /> : <div className="contracts-stack" role="list">
        {query.data.content.map((contract) => <article className="contract-item-card" role="listitem" key={contract.id}>
          <div className="contract-item-card__header"><span className="contract-item-card__code"><FileTextOutlined /> {contract.contractCode}</span><Space wrap><Tag color="gold">Hoa hồng: {contract.commissionRate}%</Tag><Tag color={contract.status === 'ACTIVE' ? 'success' : 'default'}>{statusLabels[contract.status]}</Tag></Space></div>
          <p className="contract-item-card__terms">Cơ sở tính hoa hồng: {basisLabels[contract.commissionBasis]}</p>
          <div className="contract-item-card__meta"><span>Hiệu lực: <strong>{new Date(contract.startsAt).toLocaleString('vi-VN')}</strong> → <strong>{new Date(contract.endsAt).toLocaleString('vi-VN')}</strong></span></div>
          <p className="muted">Chủ sở hữu: {contract.ownerUserId}</p>
        </article>)}
      </div>}
      {query.data && <Pagination current={page + 1} pageSize={size} total={query.data.totalElements} showSizeChanger onChange={(next, nextSize) => { setPage(nextSize === size ? next - 1 : 0); setSize(nextSize) }} />}
    </section>
    <aside className="surface-card" aria-labelledby={`${formId}-create`}>
      <h2 id={`${formId}-create`}>Tạo dự thảo hợp đồng hoa hồng</h2>
      <p className="muted">Thiết lập tỷ lệ, cơ sở tính và thời điểm hiệu lực. Thời gian nhập theo múi giờ thiết bị, gửi dưới dạng UTC.</p>
      {!isAdmin && <Alert type="info" showIcon title="Chỉ ADMIN được tạo hợp đồng" />}
      {mutation.isError && <Alert type="error" showIcon title="Không thể tạo hợp đồng" description={errorMessage(mutation.error)} />}
      <Form layout="vertical" component="form" className="admin-form" noValidate disabled={!isAdmin || mutation.isPending} onSubmitCapture={handleSubmit(submit)}>
        <Form.Item label="Mã hợp đồng thỏa thuận" htmlFor={`${formId}-code`} required validateStatus={errors.contractCode ? 'error' : undefined} help={errors.contractCode?.message}><Controller name="contractCode" control={control} render={({ field }) => <Input {...field} id={`${formId}-code`} maxLength={50} size="large" />} /></Form.Item>
        <Form.Item label="UUID chủ sở hữu" htmlFor={`${formId}-owner`} required validateStatus={errors.ownerUserId ? 'error' : undefined} help={errors.ownerUserId?.message}><Controller name="ownerUserId" control={control} render={({ field }) => <Input {...field} id={`${formId}-owner`} size="large" />} /></Form.Item>
        <div className="form-grid-2">
          <Form.Item label="Tỷ lệ hoa hồng (%)" htmlFor={`${formId}-rate`} required validateStatus={errors.commissionRate ? 'error' : undefined} help={errors.commissionRate?.message}><Controller name="commissionRate" control={control} render={({ field }) => <InputNumber id={`${formId}-rate`} className="full-width" size="large" min={0} max={100} step={0.01} value={field.value} onChange={(value) => field.onChange(value)} />} /></Form.Item>
          <Form.Item label="Cơ sở tính hoa hồng" htmlFor={`${formId}-basis`} required><Controller name="commissionBasis" control={control} render={({ field }) => <Select {...field} id={`${formId}-basis`} size="large" options={commissionBasisSchema.options.map((value) => ({ value, label: basisLabels[value] }))} />} /></Form.Item>
        </div>
        <div className="form-grid-2">
          <Form.Item label="Hiệu lực từ thời điểm" htmlFor={`${formId}-start`} required validateStatus={errors.startsAt ? 'error' : undefined} help={errors.startsAt?.message}><Controller name="startsAt" control={control} render={({ field }) => <Input {...field} id={`${formId}-start`} type="datetime-local" size="large" />} /></Form.Item>
          <Form.Item label="Hiệu lực đến thời điểm" htmlFor={`${formId}-end`} required validateStatus={errors.endsAt ? 'error' : undefined} help={errors.endsAt?.message}><Controller name="endsAt" control={control} render={({ field }) => <Input {...field} id={`${formId}-end`} type="datetime-local" size="large" />} /></Form.Item>
        </div>
        <Button type="primary" htmlType="submit" size="large" className="full-width" icon={<PlusOutlined />} loading={mutation.isPending}>Tạo dự thảo hợp đồng</Button>
      </Form>
    </aside>
  </div>
}
