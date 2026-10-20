import type { FormField } from '../../../../shared/api'

interface PreviewProps {
  title: string
  description: string
  fields: FormField[]
}

export function Preview({ title, description, fields }: PreviewProps) {
  return (
    <div className="preview-outer">
      <div className="preview-label">
        <span className="live-dot" />
        ПРЕДПРОСМОТР
      </div>
      <div className="preview-card">
        <div className="preview-brand">ФОРМА · ОТКЛИК</div>
        <h2>{title || 'Название формы'}</h2>
        {description && <p>{description}</p>}
        {fields.length ? (
          fields.map((field) => (
            <div className="preview-field" key={field.id}>
              <label>
                {field.label}
                {field.required && <i>*</i>}
              </label>
              {field.description && <small>{field.description}</small>}
              {['radio', 'checkbox'].includes(field.type) ? (
                field.options.filter(Boolean).map((option) => (
                  <div className="preview-choice" key={option}>
                    <span />
                    {option}
                  </div>
                ))
              ) : field.type === 'textarea' ? (
                <div className="preview-textarea">
                  {field.placeholder || 'Ваш ответ'}
                </div>
              ) : field.type === 'select' ? (
                <div className="preview-input">
                  {field.placeholder || 'Выберите вариант'}　⌄
                </div>
              ) : (
                <div className="preview-input">
                  {field.placeholder || 'Ваш ответ'}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="preview-empty">
            Добавьте вопросы, чтобы увидеть форму.
          </div>
        )}
        <div className="preview-submit">Отправить отклик →</div>
        <div className="preview-foot">
          Ваши ответы сохраняются автоматически
        </div>
      </div>
      <p className="preview-caption">Так форму увидят студенты</p>
    </div>
  )
}
