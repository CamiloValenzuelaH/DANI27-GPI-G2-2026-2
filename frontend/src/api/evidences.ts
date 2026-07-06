import client from './client'
import type { AxiosRequestConfig } from 'axios'

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

export interface EvidenceUploadResponse {
  evidence_id: string
  id: string
  name: string
  type: string
  control_id: string
  clause_ref: string
  organization_id: string
  validity_days: number | null
  freshness_status: 'fresh' | 'expiring' | 'expired'
  file_name: string
  original_file_name: string
  content_type: string
  size_bytes: number
  file_path: string
  created_date: string | null
}

export const evidencesApi = {
  list: async (): Promise<EvidenceTaxonomyGroup[]> => {
    const response = await client.get<EvidenceTaxonomyGroup[]>('/evidences')
    return response.data
  },
  remove: async (evidenceId: string): Promise<void> => {
    await client.delete(`/evidences/${evidenceId}`)
  },
  upload: async (formData: FormData, config?: AxiosRequestConfig): Promise<EvidenceUploadResponse> => {
    const { data } = await client.post<EvidenceUploadResponse>('/evidences', formData, config)
    return data
  },
}
