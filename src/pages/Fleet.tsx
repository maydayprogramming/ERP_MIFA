import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CircleDot,
  Cog,
  Fuel,
  Gauge,
  Hammer,
  Plus,
  Truck,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics } from '../lib/metrics'
import { dmy, idr, num, num1, pct1, sum } from '../lib/format'
import type { Equipment, MaintenanceJob } from '../types'

type TabId = 'units' | 'maintenance' | 'utilization' | 'tyres'

const STATUS_ACTION: Record<Equipment['status'], Equipment['status']> = {
  Operating: 'Standby',
  Standby: 'Operating',
  Maintenance: 'Operating',
  Breakdown: 'Maintenance',
  Idle: 'Operating',
}

export default function Fleet() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('units')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [woOpen, setWoOpen] = useState(false)
  const [detail, setDetail] = useState<Equipment | null>(null)

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.code ?? '-'

  const units = useMemo(
    () => state.equipment.filter((e) => (typeFilter === 'all' || e.type === typeFilter) && (statusFilter === 'all' || e.status === statusFilter)),
    [state.equipment, typeFilter, statusFilter],
  )

  const unitColumns: Column<Equipment>[] = [
    {
      key: 'code',
      header: 'Kode Unit',
      sort: (r) => r.code,
      render: (r) => (
        <div>
          <p className="font-mono text-[13px] font-medium text-amber-400">{r.code}</p>
          <p className="text-[11px] text-ink-faintest">{siteName(r.siteId)}</p>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Unit / Model',
      sort: (r) => r.name,
      render: (r) => (
        <div>
          <p className="text-[13px] text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-faintest">
            {r.brand} &middot; {r.year}
          </p>
        </div>
      ),
    },
    { key: 'type', header: 'Tipe', sort: (r) => r.type, render: (r) => <Badge tone="neutral">{r.type}</Badge> },
    { key: 'hourMeter', header: 'Hour Meter', align: 'right', sort: (r) => r.hourMeter, render: (r) => <span className="font-mono">{num(r.hourMeter)} jam</span> },
    {
      key: 'availabilityPct',
      header: 'Availability',
      align: 'right',
      sort: (r) => r.availabilityPct,
      render: (r) => (
        <div>
          <p className={`font-mono ${r.availabilityPct < 80 ? 'text-rose-400' : r.availabilityPct < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct1(r.availabilityPct)}</p>
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${r.availabilityPct}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'utilizationPct',
      header: 'Utilisasi',
      align: 'right',
      sort: (r) => r.utilizationPct,
      render: (r) => (
        <div>
          <p className="font-mono text-ink">{pct1(r.utilizationPct)}</p>
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.utilizationPct}%` }} />
          </div>
        </div>
      ),
    },
    { key: 'fuelLph', header: 'BBM', align: 'right', sort: (r) => r.fuelLph, render: (r) => <span className="font-mono text-ink-muted">{num(r.fuelLph)} L/jam</span> },
    {
      key: 'service',
      header: 'Servis Berikutnya',
      align: 'right',
      sort: (r) => r.nextServiceHm,
      render: (r) => {
        const due = r.nextServiceHm - r.hourMeter
        return (
          <span className={`font-mono ${due <= 0 ? 'text-rose-400' : due <= 60 ? 'text-amber-400' : 'text-ink-muted'}`}>
            {due <= 0 ? `Terlambat ${num(-due)} jam` : `${num(due)} jam`}
          </span>
        )
      },
    },
    { key: 'tyreLifePct', header: 'Umur Ban', align: 'right', sort: (r) => r.tyreLifePct, render: (r) => <span className={`font-mono ${r.tyreLifePct < 20 ? 'text-rose-400' : 'text-ink-muted'}`}>{pct1(r.tyreLifePct)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const woColumns: Column<MaintenanceJob>[] = [
    { key: 'woNo', header: 'No. WO', sort: (r) => r.woNo, render: (r) => <span className="font-mono text-[13px] font-medium text-amber-400">{r.woNo}</span> },
    {
      key: 'equipment',
      header: 'Unit',
      sort: (r) => state.equipment.find((e) => e.id === r.equipmentId)?.code ?? '',
      render: (r) => {
        const eq = state.equipment.find((e) => e.id === r.equipmentId)
        return (
          <div>
            <p className="font-mono text-[12px] text-ink">{eq?.code}</p>
            <p className="text-[11px] text-ink-faintest">{eq?.name}</p>
          </div>
        )
      },
    },
    { key: 'type', header: 'Jenis', sort: (r) => r.type, render: (r) => <Badge tone={r.type === 'Major' ? 'violet' : r.type === 'Corrective' ? 'warning' : 'info'}>{r.type}</Badge> },
    { key: 'description', header: 'Deskripsi Pekerjaan', render: (r) => <span className="text-[12px] text-ink-muted">{r.description}</span> },
    { key: 'scheduledDate', header: 'Jadwal', sort: (r) => r.scheduledDate, render: (r) => <span className="text-ink-muted">{dmy(r.scheduledDate)}</span> },
    { key: 'mechanic', header: 'Mekanik', render: (r) => <span className="text-[12px] text-ink-faint">{r.mechanic}</span> },
    { key: 'costIdr', header: 'Estimasi Biaya', align: 'right', sort: (r) => r.costIdr, render: (r) => <span className="font-mono text-emerald-400">{idr(r.costIdr)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const byType = useMemo(() => {
    const map = new Map<string, { availability: number[]; utilization: number[]; count: number }>()
    state.equipment.forEach((e) => {
      const cur = map.get(e.type) ?? { availability: [], utilization: [], count: 0 }
      cur.availability.push(e.availabilityPct)
      cur.utilization.push(e.utilizationPct)
      cur.count += 1
      map.set(e.type, cur)
    })
    return [...map.entries()].map(([type, v]) => ({
      label: type.replace(' Haul Truck', '').replace(' Water Truck', ''),
      type,
      availability: v.availability.reduce((a, b) => a + b, 0) / v.availability.length,
      utilization: v.utilization.reduce((a, b) => a + b, 0) / v.utilization.length,
      count: v.count,
    }))
  }, [state.equipment])

  const statusMix = (['Operating', 'Standby', 'Maintenance', 'Breakdown', 'Idle'] as const).map((st) => ({
    name: st,
    value: state.equipment.filter((e) => e.status === st).length,
  }))

  const availabilityTrend = m.monthly.map((r, i) => ({
    label: r.label,
    availability: 88 + ((i * 7) % 9) - (i % 3),
    utilization: 72 + ((i * 11) % 18) - (i % 4),
  }))

  const maintenanceCost = sum(state.maintenance.map((w) => w.costIdr))
  const tyreAlerts = state.equipment.filter((e) => e.tyreLifePct < 20)

  return (
    <div>
      <PageHeader
        title="Armada & Pemeliharaan"
        subtitle="Manajemen alat berat tambang — excavator, haul truck, dozer, grader, dan unit pendukung beserta jadwal pemeliharaan dan analisis ketersediaan."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setWoOpen(true)}>
            Work Order
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Unit Terdaftar" value={num(m.fleetTotal)} unit="unit" hint={`${m.fleetOperating} sedang beroperasi`} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Physical Availability" value={pct1(m.fleetAvailability)} hint="Target ≥ 85%" icon={<Gauge className="h-4 w-4" />} tone={m.fleetAvailability >= 85 ? 'emerald' : 'amber'} />
        <StatCard label="Utilisasi" value={pct1(m.fleetUtilization)} hint="Target ≥ 80%" icon={<CircleDot className="h-4 w-4" />} tone={m.fleetUtilization >= 80 ? 'emerald' : 'amber'} />
        <StatCard label="Unit Breakdown" value={num(m.fleetBreakdown)} unit="unit" hint={`${m.fleetMaintenance} dalam pemeliharaan`} icon={<AlertTriangle className="h-4 w-4" />} tone={m.fleetBreakdown > 0 ? 'rose' : 'emerald'} />
        <StatCard label="WO Jatuh Tempo" value={num(m.overdueWO)} unit="WO" hint={`${m.dueSoon} unit mendekati servis`} icon={<Wrench className="h-4 w-4" />} tone={m.overdueWO > 0 ? 'rose' : 'emerald'} />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'units', label: 'Daftar Unit', count: units.length },
            { id: 'maintenance', label: 'Pemeliharaan', count: state.maintenance.length },
            { id: 'utilization', label: 'Analisis Kinerja' },
            { id: 'tyres', label: 'Manajemen Ban' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'units' && (
        <Card className="mt-4">
          <CardHeader
            title="Daftar Alat Berat"
            subtitle="Status operasional, hour meter, ketersediaan, dan jadwal servis setiap unit"
            actions={
              <>
                <Select
                  options={['all', 'Excavator', 'Haul Truck', 'Dozer', 'Grader', 'Water Truck', 'Drill', 'Loader'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Tipe' : v }))}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="!h-8 !w-36 !text-xs"
                />
                <Select
                  options={['all', 'Operating', 'Standby', 'Maintenance', 'Breakdown', 'Idle'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Status' : v }))}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="!h-8 !w-36 !text-xs"
                />
              </>
            }
          />
          <DataTable
            data={units}
            columns={unitColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.code} ${r.name} ${r.type} ${r.operator} ${r.status}`}
            searchPlaceholder="Cari kode unit, model, operator…"
            exportName="armada"
            initialSort={{ key: 'code', dir: 'asc' }}
            onRowClick={setDetail}
            actions={(r) => (
              <Button size="sm" variant="outline" onClick={() => actions.setEquipmentStatus(r.id, STATUS_ACTION[r.status])}>
                → {STATUS_ACTION[r.status]}
              </Button>
            )}
          />
        </Card>
      )}

      {tab === 'maintenance' && (
        <Card className="mt-4">
          <CardHeader
            title="Work Order Pemeliharaan"
            subtitle="Jadwal preventive, corrective, major overhaul, dan inspeksi berkala"
            actions={<Badge tone={m.overdueWO ? 'danger' : 'success'}>{m.overdueWO} terlambat</Badge>}
          />
          <DataTable
            data={state.maintenance}
            columns={woColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.woNo} ${r.description} ${r.mechanic} ${r.status}`}
            searchPlaceholder="Cari WO, deskripsi, mekanik…"
            exportName="work-order"
            initialSort={{ key: 'scheduledDate', dir: 'desc' }}
            actions={(r) => (
              <>
                {r.status !== 'Completed' && (
                  <Button size="sm" variant="ghost" onClick={() => actions.setMaintenanceStatus(r.id, r.status === 'Scheduled' ? 'In Progress' : 'Completed')}>
                    {r.status === 'Scheduled' ? 'Mulai' : 'Selesaikan'}
                  </Button>
                )}
                {r.status === 'Completed' && <StatusBadge value="Completed" />}
              </>
            )}
          />
        </Card>
      )}

      {tab === 'utilization' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Availability & Utilisasi per Tipe Unit"
              subtitle="Rata-rata physical availability dan utilisasi alat berat"
              actions={<Badge tone="sky">Fleet {pct1(m.fleetAvailability)}</Badge>}
            >
              <BarsChart
                data={byType}
                xKey="label"
                series={[
                  { key: 'availability', name: 'Availability (%)', color: '#38bdf8' },
                  { key: 'utilization', name: 'Utilisasi (%)', color: '#f59e0b' },
                ]}
                valueFormatter={(v) => pct1(v)}
                yTickFormatter={(v) => `${num1(v)}%`}
              />
            </ChartFrame>

            <ChartFrame title="Status Armada" subtitle="Sebaran unit berdasarkan status operasional">
              <DonutChart
                data={statusMix.map((s) => ({ name: s.name, value: s.value, color: s.name === 'Operating' ? '#34d399' : s.name === 'Standby' ? '#fbbf24' : s.name === 'Maintenance' ? '#38bdf8' : s.name === 'Breakdown' ? '#fb7185' : '#71717a' }))}
                centerValue={num(m.fleetOperating)}
                centerLabel="Unit operating"
                height={240}
              />
            </ChartFrame>
          </div>

          <ChartFrame
            title="Tren Availability & Utilisasi"
            subtitle="Perkembangan kinerja armada 12 bulan terakhir (%)"
          >
            <TrendChart
              data={availabilityTrend}
              xKey="label"
              series={[
                { key: 'availability', name: 'Availability (%)', color: '#34d399' },
                { key: 'utilization', name: 'Utilisasi (%)', color: '#a78bfa', type: 'line' },
              ]}
              valueFormatter={(v) => pct1(v)}
              yTickFormatter={(v) => `${num1(v)}%`}
            />
          </ChartFrame>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Biaya Pemeliharaan" subtitle="Akumulasi biaya work order" icon={<Hammer className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {(['Preventive', 'Corrective', 'Major', 'Inspection'] as const).map((t) => {
                  const cost = sum(state.maintenance.filter((w) => w.type === t).map((w) => w.costIdr))
                  return (
                    <div key={t} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                      <span className="text-xs text-ink-muted">{t}</span>
                      <span className="font-mono text-sm font-semibold text-ink-strong">{idr(cost)}</span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-ink">Total</span>
                  <span className="font-mono text-sm font-bold text-amber-400">{idr(maintenanceCost)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Konsumsi Bahan Bakar" subtitle="Estimasi konsumsi solar per tipe unit" icon={<Fuel className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {byType.slice(0, 6).map((t) => {
                  const units = state.equipment.filter((e) => e.type === t.type)
                  const lph = units.reduce((a, b) => a + b.fuelLph, 0) / units.length
                  return (
                    <div key={t.type} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                      <span className="text-xs text-ink-muted">
                        {t.type} <span className="text-ink-faintest">({t.count})</span>
                      </span>
                      <span className="font-mono text-sm text-ink-strong">{num(lph)} L/jam</span>
                    </div>
                  )
                })}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-600 dark:text-amber-200">
                  Estimasi konsumsi harian armada ± 145.000 liter solar, setara {idr(145000 * 14300)} per hari.
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Unit Prioritas Servis" subtitle="Unit yang mendekati atau melewati jadwal servis" icon={<CalendarClock className="h-4 w-4" />} />
              <div className="divide-y divide-line">
                {[...state.equipment]
                  .sort((a, b) => a.nextServiceHm - a.hourMeter - (b.nextServiceHm - b.hourMeter))
                  .slice(0, 6)
                  .map((e) => {
                    const due = e.nextServiceHm - e.hourMeter
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${due <= 0 ? 'bg-rose-500/10 text-rose-400' : due <= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-2 text-ink-muted'}`}>
                          <Cog className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[12px] text-ink">{e.code}</p>
                          <p className="truncate text-[11px] text-ink-faintest">{e.name}</p>
                        </div>
                        <span className={`shrink-0 font-mono text-xs ${due <= 0 ? 'text-rose-400' : due <= 60 ? 'text-amber-400' : 'text-ink-faint'}`}>
                          {due <= 0 ? `${num(-due)} jam` : `${num(due)} jam`}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'tyres' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Rata-rata Umur Ban" value={pct1(sum(state.equipment.map((e) => e.tyreLifePct)) / state.equipment.length)} hint="Siklus pemakaian ban OTR" icon={<CircleDot className="h-4 w-4" />} tone="violet" />
            <StatCard label="Perlu Penggantian" value={num(tyreAlerts.length)} unit="unit" hint="Umur ban di bawah 20%" icon={<AlertTriangle className="h-4 w-4" />} tone={tyreAlerts.length ? 'rose' : 'emerald'} />
            <StatCard label="Stok Ban Gudang" value={num(sum(state.warehouseItems.filter((i) => i.category === 'Tyres').map((i) => i.stock)))} unit="pcs" hint="Siap pasang" icon={<Truck className="h-4 w-4" />} tone="sky" />
            <StatCard label="Biaya Ban / Bulan" value={idr(1_850_000_000)} hint="Estimasi penggantian & repair" icon={<Hammer className="h-4 w-4" />} tone="zinc" />
          </div>

          <Card>
            <CardHeader title="Status Umur Ban per Unit" subtitle="Monitoring siklus pemakaian ban untuk perencanaan penggantian" actions={<Badge tone={tyreAlerts.length ? 'warning' : 'success'}>{tyreAlerts.length} unit prioritas</Badge>} />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {state.equipment.map((e) => (
                <div key={e.id} className="rounded-lg border border-line bg-surface-2/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[12px] font-medium text-ink">{e.code}</p>
                    <span className={`font-mono text-xs font-semibold ${e.tyreLifePct < 20 ? 'text-rose-400' : e.tyreLifePct < 45 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct1(e.tyreLifePct)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-ink-faintest">{e.name}</p>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className={`h-full rounded-full ${e.tyreLifePct < 20 ? 'bg-rose-500' : e.tyreLifePct < 45 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${e.tyreLifePct}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] text-ink-faintest">{e.tyreLifePct < 20 ? 'Segera ganti' : e.tyreLifePct < 45 ? 'Pantau tekanan & tread' : 'Kondisi baik'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <SectionTitle title="Indikator Pemeliharaan" subtitle="Metrik efektivitas program perawatan aset" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'MTBF Rata-rata', value: '186 jam', hint: 'Mean time between failure', tone: 'text-emerald-400' },
          { title: 'MTTR Rata-rata', value: '4,2 jam', hint: 'Mean time to repair', tone: 'text-sky-400' },
          { title: 'Kepatuhan PM', value: pct1(92.6), hint: 'Preventive maintenance on time', tone: 'text-amber-400' },
          { title: 'Biaya per Jam Operasi', value: idr(maintenanceCost / sum(state.equipment.map((e) => e.hourMeter))), hint: 'Realisasi biaya maintenance', tone: 'text-violet-400' },
        ].map((s) => (
          <Card key={s.title}>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-ink-faint">{s.title}</p>
              <p className={`mt-1.5 font-mono text-xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-[11px] text-ink-faintest">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <WorkOrderForm open={woOpen} onClose={() => setWoOpen(false)} />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.code} — ${detail.name}` : ''}
        subtitle={detail ? `${detail.brand} ${detail.model} · ${siteName(detail.siteId)}` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
            {detail && (
              <Button variant="primary" onClick={() => { actions.setEquipmentStatus(detail.id, STATUS_ACTION[detail.status]); setDetail(null) }}>
                Ubah → {STATUS_ACTION[detail.status]}
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/50 p-4">
              <div>
                <p className="text-[11px] text-ink-faint">Status Unit</p>
                <div className="mt-1">
                  <StatusBadge value={detail.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-ink-faint">Hour Meter</p>
                <p className="font-mono text-xl font-bold text-ink-strong">{num(detail.hourMeter)} jam</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Tipe', value: detail.type },
                { label: 'Tahun', value: num(detail.year) },
                { label: 'Operator', value: detail.operator },
                { label: 'Availability', value: pct1(detail.availabilityPct) },
                { label: 'Utilisasi', value: pct1(detail.utilizationPct) },
                { label: 'Konsumsi BBM', value: `${num(detail.fuelLph)} L/jam` },
                { label: 'Servis terakhir', value: `${num(detail.lastServiceHm)} jam` },
                { label: 'Servis berikutnya', value: `${num(detail.nextServiceHm)} jam` },
                { label: 'Umur ban', value: pct1(detail.tyreLifePct) },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
                  <p className="text-[11px] text-ink-faint">{r.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-strong">{r.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="label">Riwayat Work Order</p>
              <div className="space-y-2">
                {state.maintenance
                  .filter((w) => w.equipmentId === detail.id)
                  .slice(0, 4)
                  .map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] text-ink">{w.description}</p>
                        <p className="text-[11px] text-ink-faintest">
                          {w.woNo} &middot; {dmy(w.scheduledDate)}
                        </p>
                      </div>
                      <StatusBadge value={w.status} />
                    </div>
                  ))}
                {state.maintenance.filter((w) => w.equipmentId === detail.id).length === 0 && <p className="text-xs text-ink-faintest">Belum ada work order untuk unit ini.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function WorkOrderForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    equipmentId: state.equipment[0]?.id ?? '',
    type: 'Preventive' as MaintenanceJob['type'],
    description: '',
    scheduledDate: '2026-10-20',
    costIdr: '',
    mechanic: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Work Order Pemeliharaan"
      subtitle="Penjadwalan pekerjaan preventive, corrective, atau overhaul"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Wrench className="h-4 w-4" />}
            onClick={() => {
              if (!form.description) {
                toast('Deskripsi pekerjaan wajib diisi', 'warning')
                return
              }
              actions.addMaintenance({
                equipmentId: form.equipmentId,
                type: form.type,
                description: form.description,
                scheduledDate: form.scheduledDate,
                costIdr: Number(form.costIdr || 0),
                mechanic: form.mechanic || 'Tim Internal',
              })
              setForm({ ...form, description: '', costIdr: '', mechanic: '' })
              onClose()
            }}
          >
            Jadwalkan WO
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Unit Alat Berat" required>
          <Select options={state.equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} value={form.equipmentId} onChange={(e) => set('equipmentId', e.target.value)} />
        </Field>
        <Field label="Jenis Pekerjaan">
          <Select options={['Preventive', 'Corrective', 'Major', 'Inspection']} value={form.type} onChange={(e) => set('type', e.target.value)} />
        </Field>
        <Field label="Tanggal Jadwal">
          <Input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
        </Field>
        <Field label="Estimasi Biaya (Rp)">
          <Input type="number" min={0} placeholder="contoh: 150000000" value={form.costIdr} onChange={(e) => set('costIdr', e.target.value)} />
        </Field>
        <Field label="Mekanik / Tim Pelaksana" className="sm:col-span-2">
          <Input placeholder="Nama mekanik atau tim" value={form.mechanic} onChange={(e) => set('mechanic', e.target.value)} />
        </Field>
        <Field label="Deskripsi Pekerjaan" required className="sm:col-span-2">
          <Textarea placeholder="Uraian pekerjaan, komponen yang diganti, estimasi downtime…" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
