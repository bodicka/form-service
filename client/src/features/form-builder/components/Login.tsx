import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { api } from '../../../shared/api'
import { useAuthStore } from '../../auth/authStore'

export function Login() {
  const setToken = useAuthStore((state) => state.setToken)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      setToken(result.token)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">f.</div>
        <p className="eyebrow">ПРОСТЫЕ ФОРМЫ · ЧЕСТНАЯ АНАЛИТИКА</p>
        <h1>Войти в рабочее пространство</h1>
        <p className="muted">
          Введите пароль менеджера, чтобы управлять формами и ответами.
        </p>
        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль администратора"
          autoFocus
        />
        <button className="button primary full" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
          <ArrowDown size={16} />
        </button>
        {error && <div className="error-box">{error}</div>}
        <div className="login-hint">
          Пароль по умолчанию: <code>admin</code>
        </div>
      </form>
    </main>
  )
}
