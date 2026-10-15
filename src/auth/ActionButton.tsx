import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button, type ButtonProps } from '../components/ui'
import { useAuth } from './AuthProvider'
import { AUTHORITY_LABEL, MODULES, type Authority } from '../data/accounts'
import { cx } from '../lib/format'

interface ActionButtonProps extends ButtonProps {
  /** Path modul tempat tindakan ini berada. */
  module: string
  /** Kewenangan minimal yang dibutuhkan untuk mengaktifkan tombol. */
  need: Authority
  children: ReactNode
  /** Tampilkan tombol sekalipun tidak berwenang (nonaktif + penjelasan). */
  showWhenDenied?: boolean
}

/**
 * Tombol aksi terkontrol RBAC tiga dimensi. Bila kewenangan peran pada modul
 * lebih rendah dari `need`, tombol disembunyikan (default) atau ditampilkan
 * nonaktif beserta alasan penolakan.
 */
export function ActionButton({
  module,
  need,
  children,
  showWhenDenied = false,
  className,
  variant = 'secondary',
  icon,
  ...rest
}: ActionButtonProps) {
  const { role, canDo } = useAuth()
  const allowed = canDo(module, need)

  if (!allowed && !showWhenDenied) return null

  const modLabel = MODULES.find((m) => m.path === module)?.label ?? module

  return (
    <Button
      {...rest}
      variant={allowed ? variant : 'ghost'}
      icon={allowed ? icon : <Lock className="h-3.5 w-3.5" />}
      disabled={!allowed || rest.disabled}
      title={allowed ? rest.title : `Peran ${role ?? 'Anda'} hanya berwenang "${AUTHORITY_LABEL[canDo(module, 'none') ? 'none' : 'view']}" pada modul ${modLabel}. Diperlukan: ${AUTHORITY_LABEL[need]}.`}
      className={cx(!allowed && 'cursor-not-allowed opacity-50', className)}
      aria-disabled={!allowed}
    >
      {children}
    </Button>
  )
}

/** Hook ringkas untuk pengecekan kewenangan di dalam komponen halaman. */
export function useAuthority(module: string): Authority {
  return useAuth().authority(module)
}
