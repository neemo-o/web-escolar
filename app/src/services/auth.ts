import { fetchJson } from '../utils/api'

export async function getMe() {
  return fetchJson('/auth/me')
}

export async function login(payload: { email: string; password: string; schoolId?: string }) {
  return fetchJson('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export default { getMe, login }
