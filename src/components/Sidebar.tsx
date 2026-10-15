import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Mountain,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useERP } from '../store'
import { cx } from '../lib/format'

export interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Utama',
    items: [
      { to: '/dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
      { to: '/reports', label: 'Pusat Laporan', icon: BarChart3 },
    ],
  },
  {
    label: 'Operasional Tambang',
    items: [
      { to: '/production', label: 'Produksi & Pit', icon: Mountain },
      { to: '/fleet', label: 'Armada & Maintenance', icon: Truck },
      { to: '/inventory', label: 'Inventory & Logistik', icon: Boxes },
      { to: '/hse', label: 'K3LH & Lingkungan', icon: ShieldCheck },
    ],
  },
  {
    label: 'Komersial',
    items: [
      { to: '/sales', label: 'Penjualan & Kontrak', icon: ClipboardList },
      { to: '/purchasing', label: 'Pembelian & Vendor', icon: ShoppingCart },
    ],
  },
  {
    label: 'SDM & Keuangan',
    items: [
      { to: '/hr', label: 'SDM & Pengupahan', icon: Users },
      { to: '/finance', label: 'Keuangan & RKAB', icon: Wallet },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useERP()

  const openPOs = state.purchaseOrders.filter((p) => p.status === 'Pending Approval').length
  const openIncidents = state.incidents.filter((i) => i.status !== 'Closed').length
  const badgeFor = (to: string): number | undefined => {
    if (to === '/purchasing') return openPOs || undefined
    if (to === '/hse') return openIncidents || undefined
    return undefined
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800 px-5">
        <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
          <Mountain className="h-5 w-5 text-zinc-950" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-zinc-50">
            MIFA <span className="text-amber-400">ERP</span>
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">Coal Mining Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
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
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[11px] font-bold text-white">
              {state.currentUser.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">{state.currentUser.name}</p>
              <p className="truncate text-[10px] text-zinc-500">{state.currentUser.role}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2.5">
            <span className="text-[10px] text-zinc-600">v1.0.0 &middot; RKAB 2026</span>
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
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-[264px] border-r border-zinc-800 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button onClick={onClose} className="absolute right-3 top-4 text-zinc-600 hover:text-zinc-300 lg:hidden" aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  )
}
