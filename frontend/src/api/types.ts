export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  organization_id: string
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

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  organization_name: string
  organization_slug: string
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
  severity: string
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