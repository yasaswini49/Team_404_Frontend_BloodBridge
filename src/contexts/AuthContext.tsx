import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthState, UserRole } from '@/types'
import { loadAuth, saveAuth, clearAuth } from '@/lib/auth'
import { apiCall } from '@/lib/api'

interface AuthContextValue {
  auth: AuthState | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  token: string | null
  role: UserRole | null
}

interface RegisterData {
  full_name: string
  email: string
  phone: string
  password: string
  role: UserRole
  latitude?: number
  longitude?: number
}

interface LoginResponse {
  access_token: string
  token_type: string
  user: { full_name: string; email: string; role: UserRole }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => loadAuth())

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiCall<LoginResponse>('/auth/login', 'POST', { email, password })
    const state: AuthState = {
      access_token: res.access_token,
      token_type: res.token_type,
      role: res.user.role,
      full_name: res.user.full_name,
      email: res.user.email,
    }
    saveAuth(state)
    setAuth(state)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    await apiCall('/auth/register', 'POST', data)
    await login(data.email, data.password)
  }, [login])

  const logout = useCallback(() => {
    clearAuth()
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        register,
        logout,
        token: auth?.access_token ?? null,
        role: auth?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
