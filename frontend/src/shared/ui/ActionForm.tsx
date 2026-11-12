import { useId, useState, type ReactNode } from 'react'
import { Alert, Button, Form, Input, Space } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError, errorMessage } from '@/shared/api/api-error'
import { applyApiFieldErrors } from '@/shared/lib/form-errors'
import { formInputSchema, type FormAction } from '../model/form-action'

export interface ActionMutation {
  mutateAsync: (values: Record<string, string>) => Promise<unknown>
  isPending: boolean
  isError: boolean
  error: unknown
  isSuccess: boolean
}

export function ActionForm({
  action,
  token = '',
  mutation,
  hasSession,
  links,
  danger = false,
}: {
  action: FormAction
  token?: string
  mutation: ActionMutation
  hasSession: boolean
  links?: ReactNode
  danger?: boolean
}) {
  const id = useId()
  const [result, setResult] = useState<unknown>(undefined)
  const {
    control,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(formInputSchema(action)),
    defaultValues: Object.fromEntries(
      action.fields.map((f) => [
        f.key,
        f.key === 'token' ? token : (f.initial ?? ''),
      ]),
    ),
  })
  async function submit(values: Record<string, string>) {
    setResult(undefined)
    try {
      const response = await mutation.mutateAsync(values)
      setResult(response)
      action.fields
        .filter((f) => f.secret)
        .forEach((f) => resetField(f.key, { defaultValue: '' }))
    } catch (error) {
      applyApiFieldErrors(
        error,
        setError,
        action.fields.map((f) => f.key),
      )
    }
  }
  return (
    <section aria-labelledby={id + '-title'}>
      <h2 id={id + '-title'}>{action.title}</h2>
      {links}
      {action.authenticated && !hasSession && (
        <Alert
          type="warning"
          showIcon
          title="Đăng nhập trước khi thực hiện thao tác này."
        />
      )}
      <Form
        layout="vertical"
        onSubmitCapture={handleSubmit(submit)}
        style={{ maxWidth: 640, marginTop: 24 }}
      >
        {action.fields.map((field) => (
          <Form.Item
            key={field.key}
            label={field.label}
            htmlFor={id + field.key}
            validateStatus={errors[field.key] ? 'error' : undefined}
            help={errors[field.key]?.message}
          >
            <Controller
              name={field.key}
              control={control}
              render={({ field: input }) =>
                field.secret ? (
                  <Input.Password
                    {...input}
                    id={id + field.key}
                    autoComplete={field.autoComplete ?? 'new-password'}
                  />
                ) : (
                  <Input
                    {...input}
                    id={id + field.key}
                    autoComplete={field.key === 'email' ? 'email' : 'off'}
                  />
                )
              }
            />
          </Form.Item>
        ))}
        <Space wrap>
          <Button
            htmlType="submit"
            type="primary"
            danger={danger}
            loading={mutation.isPending}
            disabled={action.authenticated && !hasSession}
          >
            {action.title}
          </Button>
        </Space>
      </Form>
      {mutation.isError && (
        <Alert
          style={{ marginTop: 20 }}
          type="error"
          showIcon
          title={errorMessage(mutation.error)}
          description={
            mutation.error instanceof ApiError
              ? [
                  mutation.error.status || '',
                  mutation.error.code,
                  mutation.error.traceId,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
        />
      )}
      {mutation.isSuccess && (
        <Alert
          style={{ marginTop: 20 }}
          type="success"
          showIcon
          title={action.success ?? 'Thao tác thành công.'}
        />
      )}
      {result !== undefined && (
        <section aria-label="Kết quả từ máy chủ" style={{ marginTop: 24 }}>
          <h3>Kết quả từ máy chủ</h3>
          {result === null ? (
            <p>Yêu cầu đã hoàn tất.</p>
          ) : (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                maxHeight: 480,
                overflow: 'auto',
                padding: 16,
                background: '#F3EFE6',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </section>
      )}
    </section>
  )
}
