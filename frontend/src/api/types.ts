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