import client from './client'

export interface SearchResultItem {
  id: string
  clause_ref: string
  folder: string
  title: string
  preview: string
  content: string
  relevance_score: number
}

export interface SearchResponse {
  query: string
  results: SearchResultItem[]
}

export interface SearchRequest {
  query: string
}

export const searchIsoChunks = async (query: string): Promise<SearchResponse> => {
  const { data } = await client.post<SearchResponse>('/search', { query })
  return data
}
