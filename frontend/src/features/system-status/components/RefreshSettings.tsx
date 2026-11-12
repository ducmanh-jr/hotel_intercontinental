import { useId } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, InputNumber } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { settingsSchema, type Settings } from '../model/refresh-settings-schema'

interface RefreshSettingsProps {
  refreshSeconds: number
  onApply: (seconds: number) => void
}

export function RefreshSettings({ refreshSeconds, onApply }: RefreshSettingsProps) {
  const fieldId = useId()
  const { control, handleSubmit, formState: { errors, isDirty }, reset } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { refreshSeconds },
  })

  function submit(values: Settings) {
    onApply(values.refreshSeconds)
    reset(values)
  }

  return (
    <section className="settings-panel" aria-labelledby="refresh-settings-title">
      <h2 id="refresh-settings-title">Tự động cập nhật</h2>
      <p className="muted">Chọn khoảng kiểm tra kết nối trong tab này.</p>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Form.Item
          label="Khoảng kiểm tra (giây)"
          htmlFor={fieldId}
          validateStatus={errors.refreshSeconds ? 'error' : undefined}
          help={errors.refreshSeconds?.message}
        >
          <Controller
            name="refreshSeconds"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                id={fieldId}
                min={0}
                max={300}
                step={15}
                controls
                className="full-width"
                aria-invalid={Boolean(errors.refreshSeconds)}
                aria-describedby={fieldId + '-help'}
              />
            )}
          />
        </Form.Item>
        <p id={fieldId + '-help'} className="field-help">
          Nhập 0 để chỉ kiểm tra thủ công, hoặc từ 15 đến 300 giây.
        </p>
        <Button type="primary" htmlType="submit" disabled={!isDirty}>Áp dụng</Button>
      </form>
    </section>
  )
}
