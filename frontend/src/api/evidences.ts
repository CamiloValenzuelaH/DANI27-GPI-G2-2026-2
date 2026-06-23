import client from './client'

export interface EvidenceTaxonomyItem {
  id: string
  name: string
  type: string
  control_id: string
  clause_ref: string
  organization_id: string
  validity_days: number | null
  freshness_status: 'fresh' | 'expiring' | 'expired'
}

export interface EvidenceTaxonomyGroup {
  type: string
  evidences: EvidenceTaxonomyItem[]
}

export const evidencesApi = {
  list: async (): Promise<EvidenceTaxonomyGroup[]> => {
    const response = await client.get<EvidenceTaxonomyGroup[]>('/evidences')
    return response.data
  },
}
