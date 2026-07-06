export type CAPAStatus = 'open' | 'inProgress' | 'resolved' | 'closed'
export type CAPAPriority = 'critical' | 'high' | 'medium' | 'low'
export type CAPASource = 'internal_audit' | 'external_audit' | 'incident' | 'management_review'

export interface CAPAItem {
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
