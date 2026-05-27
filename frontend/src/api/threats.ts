import client from './client'
import type { Threat } from './types'

export interface CreateThreatRequest {
  name: string
  description?: string
  category: string
  likelihood: number
}

export interface UpdateThreatRequest {
  name?: string
  description?: string
  category?: string
  likelihood?: number
}

export const threatsApi = {
  list: async (): Promise<Threat[]> => {
    const res = await client.get<Threat[]>('/threats')
    return res.data
  },

  create: async (data: CreateThreatRequest): Promise<Threat> => {
    const res = await client.post<Threat>('/threats', data)
    return res.data
  },

  update: async (id: string, data: UpdateThreatRequest): Promise<Threat> => {
    const res = await client.patch<Threat>(`/threats/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/threats/${id}`)
  },
}
