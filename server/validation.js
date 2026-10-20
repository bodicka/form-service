import { z } from 'zod'

const FieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'textarea', 'email', 'phone', 'number', 'radio', 'select', 'checkbox', 'date', 'url']),
  label: z.string().trim().min(1),
  description: z.string(),
  placeholder: z.string(),
  required: z.boolean(),
  options: z.array(z.string()),
})

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название формы').max(160, 'Название формы слишком длинное'),
  description: z.string(),
  fields: z.array(FieldSchema).max(50, 'В форме может быть не более 50 полей'),
})

const AnswersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]))

export function validateFormInput(input) {
  const parsed = FormSchema.safeParse(input)
  if (!parsed.success) return parsed.error.issues[0]?.message || 'Проверьте данные формы'
  const ids = new Set()
  for (const field of parsed.data.fields) {
    if (ids.has(field.id)) return 'У каждого поля должен быть уникальный ID'
    ids.add(field.id)
    if (['radio', 'select', 'checkbox'].includes(field.type) && (!field.options.length || field.options.some((option) => !option.trim()))) return `Добавьте варианты для поля «${field.label}»`
  }
  return null
}

export function validateAnswers(form, answers) {
  const fields = {}
  const parsed = AnswersSchema.safeParse(answers)
  if (!parsed.success) {
    fields._form = 'Ответы должны содержать текстовые значения'
    return fields
  }
  const values = parsed.data
  const known = new Set(form.fields.map((field) => field.id))
  for (const key of Object.keys(values)) {
    if (!known.has(key)) fields[key] = 'Неизвестное поле'
  }
  for (const field of form.fields) {
    const value = values[field.id]
    const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
    if (field.required && empty) {
      fields[field.id] = 'Заполните это поле'
      continue
    }
    if (empty) continue
    const invalid = (message) => { fields[field.id] = message }
    if (field.type === 'checkbox') {
      if (!Array.isArray(value) || value.some((entry) => !field.options.includes(entry))) invalid('Выберите допустимые варианты')
      continue
    }
    if (typeof value !== 'string') {
      invalid('Введите текстовое значение')
      continue
    }
    if (['radio', 'select'].includes(field.type) && !field.options.includes(value)) invalid('Выберите допустимый вариант')
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) invalid('Введите корректный email')
    if (field.type === 'phone' && !/^\+?[\d\s().-]{7,20}$/.test(value)) invalid('Введите корректный номер телефона')
    if (field.type === 'url') {
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) invalid('Введите корректную ссылку')
      } catch {
        invalid('Введите корректную ссылку')
      }
    }
    if (field.type === 'number' && !Number.isFinite(Number(value))) invalid('Введите число')
    if (field.type === 'date') {
      const date = new Date(`${value}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid('Введите корректную дату')
    }
    if (value.length > 10000) invalid('Ответ слишком длинный')
  }
  return fields
}
