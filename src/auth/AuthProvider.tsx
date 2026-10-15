import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ACCOUNTS,
  authorityOf,
  canAccess,
  hasAuthority,
  scopeDepartments,
  scopeProjects,
  type Action,
  type Authority,
  type AuthUser,
  type Role,
} from '../data/accounts'

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
  /** Dimensi 1 & 3 — boleh buka modul? */
  can: (path: string) => boolean
  /** Tingkat kewenangan pada modul tertentu. */
  authority: (path: string) => Authority
  /** Kewenangan minimal setingkat `min` pada modul? */
  canDo: (path: string, min: Authority) => boolean
  /** Dimensi 2 — proyek & departemen yang boleh diakses. */
  projects: string[]
  departments: string[]
  /** Boleh melihat data biaya/margin? */
  canSeeCost: boolean
  /** Admin teknis tanpa kewenangan bisnis. */
  technicalOnly: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.user?.id) return null
    // Samakan dengan direktori akun terbaru (nama/peran bisa berubah).
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
  const [session, setSession] = useState<Session | null>(() =>
    initialUser ? { user: initialUser, loginAt: new Date().toISOString(), remember: true } : readSession(),
  )
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
      if (found.status === 'Inactive') {
        setError('Akun ini telah dinonaktifkan. Hubungi administrator sistem.')
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
    if (found.status === 'Inactive') {
      setError('Akun demo tersebut berstatus nonaktif.')
      return false
    }
    setError(null)
    setSession({ user: found, loginAt: new Date().toISOString(), remember: true })
    return true
  }, [])

  const logout = useCallback(() => setSession(null), [])
  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(() => {
    const role = session?.user.role
    return {
      session,
      user: session?.user ?? null,
      role,
      pending,
      error,
      login,
      loginAs,
      logout,
      clearError,
      can: (path: string) => canAccess(role, path),
      authority: (path: string) => authorityOf(role, path),
      canDo: (path: string, min: Authority) => hasAuthority(role, path, min),
      projects: scopeProjects(role),
      departments: scopeDepartments(role),
      canSeeCost: canAccess(role, '/biaya') || canAccess(role, '/rekonsiliasi'),
      technicalOnly: role === 'System Admin',
    }
  }, [session, pending, error, login, loginAs, logout, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam <AuthProvider>')
  return ctx
}

/** Akun demo untuk pengisian cepat pada halaman login. */
export const DEMO_ACCOUNTS = ACCOUNTS

/** Re-export tipe aksi agar halaman dapat memakai tanpa import ganda. */
export type { Action, Authority, Role }
