const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api'

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map((d: { msg?: string }) => d.msg).join(', ')
    return data.message ?? 'API error'
  } catch {
    return res.statusText || 'API error'
  }
}

export async function apiCall<T>(
  endpoint: string,
  method = 'GET',
  body: unknown = null,
  token: string | null = null,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== null) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function uploadFile(
  endpoint: string,
  file: File,
  token: string,
): Promise<{ hplc_url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export { API_BASE }
