import axios from 'axios'
import { auth } from '@/config/firebase'

// ─── Axios instance pointing to the Render backend ───────────────────────────

const BASE_URL = import.meta.env.VITE_BACKEND_URL

/**
 * Returns true if the backend URL is configured.
 * Use this to show "Backend not connected" UI gracefully.
 */
export function isBackendConfigured() {
  return !!BASE_URL
}

const api = axios.create({
  baseURL: BASE_URL || 'https://placeholder.wesafeqr.com',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach Firebase ID token ───────────────────────────

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: normalize errors ───────────────────────────────────

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export default api
