import client from './client'
import type { Asset, AssetSummary } from './types'

export interface CreateAssetRequest {
  name: string
  description?: string
  asset_type: string
  owner_id?: string
  location?: string
  confidentiality: number
  integrity: number
  availability: number
  clause_ref?: string
}

export interface UpdateAssetRequest {
  name?: string
  description?: string
  asset_type?: string
  owner_id?: string
  location?: string
  status?: string
  confidentiality?: number
  integrity?: number
  availability?: number
  clause_ref?: string
}

export const assetsApi = {
  list: async (): Promise<Asset[]> => {
    const res = await client.get<Asset[]>('/assets')
    return res.data
  },

  summary: async (): Promise<AssetSummary> => {
    const res = await client.get<AssetSummary>('/assets/summary')
    return res.data
  },

  get: async (id: string): Promise<Asset> => {
    const res = await client.get<Asset>(`/assets/${id}`)
    return res.data
  },

  create: async (data: CreateAssetRequest): Promise<Asset> => {
    const res = await client.post<Asset>('/assets', data)
    return res.data
  },

  update: async (id: string, data: UpdateAssetRequest): Promise<Asset> => {
    const res = await client.patch<Asset>(`/assets/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/assets/${id}`)
  },
}