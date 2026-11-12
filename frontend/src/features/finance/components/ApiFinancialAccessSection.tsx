import { useId, useState } from 'react'
import { ReloadOutlined, SafetyCertificateOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, App as AntApp, Button, Checkbox, Form, Input, Space, Tag } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCurrentUser } from '@/features/auth'
import { ApiError, errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageLoading } from '@/shared/ui/PageLoading'
import { useApiFinancialAccessQuery, useUpdateApiFinancialAccessMutation } from '../hooks/use-api-financial-access'
import { financialAccessKeys } from '../hooks/financial-access-query-keys'
import { updateApiFinancialAccessFormSchema, type FinancialAccessDetail, type UpdateApiFinancialAccessFormValues } from '../model/financial-access-api-contract'

interface Props { hotelId: string; hotelName?: string; defaultOwnerUserId: string }
const uuidSchema = z.uuid()
function formValues(detail?: FinancialAccessDetail): UpdateApiFinancialAccessFormValues {
  return { isGranted: detail?.isGranted ?? true, accessScope: detail?.accessScope ?? 'FINANCE_READ', expectedVersion: detail?.currentVersion ?? 0, reason: '' }
}

export function ApiFinancialAccessSection({ hotelId, hotelName, defaultOwnerUserId }: Props) {
  const formId = useId()
  const { isAdmin, isChecking, isError, error, refetch } = useCurrentUser()
  const [userInput, setUserInput] = useState(defaultOwnerUserId)
  const [userId, setUserId] = useState(uuidSchema.safeParse(defaultOwnerUserId).success ? defaultOwnerUserId : '')
  const [invalidUser, setInvalidUser] = useState(false)
  const query = useApiFinancialAccessQuery(hotelId, userId, isAdmin)
  const notConfigured = query.error instanceof ApiError && query.error.code === 'FINANCIAL_ACCESS_NOT_FOUND'

  function selectUser() {
    const parsed = uuidSchema.safeParse(userInput.trim())
    setInvalidUser(!parsed.success)
    if (parsed.success) setUserId(parsed.data)
  }

  return <section className="rates-scientific-panel" aria-labelledby={`${formId}-title`}>
    <div className="rates-panel-header">
      <div><span className="rates-panel-header__kicker">PHÂN QUYỀN TRUY CẬP TÀI CHÍNH ĐỐI TÁC</span><h2 id={`${formId}-title`} className="rates-panel-header__title">{hotelName ? `Đại diện tài chính — ${hotelName}` : 'Cấp & Thu hồi quyền đọc tài chính'}</h2></div>
      <Space wrap><Tag color="gold" icon={<SafetyCertificateOutlined />}>Bảo vệ đối soát đồng thời</Tag><Button icon={<ReloadOutlined />} disabled={!isAdmin || !userId} loading={query.isFetching} onClick={() => void query.refetch()}>Tải lại thông tin</Button></Space>
    </div>
    {isChecking ? <PageLoading /> : isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : !isAdmin ? <Alert type="info" showIcon title="Chỉ ADMIN được tra cứu và thay đổi quyền tài chính" /> : <>
      <div className="fin-reps-section">
        <div className="fin-reps-section__header"><div><h3 className="fin-reps-section__title">Chọn người dùng cần thiết lập quyền</h3><p className="muted">Nhập UUID tài khoản có thật. API hiện chưa cung cấp danh sách nhân sự đại diện theo khách sạn.</p></div></div>
        <label htmlFor={`${formId}-user`}>UUID người dùng</label>
        <Space.Compact className="full-width"><Input id={`${formId}-user`} value={userInput} status={invalidUser ? 'error' : undefined} onChange={(event) => setUserInput(event.target.value)} onPressEnter={selectUser} /><Button icon={<SearchOutlined />} onClick={selectUser} disabled={query.isFetching}>Tra cứu</Button></Space.Compact>
        {invalidUser && <p role="alert">Nhập UUID người dùng hợp lệ.</p>}
      </div>
      {!userId ? <EmptyState title="Nhập UUID người dùng để tra cứu" /> : query.isPending ? <PageLoading /> : query.isError && !notConfigured ? <ErrorState error={query.error} retrying={query.isFetching} onRetry={() => void query.refetch()} /> : <FinancialAccessEditor key={`${hotelId}-${userId}`} hotelId={hotelId} userId={userId} detail={query.data} isFetching={query.isFetching} />}
    </>}
  </section>
}

function FinancialAccessEditor({ hotelId, userId, detail, isFetching }: { hotelId: string; userId: string; detail?: FinancialAccessDetail; isFetching: boolean }) {
  const formId = useId()
  const { message } = AntApp.useApp()
  const client = useQueryClient()
  const mutation = useUpdateApiFinancialAccessMutation(hotelId, userId)
  const { control, handleSubmit, getValues, reset, setValue, setError, formState: { errors, isDirty } } = useForm<UpdateApiFinancialAccessFormValues>({ resolver: zodResolver(updateApiFinancialAccessFormSchema), defaultValues: formValues(detail) })
  const loadedVersion = getValues('expectedVersion')
  const newerVersion = detail !== undefined && detail.currentVersion !== loadedVersion
  const conflict = mutation.error instanceof ApiError && mutation.error.status === 409

  async function submit(values: UpdateApiFinancialAccessFormValues) {
    try {
      const updated = await mutation.mutateAsync(values)
      const key = financialAccessKeys.grant('api', hotelId, userId)
      const current = client.getQueryState<FinancialAccessDetail>(key)
      // GET after the transaction commits owns the current version; PUT may contain its pre-flush snapshot.
      const version = current?.status === 'success' ? current.data?.currentVersion ?? updated.version : updated.version
      reset({ ...values, expectedVersion: version, reason: '' })
      void message.success('Đã lưu phân quyền tài chính.')
    } catch (error) { applyApiFieldErrors(error, setError) }
  }
  function loadLatest() { reset(formValues(detail)); mutation.reset() }

  return <div className="fin-detail-grid">
    <div className="fin-status-card">
      <div className="fin-card-header"><h3 className="fin-card-header__title">Quyền truy cập hiện tại</h3><Tag>Lượt cập nhật #{detail?.currentVersion ?? 0}</Tag></div>
      {!detail && <Alert type="info" showIcon title="Chưa có thiết lập quyền tài chính" description="Có thể tạo thiết lập đầu tiên với phiên bản kỳ vọng 0." />}
      <div className="fin-permission-pills"><span className={`fin-perm-pill ${detail?.isGranted ? 'is-granted' : 'is-denied'}`}>{detail?.isGranted ? 'Đang cấp quyền' : 'Chưa cấp hoặc đã thu hồi'} · {detail?.accessScope ?? 'FINANCE_READ'}</span></div>
      <dl className="fin-meta-list">
        <div className="fin-meta-item"><dt>Người dùng</dt><dd><strong>{detail?.userName ?? userId}</strong><div className="muted">{detail?.userEmail}</div></dd></div>
        <div className="fin-meta-item"><dt>UUID</dt><dd>{userId}</dd></div>
        <div className="fin-meta-item"><dt>Phạm vi truy cập</dt><dd>{detail?.accessScope ?? 'Chưa thiết lập'}</dd></div>
        <div className="fin-meta-item"><dt>Lý do gần nhất</dt><dd>{detail?.reason ?? 'Không có'}</dd></div>
        <div className="fin-meta-item"><dt>Thời điểm cập nhật</dt><dd>{detail ? new Date(detail.grantedAt).toLocaleString('vi-VN') : 'Chưa có'}</dd></div>
        <div className="fin-meta-item"><dt><HistoryOutlined /> Lịch sử từ hệ thống</dt><dd className="fin-history-callout">{detail?.history.length ? <ul>{detail.history.map((item) => <li key={item.id}>#{item.version} · {item.isGranted ? 'Cấp' : 'Thu hồi'} · {item.accessScope} · {item.reason ?? 'Không có lý do'} · {new Date(item.changedAt).toLocaleString('vi-VN')} · {item.changedByUserId}</li>)}</ul> : 'Chưa có lịch sử thay đổi.'}</dd></div>
      </dl>
    </div>
    <div className="fin-form-card">
      <div className="fin-card-header"><div><h3 className="fin-card-header__title">Cấp / Thu hồi quyền tài chính</h3><p className="muted">Hệ thống lưu một trạng thái cấp quyền và một phạm vi truy cập cho người dùng tại khách sạn.</p></div></div>
      <div className="fin-presets-bar"><span className="fin-presets-label">Thao tác nhanh:</span><Button disabled={mutation.isPending || isFetching} onClick={() => { setValue('isGranted', true, { shouldDirty: true }); setValue('accessScope', 'FINANCE_READ', { shouldDirty: true }) }}>Cấp quyền FINANCE_READ</Button><Button danger disabled={mutation.isPending || isFetching} onClick={() => setValue('isGranted', false, { shouldDirty: true })}>Thu hồi quyền</Button></div>
      {mutation.isError && <Alert type="error" showIcon title={conflict ? 'Dữ liệu đã thay đổi, cần xem lại trước khi lưu' : 'Không thể lưu phân quyền'} description={errorMessage(mutation.error)} />}
      {(newerVersion || conflict) && <Alert type="warning" showIcon title="Thông tin mới đã được tải; biểu mẫu vẫn giữ phiên bản đã đọc" description={<Button disabled={isFetching || !detail} onClick={loadLatest}>Nạp phiên bản mới vào biểu mẫu</Button>} />}
      <Form layout="vertical" component="form" className="admin-form fin-vertical-form" noValidate disabled={mutation.isPending || isFetching} onSubmitCapture={handleSubmit(submit)}>
        <Form.Item label="Trạng thái cấp quyền" className="fin-form-item"><Controller name="isGranted" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)}>Cấp quyền truy cập tài chính</Checkbox>} /></Form.Item>
        <Form.Item label="Phạm vi truy cập" htmlFor={`${formId}-scope`} className="fin-form-item" required validateStatus={errors.accessScope ? 'error' : undefined} help={errors.accessScope?.message}><Controller name="accessScope" control={control} render={({ field }) => <Input {...field} id={`${formId}-scope`} maxLength={50} />} /></Form.Item>
        <div className="fin-version-sync-strip"><span className="fin-version-sync-strip__label">Phiên bản đã đọc:</span><span className="fin-version-sync-strip__value">#{loadedVersion}. Khi lưu, đối chiếu đúng phiên bản này.</span></div>
        <Form.Item label="Lý do cấp / thu hồi quyền" htmlFor={`${formId}-reason`} className="fin-form-item" required validateStatus={errors.reason ? 'error' : undefined} help={errors.reason?.message}><Controller name="reason" control={control} render={({ field }) => <Input.TextArea {...field} id={`${formId}-reason`} rows={3} maxLength={255} />} /></Form.Item>
        <div className="fin-form-actions"><Button type="primary" htmlType="submit" size="large" disabled={newerVersion || conflict} loading={mutation.isPending}>Lưu phân quyền tài chính</Button><Button htmlType="button" size="large" disabled={!isDirty} onClick={loadLatest}>Hoàn tác</Button></div>
      </Form>
    </div>
  </div>
}
