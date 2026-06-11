import client, { storage } from './client'

export interface DocumentMetadata {
  documentId: string
  title: string
  description?: string
  createdAt?: string
}

export interface DocumentDetailResponse extends DocumentMetadata {
  documentText?: string
}

export interface DocumentUploadResponse {
  documentId: string
  title: string
  description?: string
  message?: string
}

export interface DocumentGenerationRequest {
  title: string
  description?: string
  targetAudience?: string
  language?: string
  tone?: string
  sections?: string[]
  controlRefs?: string[]
}

export interface DocumentGenerationJobResponse {
  job_id: string
  status: string
  stream_Url: string
}

export interface DocumentGenerationProgressResponse {
  job_id: string
  status: string
  progress: number
  message?: string
  document_title?: string
  current_section_index?: number
  current_section_title?: string
  total_sections?: number
  completed_sections?: number
}

export const listDocuments = async (): Promise<DocumentMetadata[]> => {
  const { data } = await client.get<DocumentMetadata[]>('/documents')
  return data
}

export const getDocument = async (documentId: string): Promise<DocumentDetailResponse> => {
  const { data } = await client.get<DocumentDetailResponse>(`/documents/${documentId}`)
  return data
}

export const uploadDocument = async (formData: FormData): Promise<DocumentUploadResponse> => {
  const { data } = await client.post<DocumentUploadResponse>('/documents/upload', formData)
  return data
}

export const generateDocument = async (
  payload: DocumentGenerationRequest,
): Promise<DocumentGenerationJobResponse> => {
  const { data } = await client.post<DocumentGenerationJobResponse>('/documents/generate/full', payload)
  return data
}

export type DocumentGenerationEvent = {
  event: string
  data: Record<string, unknown>
}

export const streamDocumentGenerationEvents = async (
  job_id: string,
  onEvent: (event: DocumentGenerationEvent) => void,
  onDone: () => void,
  onError: (error: Error) => void,
): Promise<void> => {
  const token = storage.getToken()
  const url = `${client.defaults.baseURL ?? '/api/v1'}/documents/generate/full/${job_id}/events${token ? `?access_token=${token}` : ''}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Error ${response.status}: ${body}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No se pudo leer el stream de generación')
    }

    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      let separatorIndex = buffer.indexOf('\n\n')

      while (separatorIndex !== -1) {
        const chunk = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)

        const lines = chunk.split(/\r?\n/)
        let event = 'message'
        let data = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            event = line.slice('event:'.length).trim()
          }
          if (line.startsWith('data:')) {
            data += line.slice('data:'.length).trim()
          }
        }

        if (data) {
          try {
            const payload = JSON.parse(data)
            onEvent({ event, data: payload })
          } catch {
            onEvent({ event, data: { raw: data } })
          }

          if (event === 'done') {
            onDone()
            return
          }
        }

        separatorIndex = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim()) {
      try {
        const payload = JSON.parse(buffer.trim())
        onEvent({ event: 'message', data: payload })
      } catch {
        onEvent({ event: 'message', data: { raw: buffer.trim() } })
      }
    }

    onDone()
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export const updateDocument = async (
  documentId: string,
  title: string,
  content: string,
): Promise<void> => {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  await client.patch(`/documents/${documentId}`, formData)
}

export const deleteDocument = async (documentId: string): Promise<void> => {
  await client.delete(`/documents/${documentId}`)
}