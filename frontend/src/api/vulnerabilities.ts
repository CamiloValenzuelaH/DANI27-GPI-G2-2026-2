import client from './client'
import type { Vulnerability } from './types'

export interface CreateVulnerabilityRequest {
  name: string
  description?: string
  asset_id: string
  severity: string
  likelihood?: number
  impact?: number
}

export interface UpdateVulnerabilityRequest {
  name?: string
  description?: string
  asset_id?: string
  severity?: string
  likelihood?: number
  impact?: number
}

export const vulnerabilitiesApi = {
  list: async (): Promise<Vulnerability[]> => {
    const res = await client.get<Vulnerability[]>('/vulnerabilities')
    return res.data
  },

  create: async (data: CreateVulnerabilityRequest): Promise<Vulnerability> => {
    const res = await client.post<Vulnerability>('/vulnerabilities', data)
    return res.data
  },

  update: async (id: string, data: UpdateVulnerabilityRequest): Promise<Vulnerability> => {
    const res = await client.patch<Vulnerability>(`/vulnerabilities/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/vulnerabilities/${id}`)
  },
}
