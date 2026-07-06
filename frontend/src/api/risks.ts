import client from './client'
import type { Risk, Threat } from './types'

export interface CreateRiskRequest {
  name: string
  description?: string
  asset_id: string
  probability: number
  impact: number
}

export interface LinkRiskThreatRequest {
  threat_id: string
}

export const risksApi = {
  list: async (): Promise<Risk[]> => {
    const res = await client.get<Risk[]>('/risks')
    return res.data
  },

  create: async (data: CreateRiskRequest): Promise<Risk> => {
    const res = await client.post<Risk>('/risks', data)
    return res.data
  },

  linkThreat: async (riskId: string, data: LinkRiskThreatRequest): Promise<Threat> => {
    const res = await client.post<Threat>(`/risks/${riskId}/threats`, data)
    return res.data
  },
}
