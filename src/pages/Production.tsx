import { useMemo, useState } from 'react'
import {
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  FlaskConical,
  Layers,
  Mountain,
  Pickaxe,
  Target,
  Truck,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics } from '../lib/metrics'
import { dmy, num, num1, num2, pct1, sum, toCSV } from '../lib/format'
import type { ProductionRecord, Site } from '../types'

type TabId = 'daily' | 'quality' | 'rkab' | 'sites'

export default function Production() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('daily')
  const [siteFilter, setSiteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [detail, setDetail] = useState<ProductionRecord | null>(null)

  const sites = state.sites
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? '-'
  const siteCode = (id: string) => sites.find((s) => s.id === id)?.code ?? '-'

  const filtered = useMemo(
    () =>
      state.production.filter(
        (p) => (siteFilter === 'all' || p.siteId === siteFilter) && (statusFilter === 'all' || p.status === statusFilter),
      ),
    [state.production, siteFilter, statusFilter],
  )

  const columns: Column<ProductionRecord>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      sort: (r) => r.date,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{dmy(r.date)}</p>
          <p className="text-[11px] text-ink-faintest">{r.shift}</p>
        </div>
      ),
    },
    {
      key: 'site',
      header: 'Site',
      sort: (r) => siteName(r.siteId),
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-surface-2 font-mono text-[10px] font-bold text-amber-400">{siteCode(r.siteId)}</span>
          <span className="text-ink">{siteName(r.siteId)}</span>
        </div>
      ),
    },
    { key: 'coalMt', header: 'Batu Bara (MT)', align: 'right', sort: (r) => r.coalMt, render: (r) => <span className="font-mono text-ink-strong">{num(r.coalMt)}</span> },
    { key: 'obBcm', header: 'Overburden (Bcm)', align: 'right', sort: (r) => r.obBcm, render: (r) => <span className="font-mono">{num1(r.obBcm)}</span> },
    {
      key: 'sr',
      header: 'SR',
      align: 'right',
      sort: (r) => (r.coalMt ? r.obBcm / r.coalMt : 0),
      render: (r) => <span className="font-mono text-sky-400">{num1(r.coalMt ? r.obBcm / r.coalMt : 0)}</span>,
    },
    { key: 'romMt', header: 'ROM (MT)', align: 'right', sort: (r) => r.romMt, render: (r) => <span className="font-mono">{num1(r.romMt)}</span> },
    { key: 'haulingTrips', header: 'Ritase', align: 'right', sort: (r) => r.haulingTrips, render: (r) => <span className="font-mono">{num(r.haulingTrips)}</span> },
    { key: 'gcvAr', header: 'GCV (kcal/kg)', align: 'right', sort: (r) => r.gcvAr, render: (r) => <span className="font-mono text-emerald-400">{num(r.gcvAr)}</span> },
    { key: 'totalMoisture', header: 'TM (%)', align: 'right', sort: (r) => r.totalMoisture, render: (r) => <span className="font-mono">{num1(r.totalMoisture)}</span> },
    { key: 'ash', header: 'Ash (%)', align: 'right', sort: (r) => r.ash, render: (r) => <span className="font-mono">{num1(r.ash)}</span> },
    { key: 'sulfur', header: 'S (%)', align: 'right', sort: (r) => r.sulfur, render: (r) => <span className="font-mono">{num2(r.sulfur)}</span> },
    {
      key: 'status',
      header: 'Status',
      sort: (r) => r.status,
      render: (r) => <StatusBadge value={r.status} />,
    },
  ]

  const qualityBySite = sites.map((s) => {
    const rows = state.production.filter((p) => p.siteId === s.id)
    const n = rows.length || 1
    return {
      site: s,
      gcv: sum(rows.map((r) => r.gcvAr)) / n,
      tm: sum(rows.map((r) => r.totalMoisture)) / n,
      ash: sum(rows.map((r) => r.ash)) / n,
      sulfur: sum(rows.map((r) => r.sulfur)) / n,
      spec: royaltySpec(s.gcvAr),
    }
  })

  const gcvTrend = m.monthly.map((r) => ({
    label: r.label,
    gcv: m.avgGcv > 0 && r.month === m.currentMonth ? Math.round(m.avgGcv) : Math.round(3900 + ((Number(r.month.slice(5)) * 37) % 420)),
    target: 4300,
  }))

  const rkabPlan = 1_250_000 // MT/tahun
  const rkabYtd = sum(m.monthly.map((r) => r.coal))

  const totalCoal = sum(filtered.map((p) => p.coalMt))
  const totalOb = sum(filtered.map((p) => p.obBcm))
  const totalTrips = sum(filtered.map((p) => p.haulingTrips))

  const exportDaily = () => {
    toCSV(
      filtered.map((p) => ({
        Tanggal: p.date,
        Site: siteCode(p.siteId),
        Shift: p.shift,
        'Batu Bara (MT)': p.coalMt,
        'Overburden (Bcm)': p.obBcm,
        'ROM (MT)': p.romMt,
        'Jarak Haul (km)': p.haulDistanceKm,
        Ritase: p.haulingTrips,
        'GCV (kcal/kg)': p.gcvAr,
        'TM (%)': p.totalMoisture,
        'Ash (%)': p.ash,
        'Sulfur (%)': p.sulfur,
        Status: p.status,
      })),
      'laporan-produksi',
    )
    toast('Laporan produksi diunduh sebagai CSV', 'success')
  }

  return (
    <div>
      <PageHeader
        title="Produksi & Operasional Pit"
        subtitle="Monitoring produksi harian, overburden removal, analisis kualitas batubara, dan realisasi rencana kerja anggaran biaya (RKAB) per site."
        actions={
          <>
            <Button variant="secondary" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportDaily}>
              Ekspor CSV
            </Button>
            <Button variant="primary" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Lapor Produksi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Produksi Bulan Ini" value={num(m.coalMtd)} unit="MT" delta={m.coalDelta} deltaLabel="vs bulan lalu" icon={<Mountain className="h-4 w-4" />} />
        <StatCard label="Overburden Removal" value={num1(m.obMtd)} unit="Bcm" delta={m.obDelta} deltaLabel="vs bulan lalu" icon={<Truck className="h-4 w-4" />} tone="sky" />
        <StatCard label="Stripping Ratio" value={num1(m.srMtd)} unit="Bcm/MT" hint="Rasio pengupasan optimal" icon={<Layers className="h-4 w-4" />} tone="violet" />
        <StatCard label="GCV Rata-rata" value={num(m.avgGcv)} unit="kcal/kg" hint={`Tarif royalti ${m.royaltyRate.rate}%`} icon={<FlaskConical className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Total Ritase" value={num(totalTrips)} unit="trip" hint={`${num1(totalOb)} Bcm terangkut`} icon={<Pickaxe className="h-4 w-4" />} tone="zinc" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'daily', label: 'Laporan Harian', count: filtered.length },
            { id: 'quality', label: 'Analisis Kualitas' },
            { id: 'rkab', label: 'Realisasi RKAB' },
            { id: 'sites', label: 'Site & Cadangan' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* ----------------------------- Tab: Harian ---------------------------- */}
      {tab === 'daily' && (
        <Card className="mt-4">
          <CardHeader
            title="Laporan Produksi Harian"
            subtitle={`${num(totalCoal)} MT batubara & ${num1(totalOb)} Bcm overburden tercatat pada periode terpilih`}
            actions={
              <>
                <Select
                  options={[{ value: 'all', label: 'Semua Site' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="!h-8 !w-44 !text-xs"
                />
                <Select
                  options={['all', 'Draft', 'Verified', 'Approved'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Status' : v }))}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="!h-8 !w-36 !text-xs"
                />
              </>
            }
          />
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${siteName(r.siteId)} ${r.date} ${r.shift} ${r.status}`}
            searchPlaceholder="Cari tanggal, site, shift…"
            exportName="laporan-produksi"
            initialSort={{ key: 'date', dir: 'desc' }}
            onRowClick={setDetail}
            actions={(r) =>
              r.status !== 'Approved' ? (
                <Button size="sm" variant="ghost" onClick={() => actions.setProductionStatus(r.id, r.status === 'Draft' ? 'Verified' : 'Approved')}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {r.status === 'Draft' ? 'Verifikasi' : 'Approve'}
                </Button>
              ) : (
                <Badge tone="success">Selesai</Badge>
              )
            }
          />
        </Card>
      )}

      {/* ---------------------------- Tab: Kualitas --------------------------- */}
      {tab === 'quality' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Tren Kualitas Kalori (GCV)"
              subtitle="Rata-rata GCV bulanan terhadap spesifikasi minimum kontrak"
              actions={<Badge tone="emerald">Target GAR 4.300</Badge>}
            >
              <TrendChart
                data={gcvTrend}
                xKey="label"
                series={[
                  { key: 'gcv', name: 'GCV aktual', color: '#34d399' },
                  { key: 'target', name: 'Spesifikasi', color: '#f59e0b', type: 'line' },
                ]}
                valueFormatter={(v) => `${num(v)} kcal/kg`}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Spesifikasi Kontrak" subtitle="Parameter mutu batubara per kontrak aktif" icon={<FlaskConical className="h-4 w-4" />} />
              <div className="divide-y divide-line">
                {state.contracts.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{c.qualitySpec}</p>
                      <p className="truncate text-[11px] text-ink-faintest">
                        {c.code} &middot; {c.type}
                      </p>
                    </div>
                    <Badge tone={c.type === 'Export' ? 'info' : 'neutral'}>{c.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Analisis Mutu per Site" subtitle="Rata-rata parameter kualitas batubara dan batasan tarif royalti PNBP" />
            <div className="overflow-x-auto scrollbar-thin">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Jenis Batubara</th>
                    <th className="text-right">GCV GAR (kcal/kg)</th>
                    <th className="text-right">Total Moisture (%)</th>
                    <th className="text-right">Ash (%)</th>
                    <th className="text-right">Sulfur (%)</th>
                    <th className="text-right">Band Royalti</th>
                    <th className="text-right">Tarif PNBP</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityBySite.map((q) => (
                    <tr key={q.site.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded bg-surface-2 font-mono text-[10px] font-bold text-amber-400">{q.site.code}</span>
                          <span className="text-ink">{q.site.name}</span>
                        </div>
                      </td>
                      <td className="text-ink-muted">{q.site.coalType}</td>
                      <td className="tbl-num text-emerald-400">{num(q.gcv)}</td>
                      <td className="tbl-num">{num1(q.tm)}</td>
                      <td className="tbl-num">{num1(q.ash)}</td>
                      <td className="tbl-num">{num2(q.sulfur)}</td>
                      <td className="text-right text-ink-muted">{q.spec.band}</td>
                      <td className="tbl-num">
                        <Badge tone="warning">{q.spec.rate}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-5 py-3 text-[11px] text-ink-faintest">
              Tarif royalti mengacu pada PP No. 9 Tahun 2010 jo. PP No. 1 Tahun 2017 beserta perubahannya — dihitung dari nilai kalori GAR (air received basis).
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------ Tab: RKAB ----------------------------- */}
      {tab === 'rkab' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Produksi Aktual vs Rencana RKAB"
              subtitle="Tonase batu bara bulanan dibanding rencana produksi tahunan (MT)"
              actions={<Badge tone="amber">RKAB {num(rkabPlan)} MT</Badge>}
            >
              <BarsChart
                data={m.monthly.map((r) => ({ label: r.label, coal: r.coal, plan: Math.round(rkabPlan / 12) }))}
                xKey="label"
                series={[
                  { key: 'coal', name: 'Aktual (MT)', color: '#f59e0b' },
                  { key: 'plan', name: 'Rencana (MT)', color: '#52525b' },
                ]}
                valueFormatter={(v) => num(v)}
                yTickFormatter={(v) => (v >= 1000 ? `${num1(v / 1000)} rb` : num(v))}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Capaian Tahunan" subtitle="Realisasi produksi terhadap RKAB 2026" icon={<Target className="h-4 w-4" />} />
              <div className="space-y-5 p-5">
                <div>
                  <Progress value={(rkabYtd / rkabPlan) * 100} tone="amber" label="Produksi batu bara" />
                  <p className="mt-1.5 text-[11px] text-ink-faintest">
                    {num(rkabYtd)} MT dari {num(rkabPlan)} MT
                  </p>
                </div>
                <div>
                  <Progress value={m.rkabPct} tone="emerald" label="Realisasi biaya RKAB" />
                  <p className="mt-1.5 text-[11px] text-ink-faintest">{pct1(m.rkabPct)} dari pagu anggaran</p>
                </div>
                <div>
                  <Progress value={(m.contractLifted / m.contractVolume) * 100} tone="sky" label="Volume kontrak terlaksana" />
                  <p className="mt-1.5 text-[11px] text-ink-faintest">
                    {num(m.contractLifted)} MT dari {num(m.contractVolume)} MT
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface-2/50 p-3">
                  <p className="text-[11px] text-ink-faint">Proyeksi akhir tahun</p>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-400">{num(Math.round((rkabYtd / 10) * 12))} MT</p>
                  <p className="text-[11px] text-ink-faintest">{pct1(((rkabYtd / 10) * 12) / rkabPlan * 100)} dari target</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {m.bySite.map((r) => {
              const plan = rkabPlan / 5
              return (
                <Card key={r.site.id}>
                  <CardHeader
                    title={r.site.name}
                    subtitle={`${r.site.region} · ${r.site.contractor}`}
                    actions={<Badge tone={r.site.status === 'Operating' ? 'success' : 'warning'}>{r.site.status}</Badge>}
                  />
                  <div className="space-y-4 p-5">
                    <Progress value={(r.coal / (plan / 10)) * 100} tone="amber" label="Produksi vs rencana bulanan" />
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <Metric label="Produksi MTD" value={`${num(r.coal)} MT`} />
                      <Metric label="Overburden" value={`${num1(r.ob)} Bcm`} />
                      <Metric label="Stripping ratio" value={num1(r.sr)} />
                      <Metric label="Stok stockpile" value={`${num(r.stock)} MT`} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ----------------------------- Tab: Sites ----------------------------- */}
      {tab === 'sites' && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sites.map((s) => (
            <SiteCard key={s.id} site={s} />
          ))}
        </div>
      )}

      {/* ------------------------------ Modals ------------------------------- */}
      <ProductionForm open={formOpen} onClose={() => setFormOpen(false)} sites={sites} onSubmit={actions.addProduction} />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Detail Laporan Produksi"
        subtitle={detail ? `${siteName(detail.siteId)} · ${dmy(detail.date)} · ${detail.shift}` : ''}
        size="md"
        footer={<Button variant="secondary" onClick={() => setDetail(null)}>Tutup</Button>}
      >
        {detail && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Batu Bara" value={`${num(detail.coalMt)} MT`} />
            <Metric label="Overburden" value={`${num1(detail.obBcm)} Bcm`} />
            <Metric label="ROM" value={`${num1(detail.romMt)} MT`} />
            <Metric label="Stripping Ratio" value={num1(detail.obBcm / detail.coalMt)} />
            <Metric label="Jarak Haul" value={`${num1(detail.haulDistanceKm)} km`} />
            <Metric label="Jumlah Ritase" value={num(detail.haulingTrips)} />
            <Metric label="GCV" value={`${num(detail.gcvAr)} kcal/kg`} />
            <Metric label="Total Moisture" value={`${num1(detail.totalMoisture)} %`} />
            <Metric label="Ash" value={`${num1(detail.ash)} %`} />
            <Metric label="Sulfur" value={`${num2(detail.sulfur)} %`} />
            <Metric label="Shift" value={detail.shift} />
            <Metric label="Status" value={detail.status} />
          </div>
        )}
      </Modal>

      {tab === 'daily' && filtered.length === 0 && (
        <Card className="mt-4">
          <EmptyState icon={<Mountain className="h-6 w-6" />} title="Belum ada laporan produksi" hint="Ubah filter site atau status untuk melihat data lain." />
        </Card>
      )}

      <SectionTitle title="Ringkasan Operasional" subtitle="Indikator kunci yang memengaruhi produktivitas pit" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Efisiensi Pengupasan" subtitle="Rasio overburden terhadap batubara" icon={<Layers className="h-4 w-4" />} />
          <div className="p-5">
            <Progress value={Math.min(100, (m.srMtd / 6) * 100)} tone={m.srMtd > 5 ? 'rose' : m.srMtd > 4 ? 'amber' : 'emerald'} label="Stripping ratio saat ini" />
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              Stripping ratio {num1(m.srMtd)} Bcm/MT berada pada batas normal operasional tambang terbuka. Nilai ideal bervariasi 3,5–5,0 Bcm/MT bergantung pada geometri endapan.
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Produktivitas Alat Berat" subtitle="Rata-rata ritase dan jarak haul harian" icon={<Truck className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3 p-5">
            <Metric label="Rata-rata ritase/hari" value={num(totalTrips / Math.max(filtered.length, 1))} />
            <Metric label="Jarak haul rata-rata" value={`${num1(sum(filtered.map((f) => f.haulDistanceKm)) / Math.max(filtered.length, 1))} km`} />
            <Metric label="Produktivitas/haul" value={`${num1(totalCoal / Math.max(totalTrips, 1))} MT`} />
            <Metric label="Utilisasi armada" value={pct1(m.fleetUtilization)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Verifikasi Data" subtitle="Status persetujuan laporan produksi" icon={<ClipboardCheck className="h-4 w-4" />} />
          <div className="space-y-3 p-5">
            {(['Draft', 'Verified', 'Approved'] as const).map((st) => {
              const c = state.production.filter((p) => p.status === st).length
              return (
                <div key={st} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
                  <span className="text-xs text-ink-muted">{st}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${st === 'Approved' ? 'bg-emerald-500' : st === 'Verified' ? 'bg-sky-500' : 'bg-zinc-500'}`} style={{ width: `${(c / state.production.length) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs text-ink">{c}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------ Helpers ------------------------------ */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-ink-strong">{value}</p>
    </div>
  )
}

function royaltySpec(gcvAr: number): { rate: number; band: string } {
  if (gcvAr > 5200) return { rate: 4, band: 'GAR > 5.200' }
  if (gcvAr >= 4200) return { rate: 5, band: 'GAR 4.201 – 5.200' }
  if (gcvAr >= 3400) return { rate: 6, band: 'GAR 3.401 – 4.200' }
  if (gcvAr >= 3100) return { rate: 7, band: 'GAR 3.101 – 3.400' }
  if (gcvAr >= 2100) return { rate: 8, band: 'GAR 2.101 – 3.100' }
  return { rate: 9, band: 'GAR ≤ 2.100' }
}

function SiteCard({ site }: { site: Site }) {
  const { state } = useERP()
  const stock = state.stockpiles.filter((s) => s.siteId === site.id)
  const eq = state.equipment.filter((e) => e.siteId === site.id)
  const staff = state.employees.filter((e) => e.siteId === site.id).length
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/10 text-amber-400">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-strong">{site.name}</h3>
            <p className="text-[11px] text-ink-faint">
              {site.region} &middot; {site.province}
            </p>
          </div>
        </div>
        <StatusBadge value={site.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 text-xs">
        <Metric label="Nomor IUP" value={site.iupNo} />
        <Metric label="Tahap IUP" value={site.iupStage} />
        <Metric label="Luas Areal" value={`${num(site.areaHa)} Ha`} />
        <Metric label="Cadangan" value={`${num1(site.reservesMt)} Jt MT`} />
        <Metric label="Jenis batubara" value={site.coalType} />
        <Metric label="GCV cadangan" value={`${num(site.gcvAr)} kcal/kg`} />
        <Metric label="Manajer site" value={site.manager.replace('Ir. ', '')} />
        <Metric label="Kontraktor" value={site.contractor} />
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-line p-5 text-center">
        {[
          { label: 'Stockpile', value: stock.length },
          { label: 'Unit Armada', value: eq.length },
          { label: 'Karyawan', value: staff },
        ].map((x) => (
          <div key={x.label}>
            <p className="font-mono text-lg font-bold text-ink-strong">{x.value}</p>
            <p className="text-[11px] text-ink-faint">{x.label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ---------------------------- Form Produksi --------------------------- */

function ProductionForm({
  open,
  onClose,
  sites,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  sites: Site[]
  onSubmit: (r: Omit<ProductionRecord, 'id' | 'status' | 'createdBy'>) => void
}) {
  const [form, setForm] = useState({
    date: '2026-10-15',
    siteId: sites[0]?.id ?? '',
    shift: 'Shift 1' as ProductionRecord['shift'],
    coalMt: '',
    obBcm: '',
    romMt: '',
    haulDistanceKm: '',
    haulingTrips: '',
    gcvAr: '',
    totalMoisture: '',
    ash: '',
    sulfur: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    const e: Record<string, string> = {}
    if (!form.date) e.date = 'Tanggal wajib diisi'
    if (!form.siteId) e.siteId = 'Site wajib dipilih'
    if (!form.coalMt || Number(form.coalMt) <= 0) e.coalMt = 'Tonase batubara wajib diisi'
    if (!form.obBcm || Number(form.obBcm) <= 0) e.obBcm = 'Overburden wajib diisi'
    if (!form.gcvAr || Number(form.gcvAr) < 1000) e.gcvAr = 'GCV minimum 1.000 kcal/kg'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onSubmit({
      date: form.date,
      siteId: form.siteId,
      shift: form.shift,
      coalMt: Number(form.coalMt),
      obBcm: Number(form.obBcm),
      romMt: Number(form.romMt || Number(form.coalMt) * 1.3),
      haulDistanceKm: Number(form.haulDistanceKm || 4),
      haulingTrips: Number(form.haulingTrips || 0),
      gcvAr: Number(form.gcvAr),
      totalMoisture: Number(form.totalMoisture || 0),
      ash: Number(form.ash || 0),
      sulfur: Number(form.sulfur || 0),
    })
    setForm({ ...form, coalMt: '', obBcm: '', romMt: '', haulingTrips: '', gcvAr: '', totalMoisture: '', ash: '', sulfur: '', notes: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Laporan Produksi Harian"
      subtitle="Input data produksi, pengupasan, dan kualitas batubara per shift"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit}>
            Simpan Laporan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tanggal Produksi" required error={errors.date}>
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Site Tambang" required error={errors.siteId}>
          <Select options={sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Shift Kerja">
          <Select options={['Shift 1', 'Shift 2', 'Shift 3']} value={form.shift} onChange={(e) => set('shift', e.target.value)} />
        </Field>
        <Field label="Batu Bara (MT)" required error={errors.coalMt} hint="Total produksi terangkut ke stockpile">
          <Input type="number" min={0} placeholder="contoh: 12.400" value={form.coalMt} onChange={(e) => set('coalMt', e.target.value)} />
        </Field>
        <Field label="Overburden (Bcm)" required error={errors.obBcm} hint="Volume material pengupasan">
          <Input type="number" min={0} step="0.01" placeholder="contoh: 48.500" value={form.obBcm} onChange={(e) => set('obBcm', e.target.value)} />
        </Field>
        <Field label="ROM (MT)" hint="Run of mine sebelum crushing">
          <Input type="number" min={0} step="0.01" value={form.romMt} onChange={(e) => set('romMt', e.target.value)} />
        </Field>
        <Field label="Jarak Haul (km)">
          <Input type="number" min={0} step="0.1" value={form.haulDistanceKm} onChange={(e) => set('haulDistanceKm', e.target.value)} />
        </Field>
        <Field label="Jumlah Ritase">
          <Input type="number" min={0} value={form.haulingTrips} onChange={(e) => set('haulingTrips', e.target.value)} />
        </Field>
        <Field label="GCV GAR (kcal/kg)" required error={errors.gcvAr} hint="Nilai kalori air received basis">
          <Input type="number" min={1000} value={form.gcvAr} onChange={(e) => set('gcvAr', e.target.value)} />
        </Field>
        <Field label="Total Moisture (%)">
          <Input type="number" min={0} max={60} step="0.1" value={form.totalMoisture} onChange={(e) => set('totalMoisture', e.target.value)} />
        </Field>
        <Field label="Ash (%)">
          <Input type="number" min={0} max="40" step="0.1" value={form.ash} onChange={(e) => set('ash', e.target.value)} />
        </Field>
        <Field label="Sulfur (%)">
          <Input type="number" min={0} max="5" step="0.01" value={form.sulfur} onChange={(e) => set('sulfur', e.target.value)} />
        </Field>
        <Field label="Catatan Operasional" className="sm:col-span-2 lg:col-span-3">
          <Textarea placeholder="Kendala operasional, kondisi cuaca, kejadian tidak terduga, atau catatan tambahan…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
