export interface User {
  id: string
  email: string
  full_name: string
  phone_number: string | null
  language: 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it'
  is_active: boolean
  organization_id: string
  two_factor_enabled: boolean
  last_login_at: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginResponse {
  tokens: TokenResponse
  user: User
}

export interface PolicyOut {
  id: string
  title: string
  summary: string | null
  content: string
  status: 'draft' | 'published' | 'archived'
  document_version: string
  mandatory: boolean
  published_at: string | null
  acknowledged?: boolean
}

export interface PolicyAcknowledgmentResponse {
  id: string
  policy_id: string
  user_id: string
  acknowledged_at: string
  ip_address: string | null
  document_version: string
  content_hash: string
}

export interface TwoFactorChallengeResponse {
  requires_two_factor: true
  challenge_token: string
  user: User
}

export type AuthLoginResponse = LoginResponse | TwoFactorChallengeResponse

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  organization_name: string
  organization_slug: string
}

export interface TwoFactorEnableResponse {
  setup_token: string
  qr_code_base64: string
  issuer: string
  account_name: string
}

export interface TwoFactorVerifyRequest {
  code?: string
  challenge_token?: string
  setup_token?: string
  backup_code?: string
  delivery_method?: 'sms' | 'email'
}

export interface TwoFactorVerifyResponse {
  verified: true
  tokens?: TokenResponse | null
  user?: User | null
}

export interface TwoFactorBackupCodesResponse {
  backup_codes: string[]
}

export interface TwoFactorDisableRequest {
  password: string
}

export interface TwoFactorDeliveryRequest {
  challenge_token: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  is_system_role: boolean
  organization_id: string
  created_at: string
}

export interface Asset {
  id: string
  name: string
  description: string | null
  asset_type: string
  owner_id: string | null
  location: string | null
  status: string
  confidentiality: number
  integrity: number
  availability: number
  criticality_score: number
  criticality_level: string
  clause_ref: string | null
  created_at: string
  updated_at: string
}

export interface AssetSummary {
  total: number
  by_type: Record<string, number>
  by_level: Record<string, number>
  critical_assets: Asset[]
}

export interface Threat {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: string
  likelihood: number
  created_at: string
  updated_at: string
}

export interface Vulnerability {
  id: string
  organization_id: string
  name: string
  description: string | null
  asset_id: string
  threat_id: string | null
  severity: string
  likelihood: number
  impact: number
  remediation_plan: string | null
  created_at: string
  updated_at: string
}

export interface Risk {
  id: string
  organization_id: string
  asset_id: string
  name: string
  description: string | null
  probability: number
  impact: number
  inherent_risk: number
  residual_risk: number
  created_at: string
  updated_at: string
}

export interface DashboardTrendItem {
  month: string
  documentation_percentage: number
  implementation_percentage: number
  tested_percentage: number
  overall_percentage: number
  health_score: number
}

export interface DashboardActivityItem {
  id: string
  title: string
  category: string
  time: string
}

export interface DashboardUpcomingTaskItem {
  id: string
  title: string
  category: string
  priority: 'high' | 'medium' | 'low'
  due: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'
  due_date: string | null
}

export interface DashboardMetricsResponse {
  documentation_percentage: number
  implementation_percentage: number
  tested_percentage: number
  overall_percentage: number
  health_score: number
  health_status: string
  total_assets: number
  total_users: number
  active_users: number
  trend: DashboardTrendItem[]
}