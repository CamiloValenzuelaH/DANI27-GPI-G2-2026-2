import client, { storage } from './client'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from './types'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await client.post<LoginResponse>('/auth/login', data)
    return res.data
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const res = await client.post<LoginResponse>('/auth/register', data)
    return res.data
  },

  me: async (): Promise<User> => {
    const res = await client.get<User>('/auth/me')
    return res.data
  },

  logout: async (): Promise<void> => {
    const refreshToken = storage.getRefresh()
    if (refreshToken) {
      await client.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {})
    }
    storage.clear()
  },
}