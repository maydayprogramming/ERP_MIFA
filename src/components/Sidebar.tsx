import { NavLink } from 'react-router-dom'
import {
  Anchor,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Fuel,
  Gauge,
  Hammer,
  LayoutDashboard,
  ListChecks,
  Mountain,
  Pickaxe,
  Scale,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { cx } from '../lib/format'

export interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Utama',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tugas-saya', label: 'Tugas Saya', icon: ListChecks },
      { to: '/laporan', label: 'Laporan & Audit Trail', icon: BarChart3 },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/perencanaan', label: 'Perencanaan Produksi', icon: ClipboardList },
      { to: '/monitoring-produksi', label: 'Monitoring Produksi', icon: Mountain },
      { to: '/dispatch', label: 'Dispatch & Alokasi Armada', icon: Anchor },
      { to: '/master-unit', label: 'Master Unit & Alat', icon: Truck },
      { to: '/downtime', label: 'Downtime & Performa Alat', icon: Gauge },
    ],
  },
  {
    label: 'Pemeliharaan',
    items: [
      { to: '/maintenance', label: 'Maintenance & Work Order', icon: Wrench },
      { to: '/bbm', label: 'Manajemen BBM', icon: Fuel },
      { to: '/gudang', label: 'Inventory & Gudang', icon: Boxes },
    ],
  },
  {
    label: 'Komersial',
    items: [
      { to: '/proyek-kontrak', label: 'Proyek & Kontrak', icon: BadgeCheck },
      { to: '/pengadaan', label: 'Procurement & Pembelian', icon: Hammer },
      { to: '/biaya', label: 'Cost Control', icon: Wallet },
      { to: '/rekonsiliasi', label: 'Rekonsiliasi & Billing', icon: Scale },
    ],
  },
  {
    label: 'SDM & K3LH',
    items: [
      { to: '/personel', label: 'Personel, Shift & Kompetensi', icon: Users },
      { to: '/hse', label: 'HSE & Tindakan Korektif', icon: ShieldCheck },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/pengaturan', label: 'Pengaturan Sistem', icon: Settings },
    ],
  },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useERP()
  const { user, can } = useAuth()

  const openWO = state.maintenance.filter((w) => w.status !== 'Completed').length
  const openIncidents = state.incidents.filter((i) => i.status !== 'Closed').length
  const criticalStock = state.warehouseItems.filter((w) => w.stock <= w.minStock).length

  const badgeFor = (to: string): number | undefined => {
    if (to === '/maintenance') return openWO || undefined
    if (to === '/hse') return openIncidents || undefined
    if (to === '/gudang') return criticalStock || undefined
    if (to === '/pengadaan') return state.purchaseOrders.filter((p) => p.status === 'Pending Approval').length || undefined
    return undefined
  }

  return (
    <div className="flex h-full flex-col bg-surface-0">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
          <Pickaxe className="h-5 w-5 text-zinc-950" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-ink-strong">
            MIFA <span className="text-amber-400">Kontraktor</span>
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faintest">Mining Contractor ERP</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => can(item.to))
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) => cx('nav-link', isActive && 'nav-link-active')}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-400" />}
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeFor(item.to) && (
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">{badgeFor(item.to)}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-line p-3">
        <div className="rounded-lg border border-line bg-surface-1/60 p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[11px] font-bold text-white">
              {user?.avatar ?? '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{user?.name ?? 'Belum masuk'}</p>
              <p className="truncate text-[10px] text-ink-faint">{user?.role ?? '-'}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
            <span className="truncate text-[10px] text-ink-faintest" title={user?.site}>
              {user?.site ?? 'Semua Site'}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-line bg-surface-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-surface-0 animate-slide-in-right">
            <SidebarContent onNavigate={onClose} />
            <button
              onClick={onClose}
              className="absolute right-3 top-4 text-ink-faintest hover:text-ink"
              aria-label="Tutup menu"
            >
              ✕
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
