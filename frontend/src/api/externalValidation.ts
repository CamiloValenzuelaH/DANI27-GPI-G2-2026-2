import { storage } from './client'

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

export function subscribeExternalValidationJob(
  jobId: string,
  handlers: {
    onProgress: (payload: ValidationReportResponse) => void
    onDone?: (payload: ValidationReportResponse) => void
    onError?: (message: string) => void
  }
): EventSource {
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
