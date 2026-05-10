import client from './client'
import type { Role } from './types'

export interface CreateRoleRequest {
  name: string
  description?: string
}

export const rolesApi = {
  list: async (): Promise<Role[]> => {
    const res = await client.get<Role[]>('/roles')
    return res.data
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const res = await client.post<Role>('/roles', data)
    return res.data
  },

  update: async (id: string, data: Partial<CreateRoleRequest>): Promise<Role> => {
    const res = await client.patch<Role>(`/roles/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/roles/${id}`)
  },
}