import { storage } from './client'
import client from './client'

const BASE_URL = import.meta.env.VITE_VALIDATION_API_URL ?? '/api/validate'

export interface ValidationObservation {
  severity: 'critical' | 'major' | 'minor'
  text: string
}

export interface ChunkValidationResult {
  clause_ref: string
  title: string
  relevance_score?: number
  compliance_score: number
  document_status?: 'COMPLETO' | 'INCOMPLETO' | 'INEXISTENTE'
  missing_elements?: string[]
  observations: ValidationObservation[]
  suggestions: string[]
}

export interface ValidationReportResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  message?: string | null
  organization_id?: string | null
  user_id?: string | null
  file_name?: string | null
  file_path?: string | null
  total_chunks: number
  overall_score?: number | null
  findings: ChunkValidationResult[]
  summary?: string | null
  error?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ValidationJobResponse {
  job_id: string
  status: 'queued'
  stream_url: string
}

export interface GenerateMissingResponse {
  job_id: string
  chunk_id: string
  generated_text: string
  validation_passed: boolean
  validation_score: number
  iterations: number
  validation_feedback?: string | null
}

export async function enqueueExternalValidation(file: File): Promise<ValidationJobResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const token = storage.getToken()
  const response = await fetch(`${BASE_URL}/external`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<ValidationJobResponse>
}

export async function subscribeExternalValidationJob(
  jobId: string,
  handlers: {
    onProgress: (payload: ValidationReportResponse) => void
    onDone?: (payload: ValidationReportResponse) => void
    onError?: (message: string) => void
  }
): Promise<EventSource> {
  // Ensure access token is valid (triggers axios refresh interceptor if needed)
  try {
    await client.get('/auth/me')
  } catch (err) {
    // If refresh failed, let the caller handle redirect/login via client interceptor
    throw err
  }

  const token = storage.getToken()
  const query = token ? `?access_token=${encodeURIComponent(token)}` : ''
  const source = new EventSource(`${BASE_URL}/external/${jobId}/events${query}`)

  source.addEventListener('progress', (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as ValidationReportResponse
    handlers.onProgress(payload)
  })

  source.addEventListener('done', (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as ValidationReportResponse
    handlers.onDone?.(payload)
    source.close()
  })

  source.onerror = () => {
    handlers.onError?.('No se pudo conectar al stream de progreso')
  }

  return source
}

export async function listExternalValidationJobs(limit = 50): Promise<ValidationReportResponse[]> {
  const token = storage.getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${BASE_URL}/external/history?limit=${encodeURIComponent(String(limit))}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<ValidationReportResponse[]>
}

export async function getExternalValidationResult(jobId: string): Promise<ValidationReportResponse> {
  const token = storage.getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${BASE_URL}/external/${jobId}/result`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<ValidationReportResponse>
}

export async function generateMissingForChunk(
  jobId: string,
  chunkId: string
): Promise<GenerateMissingResponse> {
  const token = storage.getToken()
  const response = await fetch(`${BASE_URL}/external/${jobId}/generate-missing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ chunk_id: chunkId }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<GenerateMissingResponse>
}
