import axios from './client';

export interface AuditFinding {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  impact: string;
}

export interface AuditValidationResponse {
  audit_id: string;
  status: 'compliant' | 'non_compliant' | 'needs_review';
  findings: AuditFinding[];
  overall_compliance_score: number;
  analyzed_at: string;
  agent_notes: string;
}

export interface AuditEvidenceRequest {
  title: string;
  description: string;
  evidence_text: string;
  audit_type: 'security' | 'compliance' | 'operational' | 'financial';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditChecklistItem {
  id: string;
  control_code: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  notes: string;
}

export interface AuditChecklistResponse {
  items: AuditChecklistItem[];
  completion_percentage: number;
  updated_at: string | null;
}

export interface AuditChecklistUpsertRequest {
  items: AuditChecklistItem[];
}

export interface AssessmentProgressResponse {
  payload: Record<string, unknown>;
  updated_at: string | null;
}

export interface AssessmentProgressRequest {
  payload: Record<string, unknown>;
}

export interface FileValidationResult {
  file_name: string;
  compliance_score: number;
  compliance_status: 'compliant' | 'non_compliant' | 'needs_review';
  findings: AuditFinding[];
  summary: string;
}

export async function validateAudit(data: AuditEvidenceRequest): Promise<AuditValidationResponse> {
  try {
    const response = await axios.post<AuditValidationResponse>('/audit/validate', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getAuditHistory(skip: number = 0, limit: number = 10) {
  try {
    const response = await axios.get('/audit/history', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getAuditChecklist(): Promise<AuditChecklistResponse> {
  const response = await axios.get<AuditChecklistResponse>('/audit/checklist');
  return response.data;
}

export async function saveAuditChecklist(payload: AuditChecklistUpsertRequest): Promise<AuditChecklistResponse> {
  const response = await axios.put<AuditChecklistResponse>('/audit/checklist', payload);
  return response.data;
}

export async function getAssessmentProgress(): Promise<AssessmentProgressResponse> {
  const response = await axios.get<AssessmentProgressResponse>('/audit/assessment');
  return response.data;
}

export async function saveAssessmentProgress(payload: AssessmentProgressRequest): Promise<AssessmentProgressResponse> {
  const response = await axios.put<AssessmentProgressResponse>('/audit/assessment', payload);
  return response.data;
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post<FileValidationResult>('/audit/validate-file', formData);
  return response.data;
}

export { enqueueExternalValidation, subscribeExternalValidationJob } from './externalValidation';
