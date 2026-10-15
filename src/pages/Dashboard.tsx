import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Fuel,
  Gauge,
  HardHat,
  ListChecks,
  Mountain,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { TODAY } from '../lib/metrics'
import { cx, dmy, idrFull, num, num1, pct0, pct1, sum } from '../lib/format'
import { Badge, Card, CardHeader, EmptyState, Progress, StatCard } from '../components/ui'
import { BarsChart, DonutChart, TrendChart } from '../components/charts'
import { AUTHORITY_LABEL, MODULES, ROLE_META } from '../data/accounts'
import type { Role } from '../data/accounts'

const TONE = {
  amber: 'amber',
  emerald: 'emerald',
  sky: 'sky',
  rose: 'rose',
  violet: 'violet',
} as const

interface KpiProps {
  label: string
  value: string
  unit?: string
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  tone?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet' | 'zinc'
  hint?: string
  to?: string
}

function Kpi({ to, ...rest }: KpiProps) {
  const card = <StatCard {...rest} />
  return to ? (
    <Link to={to} className="block transition-transform hover:-translate-y-0.5">
      {card}
    </Link>
  ) : (
    card
  )
}

/* ========================================================================== */
export default function Dashboard() {
  const { state, actions } = useERP()
  const { user, role, authority, can, canSeeCost } = useAuth()
  const m = useMetrics()

  const scope = useMemo(() => {
    // Dimensi 2 — data scope: proyek mana yang boleh dilihat pengguna.
    const scoped = role === 'System Admin' || role === 'Operation Manager' || role === 'Direktur' || role === 'Commercial Manager' || role === 'Finance Manager'
    return { scoped }
  }, [role])

  const visibleContracts = useMemo(() => {
    if (scope.scoped) return state.projectContracts
    return state.projectContracts.filter((c) => c.siteId === user?.site)
  }, [state.projectContracts, scope.scoped, user?.site])

  const myTasks = state.tasks.filter((t) => t.ownerRole === role && t.status !== 'Done')
  const pendingActions = myTasks.filter((t) => t.priority === 'Kritis' || t.priority === 'Tinggi').length

  const hour = 8
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'

  return (
    <div className="space-y-6">
      {/* ---------------------------- Header ---------------------------- */}
      <div className="panel relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">{dmy(TODAY)}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-strong">
              {greeting}, {user?.name?.split(' ')[0] ?? 'Pengguna'}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-faint">
              {ROLE_META[role as Role]?.desc ?? 'Ringkasan operasional kontraktor tambang.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="amber">{role}</Badge>
              <Badge tone="zinc">Level {user?.level}</Badge>
              <Badge tone="sky">{user?.department}</Badge>
              <Badge tone="emerald" dot>
                {user?.site}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-lg border border-line bg-surface-2/50 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Cakupan data sesi ini</p>
              <p className="mt-0.5 text-xs font-medium text-ink">
                {scope.scoped ? `${visibleContracts.length} kontrak aktif` : `${visibleContracts.length} kontrak pada ${user?.site}`}
              </p>
            </div>
            <Link to="/tugas-saya" className="btn btn-primary btn-sm">
              <ListChecks className="h-4 w-4" /> Tugas Saya ({myTasks.length})
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------ Peringatan eskalasi ------------------------ */}
      {(m.overdueCA > 0 || m.fleetBreakdown > 0 || m.pendingApproval > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {m.overdueCA > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">{m.overdueCA} tindakan korektif terlambat</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">Modul HSE — perlu eskalasi ke Supervisor</p>
              </div>
            </div>
          )}
          {m.fleetBreakdown > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">{m.fleetBreakdown} unit breakdown</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">{m.openWO} work order masih terbuka</p>
              </div>
            </div>
          )}
          {m.pendingApproval > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sky-600 dark:text-sky-300">{m.pendingApproval} laporan menunggu persetujuan</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">Modul Monitoring Produksi</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------- KPI per peran --------------------------- */}
      <RoleKpis role={role as Role} />

      {/* ---------------------------- Isi per peran ---------------------------- */}
      {(role === 'Operator' || role === 'Foreman') && <LapanganDashboard />}
      {role === 'Supervisor' && <SupervisorDashboard />}
      {role === 'Planner' && <PlannerDashboard />}
      {(role === 'Superintendent' || role === 'Project Manager') && <ProjectDashboard />}
      {(role === 'Operation Manager' || role === 'Direktur') && <ExecutiveDashboard />}
      {(role === 'Commercial Manager' || role === 'Finance Manager') && <CommercialDashboard />}
      {role === 'System Admin' && <AdminDashboard />}

      {/* --------------------------- Tugas yang menunggu --------------------------- */}
      <Card>
        <CardHeader
          title="Keputusan & Tindakan yang Menunggu Anda"
          subtitle={`Diurutkan berdasarkan prioritas — peran ${role} berwenang "${AUTHORITY_LABEL[authority('/monitoring-produksi')]}" pada modul produksi`}
          actions={
            <Link to="/tugas-saya" className="btn btn-ghost btn-sm">
              Lihat semua <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {myTasks.length === 0 ? (
          <EmptyState title="Tidak ada tugas tertunda" hint="Semua item yang menjadi tanggung jawab peran Anda sudah ditangani." icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />} />
        ) : (
          <div className="divide-y divide-line">
            {myTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Badge tone={t.priority === 'Kritis' ? 'rose' : t.priority === 'Tinggi' ? 'amber' : 'zinc'} dot>
                  {t.priority}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                  <p className="truncate text-[11px] text-ink-faint">{t.detail}</p>
                </div>
                {t.dueDate && (
                  <span className={cx('text-[11px] font-medium', t.dueDate <= TODAY ? 'text-rose-400' : 'text-ink-faint')}>
                    {t.dueDate === TODAY ? 'Hari ini' : `Tenggat ${dmy(t.dueDate)}`}
                  </span>
                )}
                <Link to={t.module} className="btn btn-ghost btn-sm">
                  Buka
                </Link>
                <button onClick={() => actions.setTaskStatus(t.id, 'Done')} className="btn btn-ghost btn-sm !px-2" title="Tandai selesai">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* --------------------------- Ringkasan modul --------------------------- */}
      <Card>
        <CardHeader title="Cakupan Modul yang Dapat Diakses" subtitle="Hak akses ditentukan oleh matriks kewenangan tiga dimensi (peran, lingkup data, wewenang persetujuan)" />
        <div className="grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['/proyek-kontrak', 'Proyek & Kontrak'],
            ['/perencanaan', 'Perencanaan Produksi'],
            ['/monitoring-produksi', 'Monitoring Produksi'],
            ['/dispatch', 'Dispatch & Alokasi Armada'],
            ['/master-unit', 'Master Unit & Alat'],
            ['/downtime', 'Downtime & Performa Alat'],
            ['/maintenance', 'Maintenance & Work Order'],
            ['/bbm', 'Manajemen BBM'],
            ['/gudang', 'Inventory & Gudang'],
            ['/pengadaan', 'Procurement & Pembelian'],
            ['/personel', 'Personel & Shift'],
            ['/hse', 'HSE & Korektif'],
            ['/biaya', 'Cost Control'],
            ['/rekonsiliasi', 'Rekonsiliasi & Billing'],
            ['/laporan', 'Laporan & Audit'],
          ]
            .filter(([path]) => authority(path) !== 'none')
            .map(([path, label]) => {
              const a = authority(path)
              return (
                <Link key={path} to={path} className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3 py-2.5 hover:border-amber-500/40">
                  <span className="grid h-6 w-6 place-items-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-400">
                    {a === 'admin' ? 'A' : a === 'approve' ? 'S' : a === 'verify' ? 'V' : a === 'create' ? 'B' : a === 'export' ? 'E' : 'L'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{label}</span>
                  <span className="shrink-0 text-[10px] text-ink-faintest">{AUTHORITY_LABEL[a]}</span>
                </Link>
              )
            })}
        </div>
        <div className="border-t border-line px-4 pb-4">
          <p className="text-[11px] leading-relaxed text-ink-faint">
            {MODULES.filter((m) => authority(m.path) === 'none').length} modul lainnya tidak dapat diakses oleh peran {role}.
            Rincian kewenangan seluruh peran tersedia pada menu Pengaturan → Matriks Kewenangan.
          </p>
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   KPI ringkas sesuai peran
   ========================================================================== */
function RoleKpis({ role }: { role: Role }) {
  const m = useMetrics()
  const { state } = useERP()
  const { user, projects } = useAuth()

  const scoped = projects.length === state.projectContracts.length
  const logs = scoped ? state.productionLogs : state.productionLogs.filter((l) => l.inputBy === user?.name)
  const units = scoped ? state.equipment : state.equipment.filter((e) => e.siteId === user?.site)

  const common: Record<string, Array<{ label: string; value: string; unit?: string; icon: React.ReactNode; tone?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet' | 'zinc'; to?: string; hint?: string; delta?: number; deltaLabel?: string }>> = {
    Operator: [
      { label: 'Realisasi Saya Hari Ini', value: num(sum(logs.filter((l) => l.date === TODAY).map((l) => l.qty))), unit: 'BCM', icon: <Mountain className="h-4 w-4" />, tone: 'amber', to: '/monitoring-produksi', hint: 'Log yang saya input' },
      { label: 'Laporan Menunggu Verifikasi', value: num(logs.filter((l) => l.status === 'Submitted').length), icon: <Clock className="h-4 w-4" />, tone: 'sky', to: '/monitoring-produksi', hint: 'Dikirim ke foreman' },
      { label: 'Laporan Dikembalikan', value: num(logs.filter((l) => l.status === 'Returned').length), icon: <AlertTriangle className="h-4 w-4" />, tone: 'rose', to: '/monitoring-produksi', hint: 'Perlu koreksi' },
      { label: 'Unit Saya', value: num(state.unitAssignments.filter((u) => u.status === 'Active' && u.operatorId === user?.id).length), icon: <Truck className="h-4 w-4" />, tone: 'violet', to: '/dispatch', hint: 'Penugasan aktif' },
    ],
    Foreman: [
      { label: 'Menunggu Verifikasi Saya', value: num(m.logsThisMonth.filter((l) => l.status === 'Submitted').length), icon: <CheckCircle2 className="h-4 w-4" />, tone: 'amber', to: '/monitoring-produksi', hint: 'Laporan tim saya' },
      { label: 'Downtime Belum Diverifikasi', value: num(state.downtimeEvents.filter((d) => !d.verifiedBy).length), icon: <Gauge className="h-4 w-4" />, tone: 'rose', to: '/downtime', hint: 'Tanpa penyebab akhir' },
      { label: 'WO Tim Terbuka', value: num(state.maintenance.filter((w) => w.status !== 'Completed').length), icon: <Wrench className="h-4 w-4" />, tone: 'sky', to: '/maintenance', hint: 'Perlu tindak lanjut' },
      { label: 'Tindakan Korektif Terlambat', value: num(m.overdueCA), icon: <ShieldCheck className="h-4 w-4" />, tone: 'rose', to: '/hse', hint: 'Melewati tenggat' },
    ],
    Supervisor: [
      { label: 'Realisasi Bulan Ini', value: num(m.actualThisMonth), unit: 'BCM', icon: <Mountain className="h-4 w-4" />, tone: 'amber', to: '/monitoring-produksi', delta: m.volumeDelta, deltaLabel: 'vs bulan lalu' },
      { label: 'Menunggu Persetujuan', value: num(m.pendingApproval), icon: <Clock className="h-4 w-4" />, tone: 'sky', to: '/monitoring-produksi', hint: 'Sudah diverifikasi' },
      { label: 'Unit Breakdown', value: num(m.fleetBreakdown), icon: <Wrench className="h-4 w-4" />, tone: 'rose', to: '/master-unit', hint: `dari ${m.fleetTotal} unit` },
      { label: 'Jam Downtime Bulan Ini', value: num1(m.downtimeHours), unit: 'jam', icon: <Gauge className="h-4 w-4" />, tone: 'violet', to: '/downtime', hint: 'Semua kategori' },
    ],
    Planner: [
      { label: 'Capaian Target Bulan Ini', value: pct0(m.achievement), icon: <TrendingUp className="h-4 w-4" />, tone: m.achievement >= 95 ? 'emerald' : 'amber', to: '/perencanaan', hint: `${num(m.actualThisMonth)} dari ${num(m.targetThisMonth)}` },
      { label: 'Rencana Menunggu Tinjauan', value: num(state.productionTargets.filter((t) => t.status === 'Submitted').length), icon: <ClipboardList className="h-4 w-4" />, tone: 'sky', to: '/perencanaan', hint: 'Perlu approval Superintendent' },
      { label: 'Produktivitas Rata-rata', value: num1(sum(state.productionLogs.filter((l) => l.status === 'Approved' && l.operatingHours > 0).map((l) => l.qty / l.operatingHours)) / Math.max(1, state.productionLogs.filter((l) => l.operatingHours > 0).length)), unit: 'BCM/jam', icon: <Activity className="h-4 w-4" />, tone: 'violet', to: '/monitoring-produksi', hint: 'Log disetujui' },
      { label: 'Selisih Volume Rekonsiliasi', value: num(m.recVariance), unit: 'BCM', icon: <Scale className="h-4 w-4" />, tone: m.recVariance > 0 ? 'amber' : 'emerald', to: '/rekonsiliasi', hint: 'Internal vs disetujui owner' },
    ],
    Superintendent: [
      { label: 'Ketersediaan Armada', value: pct0(m.fleetAvailability), icon: <Truck className="h-4 w-4" />, tone: 'emerald', to: '/master-unit', hint: `${m.fleetOperating}/${m.fleetTotal} unit beroperasi` },
      { label: 'Jam Downtime Bulan Ini', value: num1(m.downtimeHours), unit: 'jam', icon: <Gauge className="h-4 w-4" />, tone: 'rose', to: '/downtime', hint: `${state.downtimeEvents.filter((d) => !d.verifiedBy).length} belum terverifikasi` },
      { label: 'WO Terbuka', value: num(m.openWO), icon: <Wrench className="h-4 w-4" />, tone: 'amber', to: '/maintenance', hint: `${m.overdueWO} terlambat` },
      { label: 'Rencana Menunggu Persetujuan', value: num(state.productionTargets.filter((t) => t.status === 'Submitted').length), icon: <ClipboardList className="h-4 w-4" />, tone: 'sky', to: '/perencanaan', hint: 'Modul Perencanaan' },
    ],
    'Project Manager': [
      { label: 'Proyek Aktif', value: num(state.projectContracts.filter((c) => c.status === 'Active').length), icon: <BadgeCheck className="h-4 w-4" />, tone: 'emerald', to: '/proyek-kontrak', hint: 'Kontrak berjalan' },
      { label: 'Capaian Volume', value: pct0(m.byProject[0]?.progressPct ?? 0), icon: <Mountain className="h-4 w-4" />, tone: 'amber', to: '/perencanaan', hint: 'Proyek utama' },
      { label: 'Biaya Aktual Bulan Ini', value: idrFull(m.costActual), icon: <Wallet className="h-4 w-4" />, tone: 'rose', to: '/biaya', hint: 'Actual saja' },
      { label: 'Nilai Siap Ditagih', value: idrFull(m.billableValue), icon: <Scale className="h-4 w-4" />, tone: 'sky', to: '/rekonsiliasi', hint: 'Paket penagihan' },
    ],
    'Operation Manager': [
      { label: 'Kontrak Berjalan', value: num(state.projectContracts.filter((c) => c.status === 'Active').length), icon: <BadgeCheck className="h-4 w-4" />, tone: 'emerald', to: '/proyek-kontrak', hint: 'Lintas site' },
      { label: 'Ketersediaan Armada', value: pct0(m.fleetAvailability), icon: <Truck className="h-4 w-4" />, tone: 'amber', to: '/master-unit', hint: 'Seluruh proyek' },
      { label: 'Jam Downtime', value: num1(m.downtimeHours), unit: 'jam', icon: <Gauge className="h-4 w-4" />, tone: 'rose', to: '/downtime', hint: 'Bulan ini' },
      { label: 'Realisasi Volume', value: num(m.actualThisMonth), unit: 'BCM', icon: <Mountain className="h-4 w-4" />, tone: 'sky', to: '/monitoring-produksi', delta: m.volumeDelta, deltaLabel: 'vs bulan lalu' },
    ],
    'Commercial Manager': [
      { label: 'Nilai Kontrak Aktif', value: idrFull(sum(state.projectContracts.filter((c) => c.status === 'Active').map((c) => c.targetVolume * c.rateIdr))), icon: <BadgeCheck className="h-4 w-4" />, tone: 'emerald', to: '/proyek-kontrak', hint: 'Target volume × tarif' },
      { label: 'Menunggu Persetujuan Owner', value: num(state.billingReconciliations.filter((b) => b.status === 'Awaiting Owner Approval').length), icon: <Clock className="h-4 w-4" />, tone: 'amber', to: '/rekonsiliasi', hint: 'Rekonsiliasi periode ini' },
      { label: 'Nilai Siap Ditagih', value: idrFull(m.billableValue), icon: <Scale className="h-4 w-4" />, tone: 'sky', to: '/rekonsiliasi', hint: 'Sudah disetujui owner' },
      { label: 'Sudah Dibayar', value: idrFull(m.paidValue), icon: <CheckCircle2 className="h-4 w-4" />, tone: 'violet', to: '/rekonsiliasi', hint: 'Realiasi kas' },
    ],
    'Finance Manager': [
      { label: 'Biaya Aktual', value: idrFull(m.costActual), icon: <Wallet className="h-4 w-4" />, tone: 'rose', to: '/biaya', hint: 'Bulan ini' },
      { label: 'Komitmen PO', value: idrFull(m.costCommitted), icon: <ClipboardList className="h-4 w-4" />, tone: 'amber', to: '/biaya', hint: 'Belum menjadi aktual' },
      { label: 'Nilai Ditagihkan', value: idrFull(m.billableValue), icon: <Scale className="h-4 w-4" />, tone: 'sky', to: '/rekonsiliasi', hint: 'Ready to bill + invoiced' },
      { label: 'Margin Indikatif', value: pct1(m.byProject.length ? sum(m.byProject.map((p) => p.margin)) / m.byProject.length : 0), icon: <TrendingUp className="h-4 w-4" />, tone: 'emerald', to: '/biaya', hint: 'Rata-rata proyek aktif' },
    ],
    Direktur: [
      { label: 'Proyek Berjalan', value: num(state.projectContracts.filter((c) => c.status === 'Active').length), icon: <BadgeCheck className="h-4 w-4" />, tone: 'emerald', to: '/proyek-kontrak', hint: 'Dari 6 kontrak terdaftar' },
      { label: 'Realisasi Volume', value: num(m.actualThisMonth), unit: 'BCM', icon: <Mountain className="h-4 w-4" />, tone: 'amber', to: '/monitoring-produksi', delta: m.volumeDelta, deltaLabel: 'vs bulan lalu' },
      { label: 'Biaya Aktual', value: idrFull(m.costActual), icon: <Wallet className="h-4 w-4" />, tone: 'rose', to: '/biaya', hint: 'Bulan berjalan' },
      { label: 'Nilai Belum Tertagih', value: idrFull(m.billableValue), icon: <Scale className="h-4 w-4" />, tone: 'sky', to: '/rekonsiliasi', hint: 'Piutang kontrak' },
    ],
    'System Admin': [
      { label: 'Akun Aktif', value: num(12), icon: <CheckCircle2 className="h-4 w-4" />, tone: 'emerald', to: '/pengaturan', hint: 'Termasuk 1 nonaktif' },
      { label: 'Peran Terdaftar', value: num(11), icon: <ShieldCheck className="h-4 w-4" />, tone: 'violet', to: '/pengaturan', hint: 'Level 1–10 + admin' },
      { label: 'Entri Audit Hari Ini', value: num(state.activity.filter((a) => a.time.slice(0, 10) === TODAY).length), icon: <Activity className="h-4 w-4" />, tone: 'sky', to: '/laporan', hint: 'Perubahan data penting' },
      { label: 'Notifikasi Terkirim', value: num(state.notifications.length), icon: <CalendarClock className="h-4 w-4" />, tone: 'amber', to: '/laporan', hint: 'Antrean eskalasi' },
    ],
  }

  const items = common[role] ?? common.Supervisor
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => (
        <Kpi key={k.label} {...k} />
      ))}
    </div>
  )
}

/* ==========================================================================
   Dasbor Lapangan (Operator & Foreman)
   ========================================================================== */
function LapanganDashboard() {
  const { state } = useERP()
  const { user } = useAuth()
  const myUnits = state.unitAssignments.filter((u) => u.status === 'Active')

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Penugasan Unit Aktif" subtitle="Modul Dispatch — penempatan unit & operator ke pit/area hari ini" actions={<Link to="/dispatch" className="btn btn-ghost btn-sm">Buka</Link>} />
        <div className="divide-y divide-line">
          {myUnits.slice(0, 6).map((u) => {
            const eq = state.equipment.find((e) => e.id === u.unitId)
            const emp = state.employees.find((e) => e.id === u.operatorId)
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Truck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {eq?.code} — {eq?.name}
                  </p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {u.pit} · {u.shift} · {emp?.name ?? 'Tanpa operator'}
                  </p>
                </div>
                <Badge tone={u.reason.includes('Dibatalkan') ? 'rose' : 'emerald'}>{u.status === 'Active' ? 'Berjalan' : u.status}</Badge>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Laporan Produksi Saya" subtitle="Alur: input → verifikasi foreman → persetujuan supervisor" />
        <div className="divide-y divide-line">
          {state.productionLogs
            .filter((l) => l.inputBy === user?.name || true)
            .slice(0, 6)
            .map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-[10px] font-bold text-ink-muted">{l.shift.replace('Shift ', 'S')}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {l.code} · {num(l.qty)} {l.unit}
                  </p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {l.pit} · {l.activity} · {l.method}
                  </p>
                </div>
                <Badge tone={l.status === 'Approved' ? 'emerald' : l.status === 'Verified' ? 'sky' : l.status === 'Submitted' ? 'amber' : l.status === 'Returned' ? 'rose' : 'zinc'}>{l.status}</Badge>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Supervisor
   ========================================================================== */
function SupervisorDashboard() {
  const m = useMetrics()
  const { state } = useERP()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Tren Produksi Terverifikasi" subtitle="Volume BCM dari laporan yang sudah disetujui" />
        <div className="p-4 pt-0">
          <TrendChart data={m.monthly as unknown as Array<Record<string, string | number>>} xKey="label" series={[{ key: 'bcm', name: 'OB Removal (BCM)' }, { key: 'ton', name: 'Coal Getting (Ton)', type: 'line' }]} height={240} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Downtime per Kategori" subtitle="Jam tidak produktif bulan ini — sumber verifikasi downtime lapangan" />
        <div className="p-4 pt-0">
          <DonutChart data={m.downtimeByCategory} height={240} />
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Antrean Persetujuan Departemen" subtitle="Laporan produksi yang sudah diverifikasi dan menunggu keputusan Anda" />
        <div className="divide-y divide-line">
          {state.productionLogs
            .filter((l) => l.status === 'Verified')
            .slice(0, 6)
            .map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Badge tone="sky">Verified</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {l.code} · {num(l.qty)} {l.unit}
                  </p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {l.pit} · {l.shift} · diverifikasi {l.verifiedBy ?? '-'}
                  </p>
                </div>
                <Link to="/monitoring-produksi" className="btn btn-primary btn-sm">
                  Tinjau
                </Link>
              </div>
            ))}
          {state.productionLogs.filter((l) => l.status === 'Verified').length === 0 && (
            <EmptyState title="Antrean kosong" hint="Tidak ada laporan menunggu persetujuan." icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />} />
          )}
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Planner / Engineer
   ========================================================================== */
function PlannerDashboard() {
  const m = useMetrics()
  const { state } = useERP()
  const perContract = state.projectContracts.map((c) => ({
    name: c.code.replace('KTR-2026-', ''),
    target: sum(state.productionTargets.filter((t) => t.contractId === c.id && t.period === m.currentMonth && t.status === 'Approved').map((t) => t.targetQty)),
    actual: sum(state.productionLogs.filter((l) => l.contractId === c.id && l.status === 'Approved' && l.date.slice(0, 7) === m.currentMonth).map((l) => l.qty)),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Target vs Realisasi per Kontrak" subtitle="Hanya laporan berstatus Approved yang dihitung" />
        <div className="p-4 pt-0">
          <BarsChart data={perContract as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'target', name: 'Target' }, { key: 'actual', name: 'Realisasi' }]} height={250} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Status Rencana Produksi" subtitle="Alur draft → diajukan → disetujui / direvisi" />
        <div className="divide-y divide-line">
          {state.productionTargets.slice(0, 7).map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <Badge tone={t.status === 'Approved' ? 'emerald' : t.status === 'Submitted' ? 'amber' : t.status === 'Revised' ? 'sky' : 'zinc'}>{t.status}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {t.code} · {num(t.targetQty)} {t.unit}
                </p>
                <p className="truncate text-[11px] text-ink-faint">
                  {t.pit} · {t.activity} · {t.shift} · v{t.version}
                </p>
              </div>
              <span className="text-[11px] text-ink-faintest">{t.planner}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Analisis Produktivitas per Unit" subtitle="Volume per jam operasi — dasar penyusunan rencana berikutnya" />
        <div className="p-4 pt-0">
          <BarsChart
            data={state.equipment.slice(0, 10).map((e) => ({
              name: e.code,
              jam: Number((e.hourMeter / 1000).toFixed(1)),
            })) as unknown as Array<Record<string, string | number>>}
            xKey="name"
            series={[{ key: 'jam', name: 'Jam meter (ribu jam)' }]}
            height={220}
          />
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Superintendent / Project Manager
   ========================================================================== */
function ProjectDashboard() {
  const m = useMetrics()
  const { state } = useERP()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Progres Volume per Proyek" subtitle="Realisasi kumulatif terhadap target kontrak" />
        <div className="space-y-3.5 p-4 pt-0">
          {m.byProject.map((p) => (
            <div key={p.contract.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink">{p.contract.name}</p>
                <span className="shrink-0 text-xs font-semibold text-ink-muted">{pct1(p.progressPct)}</span>
              </div>
              <Progress value={p.progressPct} tone={p.progressPct >= 60 ? 'emerald' : p.progressPct >= 30 ? 'amber' : 'rose'} />
              <p className="mt-1 text-[11px] text-ink-faint">
                {num(p.volumeToDate)} dari {num(p.contract.targetVolume)} {p.contract.paymentUnit} · berakhir {dmy(p.contract.endDate)}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Status Unit per Site" subtitle="Ketersediaan, downtime, dan posisi BBM" />
        <div className="p-4 pt-0">
          <BarsChart data={m.bySite.map((s) => ({ name: s.site.code, operasi: s.operating, total: s.units })) as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'operasi', name: 'Beroperasi' }, { key: 'total', name: 'Total unit', type: 'line' }]} height={250} />
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Work Order Prioritas" subtitle="WO dengan biaya tertinggi atau terlambat" actions={<Link to="/maintenance" className="btn btn-ghost btn-sm">Kelola WO</Link>} />
        <div className="divide-y divide-line">
          {[...state.maintenance]
            .sort((a, b) => b.costIdr - a.costIdr)
            .slice(0, 6)
            .map((w) => {
              const eq = state.equipment.find((e) => e.id === w.equipmentId)
              return (
                <div key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Badge tone={w.status === 'Overdue' ? 'rose' : w.status === 'Completed' ? 'emerald' : 'amber'}>{w.status}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {w.woNo} · {eq?.code ?? '-'}
                    </p>
                    <p className="truncate text-[11px] text-ink-faint">{w.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-ink-muted">{idrFull(w.costIdr)}</span>
                </div>
              )
            })}
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Eksekutif (Operation Manager & Direktur)
   ========================================================================== */
function ExecutiveDashboard() {
  const m = useMetrics()
  const { state } = useERP()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Realisasi vs Target Seluruh Proyek" subtitle="Agregat BCM per bulan dari laporan yang disetujui" />
        <div className="p-4 pt-0">
          <TrendChart data={m.monthly as unknown as Array<Record<string, string | number>>} xKey="label" series={[{ key: 'bcm', name: 'OB Removal (BCM)' }, { key: 'ton', name: 'Coal Getting (Ton)', type: 'line' }, { key: 'km', name: 'Jalan (Km)', type: 'line' }]} height={260} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Kesehatan Operasional" subtitle="Indikator utama hari ini" />
        <div className="space-y-4 p-4 pt-0">
          {[
            ['Ketersediaan armada', m.fleetAvailability, m.fleetAvailability >= 80 ? 'emerald' : 'amber'],
            ['Pemanfaatan armada', m.fleetUtilization, m.fleetUtilization >= 70 ? 'emerald' : 'amber'],
            ['Capaian target bulan ini', m.achievement, m.achievement >= 95 ? 'emerald' : 'amber'],
            ['Tingkat kepatuhan lingkungan', m.complianceRate, m.complianceRate >= 90 ? 'emerald' : 'rose'],
          ].map(([label, value, tone]) => (
            <div key={label as string}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-xs font-medium text-ink-muted">{label}</p>
                <span className="text-sm font-bold text-ink">{pct0(value as number)}</span>
              </div>
              <Progress value={value as number} tone={tone as 'emerald'} />
            </div>
          ))}
        </div>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Perbandingan Proyek" subtitle="Volume, biaya aktual, dan nilai yang sudah disetujui owner" />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Proyek</th>
                <th>Owner</th>
                <th className="text-right">Progres</th>
                <th className="text-right">Biaya Aktual</th>
                <th className="text-right">Komitmen</th>
                <th className="text-right">Pendapatan Disetujui</th>
                <th className="text-right">Margin Indikatif</th>
              </tr>
            </thead>
            <tbody>
              {m.byProject.map((p) => (
                <tr key={p.contract.id}>
                  <td className="font-medium text-ink">{p.contract.name}</td>
                  <td className="text-ink-muted">{p.contract.owner}</td>
                  <td className="tbl-num">{pct1(p.progressPct)}</td>
                  <td className="tbl-num">{idrFull(p.costActual)}</td>
                  <td className="tbl-num">{idrFull(p.costCommitted)}</td>
                  <td className="tbl-num">{idrFull(p.revenue)}</td>
                  <td className={cx('tbl-num font-semibold', p.margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{pct1(p.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Tren Biaya: Aktual vs Komitmen" subtitle="Actual dan Committed dipisahkan agar tidak menyesatkan" />
        <div className="p-4 pt-0">
          <BarsChart data={m.monthlyCost as unknown as Array<Record<string, string | number>>} xKey="label" series={[{ key: 'actual', name: 'Actual' }, { key: 'committed', name: 'Committed' }]} stacked height={240} />
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Komersial (Commercial Manager & Finance Manager)
   ========================================================================== */
function CommercialDashboard() {
  const m = useMetrics()
  const { state } = useERP()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Portofolio Kontrak" subtitle="Nilai kontrak, status, dan sisa masa berlaku" />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kontrak</th>
                <th>Satuan</th>
                <th className="text-right">Tarif</th>
                <th className="text-right">Nilai Kontrak</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.projectContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-ink">{c.code}</p>
                    <p className="text-[11px] text-ink-faint">{c.name}</p>
                  </td>
                  <td className="text-ink-muted">{c.paymentUnit}</td>
                  <td className="tbl-num">{idrFull(c.rateIdr)}</td>
                  <td className="tbl-num">{idrFull(c.targetVolume * c.rateIdr)}</td>
                  <td>
                    <Badge tone={c.status === 'Active' ? 'emerald' : c.status === 'Expiring' ? 'amber' : c.status === 'Review' ? 'sky' : 'zinc'}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title="Komposisi Biaya Bulan Ini" subtitle="Actual + Committed + Accrual menurut kategori" />
        <div className="p-4 pt-0">
          <DonutChart data={m.costByCategory} height={250} />
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Alur Rekonsiliasi & Penagihan" subtitle="Draft → menunggu persetujuan owner → siap tagih → invoiced → dibayar" actions={<Link to="/rekonsiliasi" className="btn btn-ghost btn-sm">Kelola</Link>} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Periode</th>
                <th className="text-right">Volume Internal</th>
                <th className="text-right">Disetujui Owner</th>
                <th className="text-right">Selisih</th>
                <th>Alasan Selisih</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.billingReconciliations.slice(0, 8).map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs text-ink">{b.code}</td>
                  <td className="text-ink-muted">{b.period}</td>
                  <td className="tbl-num">{num(b.internalVolume)}</td>
                  <td className="tbl-num">{b.approvedVolume > 0 ? num(b.approvedVolume) : '—'}</td>
                  <td className={cx('tbl-num', b.internalVolume - b.approvedVolume > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                    {b.approvedVolume > 0 ? num(b.internalVolume - b.approvedVolume) : '—'}
                  </td>
                  <td className="max-w-[260px] truncate text-[11px] text-ink-faint">{b.varianceReason}</td>
                  <td>
                    <Badge tone={b.status === 'Paid' ? 'emerald' : b.status === 'Invoiced' ? 'sky' : b.status === 'Ready to Bill' ? 'amber' : 'zinc'}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ==========================================================================
   Dasbor Administrator Teknis
   ========================================================================== */
function AdminDashboard() {
  const { state } = useERP()
  const { user } = useAuth()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Audit Trail Terbaru" subtitle="Riwayat perubahan data penting — hanya baca untuk admin" />
        <div className="max-h-[380px] divide-y divide-line overflow-y-auto scrollbar-thin">
          {state.activity.slice(0, 20).map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', a.type === 'approve' ? 'bg-emerald-400' : a.type === 'create' ? 'bg-sky-400' : a.type === 'delete' ? 'bg-rose-400' : 'bg-amber-400')} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{a.action}</p>
                <p className="truncate text-[11px] text-ink-faint">{a.detail}</p>
              </div>
              <span className="shrink-0 text-[10px] text-ink-faintest">{a.time.slice(11, 16)}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Status Integrasi & Konfigurasi" subtitle="Ambat notifikasi, ambang stok, dan ambang selisih BBM" />
        <div className="space-y-2.5 p-4 pt-0">
          {[
            ['GPS Fleet Tracking', 'Tersambung', 'emerald'],
            ['Weighbridge (Timbangan)', 'Tersambung', 'emerald'],
            ['Fuel Management System', 'Tersambung', 'emerald'],
            ['Sistem Keuangan', 'Belum dikonfigurasi', 'amber'],
            ['ERP Pemilik Tambang', 'Belum dikonfigurasi', 'zinc'],
          ].map(([name, status, tone]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
              <p className="text-sm text-ink">{name}</p>
              <Badge tone={tone as 'emerald'} dot>
                {status}
              </Badge>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-4">
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Peran Anda (<span className="font-semibold">{user?.role}</span>) memiliki akses teknis penuh, tetapi tidak memiliki kewenangan menyetujui
            pembelian, mengubah volume tagihan, atau menutup work order. Wejib dipertahankan sesuai pemisahan hak teknis dan kewenangan bisnis.
          </p>
        </div>
      </Card>
    </div>
  )
}

export { Fuel as FuelIcon, HardHat as HardHatIcon, TrendingDown as TrendingDownIcon }
