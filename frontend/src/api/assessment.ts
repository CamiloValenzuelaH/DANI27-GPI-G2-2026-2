import client from './client'

export interface PhaseDTO {
  id: string
  name: string
  code?: string
  description?: string
  sort_order?: number
  progress?: number
}

export interface QuestionDTO {
  id: string
  text: string
  clause_ref?: string
  is_critical: boolean
  evidence_hint?: string
}

export async function getPhases(): Promise<PhaseDTO[]> {
  const { data } = await client.get<PhaseDTO[]>('/assessment/phases')
  return data
}

export async function getPhaseQuestions(phaseId: string): Promise<QuestionDTO[]> {
  const { data } = await client.get<QuestionDTO[]>(`/assessment/phases/${phaseId}/questions`)
  return data
}

export async function postAnswer(payload: { question_id: string; answer: string; notes?: string }) {
  console.debug('Posting assessment answer', payload)
  const { data } = await client.post('/assessment/answers', payload)
  return data
}

export async function getProgress() {
  const { data } = await client.get('/assessment/progress')
  return data
}

export async function getGapsSummary() {
  const { data } = await client.get('/assessment/gaps')
  return data
}

export async function getGapActions(phaseId: string) {
  const { data } = await client.get(`/assessment/gaps/phase/${phaseId}/actions`)
  return data
}

export interface CriticalGapItem {
  phase_id: string
  phase_name: string
  question_id: string
  question_text: string
  clause_ref?: string
  answer?: string
  open_reason: 'unanswered' | 'answered_no' | 'answered_partial'
  missing_requirement: string
  suggested_evidence?: string
  has_evidence?: boolean
}

export async function getCriticalGaps(): Promise<CriticalGapItem[]> {
  const { data } = await client.get<CriticalGapItem[]>('/assessment/gaps/critical')
  return data
}
