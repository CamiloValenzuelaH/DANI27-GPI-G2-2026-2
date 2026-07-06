import client from './client'

export interface AuditRoomFolderResponse {
  id: string
  label: string
  control_ref_prefix: string
  item_count: number
}

export interface AuditRoomEvidenceItem {
  id: string
  name: string
  type: string
  control_id: string
  clause_ref: string
  organization_id: string
  question_id?: string | null
  answer_id?: string | null
  validity_days?: number | null
  freshness_status: string
  created_at?: string | null
}

export interface AuditRoomSearchResult {
  id: string
  clause_ref?: string | null
  title?: string | null
  content?: string | null
  relevance_score: number
}

export interface AuditRoomSearchResponse {
  query: string
  results: AuditRoomSearchResult[]
}

export interface AuditRoomBinderRequest {
  title: string
  description?: string
  selected_evidence_ids: string[]
}

export interface AuditRoomBinderResponse {
  job_id: string
  status_url: string
}

export interface AuditRoomBinderStatusResponse {
  job_id: string
  status: string
  progress: number
  message?: string
  download_url?: string
  created_at?: string
  updated_at?: string
}

export const getAuditRoomFolders = async (): Promise<AuditRoomFolderResponse[]> => {
  const { data } = await client.get<AuditRoomFolderResponse[]>('/audit-room/folders')
  return data
}

export const getAuditRoomFolderEvidences = async (controlId: string): Promise<AuditRoomEvidenceItem[]> => {
  const { data } = await client.get<AuditRoomEvidenceItem[]>(`/audit-room/folders/${encodeURIComponent(controlId)}/evidences`)
  return data
}

export const searchAuditRoom = async (query: string): Promise<AuditRoomSearchResponse> => {
  const { data } = await client.post<AuditRoomSearchResponse>('/audit-room/search', { query })
  return data
}

export const createAuditRoomBinder = async (
  payload: AuditRoomBinderRequest,
): Promise<AuditRoomBinderResponse> => {
  const { data } = await client.post<AuditRoomBinderResponse>('/audit-room/binder', payload)
  return data
}

export const getAuditRoomBinderStatus = async (
  jobId: string,
): Promise<AuditRoomBinderStatusResponse> => {
  const { data } = await client.get<AuditRoomBinderStatusResponse>(`/audit-room/binder/${encodeURIComponent(jobId)}/status`)
  return data
}

export const downloadAuditRoomBinder = async (downloadUrl: string): Promise<Blob> => {
  const normalizedUrl = downloadUrl.startsWith('/api/v1') ? downloadUrl.replace(/^\/api\/v1/, '') : downloadUrl
  const response = await client.get<Blob>(normalizedUrl, { responseType: 'blob' })
  return response.data
}
