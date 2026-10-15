import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACCOUNTS, canAccess, canDo, type Action, type AuthUser, type Role } from '../data/accounts'

const STORAGE_KEY = 'mifa-erp-session-v1'

export interface Session {
  user: AuthUser
  loginAt: string
  remember: boolean
}

interface AuthContextValue {
  session: Session | null
  user: AuthUser | null
  role: Role | undefined
  /** status proses login */
  pending: boolean
  error: string | null
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>
  loginAs: (userId: string) => boolean
  logout: () => void
  clearError: () => void
  can: (path: string) => boolean
  canAction: (action: Action) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.user?.id) return null
    // Samakan dengan direktori akun terbaru (nama/role bisa berubah).
    const fresh = ACCOUNTS.find((a) => a.id === parsed.user.id)
    return fresh ? { ...parsed, user: fresh } : null
  } catch {
    return null
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage tidak tersedia — sesi hanya in-memory */
  }
}

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: AuthUser | null }) {
  const [session, setSession] = useState<Session | null>(() => (initialUser ? { user: initialUser, loginAt: new Date().toISOString(), remember: true } : readSession()))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    writeSession(session)
  }, [session])

  const login = useCallback(async (email: string, password: string, remember = true) => {
    setPending(true)
    setError(null)
    try {
      // Simulasi latensi jaringan backend.
      await new Promise((r) => setTimeout(r, 420))
      const found = ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
      if (!found) {
        setError('Email tidak terdaftar pada direktori akun perusahaan.')
        return false
      }
      if (found.password !== password) {
        setError('Kata sandi salah. Gunakan kata sandi demo yang tertera pada halaman.')
        return false
      }
      setSession({ user: found, loginAt: new Date().toISOString(), remember })
      return true
    } finally {
      setPending(false)
    }
  }, [])

  const loginAs = useCallback((userId: string) => {
    const found = ACCOUNTS.find((a) => a.id === userId)
    if (!found) {
      setError('Akun demo tidak ditemukan.')
      return false
    }
    setError(null)
    setSession({ user: found, loginAt: new Date().toISOString(), remember: true })
    return true
  }, [])

  const logout = useCallback(() => setSession(null), [])
  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.user.role,
      pending,
      error,
      login,
      loginAs,
      logout,
      clearError,
      can: (path: string) => canAccess(session?.user.role, path),
      canAction: (action: Action) => canDo(session?.user.role, action),
    }),
    [session, pending, error, login, loginAs, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam <AuthProvider>')
  return ctx
}

/** Akun demo untuk pengisian cepat pada halaman login. */
export const DEMO_ACCOUNTS = ACCOUNTS
