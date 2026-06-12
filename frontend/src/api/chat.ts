import client, { storage } from './client'

export type ChatMode = 'document' | 'iso' | 'both'

export interface ChatRequest {
  message: string
  conversationId?: string
  mode: ChatMode
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatActionOption {
  label: string
  description?: string
  command?: string
}

export interface ChatResponse {
  message: string
  conversationId: string
  citations: string[]
  documentId?: string
  actionOptions?: ChatActionOption[]
}

export const getChatHistory = async (conversationId: string): Promise<ChatHistoryItem[]> => {
  const { data } = await client.get<ChatHistoryItem[]>('/chat/history', {
    params: { conversationId },
  })
  return data
}

export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await client.post<ChatResponse>('/chat', payload)
  return data
}

export interface ChatActionExecutionRequest {
  action: ChatActionOption
  conversationId?: string
  mode: ChatMode
}

export const executeDocumentChatAction = async (
  documentId: string,
  payload: ChatActionExecutionRequest,
): Promise<ChatResponse> => {
  const { data } = await client.post<ChatResponse>(`/documents/${documentId}/chat/action`, payload)
  return data
}

export interface StreamDoneMeta {
  conversationId: string
  citations: string[]
  actionOptions?: ChatActionOption[]
}

export const streamDocumentChat = async (
  documentId: string,
  payload: ChatRequest,
  onChunk: (chunk: string) => void,
  onDone: (meta: StreamDoneMeta) => void,
  onError: (error: Error) => void,
): Promise<void> => {
  const token = storage.getToken()
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  try {
    const response = await fetch(`${apiBaseUrl}/documents/${documentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Error ${response.status}: ${body}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No se pudo leer la respuesta del servidor')
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

        if (!data) {
          separatorIndex = buffer.indexOf('\n\n')
          continue
        }

        if (event === 'message') {
          try {
            const payloadData = JSON.parse(data)
            if (typeof payloadData.delta === 'string') {
              onChunk(payloadData.delta)
            }
          } catch {
            onChunk(data)
          }
        }

        if (event === 'done') {
          try {
            const payloadData = JSON.parse(data)
            onDone({
              conversationId: payloadData.conversationId,
              citations: Array.isArray(payloadData.citations) ? payloadData.citations : [],
              actionOptions: Array.isArray(payloadData.actionOptions) ? payloadData.actionOptions : [],
            })
          } catch {
            onDone({ conversationId: '', citations: [], actionOptions: [] })
          }
        }

        separatorIndex = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim()) {
      try {
        const payloadData = JSON.parse(buffer.trim())
        if (payloadData?.delta) {
          onChunk(payloadData.delta)
        }
      } catch {
        onChunk(buffer.trim())
      }
    }

    onDone({ conversationId: '', citations: [], actionOptions: [] })
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}
