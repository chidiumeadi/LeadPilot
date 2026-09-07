import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import * as authService from '../services/authService'
import type { AuthUser } from '../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  register: (payload: authService.RegisterPayload) => Promise<void>
  login: (payload: authService.LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    // Checked once on startup only — not on every navigation — to avoid
    // hammering /api/auth/me.
    authService
      .fetchCurrentUser()
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const register = useCallback(async (payload: authService.RegisterPayload) => {
    const registeredUser = await authService.registerRequest(payload)
    setUser(registeredUser)
    setStatus('authenticated')
  }, [])

  const login = useCallback(async (payload: authService.LoginPayload) => {
    const loggedInUser = await authService.loginRequest(payload)
    setUser(loggedInUser)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logoutRequest()
    } catch {
      // A network failure here shouldn't strand the user on an
      // authenticated-looking screen — clear local session state anyway.
    } finally {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, register, login, logout }),
    [user, status, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
