import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// ─── Request interceptor — attach Bearer token if present ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('whispers_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle global errors ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('whispers_token')
      localStorage.removeItem('whispers_username')
      localStorage.removeItem('whispers_role')
      // Notify the auth layer (same-tab) so React state updates immediately
      window.dispatchEvent(new Event('whispers:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
