import client from './client'

export type ReportTemplate = 'soa' | 'risk_register' | 'audit_report' | 'gap_analysis'
export type ReportFormat = 'pdf' | 'xlsx' | 'docx' | 'csv'

export interface ReportTemplateResponse {
  id: ReportTemplate
  name: string
  description: string
}

export interface ReportTemplatesResponse {
  templates: ReportTemplateResponse[]
}

export interface ReportGenerateRequest {
  documentId: string
  title: string
  description?: string
  template: ReportTemplate
  format: ReportFormat
}

export interface ReportJobResponse {
  job_id: string
  status: string
  status_url: string
}

export interface ReportStatusResponse {
  job_id: string
  status: string
  progress: number
  message?: string
  report_title?: string
  report_template?: ReportTemplate
  report_format?: ReportFormat
  download_url?: string
  created_at?: string
  updated_at?: string
}

export interface ReportHistoryItem {
  job_id: string
  report_title?: string
  report_template?: ReportTemplate
  report_format?: ReportFormat
  status: string
  created_at?: string
  file_path?: string | null
  download_url?: string
}

export const getReportTemplates = async (): Promise<ReportTemplatesResponse> => {
  const { data } = await client.get<ReportTemplatesResponse>('/reports/templates')
  return data
}

export const generateReport = async (
  payload: ReportGenerateRequest,
): Promise<ReportJobResponse> => {
  const { data } = await client.post<ReportJobResponse>('/reports/generate', payload)
  return data
}

export const getReportStatus = async (
  jobId: string,
): Promise<ReportStatusResponse> => {
  const { data } = await client.get<ReportStatusResponse>(`/reports/${jobId}/status`)
  return data
}

export const listReports = async (): Promise<ReportHistoryItem[]> => {
  const { data } = await client.get<ReportHistoryItem[]>('/reports')
  return data
}

export const deleteReport = async (jobId: string): Promise<void> => {
  await client.delete(`/reports/${jobId}`)
}
