import { z } from 'zod'

export interface FormField {
  key: string
  label: string
  rule: z.ZodType<string, string>
  secret?: boolean
  initial?: string
  autoComplete?: string
}

export interface FormAction {
  id: string
  title: string
  group: string
  fields: FormField[]
  authenticated?: boolean
  success?: string
}

export function formInputSchema(action: FormAction) {
  return z.object(Object.fromEntries(action.fields.map((field) => [field.key, field.rule])))
}
