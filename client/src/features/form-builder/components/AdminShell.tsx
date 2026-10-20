import { Link } from 'react-router-dom'
import { useAuthStore } from '../../auth/authStore'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout)
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" to="/admin">
          <span className="brand-mark small">f.</span>
          <span>форма</span>
        </Link>
        <div className="top-actions">
          <span className="avatar">М</span>
          <button className="text-button" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}
