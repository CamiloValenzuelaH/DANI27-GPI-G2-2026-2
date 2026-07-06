import client from './client'

export type CAPAStatus = 'open' | 'inProgress' | 'resolved' | 'closed'
export type CAPAPriority = 'critical' | 'high' | 'medium' | 'low'
export type CAPASource = 'internal_audit' | 'external_audit' | 'incident' | 'management_review'

export interface CAPAResponse {
  id: string
  title: string
  description?: string
  status: CAPAStatus
  priority: CAPAPriority
  source: CAPASource
  due_date?: string
  progress: number
  assigned_to?: string
  control_id?: string
  created_at: string
  updated_at: string
}

export interface CAPASummaryResponse {
  total: number
  by_status: Record<CAPAStatus, number>
  by_priority: Record<CAPAPriority, number>
  overdue_count: number
}

export async function getCapas(params?: {
  status?: CAPAStatus
  priority?: CAPAPriority
  source?: CAPASource
  limit?: number
  offset?: number
}) {
  const { data } = await client.get<CAPAResponse[]>('/capas', {
    params,
  })
  return data
}

export interface CreateCAPARequest {
  title: string
  description?: string
  status?: CAPAStatus
  priority: CAPAPriority
  source: CAPASource
  due_date?: string
  progress?: number
  control_id?: string
}
export interface UpdateCAPARequest {
  title?: string
  description?: string
  status?: CAPAStatus
  priority?: CAPAPriority
  source?: CAPASource
  due_date?: string
  progress?: number
  assigned_to?: string
  control_id?: string
}

export async function createCapa(data: CreateCAPARequest) {
  const { data: response } = await client.post<CAPAResponse>('/capas', data)
  return response
}
export async function updateCapa(id: string, data: UpdateCAPARequest) {
  const { data: response } = await client.put<CAPAResponse>(`/capas/${id}`, data)
  return response
}

export async function getCapaSummary() {
  const { data } = await client.get<CAPASummaryResponse>('/capas/summary')
  return data
}
