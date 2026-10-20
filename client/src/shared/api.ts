export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'radio' | 'select' | 'checkbox' | 'date' | 'url'
export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  options: string[]
}
export type Form = {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'published';
  slug: string | null;
  createdAt?: string;
  updatedAt?: string;
  responseCount?: number
}
export type FormResponse = {
  id: string;
  formId: string;
  sessionId: string;
  answers: Record<string, string | string[]>;
  submittedAt: string
}
export type Analytics = {
  views: number;
  starts: number;
  submissions: number;
  startRate: number;
  conversion: number;
  fields: { id: string; label: string; abandoned: number; dropoffPercent: number }[]
}

const TOKEN_KEY = 'form-service-auth'

function readToken(): string | null {
  try {
    const authState = localStorage.getItem(TOKEN_KEY)
    if (!authState) return null
    const parsed = JSON.parse(authState) as { state?: { token?: unknown } }
    return typeof parsed.state?.token === 'string' ? parsed.state.token : null
  } catch {
    return null
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

export class ApiError extends Error {
  code: string
  fields?: Record<string, string>
  constructor(message: string, code: string, fields?: Record<string, string>) {
    super(message)
    this.code = code
    this.fields = fields
  }
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = readToken()

  const headers = new Headers(options.headers)

  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearToken()
      window.dispatchEvent(new Event('form-service-auth-expired'))
    }

    const body = await response.json().catch(() => null) as { error?: { message?: string; code?: string; fields?: Record<string, string> } } | null
    throw new ApiError(body?.error?.message || 'Не удалось выполнить запрос', body?.error?.code || 'REQUEST_FAILED', body?.error?.fields)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function download(url: string, filename: string) {
  const token = readToken()

  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new Error(body?.error?.message || 'Не удалось скачать файл')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

export const save = (form: Pick<Form, 'title' | 'description' | 'fields'>) => api<Form>('/api/admin/forms', { method: 'POST', body: JSON.stringify(form) })
export const update = (id: string, form: Pick<Form, 'title' | 'description' | 'fields'>) => api<Form>(`/api/admin/forms/${id}`, { method: 'PUT', body: JSON.stringify(form) })
