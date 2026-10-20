import type { FieldType, FormField } from '../../../shared/api'

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Короткий текст' },
  { value: 'textarea', label: 'Длинный текст' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'number', label: 'Число' },
  { value: 'radio', label: 'Один вариант' },
  { value: 'select', label: 'Выпадающий список' },
  { value: 'checkbox', label: 'Несколько вариантов' },
  { value: 'date', label: 'Дата' },
  { value: 'url', label: 'Ссылка' },
]

export const createField = (type: FieldType = 'text'): FormField => ({
  id: crypto.randomUUID(),
  type,
  label: 'Новый вопрос',
  description: '',
  placeholder: '',
  required: false,
  options: ['Вариант 1', 'Вариант 2'],
})
