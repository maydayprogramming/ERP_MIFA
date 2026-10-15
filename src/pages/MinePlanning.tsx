import { useMemo, useState } from 'react'
import {
  Blend,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  Layers,
  Mountain,
  Pickaxe,
  Plus,
  Target,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  SectionTitle,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  type Column,
} from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics } from '../lib/metrics'
import { cx, mtShort, num, num1, num2, pct1, sum, toCSV } from '../lib/format'
import type { BlendingRecipe, MinePlan, Stockpile } from '../types'

type TabId = 'plans' | 'blending' | 'rkab'

const STATUS_TONE: Record<MinePlan['status'], 'neutral' | 'success' | 'warning' | 'info' | 'violet'> = {
  Draft: 'neutral',
  Approved: 'info',
  'In Progress': 'warning',
  Completed: 'success',
  Revised: 'violet',
}

const BLEND_TONE: Record<BlendingRecipe['status'], 'neutral' | 'success' | 'warning'> = {
  Draft: 'neutral',
  Active: 'success',
  Archived: 'warning',
}

const MONTHLY_PLAN_MT = 104_166 // RKAB tahunan 1.250.000 MT / 12 bulan

export default function MinePlanning() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('plans')
  const [siteFilter, setSiteFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [blendOpen, setBlendOpen] = useState(false)
  const [detail, setDetail] = useState<BlendingRecipe | null>(null)

  const sites = state.sites
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? '-'
  const siteCode = (id: string) => sites.find((s) => s.id === id)?.code ?? '-'
  const sp = (id: string): Stockpile | undefined => state.stockpiles.find((s) => s.id === id)
  const spName = (id: string) => sp(id)?.name ?? id

  /* ------------------------------- Ringkasan ------------------------------ */
  const plans = state.minePlans
  const totalPlanCoal = sum(plans.map((p) => p.planCoalMt))
  const totalActualCoal = sum(plans.map((p) => p.actualCoalMt))
  const totalPlanOb = sum(plans.map((p) => p.planObBcm))
  const totalActualOb = sum(plans.map((p) => p.actualObBcm))
  const achievement = totalPlanCoal > 0 ? (totalActualCoal / totalPlanCoal) * 100 : 0
  const activePits = new Set(
    plans.filter((p) => p.status === 'In Progress' || p.status === 'Approved').map((p) => p.siteId),
  ).size
  const avgSr = totalActualCoal > 0 ? totalActualOb / totalActualCoal : 0

  const filteredPlans = useMemo(
    () =>
      plans.filter(
        (p) => (siteFilter === 'all' || p.siteId === siteFilter) && (periodFilter === 'all' || p.period === periodFilter),
      ),
    [plans, siteFilter, periodFilter],
  )

  const periods = useMemo(() => Array.from(new Set(plans.map((p) => p.period))).sort().reverse(), [plans])

  /* -------------------------- Data grafik batubara ------------------------ */
  const coalSeries = useMemo(() => {
    const pts: Array<Record<string, string | number>> = m.monthly.map((mm) => {
      const plan = MONTHLY_PLAN_MT
      return { month: mm.label, realisasi: Math.round(mm.coal), rencana: plan }
    })
    // Tambahkan agregasi plan vs actual per periode rencana
    return pts
  }, [m.monthly])

  const sitePlanChart = useMemo(() => {
    const ids = Array.from(new Set(plans.map((p) => p.siteId)))
    return ids.map((id) => ({
      site: siteCode(id),
      name: siteName(id),
      rencana: Math.round(sum(plans.filter((p) => p.siteId === id).map((p) => p.planCoalMt)) / 1000),
      realisasi: Math.round(sum(plans.filter((p) => p.siteId === id).map((p) => p.actualCoalMt)) / 1000),
    }))
  }, [plans, sites])

  const srChart = useMemo(
    () =>
      m.monthly.map((mm) => ({
        month: mm.label,
        sr: Number(mm.sr.toFixed(2)),
      })),
    [m.monthly],
  )

  /* ------------------------------ Blending -------------------------------- */
  const blends = state.blendingRecipes
  const blendedVolume = sum(blends.filter((b) => b.status === 'Active').map((b) => b.volumeMt))
  const avgGcvTarget = blends.length ? sum(blends.map((b) => b.targetGcv)) / blends.length : 0

  const blendMixChart = useMemo(() => {
    const map = new Map<string, number>()
    blends.forEach((b) => b.components.forEach((c) => map.set(c.stockpileId, (map.get(c.stockpileId) ?? 0) + c.pct)))
    return Array.from(map.entries()).map(([id, v]) => ({ name: spName(id), value: v }))
  }, [blends, state.stockpiles])

  const stockpileQuality = useMemo(
    () =>
      state.stockpiles.map((s) => ({
        name: s.name,
        gcv: s.gcvAr,
        ash: s.ash,
        sulfur: Number(s.sulfur.toFixed(2)),
      })),
    [state.stockpiles],
  )

  /* ------------------------------- Kolom ---------------------------------- */
  const planColumns: Column<MinePlan>[] = [
    {
      key: 'code',
      header: 'Kode Rencana',
      sort: (r) => r.code,
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-amber-400">{r.code}</p>
          <p className="text-[11px] text-ink-faintest">{r.pit}</p>
        </div>
      ),
    },
    {
      key: 'site',
      header: 'Site',
      sort: (r) => siteName(r.siteId),
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{siteName(r.siteId)}</p>
          <p className="text-[11px] text-ink-faintest">{siteCode(r.siteId)}</p>
        </div>
      ),
    },
    { key: 'period', header: 'Periode', sort: (r) => r.period, render: (r) => <span className="font-mono text-xs text-ink-muted">{r.period}</span> },
    { key: 'bench', header: 'Bench / Tingkat', render: (r) => <span className="text-ink-muted">{r.bench}</span> },
    {
      key: 'plan',
      header: 'Rencana Batubara',
      align: 'right',
      sort: (r) => r.planCoalMt,
      render: (r) => <span className="font-mono text-xs text-ink">{num(r.planCoalMt)} MT</span>,
    },
    {
      key: 'actual',
      header: 'Realisasi',
      align: 'right',
      sort: (r) => r.actualCoalMt,
      render: (r) => (
        <div className="text-right">
          <p className="font-mono text-xs font-semibold text-ink">{num(r.actualCoalMt)} MT</p>
          <p className="text-[11px] text-ink-faintest">{pct1(r.planCoalMt ? (r.actualCoalMt / r.planCoalMt) * 100 : 0)}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progres',
      width: '150px',
      render: (r) => <Progress value={r.planCoalMt ? (r.actualCoalMt / r.planCoalMt) * 100 : 0} tone={r.planCoalMt && r.actualCoalMt >= r.planCoalMt ? 'emerald' : 'amber'} />,
    },
    {
      key: 'ob',
      header: 'Overburden',
      align: 'right',
      sort: (r) => r.planObBcm,
      render: (r) => (
        <div className="text-right">
          <p className="font-mono text-xs text-ink">{num1(r.actualObBcm)}</p>
          <p className="text-[11px] text-ink-faintest">dari {num1(r.planObBcm)} Bcm</p>
        </div>
      ),
    },
    { key: 'engineer', header: 'Perencana', render: (r) => <span className="text-ink-muted">{r.engineer}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === 'Draft' && (
            <Button size="sm" variant="outline" onClick={() => actions.setMinePlanStatus(r.id, 'Approved')}>
              Setujui
            </Button>
          )}
          {r.status === 'Approved' && (
            <Button size="sm" variant="outline" onClick={() => actions.setMinePlanStatus(r.id, 'In Progress')}>
              Mulai
            </Button>
          )}
          {r.status === 'In Progress' && (
            <Button size="sm" variant="success" onClick={() => actions.setMinePlanStatus(r.id, 'Completed')}>
              Selesaikan
            </Button>
          )}
        </div>
      ),
    },
  ]

  const blendColumns: Column<BlendingRecipe>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.code}</span> },
    {
      key: 'name',
      header: 'Nama Resep',
      sort: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-faintest">{siteName(r.siteId)}</p>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target Mutu',
      sort: (r) => r.targetGcv,
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="amber">GCV {num(r.targetGcv)}</Badge>
          <Badge tone="neutral">Ash {num1(r.targetAsh)}%</Badge>
          <Badge tone="neutral">S {num2(r.targetSulfur)}%</Badge>
        </div>
      ),
    },
    {
      key: 'components',
      header: 'Komposisi Campuran',
      render: (r) => (
        <div className="space-y-1">
          {r.components.map((c) => (
            <div key={c.stockpileId} className="flex items-center gap-2">
              <span className="w-28 truncate text-[11px] text-ink-muted">{spName(c.stockpileId)}</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="font-mono text-[11px] text-ink">{c.pct}%</span>
            </div>
          ))}
          <p className="text-[10px] text-ink-faintest">Total {sum(r.components.map((c) => c.pct))}%</p>
        </div>
      ),
    },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      sort: (r) => r.volumeMt,
      render: (r) => <span className="font-mono text-xs text-ink">{num(r.volumeMt)} MT</span>,
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setDetail(r)}>
            Detail
          </Button>
          {r.status === 'Draft' && (
            <Button size="sm" variant="success" onClick={() => actions.setBlendingStatus(r.id, 'Active')}>
              Aktifkan
            </Button>
          )}
          {r.status === 'Active' && (
            <Button size="sm" variant="outline" onClick={() => actions.setBlendingStatus(r.id, 'Archived')}>
              Arsipkan
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Perencanaan Tambang & Blending"
        subtitle="Perencanaan produksi batubara dan pengupasan (RKAB), pengelolaan pit & bench, serta formulasi blending batubara untuk memenuhi spesifikasi kontrak."
        actions={
          <>
            <Button
              variant="outline"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() =>
                toCSV(
                  plans.map((p) => ({
                    Kode: p.code,
                    Site: siteName(p.siteId),
                    Periode: p.period,
                    Pit: p.pit,
                    Bench: p.bench,
                    'Rencana Batubara (MT)': p.planCoalMt,
                    'Realisasi Batubara (MT)': p.actualCoalMt,
                    'Rencana OB (Bcm)': p.planObBcm,
                    'Realisasi OB (Bcm)': p.actualObBcm,
                    Status: p.status,
                    Perencana: p.engineer,
                  })),
                  'rencana-tambang',
                )
              }
            >
              Ekspor
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Rencana Baru
            </Button>
          </>
        }
      >
        <Tabs<TabId>
          tabs={[
            { id: 'plans', label: 'Rencana Tambang', count: plans.length },
            { id: 'blending', label: 'Blending', count: blends.length },
            { id: 'rkab', label: 'RKAB & Realisasi' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      {/* ------------------------------ KPI ------------------------------ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rencana Batubara Kumulatif"
          value={mtShort(totalPlanCoal)}
          icon={<Mountain className="h-4 w-4" />}
          hint={`${plans.length} rencana aktif & selesai`}
        />
        <StatCard
          label="Realisasi Batubara"
          value={mtShort(totalActualCoal)}
          tone="emerald"
          delta={achievement - 100}
          deltaLabel={`capaian ${pct1(achievement)} dari rencana`}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Pengupasan (Overburden)"
          value={`${num1(totalActualOb)} Bcm`}
          tone="sky"
          hint={`rasio SR rata-rata ${num2(avgSr)}`}
          icon={<Truck className="h-4 w-4" />}
        />
        <StatCard
          label="Site Produksi Aktif"
          value={num(activePits)}
          unit="site"
          tone="violet"
          hint={`dari ${sites.length} site terdaftar`}
          icon={<Pickaxe className="h-4 w-4" />}
        />
      </div>

      {/* ============================ RENCANA =========================== */}
      {tab === 'plans' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartFrame
              title="Realisasi vs Rencana Batubara per Site"
              subtitle="dalam ribu metrik ton — agregasi seluruh periode rencana"
              actions={<Badge tone="amber">{mtShort(totalPlanCoal)} rencana</Badge>}
            >
              <BarsChart
                data={sitePlanChart}
                xKey="site"
                series={[
                  { key: 'rencana', name: 'Rencana (ribu MT)', color: '#64748b' },
                  { key: 'realisasi', name: 'Realisasi (ribu MT)', color: '#f59e0b' },
                ]}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>

            <ChartFrame title="Tren Rasio Pengupasan (Stripping Ratio)" subtitle="Bcm overburden per metrik ton batubara — target operasional ≤ 5,00">
              <TrendChart
                data={srChart}
                xKey="month"
                series={[{ key: 'sr', name: 'Stripping Ratio', type: 'line', color: '#38bdf8' }]}
                valueFormatter={(v) => `${num2(v)} Bcm/MT`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>
          </div>

          <Card>
            <CardHeader
              title="Daftar Rencana Tambang"
              subtitle="Monitoring capaian produksi batubara dan pengupasan terhadap rencana per pit & bench"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua site' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                    className="input-sm"
                  />
                  <Select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua periode' }, ...periods.map((p) => ({ value: p, label: p }))]}
                    className="input-sm"
                  />
                </div>
              }
            />
            <DataTable
              data={filteredPlans}
              columns={planColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${siteName(r.siteId)} ${r.pit} ${r.period} ${r.engineer} ${r.status}`}
              searchPlaceholder="Cari rencana tambang..."
              pageSize={10}
              exportName="rencana-tambang"
              initialSort={{ key: 'actual', dir: 'desc' }}
              emptyLabel="Belum ada rencana tambang"
            />
          </Card>

          <Card>
            <CardHeader title="Catatan Perencana" subtitle="Catatan lapangan & kendala operasional dari tim perencanaan tambang" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {filteredPlans.map((p) => (
                <div key={p.id} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{p.code}</p>
                      <p className="text-[11px] text-ink-faint">
                        {siteName(p.siteId)} · {p.pit} · {p.period}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">{p.notes}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faintest">
                    <CalendarClock className="h-3 w-3" /> {p.engineer}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================ BLENDING ========================== */}
      {tab === 'blending' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard label="Volume Blending Aktif" value={mtShort(blendedVolume)} tone="emerald" icon={<Blend className="h-4 w-4" />} hint={`${blends.filter((b) => b.status === 'Active').length} resep aktif`} />
            <StatCard label="Target GCV Rata-rata" value={num(avgGcvTarget)} unit="kcal/kg" tone="amber" icon={<Gauge className="h-4 w-4" />} hint="rentang 3.800–5.000 kcal/kg" />
            <StatCard label="Stockpile Terlibat" value={num(blendMixChart.length)} unit="unit" tone="violet" icon={<Layers className="h-4 w-4" />} hint={`dari ${state.stockpiles.length} stockpile tersedia`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartFrame title="Kontribusi Stockpile dalam Blending" subtitle="Akumulasi bobot komposisi seluruh resep aktif">
              <DonutChart data={blendMixChart} />
            </ChartFrame>

            <ChartFrame title="Mutu Batubara Stockpile" subtitle="GCV (AR) dan kadar abu/ sulfur tersedia untuk formulasi">
              <BarsChart
                data={stockpileQuality}
                xKey="name"
                series={[
                  { key: 'gcv', name: 'GCV AR (kcal/kg)', color: '#f59e0b' },
                  { key: 'ash', name: 'Ash (%)', color: '#38bdf8' },
                  { key: 'sulfur', name: 'Sulfur (%)', color: '#f43f5e' },
                ]}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>
          </div>

          <Card>
            <CardHeader
              title="Formulasi Blending"
              subtitle="Resep pencampuran batubara dari beberapa stockpile untuk memenuhi spesifikasi kontrak"
              actions={
                <Button size="sm" variant="outline" icon={<FlaskConical className="h-4 w-4" />} onClick={() => setBlendOpen(true)}>
                  Resep Baru
                </Button>
              }
            />
            <DataTable
              data={blends}
              columns={blendColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${r.name} ${siteName(r.siteId)} ${r.status}`}
              searchPlaceholder="Cari resep blending..."
              pageSize={8}
              exportName="blending"
              emptyLabel="Belum ada resep blending"
            />
          </Card>
        </div>
      )}

      {/* ============================== RKAB ============================ */}
      {tab === 'rkab' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Realisasi vs Rencana RKAB Bulanan" subtitle="Rencana bulanan diturunkan dari RKAB tahunan 1.250.000 MT" />
              <div className="p-4 pt-2">
                <TrendChart
                  data={coalSeries}
                  xKey="month"
                  series={[
                    { key: 'realisasi', name: 'Realisasi (MT)', color: '#f59e0b' },
                    { key: 'rencana', name: 'Rencana RKAB (MT)', color: '#64748b', type: 'line' },
                  ]}
                  valueFormatter={(v) => `${num(v)} MT`}
                  yTickFormatter={(v) => num(v)}
                />
              </div>
            </Card>

            <div className="space-y-4 lg:col-span-2">
              <StatCard label="RKAB Tahunan" value={mtShort(1_250_000)} tone="amber" icon={<TrendingUp className="h-4 w-4" />} hint="Approval Kementerian ESDM" />
              <StatCard label="Realisasi YTD" value={mtShort(sum(m.monthly.map((x) => x.coal)))} tone="emerald" delta={achievement - 100} deltaLabel={`capaian ${pct1(achievement)}`} icon={<CheckCircle2 className="h-4 w-4" />} />
              <StatCard label="Rata-rata Harian" value={num(sum(m.monthly.map((x) => x.coal)) / Math.max(1, m.monthly.length) / 30)} unit="MT/hari" tone="sky" icon={<Gauge className="h-4 w-4" />} hint="12 bulan berjalan" />
            </div>
          </div>

          <Card>
            <CardHeader title="Rekapitulasi RKAB per Bulan" subtitle="Produksi batubara, pengupasan, dan rasio pengupasan terhadap rencana bulanan" />
            <DataTable
              data={m.monthly.map((x) => ({
                month: x.month,
                label: x.label,
                coal: x.coal,
                ob: x.ob,
                sr: x.sr,
                rom: x.rom,
                trips: x.trips,
              }))}
              columns={[
                { key: 'month', header: 'Bulan', render: (r) => <span className="font-medium text-ink">{r.label}</span> },
                { key: 'coal', header: 'Realisasi Batubara', align: 'right', sort: (r) => r.coal, render: (r) => <span className="font-mono text-xs text-ink">{num(Math.round(r.coal))} MT</span> },
                { key: 'plan', header: 'Rencana RKAB', align: 'right', sort: (r) => MONTHLY_PLAN_MT, render: (r) => <span className="font-mono text-xs text-ink-muted">{num(MONTHLY_PLAN_MT)} MT</span> },
                {
                  key: 'dev',
                  header: 'Deviasi',
                  align: 'right',
                  render: (r) => {
                    const dev = ((r.coal - MONTHLY_PLAN_MT) / MONTHLY_PLAN_MT) * 100
                    return <span className={cx('font-mono text-xs font-semibold', dev >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{pct1(dev)}</span>
                  },
                },
                { key: 'ob', header: 'Overburden', align: 'right', sort: (r) => r.ob, render: (r) => <span className="font-mono text-xs text-ink-muted">{num1(r.ob)} Bcm</span> },
                { key: 'sr', header: 'SR', align: 'right', sort: (r) => r.sr, render: (r) => <span className="font-mono text-xs text-ink-muted">{num2(r.sr)}</span> },
                { key: 'rom', header: 'ROM', align: 'right', sort: (r) => r.rom, render: (r) => <span className="font-mono text-xs text-ink-muted">{num(Math.round(r.rom))} MT</span> },
                { key: 'trips', header: 'Trips', align: 'right', sort: (r) => r.trips, render: (r) => <span className="font-mono text-xs text-ink-muted">{num(r.trips)}</span> },
              ]}
              rowKey={(r) => r.month}
              pageSize={12}
              exportName="rkab-realisasi"
              initialSort={{ key: 'coal', dir: 'desc' }}
              emptyLabel="Belum ada data produksi"
            />
          </Card>

          <Card>
            <CardHeader title="Keterangan Metodologi RKAB" subtitle="Dasar perhitungan dan indikator evaluasi rencana kerja anggaran biaya" />
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[
                { t: 'Rencana Produksi', d: 'Diturunkan dari RKAB tahunan 1.250.000 MT menjadi 104.166 MT/bulan sesuai approval Kementerian ESDM.' },
                { t: 'Rencana Pengupasan', d: `Target rasio pengupasan maksimal 5,00 Bcm/MT; realisasi rata-rata saat ini ${num2(avgSr)} Bcm/MT.` },
                { t: 'Evaluasi Deviasi', d: 'Deviasi negatif lebih dari -10% memicu kaji ulang jadwal pengupasan dan alokasi armada hauling.' },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <p className="text-sm font-semibold text-ink">{c.t}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{c.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================ MODAL ============================= */}
      <PlanForm open={formOpen} onClose={() => setFormOpen(false)} sites={sites} onSubmit={(r) => { actions.addMinePlan(r); setFormOpen(false) }} />
      <BlendForm open={blendOpen} onClose={() => setBlendOpen(false)} sites={sites} stockpiles={state.stockpiles} onSubmit={(r) => { actions.addBlendingRecipe(r); setBlendOpen(false) }} />
      <BlendDetail recipe={detail} onClose={() => setDetail(null)} siteName={siteName} spName={spName} />
    </div>
  )
}

/* --------------------------- Form Rencana Baru --------------------------- */

function PlanForm({
  open,
  onClose,
  sites,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  sites: Array<{ id: string; name: string }>
  onSubmit: (r: { siteId: string; period: string; pit: string; bench: string; planCoalMt: number; planObBcm: number; engineer: string; notes: string }) => void
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [period, setPeriod] = useState('2027-Q1')
  const [pit, setPit] = useState('')
  const [bench, setBench] = useState('Bench 0–20 m')
  const [planCoalMt, setPlanCoalMt] = useState(0)
  const [planObBcm, setPlanObBcm] = useState(0)
  const [engineer, setEngineer] = useState('')
  const [notes, setNotes] = useState('')
  const { toast } = useERP()

  const submit = () => {
    if (!pit.trim() || !engineer.trim()) {
      toast('Nama pit dan perencana wajib diisi', 'warning')
      return
    }
    if (planCoalMt <= 0) {
      toast('Rencana batubara harus lebih dari 0 MT', 'warning')
      return
    }
    onSubmit({ siteId, period, pit, bench, planCoalMt, planObBcm, engineer, notes })
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Rencana Tambang Baru" subtitle="Rencana produksi batubara & pengupasan per pit/bench">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site" required>
          <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Periode" required>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={['2026-Q3', '2026-Q4', '2027-Q1', '2027-Q2'].map((p) => ({ value: p, label: p }))}
          />
        </Field>
        <Field label="Nama Pit" required>
          <Input value={pit} onChange={(e) => setPit(e.target.value)} placeholder="Pit Utara" />
        </Field>
        <Field label="Bench / Tingkat">
          <Input value={bench} onChange={(e) => setBench(e.target.value)} placeholder="Bench 60–80 m" />
        </Field>
        <Field label="Rencana Batubara (MT)" required>
          <Input type="number" value={planCoalMt || ''} onChange={(e) => setPlanCoalMt(Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Rencana Overburden (Bcm)">
          <Input type="number" value={planObBcm || ''} onChange={(e) => setPlanObBcm(Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Perencana" required>
          <Input value={engineer} onChange={(e) => setEngineer(e.target.value)} placeholder="Ir. Nama Perencana" />
        </Field>
        <Field label="Catatan" className="sm:col-span-2">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Catatan lapangan, kendala, atau asumsi perencanaan..." />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={submit}>Simpan Rencana</Button>
      </div>
    </Modal>
  )
}

/* --------------------------- Form Resep Blending -------------------------- */

function BlendForm({
  open,
  onClose,
  sites,
  stockpiles,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  sites: Array<{ id: string; name: string }>
  stockpiles: Stockpile[]
  onSubmit: (r: { siteId: string; name: string; targetGcv: number; targetAsh: number; targetSulfur: number; components: Array<{ stockpileId: string; pct: number }>; volumeMt: number }) => void
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [name, setName] = useState('')
  const [targetGcv, setTargetGcv] = useState(4200)
  const [targetAsh, setTargetAsh] = useState(6)
  const [targetSulfur, setTargetSulfur] = useState(0.6)
  const [volumeMt, setVolumeMt] = useState(0)
  const [components, setComponents] = useState<Array<{ stockpileId: string; pct: number }>>([{ stockpileId: stockpiles[0]?.id ?? '', pct: 100 }])
  const { toast } = useERP()

  const totalPct = sum(components.map((c) => c.pct))
  const available = stockpiles.filter((s) => s.siteId === siteId)

  const submit = () => {
    if (!name.trim()) {
      toast('Nama resep blending wajib diisi', 'warning')
      return
    }
    if (Math.abs(totalPct - 100) > 0.5) {
      toast('Total komposisi campuran harus 100%', 'warning')
      return
    }
    if (volumeMt <= 0) {
      toast('Volume blending harus lebih dari 0 MT', 'warning')
      return
    }
    onSubmit({ siteId, name, targetGcv, targetAsh, targetSulfur, components, volumeMt })
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Resep Blending Baru" subtitle="Formulasi pencampuran batubara untuk target spesifikasi kontrak">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site" required>
          <Select value={siteId} onChange={(e) => { setSiteId(e.target.value); setComponents([{ stockpileId: stockpiles.find((s) => s.siteId === e.target.value)?.id ?? '', pct: 100 }]) }} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Nama Resep" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Blend Ekspor GAR 4200" />
        </Field>
        <Field label="Target GCV (kcal/kg)">
          <Input type="number" value={targetGcv} onChange={(e) => setTargetGcv(Number(e.target.value))} />
        </Field>
        <Field label="Target Ash (%)">
          <Input type="number" step="0.1" value={targetAsh} onChange={(e) => setTargetAsh(Number(e.target.value))} />
        </Field>
        <Field label="Target Sulfur (%)">
          <Input type="number" step="0.01" value={targetSulfur} onChange={(e) => setTargetSulfur(Number(e.target.value))} />
        </Field>
        <Field label="Volume Target (MT)" required>
          <Input type="number" value={volumeMt || ''} onChange={(e) => setVolumeMt(Number(e.target.value))} placeholder="0" />
        </Field>
      </div>

      <div className="mt-5">
        <SectionTitle title="Komposisi Campuran" subtitle={`Total saat ini: ${totalPct}% — harus tepat 100%`} />
        <div className="mt-3 space-y-2">
          {components.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={c.stockpileId}
                onChange={(e) => setComponents((prev) => prev.map((x, j) => (j === i ? { ...x, stockpileId: e.target.value } : x)))}
                options={available.map((s) => ({ value: s.id, label: `${s.name} — GCV ${num(s.gcvAr)}` }))}
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-20"
                  value={c.pct}
                  onChange={(e) => setComponents((prev) => prev.map((x, j) => (j === i ? { ...x, pct: Number(e.target.value) } : x)))}
                />
                <span className="text-sm text-ink-faint">%</span>
              </div>
              {components.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setComponents((prev) => prev.filter((_, j) => j !== i))}>
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          className="mt-2"
          size="sm"
          variant="outline"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setComponents((prev) => [...prev, { stockpileId: available[0]?.id ?? '', pct: 0 }])}
        >
          Tambah Komponen
        </Button>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={submit}>Simpan Resep</Button>
      </div>
    </Modal>
  )
}

/* ---------------------------- Detail Blending ---------------------------- */

function BlendDetail({
  recipe,
  onClose,
  siteName,
  spName,
}: {
  recipe: BlendingRecipe | null
  onClose: () => void
  siteName: (id: string) => string
  spName: (id: string) => string
}) {
  if (!recipe) return null
  const totalPct = sum(recipe.components.map((c) => c.pct))
  return (
    <Modal open onClose={onClose} title={recipe.name} subtitle={`${recipe.code} · ${siteName(recipe.siteId)}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint">Target GCV</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{num(recipe.targetGcv)}</p>
          <p className="text-[11px] text-ink-faintest">kcal/kg (AR)</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint">Target Ash</p>
          <p className="mt-1 text-xl font-bold text-sky-400">{num1(recipe.targetAsh)}%</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-ink-faint">Target Sulfur</p>
          <p className="mt-1 text-xl font-bold text-rose-400">{num2(recipe.targetSulfur)}%</p>
        </div>
      </div>

      <div className="mt-5">
        <SectionTitle title="Komposisi" subtitle={`Volume rencana ${num(recipe.volumeMt)} MT · total komposisi ${totalPct}%`} />
        <div className="mt-3 space-y-2.5">
          {recipe.components.map((c) => (
            <div key={c.stockpileId} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3">
              <Layers className="h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{spName(c.stockpileId)}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-ink">{c.pct}%</span>
              <span className="w-24 text-right font-mono text-xs text-ink-faint">{num((recipe.volumeMt * c.pct) / 100)} MT</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Modal>
  )
}
