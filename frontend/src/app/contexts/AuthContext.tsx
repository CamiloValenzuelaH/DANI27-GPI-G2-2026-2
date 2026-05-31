import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { authApi } from '../../api/auth'
import { storage } from '../../api/client'
import type { User, LoginRequest, RegisterRequest } from '../../api/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al montar, verifica si hay token guardado y carga el usuario
  useEffect(() => {
    const token = storage.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => storage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data)
    storage.setTokens(res.tokens.access_token, res.tokens.refresh_token)
    setUser(res.user)
  }

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data)
    storage.setTokens(res.tokens.access_token, res.tokens.refresh_token)
    setUser(res.user)
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}