import type { AuthState, UserRole } from '@/types'

const AUTH_KEY = 'bb_auth'

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthState
  } catch {
    return null
  }
}

export function saveAuth(auth: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'donor':
      return '/dashboard'
    case 'patient':
      return '/dashboard'
    case 'hospital_coordinator':
      return '/appointments'
    default:
      return '/dashboard'
  }
}
