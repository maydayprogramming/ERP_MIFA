import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronDown,
  CircleUser,
  Fuel,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Mountain,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  ShoppingCart,
  ClipboardList,
  Sun,
  Truck,
} from 'lucide-react'
import { useERP } from '../store'
import { cx } from '../lib/format'
import { TODAY } from '../store'
import { Button } from './ui'
import { useTheme } from '../theme/ThemeProvider'

const PAGE_META: Record<string, { title: string; section: string }> = {
  '/dashboard': { title: 'Dashboard Eksekutif', section: 'Utama' },
  '/production': { title: 'Produksi & Operasional Pit', section: 'Operasional Tambang' },
  '/fleet': { title: 'Armada & Pemeliharaan', section: 'Operasional Tambang' },
  '/inventory': { title: 'Inventory & Logistik', section: 'Operasional Tambang' },
  '/hse': { title: 'K3LH & Lingkungan', section: 'Operasional Tambang' },
  '/sales': { title: 'Penjualan & Kontrak', section: 'Komersial' },
  '/purchasing': { title: 'Pembelian & Vendor', section: 'Komersial' },
  '/hr': { title: 'SDM & Pengupahan', section: 'SDM & Keuangan' },
  '/finance': { title: 'Keuangan & RKAB', section: 'SDM & Keuangan' },
  '/reports': { title: 'Pusat Laporan', section: 'Utama' },
  '/settings': { title: 'Pengaturan Sistem', section: 'Sistem' },
}

interface SearchResult {
  id: string
  label: string
  sub: string
  to: string
  group: string
}

const QUICK_ACTIONS: Array<{ label: string; to: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'Lapor Produksi Harian', to: '/production', icon: Mountain },
  { label: 'Buat Sales Order', to: '/sales', icon: ClipboardList },
  { label: 'Ajukan Purchase Order', to: '/purchasing', icon: ShoppingCart },
  { label: 'Jadwalkan Maintenance', to: '/fleet', icon: Truck },
  { label: 'Lapor Insiden K3', to: '/hse', icon: ShieldAlert },
  { label: 'Input Stok Gudang', to: '/inventory', icon: Fuel },
]

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { state, actions } = useERP()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const quickRef = useRef<HTMLDivElement>(null)

  const meta = PAGE_META[location.pathname] ?? { title: 'Halaman', section: '-' }
  const unread = state.notifications.filter((n) => !n.read).length

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node
      if (searchRef.current && !searchRef.current.contains(t)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(t)) setUserOpen(false)
      if (quickRef.current && !quickRef.current.contains(t)) setQuickOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    const q = search.trim().toLowerCase()
    if (q.length < 2) return []
    const out: SearchResult[] = []
    state.sites.forEach((s) => out.push({ id: s.id, label: s.name, sub: `Site · ${s.region} · IUP ${s.iupNo}`, to: '/production', group: 'Site Tambang' }))
    state.customers.forEach((c) => out.push({ id: c.id, label: c.name, sub: `Pelanggan · ${c.sector}`, to: '/sales', group: 'Pelanggan' }))
    state.vendors.forEach((v) => out.push({ id: v.id, label: v.name, sub: `Vendor · ${v.category}`, to: '/purchasing', group: 'Vendor' }))
    state.equipment.forEach((e) => out.push({ id: e.id, label: `${e.code} — ${e.name}`, sub: `Armada · ${e.type}`, to: '/fleet', group: 'Armada' }))
    state.salesOrders.forEach((s) => out.push({ id: s.id, label: s.soNo, sub: `Sales Order · ${s.tonnageMt.toLocaleString('id-ID')} MT`, to: '/sales', group: 'Sales Order' }))
    state.purchaseOrders.forEach((p) => out.push({ id: p.id, label: p.poNo, sub: `Purchase Order · ${p.category}`, to: '/purchasing', group: 'Purchase Order' }))
    state.employees.forEach((e) => out.push({ id: e.id, label: e.name, sub: `Karyawan · ${e.position}`, to: '/hr', group: 'Karyawan' }))
    state.incidents.forEach((i) => out.push({ id: i.id, label: i.description.slice(0, 48), sub: `Insiden · ${i.type}`, to: '/hse', group: 'Insiden' }))
    return out.filter((r) => r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)).slice(0, 8)
  }, [search, state])

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    ;(acc[r.group] ??= []).push(r)
    return acc
  }, {})

  const today = new Date(TODAY).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-0/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button onClick={onMenuClick} className="btn btn-ghost !px-2 lg:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb / title */}
        <div className="hidden min-w-0 md:block">
          <div className="flex items-center gap-2 text-[11px] text-ink-faintest">
            <span>{meta.section}</span>
            <span className="text-ink-faintest">/</span>
            <span className="text-ink-muted">{meta.title}</span>
          </div>
          <p className="truncate text-sm font-semibold text-ink-strong">{meta.title}</p>
        </div>

        <div className="flex-1" />

        {/* Global search */}
        <div ref={searchRef} className="relative hidden w-full max-w-md sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faintest" />
          <input
            className="input !h-9 !pl-9 !pr-3"
            placeholder="Cari site, pelanggan, armada, SO, PO, karyawan…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
          />
          {searchOpen && search.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-11 max-h-96 overflow-y-auto rounded-lg border border-line bg-surface-1/95 shadow-panel backdrop-blur animate-fade-in scrollbar-thin">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-faint">Tidak ada hasil untuk “{search}”</p>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <p className="sticky top-0 bg-surface-1/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faintest backdrop-blur">{group}</p>
                    {items.map((r) => (
                      <button
                        key={r.id + r.group}
                        onClick={() => {
                          navigate(r.to)
                          setSearch('')
                          setSearchOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{r.label}</p>
                          <p className="truncate text-[11px] text-ink-faint">{r.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick action */}
        <div ref={quickRef} className="relative">
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setQuickOpen((v) => !v)} className="hidden sm:inline-flex">
            Aksi Cepat
            <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', quickOpen && 'rotate-180')} />
          </Button>
          <button onClick={() => setQuickOpen((v) => !v)} className="btn btn-primary !px-2 sm:hidden" aria-label="Aksi cepat">
            <Plus className="h-4 w-4" />
          </button>
          {quickOpen && (
            <div className="absolute right-0 top-11 w-60 overflow-hidden rounded-lg border border-line bg-surface-1/95 shadow-panel backdrop-blur animate-fade-in">
              <p className="border-b border-line px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-faintest">Buat baru</p>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    navigate(a.to)
                    setQuickOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-2/60 hover:text-ink-strong"
                >
                  <a.icon className="h-4 w-4 text-amber-400" />
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setNotifOpen((v) => !v)} className="btn btn-ghost relative !px-2" aria-label="Notifikasi">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-surface-1/95 shadow-panel backdrop-blur animate-fade-in">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink-strong">Notifikasi</p>
                <button onClick={() => actions.markAllNotificationsRead()} className="text-[11px] font-medium text-amber-400 hover:text-amber-300">
                  Tandai semua dibaca
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {state.notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => actions.markNotificationRead(n.id)}
                    className={cx('flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left hover:bg-surface-2/40', !n.read && 'bg-amber-500/[0.04]')}
                  >
                    <span
                      className={cx(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        n.type === 'alert' ? 'bg-rose-400' : n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-sky-400',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-faint">{n.body}</p>
                      <p className="mt-1 text-[10px] text-ink-faintest">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="btn btn-ghost !px-2 hidden sm:inline-flex" aria-label="Bantuan" title={`${today} · Bantuan`}>
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        {/* User */}
        <div ref={userRef} className="relative">
          <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-2/60">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[11px] font-bold text-zinc-950">
              {state.currentUser.avatar}
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-xs font-semibold text-ink">{state.currentUser.name}</span>
              <span className="block text-[10px] text-ink-faint">{state.currentUser.role}</span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-ink-faintest lg:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-lg border border-line bg-surface-1/95 shadow-panel backdrop-blur animate-fade-in">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink-strong">{state.currentUser.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{state.currentUser.email}</p>
              </div>
              <Link to="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2/60">
                <CircleUser className="h-4 w-4 text-ink-faint" /> Profil Saya
              </Link>
              <Link to="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2/60">
                <Settings2 className="h-4 w-4 text-ink-faint" /> Preferensi Sistem
              </Link>
              <button className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink-strong">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-ink-faint">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
