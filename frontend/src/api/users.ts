import client from './client'
import type { User } from './types'

export interface InviteUserRequest {
  full_name: string
  email: string
  password: string
  role_id: string
}

export interface UpdateUserRequest {
  full_name?: string
  is_active?: boolean
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await client.get<User[]>('/users')
    return res.data
  },

  get: async (id: string): Promise<User> => {
    const res = await client.get<User>(`/users/${id}`)
    return res.data
  },

  invite: async (data: InviteUserRequest): Promise<User> => {
    const res = await client.post<User>('/users', data)
    return res.data
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const res = await client.patch<User>(`/users/${id}`, data)
    return res.data
  },

  deactivate: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`)
  },

  assignRole: async (userId: string, roleId: string): Promise<User> => {
    const res = await client.post<User>(`/users/${userId}/roles`, { role_id: roleId })
    return res.data
  },

  removeRole: async (userId: string, roleId: string): Promise<void> => {
    await client.delete(`/users/${userId}/roles/${roleId}`)
  },
}