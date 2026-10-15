import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button, type ButtonProps } from '../components/ui'
import { useAuth } from './AuthProvider'
import { ACTION_LABEL, type Action } from '../data/accounts'
import { cx } from '../lib/format'

interface ActionButtonProps extends ButtonProps {
  action: Action
  children: ReactNode
  /** Tampilkan tombol sekalipun tidak berwenang (nonaktif + penjelasan). */
  showWhenDenied?: boolean
}

/**
 * Tombol aksi terkontrol RBAC. Bila peran pengguna tidak memiliki wewenang
 * `action`, tombol disembunyikan (default) atau ditampilkan nonaktif dengan
 * penjelasan alasan penolakan.
 */
export function ActionButton({
  action,
  children,
  showWhenDenied = false,
  className,
  variant = 'secondary',
  icon,
  loading,
  ...rest
}: ActionButtonProps) {
  const { canAction, role } = useAuth()
  const allowed = canAction(action)

  if (!allowed && !showWhenDenied) return null

  return (
    <Button
      {...rest}
      variant={allowed ? variant : 'ghost'}
      icon={allowed ? icon : <Lock className="h-3.5 w-3.5" />}
      disabled={!allowed || rest.disabled}
      title={allowed ? rest.title : `Peran ${role ?? 'Anda'} tidak berwenang: ${ACTION_LABEL[action]}`}
      className={cx(!allowed && 'cursor-not-allowed opacity-50', className)}
      aria-disabled={!allowed}
    >
      {children}
    </Button>
  )
}

/** Hook ringkas untuk pengecekan wewenang di dalam komponen halaman. */
export function useActionAllowed(action: Action): boolean {
  return useAuth().canAction(action)
}
