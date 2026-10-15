import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { canAccess } from '../data/accounts'
import Forbidden from '../pages/Forbidden'

/**
 * Penjaga route: memastikan pengguna sudah login DAN memiliki kewenangan
 * terhadap modul yang dituju. Belum login → /login; tanpa wewenang → 403.
 */
export function RequireAuth({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!canAccess(user.role, path)) {
    return <Forbidden />
  }

  return <>{children}</>
}

/** Route publik — dialihkan ke dashboard bila sudah login. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
