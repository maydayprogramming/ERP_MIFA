import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Coins,
  Factory,
  Fuel,
  Gauge,
  HardHat,
  Mountain,
  Package,
  Percent,
  ShieldCheck,
  Timer,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, EmptyState, Progress, SectionTitle, StatCard } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics } from '../lib/metrics'
import { dmy, idr, mtShort, num, num1, pct1, sum, usd } from '../lib/format'

const REVENUE_PLAN = 65_000_000 // USD / bulan (RKAB 2026)

export default function Dashboard() {
  const { state } = useERP()
  const m = useMetrics()
  const navigate = useNavigate()

  const recentActivity = state.activity.slice(0, 8)
  const criticalAlerts = [
    ...(m.arOverdue > 0 ? [{ id: 'ar', tone: 'danger' as const, icon: Banknote, title: 'Piutang jatuh tempo', detail: `Tunggakan ${usd(m.arOverdue)} melebihi termin pembayaran.`, to: '/finance', cta: 'Tinjau aging' }] : []),
    ...(m.overdueWO > 0 ? [{ id: 'wo', tone: 'warning' as const, icon: Truck, title: 'Work Order terlambat', detail: `${m.overdueWO} WO pemeliharaan melewati jadwal.`, to: '/fleet', cta: 'Jadwalkan ulang' }] : []),
    ...(m.lowStockItems.length > 0 ? [{ id: 'st', tone: 'warning' as const, icon: Package, title: 'Stok di bawah minimum', detail: `${m.lowStockItems.length} item gudang perlu replenishment.`, to: '/inventory', cta: 'Buat permintaan' }] : []),
    ...(m.envExceeded > 0 ? [{ id: 'env', tone: 'danger' as const, icon: Factory, title: 'Parameter lingkungan melebihi ambang', detail: `${m.envExceeded} pembacaan melebihi baku mutu AMDAL.`, to: '/hse', cta: 'Lihat monitoring' }] : []),
    ...(m.poPending > 0 ? [{ id: 'po', tone: 'info' as const, icon: Coins, title: 'PO menunggu persetujuan', detail: `${m.poPending} Purchase Order perlu approval.`, to: '/purchasing', cta: 'Proses approval' }] : []),
    ...(m.fleetBreakdown > 0 ? [{ id: 'bd', tone: 'warning' as const, icon: AlertTriangle, title: 'Unit alat berat breakdown', detail: `${m.fleetBreakdown} unit tidak operasional.`, to: '/fleet', cta: 'Lihat status' }] : []),
  ]

  const rkabTop = [...state.budgets].sort((a, b) => b.actualIdr - a.actualIdr).slice(0, 7)

  const planVsActual = m.monthly.slice(-7).map((r) => ({
    label: r.label,
    revenue: r.label.startsWith('Okt') ? m.revenueMtd : Math.round(r.label === 'Sep 26' ? 61_200_000 : REVENUE_PLAN * (0.88 + ((r.coal % 40) / 200))),
    plan: REVENUE_PLAN,
    tonnage: r.label === 'Okt 26' ? m.monthly[m.monthly.length - 1].coal : r.coal,
  }))
  void planVsActual

  return (
    <div>
      <PageHeader
        title="Dashboard Eksekutif"
        subtitle="Ringkasan terpadu kinerja operasional, komersial, K3LH, dan keuangan seluruh site tambang batu bara PT MIFA Bara Nusantara."
        actions={
          <>
            <span className="chip">
              <CalendarClock className="h-3.5 w-3.5" />
              Data per {dmy('2026-10-15')}
            </span>
            <Link to="/reports" className="btn btn-secondary">
              Pusat Laporan
            </Link>
            <Link to="/production" className="btn btn-primary">
              Input Produksi
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {/* ------------------------------- KPI ------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Produksi Batubara (MTD)"
          value={num(m.coalMtd)}
          unit="MT"
          delta={m.coalDelta}
          deltaLabel="vs bulan lalu"
          icon={<Mountain className="h-4 w-4" />}
          tone="amber"
          onClick={() => navigate('/production')}
        />
        <StatCard
          label="Overburden Removal (MTD)"
          value={num1(m.obMtd)}
          unit="Bcm"
          delta={m.obDelta}
          deltaLabel={`Stripping ratio ${num1(m.srMtd)}`}
          icon={<Truck className="h-4 w-4" />}
          tone="sky"
        />
        <StatCard
          label="Pendapatan Penjualan (MTD)"
          value={num(Math.round(m.revenueMtd / 1000))}
          unit="Ribuan USD"
          delta={m.revenueDelta}
          deltaLabel={`Total ${usd(m.revenueTotal)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Realisasi RKAB"
          value={pct1(m.rkabPct)}
          delta={undefined}
          deltaLabel={`${idr(m.actualTotal)} dari ${idr(m.budgetTotal)}`}
          icon={<Percent className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          label="Ketersediaan Armada"
          value={pct1(m.fleetAvailability)}
          delta={undefined}
          deltaLabel={`${m.fleetOperating}/${m.fleetTotal} unit operating`}
          icon={<Gauge className="h-4 w-4" />}
          tone="sky"
        />
        <StatCard
          label="Hari Tanpa LTI"
          value={num(m.daysSinceLTI)}
          unit="hari"
          delta={undefined}
          deltaLabel={`LTIFR ${m.ltifr.toFixed(2)} · TRIR ${m.trir.toFixed(2)}`}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone={m.daysSinceLTI > 180 ? 'emerald' : 'rose'}
        />
      </div>

      {/* ----------------------------- Alerts ----------------------------- */}
      {criticalAlerts.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-amber-500/[0.06] px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Perhatian Manajemen</h3>
            <span className="ml-1 text-xs text-zinc-500">{criticalAlerts.length} item memerlukan tindakan</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {criticalAlerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:flex-nowrap">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    a.tone === 'danger' ? 'bg-rose-500/10 text-rose-400' : a.tone === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                  }`}
                >
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{a.title}</p>
                  <p className="truncate text-xs text-zinc-500">{a.detail}</p>
                </div>
                <Link to={a.to} className="btn btn-outline btn-sm shrink-0">
                  {a.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ----------------------------- Charts ----------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame
          className="xl:col-span-2"
          title="Tren Produksi & Overburden Removal"
          subtitle="Akumulasi tonase batu bara (MT) dan overburden (Bcm) 12 bulan terakhir"
          actions={<Badge tone="amber">Stripping ratio {num1(m.srMtd)}</Badge>}
        >
          <TrendChart
            data={m.monthly.map((r) => ({ label: r.label, coal: r.coal, ob: r.ob }))}
            xKey="label"
            series={[
              { key: 'coal', name: 'Batu bara (MT)', color: '#f59e0b' },
              { key: 'ob', name: 'Overburden (Bcm)', color: '#38bdf8', type: 'line' },
            ]}
            valueFormatter={(v) => num1(v)}
            yTickFormatter={(v) => (v >= 1000 ? `${num1(v / 1000)} rb` : num1(v))}
          />
        </ChartFrame>

        <ChartFrame title="Komposisi Penjualan" subtitle="Kontribusi pendapatan domestik vs ekspor (USD)">
          <DonutChart
            data={[
              { name: 'Ekspor', value: Math.round(m.exportRevenue), color: '#38bdf8' },
              { name: 'Domestik', value: Math.round(m.domesticRevenue), color: '#f59e0b' },
            ]}
            valueFormatter={(v) => usd(v)}
            centerValue={usd(m.revenueTotal)}
            centerLabel="Total penjualan"
            height={240}
          />
        </ChartFrame>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame
          className="xl:col-span-2"
          title="Realisasi Penjualan vs Rencana RKAB"
          subtitle="Nilai penjualan aktual dibanding target bulanan (USD)"
          actions={<Badge tone="emerald">Target {usd(REVENUE_PLAN)}/bln</Badge>}
        >
          <BarsChart
            data={m.revenueByMonth.slice(-8).map((r) => ({ label: r.label, revenue: r.revenue / 1_000_000, plan: REVENUE_PLAN / 1_000_000 }))}
            xKey="label"
            series={[
              { key: 'revenue', name: 'Aktual (Jt USD)', color: '#f59e0b' },
              { key: 'plan', name: 'Rencana (Jt USD)', color: '#52525b' },
            ]}
            valueFormatter={(v) => `${num1(v)} Jt USD`}
            yTickFormatter={(v) => `${num1(v)} Jt`}
          />
        </ChartFrame>

        <Card>
          <CardHeader title="Realisasi RKAB 2026" subtitle={`${pct1(m.rkabPct)} dari ${idr(m.budgetTotal)}`} icon={<Percent className="h-4 w-4" />} />
          <div className="space-y-4 p-5">
            {rkabTop.map((b) => {
              const p = (b.actualIdr / b.budgetIdr) * 100
              return (
                <div key={b.id}>
                  <Progress
                    value={p}
                    tone={p > 100 ? 'rose' : p > 90 ? 'amber' : 'emerald'}
                    label={b.category}
                  />
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {idr(b.actualIdr)} / {idr(b.budgetIdr)}
                  </p>
                </div>
              )
            })}
            <Link to="/finance" className="btn btn-ghost btn-sm w-full justify-between">
              Lihat detail RKAB
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ---------------------------- Site table --------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Performa Site Tambang"
            subtitle="Produksi, stok, armada, dan BBM per site — bulan berjalan"
            icon={<Mountain className="h-4 w-4" />}
            actions={<Link to="/production" className="btn btn-ghost btn-sm">Detail</Link>}
          />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Site</th>
                  <th className="text-right">Produksi (MT)</th>
                  <th className="text-right">OB (Bcm)</th>
                  <th className="text-right">SR</th>
                  <th className="text-right">Stok (MT)</th>
                  <th>Armada</th>
                  <th className="text-right">BBM</th>
                </tr>
              </thead>
              <tbody>
                {m.bySite.map((r) => (
                  <tr key={r.site.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-800 font-mono text-[10px] font-bold text-amber-400">{r.site.code}</span>
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{r.site.name}</p>
                          <p className="text-[11px] text-zinc-600">{r.site.region}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tbl-num">{num(r.coal)}</td>
                    <td className="tbl-num">{num1(r.ob)}</td>
                    <td className="tbl-num">{num1(r.sr)}</td>
                    <td className="tbl-num">
                      <div>
                        <p className="font-mono">{num(r.stock)}</p>
                        <p className="text-[10px] text-zinc-600">{pct1((r.stock / r.capacity) * 100)} kapasitas</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-300">
                          {r.fleetOp}/{r.fleetTotal}
                        </span>
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(r.fleetOp / Math.max(r.fleetTotal, 1)) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="tbl-num">
                      <span className={r.fuelPct < 35 ? 'text-rose-400' : r.fuelPct < 55 ? 'text-amber-400' : 'text-emerald-400'}>{pct1(r.fuelPct)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Aktivitas Terbaru" subtitle="Jejak audit aktivitas pengguna sistem" icon={<Activity className="h-4 w-4" />} />
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
            {recentActivity.map((a, i) => (
              <div key={a.id} className="flex gap-3 border-b border-zinc-800/60 px-5 py-3 last:border-0">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  {i < recentActivity.length - 1 && <span className="mt-1 w-px flex-1 bg-zinc-800" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-[13px] leading-snug text-zinc-300">
                    <span className="font-medium text-zinc-100">{a.user}</span> {a.action}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {a.time} WIB &middot; {a.module}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ------------------------- Bottom widgets -------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Level BBM (Solar)" subtitle={`Rata-rata ${pct1(m.fuelLevelPct)} kapasitas tangki`} icon={<Fuel className="h-4 w-4" />} />
          <div className="space-y-3 p-5">
            {state.fuelTanks.map((t) => {
              const p = (t.levelL / t.capacityL) * 100
              return (
                <div key={t.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-zinc-400">{t.name}</span>
                    <span className={p < 30 ? 'font-mono text-rose-400' : 'font-mono text-zinc-300'}>{pct1(p)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div className={`h-full rounded-full ${p < 30 ? 'bg-rose-500' : p < 55 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pelanggan Teratas" subtitle="Berdasarkan nilai kontrak terlaksana" icon={<Banknote className="h-4 w-4" />} />
          <div className="space-y-3.5 p-5">
            {m.byCustomer.slice(0, 5).map((c, i) => (
              <div key={c.customer.id} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-zinc-200">{c.customer.name}</p>
                  <p className="text-[11px] text-zinc-600">
                    {mtShort(c.tonnage)} &middot; {c.customer.type}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-amber-400">{usd(c.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Indikator K3LH" subtitle="Statistik keselamatan 12 bulan terakhir" icon={<HardHat className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              { label: 'LTI', value: num(m.lti12), tone: m.lti12 === 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'LTIFR', value: m.ltifr.toFixed(2), tone: 'text-zinc-100' },
              { label: 'TRIR', value: m.trir.toFixed(2), tone: 'text-zinc-100' },
              { label: 'Near Miss', value: num(state.incidents.filter((i) => i.type === 'Near Miss').length), tone: 'text-sky-400' },
              { label: 'Insiden Terbuka', value: num(m.openIncidents), tone: 'text-amber-400' },
              { label: 'Kepatuhan LH', value: pct1(m.complianceRate), tone: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[11px] text-zinc-500">{s.label}</p>
                <p className={`mt-1 font-mono text-lg font-bold ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 px-5 py-3">
            <Link to="/hse" className="btn btn-ghost btn-sm w-full justify-between">
              Modul K3LH
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Status Kontrak" subtitle="Volume kontrak vs realisasi pengangkutan" icon={<CheckCircle2 className="h-4 w-4" />} />
          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs text-zinc-400">Volume terlaksana</span>
                <span className="font-mono text-sm text-zinc-100">{pct1((m.contractLifted / m.contractVolume) * 100)}</span>
              </div>
              <Progress value={(m.contractLifted / m.contractVolume) * 100} tone="amber" />
              <p className="mt-1.5 text-[11px] text-zinc-600">
                {mtShort(m.contractLifted)} dari {mtShort(m.contractVolume)} kontrak aktif
              </p>
            </div>
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              {[
                { label: 'Kontrak aktif', value: num(state.contracts.filter((c) => c.status === 'Active').length), tone: 'text-emerald-400' },
                { label: 'Akan berakhir', value: num(state.contracts.filter((c) => c.status === 'Expiring').length), tone: 'text-amber-400' },
                { label: 'Piutang outstanding', value: usd(m.arOutstanding), tone: 'text-sky-400' },
                { label: 'Utang usaha', value: idr(m.apOutstanding), tone: 'text-violet-400' },
                { label: 'Royalti PNBP YTD', value: usd(m.royaltyYtd), tone: 'text-rose-400' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{r.label}</span>
                  <span className={`font-mono font-semibold ${r.tone}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <Link to="/finance" className="btn btn-ghost btn-sm w-full justify-between">
              Modul Keuangan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ------------------------- Quick nav strip ------------------------- */}
      <SectionTitle title="Akses Cepat Modul" subtitle="Lompat langsung ke modul operasional yang paling sering digunakan" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { to: '/production', label: 'Produksi', icon: Mountain, desc: `${num(m.coalMtd)} MT bulan ini` },
          { to: '/fleet', label: 'Armada', icon: Truck, desc: `${m.fleetOperating}/${m.fleetTotal} unit aktif` },
          { to: '/inventory', label: 'Inventory', icon: Package, desc: `${mtShort(m.stockTotal)} stok batubara` },
          { to: '/sales', label: 'Penjualan', icon: TrendingUp, desc: `${num(state.salesOrders.length)} sales order` },
          { to: '/purchasing', label: 'Pembelian', icon: Coins, desc: `${m.poPending} PO menunggu` },
          { to: '/hse', label: 'K3LH', icon: ShieldCheck, desc: `${m.daysSinceLTI} hari tanpa LTI` },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="panel group flex flex-col gap-2 p-4 transition-colors hover:border-amber-500/40 hover:bg-zinc-800/40">
            <q.icon className="h-5 w-5 text-amber-400 transition-transform group-hover:scale-110" />
            <p className="text-sm font-semibold text-zinc-100">{q.label}</p>
            <p className="text-[11px] text-zinc-500">{q.desc}</p>
          </Link>
        ))}
      </div>

      {criticalAlerts.length === 0 && (
        <Card className="mt-4">
          <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="Semua indikator dalam kondisi normal" hint="Tidak ada peringatan kritis pada periode ini." />
        </Card>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-zinc-600">
        <span className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" /> Terakhir disinkronisasi: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
        </span>
        <span className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5" /> Kurs acuan USD/IDR {num(15850)}
        </span>
        <span className="flex items-center gap-1.5">
          <Factory className="h-3.5 w-3.5" /> {sum(m.bySite.map((b) => b.site.reservesMt)).toFixed(1)} juta MT cadangan terukur
        </span>
      </div>
    </div>
  )
}
