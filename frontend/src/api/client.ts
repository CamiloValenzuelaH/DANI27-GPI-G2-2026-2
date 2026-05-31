import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

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
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Si es FormData, no establecer Content-Type (dejar que el navegador lo haga)
  if (!(config.data instanceof FormData)) {
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