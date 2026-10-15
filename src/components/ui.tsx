import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
  Info,
  Search,
  X,
} from 'lucide-react'
import { cx, toCSV } from '../lib/format'

/* ============================== Button ============================== */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: ReactNode
  loading?: boolean
}

export function Button({ variant = 'secondary', size = 'md', icon, loading, children, className, ...rest }: ButtonProps) {
  const variantClass: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'btn-outline',
  }
  return (
    <button className={cx('btn', variantClass[variant], size === 'sm' && 'btn-sm', className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      {children}
    </button>
  )
}

/* =============================== Card =============================== */

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
}

export function Card({ children, className, padded = false }: CardProps) {
  return <section className={cx('panel', padded && 'p-5', className)}>{children}</section>
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
}) {
  return (
    <header className="panel-header">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">{icon}</div>}
        <div className="min-w-0">
          <h3 className="panel-title truncate">{title}</h3>
          {subtitle && <p className="panel-sub truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

/* =============================== Badge ============================== */

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'amber' | 'emerald' | 'sky' | 'rose'

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: BadgeTone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', tone === 'success' || tone === 'emerald' ? 'bg-emerald-400' : tone === 'danger' ? 'bg-rose-400' : tone === 'warning' || tone === 'amber' ? 'bg-amber-400' : tone === 'info' || tone === 'sky' ? 'bg-sky-400' : tone === 'violet' ? 'bg-violet-400' : 'bg-zinc-400')} />}
      {children}
    </span>
  )
}

const TONE_MAP: Record<string, BadgeTone> = {
  // generik
  active: 'success', operating: 'success', approved: 'success', paid: 'success', completed: 'success', compliant: 'success', closed: 'neutral', 'in progress': 'info', loading: 'info', shipped: 'info', 'filling': 'info', scheduled: 'info', verified: 'info', posted: 'success', received: 'success',
  draft: 'neutral', standby: 'warning', stable: 'neutral', idle: 'neutral', 'pending approval': 'warning', pending: 'warning', 'on hold': 'warning', overdue: 'danger', breakdown: 'danger', exceeded: 'danger', rejected: 'danger', cancelled: 'danger', 'care & maintenance': 'warning', watchlist: 'warning', investigation: 'warning', suspended: 'danger', inactive: 'neutral', expired: 'danger', expiring: 'warning', 'ramp-up': 'warning', blacklisted: 'danger', warning: 'warning', 'out of stock': 'danger',
  // tipe insiden
  lti: 'danger', fatality: 'danger', mtc: 'warning', fac: 'warning', 'near miss': 'info', environmental: 'warning', 'property damage': 'neutral',
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const tone = TONE_MAP[value.toLowerCase()] ?? 'neutral'
  return (
    <Badge tone={tone} dot className={className}>
      {value}
    </Badge>
  )
}

/* =============================== Forms ============================== */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="label">
        {label}
        {required && <span className="ml-0.5 text-amber-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-rose-400">{error}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return <input className={cx('input', className)} {...rest} />
}

export function Select({ options, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Array<{ value: string; label: string }> | string[] }) {
  const opts = (options as Array<string | { value: string; label: string }>).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <select className={cx('input', className)} {...rest}>
      {opts.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-900">
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return <textarea className={cx('input', className)} {...rest} />
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5"
      aria-pressed={checked}
    >
      <span className={cx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-amber-500' : 'bg-zinc-700')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
      {label && <span className="text-sm text-zinc-300">{label}</span>}
    </button>
  )
}

/* =============================== Modal ============================== */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cx('relative my-8 w-full animate-scale-in rounded-xl border border-zinc-800 bg-zinc-900 shadow-panel', widths[size])}>
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost -mr-2 -mt-1 h-8 w-8 !p-0" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

/* ============================== Progress ============================ */

export function Progress({ value, tone = 'amber', label, className }: { value: number; tone?: 'amber' | 'emerald' | 'rose' | 'sky' | 'violet'; label?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const bg = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
  }[tone]
  return (
    <div className={className}>
      {label && <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500"><span>{label}</span><span className="font-mono text-zinc-400">{v.toFixed(0)}%</span></div>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={cx('h-full rounded-full transition-all duration-500', bg)} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

/* =============================== Tabs =============================== */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>
  active: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div className={cx('flex gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 scrollbar-thin', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            active === t.id ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
          )}
        >
          {t.label}
          {t.count != null && (
            <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-semibold', active === t.id ? 'bg-zinc-950/20' : 'bg-zinc-800 text-zinc-400')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ============================ Empty state =========================== */

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-800/60 text-zinc-500">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* ============================== DataTable =========================== */

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sort?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  searchable?: boolean
  searchPlaceholder?: string
  search?: (row: T) => string
  pageSize?: number
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
  emptyLabel?: string
  exportName?: string
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  toolbar?: ReactNode
  maxHeight?: string
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Cari...',
  search,
  pageSize = 12,
  onRowClick,
  actions,
  emptyLabel = 'Tidak ada data yang sesuai',
  exportName,
  initialSort,
  toolbar,
  maxHeight,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSort?.dir ?? 'asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let rows = data
    if (query.trim() && search) {
      const q = query.toLowerCase()
      rows = rows.filter((r) => search(r).toLowerCase().includes(q))
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sort) {
        rows = [...rows].sort((a, b) => {
          const va = col.sort!(a)
          const vb = col.sort!(b)
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }
    return rows
  }, [data, query, search, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleExport = () => {
    const records = filtered.map((r) => {
      const out: Record<string, unknown> = {}
      columns.forEach((c) => {
        const v = (r as Record<string, unknown>)[c.key]
        out[c.header] = v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : v
      })
      return out
    })
    toCSV(records, `${exportName ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="flex flex-col">
      {(searchable || toolbar || exportName) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
          {searchable && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                className="input input-sm !pl-9"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {toolbar}
            {exportName && (
              <Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>
                CSV
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={cx('overflow-auto scrollbar-thin', maxHeight && `max-h-[${maxHeight}]`)}>
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align ?? 'left' }}
                  className={cx(c.sort && 'cursor-pointer select-none hover:text-zinc-300')}
                  onClick={() => c.sort && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sort && (sortKey === c.key ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 opacity-0" />)}
                  </span>
                </th>
              ))}
              {actions && <th style={{ textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState title={emptyLabel} hint="Coba ubah kata kunci pencarian atau filter yang aktif." />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className={cx(onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(row)}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? 'left' }} className={cx(c.align === 'right' && 'tbl-num')}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-4 border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
          <span>
            Menampilkan <span className="font-mono text-zinc-300">{safePage * pageSize + 1}</span>–
            <span className="font-mono text-zinc-300">{Math.min(filtered.length, (safePage + 1) * pageSize)}</span> dari{' '}
            <span className="font-mono text-zinc-300">{filtered.length}</span> baris
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="!px-2" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-mono">
              {safePage + 1} / {totalPages}
            </span>
            <Button size="sm" variant="ghost" className="!px-2" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================= Stat Card ============================ */

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  tone = 'amber',
  hint,
  onClick,
}: {
  label: string
  value: string
  unit?: string
  delta?: number
  deltaLabel?: string
  icon?: ReactNode
  tone?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet' | 'zinc'
  hint?: string
  onClick?: () => void
}) {
  const tones = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    zinc: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/40',
  }
  const up = (delta ?? 0) >= 0
  return (
    <div
      className={cx('panel group relative overflow-hidden p-4 transition-colors', onClick && 'cursor-pointer hover:border-zinc-700')}
      onClick={onClick}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="kpi-value">{value}</span>
            {unit && <span className="text-xs font-medium text-zinc-500">{unit}</span>}
          </p>
        </div>
        {icon && <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg border', tones[tone])}>{icon}</div>}
      </div>
      {(delta != null || hint) && (
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          {delta != null && (
            <span className={cx('inline-flex items-center gap-1 font-semibold', up ? 'stat-delta-up' : 'stat-delta-down')}>
              {up ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <span className="truncate text-zinc-500">{deltaLabel ?? hint}</span>
        </div>
      )}
    </div>
  )
}

/* ============================== Toasts ============================== */

export function ToastStack({ toasts, onDismiss }: { toasts: Array<{ id: string; message: string; variant: 'success' | 'error' | 'info' | 'warning' }>; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    error: <AlertTriangle className="h-4 w-4 text-rose-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    info: <Info className="h-4 w-4 text-sky-400" />,
  }
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/95 px-4 py-3 shadow-panel backdrop-blur"
        >
          <span className="mt-0.5 shrink-0">{icons[t.variant]}</span>
          <p className="flex-1 text-sm text-zinc-200">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 text-zinc-600 hover:text-zinc-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* =========================== Section title ========================== */

export function SectionTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
