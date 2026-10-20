import { useAuthStore } from '../../auth/authStore'
import { Login } from './Login'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Login />
}
