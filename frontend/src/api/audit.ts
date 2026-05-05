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
