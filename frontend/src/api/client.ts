import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// Resolve API base URL: prefer VITE_API_URL, otherwise default to '/api/v1'.
// When running the dev server on port 5173 and no VITE_API_URL is set,
// point to the backend at localhost:8000 so API calls don't hit the dev server.
const envUrl = import.meta.env.VITE_API_URL
let BASE_URL = (envUrl ?? '/api/v1').replace(/\/$/, '')
try {
  if (!envUrl && typeof window !== 'undefined') {
    const { hostname, port } = window.location
      if (hostname === 'localhost' && port === '5173') {
        // In local Docker setups this project exposes the backend on host port 8001
        // (docker-compose maps 8001->8000). Prefer 8001 to match developer docker mapping.
        BASE_URL = 'http://localhost:8001/api/v1'
      }
  }
} catch (e) {
  // ignore
}

// debug
// eslint-disable-next-line no-console
console.info('API base URL:', BASE_URL)

const TOKEN_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
})

// Adjunta el access token en cada request y maneja FormData correctamente
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getToken()
  config.headers = config.headers ?? {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Si es FormData, no establecer Content-Type (dejar que el navegador lo haga)
  if (config.data && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  
  return config
})

// Si recibe 401, intenta refrescar el token automáticamente
let isRefreshing = false
let queue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  queue.forEach(cb => cb(token))
  queue = []
}

client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise(resolve => {
        queue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(client(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = storage.getRefresh()

    if (!refreshToken) {
      storage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      const { access_token, refresh_token } = data
      storage.setTokens(access_token, refresh_token)
      processQueue(access_token)
      original.headers.Authorization = `Bearer ${access_token}`
      return client(original)
    } catch {
      storage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default client