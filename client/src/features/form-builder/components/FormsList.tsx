import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, Copy, Plus } from 'lucide-react'
import { api, save, type Form } from '../../../shared/api'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { createField } from '../constants/fieldTypes'

export function FormsList() {
  const [forms, setForms] = useState<Form[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      setForms(await api<Form[]>('/api/admin/forms'))
      setError('')
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Не удалось загрузить формы',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function create() {
    try {
      const form = await save({
        title: 'Новая форма',
        description: '',
        fields: [createField()],
      })
      navigate(`/admin/forms/${form.id}`)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Не удалось создать форму',
      )
    }
  }

  async function copy(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`)
    setCopied(slug)
    window.setTimeout(() => setCopied(''), 1800)
  }

  return (
    <main className="page-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
          <h1>Ваши формы</h1>
          <p className="muted">
            Собирайте отклики и находите, где теряется интерес.
          </p>
        </div>
        <button className="button primary" onClick={() => void create()}>
          <Plus size={17} />
          Создать форму
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="forms-toolbar">
        <span className="section-label">
          ВСЕ ФОРМЫ <b>{forms.length}</b>
        </span>
        <span className="muted small-text">
          Опубликовано: {forms.filter((form) => form.status === 'published').length}
        </span>
      </div>
      {loading ? (
        <LoadingSpinner label="Загружаем формы…" />
      ) : forms.length ? (
        <div className="form-list">
          {forms.map((form) => (
            <article className="form-row" key={form.id}>
              <div className="form-icon">
                <span>✳</span>
              </div>
              <div className="form-main">
                <Link to={`/admin/forms/${form.id}`} className="form-title">
                  {form.title}
                </Link>
                <div className="form-meta">
                  <span className={`status-pill ${form.status}`}>
                    {form.status === 'published' ? 'Опубликована' : 'Черновик'}
                  </span>
                  <span>·</span>
                  <span>{form.responseCount || 0} ответов</span>
                  <span>·</span>
                  <span>
                    {new Date(
                      form.updatedAt || form.createdAt || Date.now(),
                    ).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <Link
                  className="button subtle"
                  to={`/admin/forms/${form.id}/responses`}
                >
                  Ответы{' '}
                  <span className="count">{form.responseCount || 0}</span>
                </Link>
                <Link
                  className="icon-button"
                  title="Аналитика"
                  aria-label="Аналитика"
                  to={`/admin/forms/${form.id}/analytics`}
                >
                  <ArrowUpRight size={17} />
                </Link>
                {form.status === 'published' && form.slug && (
                  <button
                    className="icon-button"
                    title="Копировать ссылку"
                    aria-label="Копировать ссылку"
                    onClick={() => void copy(form.slug!)}
                  >
                    {copied === form.slug ? (
                      <Check size={17} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
                <Link className="button outline" to={`/admin/forms/${form.id}`}>
                  Редактировать
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-card">
            <div className="empty-symbol">✳</div>
            <h2>Пока нет форм</h2>
            <p>Создайте первую форму и поделитесь ссылкой со студентами.</p>
            <button className="button primary" onClick={() => void create()}>
              <Plus size={16} />
              Создать форму
            </button>
          </div>
        )
      )}
    </main>
  )
}
