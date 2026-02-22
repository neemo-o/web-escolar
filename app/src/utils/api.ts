export async function fetchJson(input: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_BASE as string) || '/api'
  const url = input.startsWith('http') ? input : `${base}${input.startsWith('/') ? '' : '/'}${input}`

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init && (init.headers as Record<string, string>)),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { ...(init || {}), headers })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }

  if (!res.ok) {
    if (res.status === 401) {
      try { localStorage.removeItem('token') } catch {}
    }
    const message = data && (data.error || data.message) ? (data.error || data.message) : res.statusText
    throw new Error(message || 'Erro na requisição')
  }

  return data
}

export default { fetchJson }
