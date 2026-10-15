import { useMemo, useState } from 'react'
import {
  Anchor,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  Plus,
  Ship,
  Timer,
  TrendingUp,
  Users,
  Warehouse,
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
  type Column,
} from '../components/ui'
import { BarsChart, ChartFrame, DonutChart } from '../components/charts'
import { useERP } from '../store'
import { bcm, dmy, mtShort, num, num1, pct1, sum, toCSV } from '../lib/format'
import { TODAY } from '../store'
import type { Jetty, Vessel } from '../types'

type TabId = 'jetty' | 'vessel' | 'loading'

const JETTY_TONE: Record<Jetty['status'], 'success' | 'warning' | 'neutral'> = {
  Operating: 'success',
  Maintenance: 'warning',
  Idle: 'neutral',
}

const VESSEL_TONE: Record<Vessel['status'], 'warning' | 'info' | 'success' | 'neutral' | 'danger'> = {
  Waiting: 'warning',
  Loading: 'info',
  Loaded: 'success',
  Sailed: 'neutral',
  Cancelled: 'danger',
}

export default function Shipping() {
  const { state, actions, toast } = useERP()
  const [tab, setTab] = useState<TabId>('jetty')
  const [siteFilter, setSiteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

  const sites = state.sites
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? '-'
  const customerName = (id: string) => state.customers.find((c) => c.id === id)?.name ?? '-'
  const contractCode = (id: string) => state.contracts.find((c) => c.id === id)?.code ?? '-'
  const jettyName = (id: string) => state.jetties.find((j) => j.id === id)?.name ?? '-'

  /* ------------------------------ Ringkasan ----------------------------- */
  const jetties = state.jetties
  const vessels = state.vessels
  const totalCapacity = sum(jetties.filter((j) => j.status === 'Operating').map((j) => j.capacityMtPerDay))
  const loadingNow = vessels.filter((v) => v.status === 'Loading')
  const loadingVolume = sum(loadingNow.map((v) => v.tonnageMt))
  const waiting = vessels.filter((v) => v.status === 'Waiting')
  const waitingVolume = sum(waiting.map((v) => v.tonnageMt))
  const sailedMtd = vessels.filter((v) => v.status === 'Sailed')
  const sailedVolume = sum(sailedMtd.map((v) => v.loadedMt))
  const bargesLoading = sum(jetties.map((j) => j.bargesLoading))
  const avgProgress =
    loadingNow.length > 0
      ? sum(loadingNow.map((v) => (v.tonnageMt > 0 ? (v.loadedMt / v.tonnageMt) * 100 : 0))) / loadingNow.length
      : 0

  const filteredVessels = useMemo(
    () => vessels.filter((v) => (siteFilter === 'all' || jetties.find((j) => j.id === v.jettyId)?.siteId === siteFilter) && (statusFilter === 'all' || v.status === statusFilter)),
    [vessels, jetties, siteFilter, statusFilter],
  )

  /* -------------------------------- Grafik ------------------------------- */
  const jettyChart = useMemo(
    () =>
      jetties.map((j) => ({
        name: j.code,
        kapasitas: Math.round(j.capacityMtPerDay / 1000),
        muatan: Math.round(sum(vessels.filter((v) => v.jettyId === j.id).map((v) => v.tonnageMt)) / 1000),
      })),
    [jetties, vessels],
  )

  const vesselMix = useMemo(() => {
    const map = new Map<string, number>()
    vessels.forEach((v) => map.set(v.type, (map.get(v.type) ?? 0) + 1))
    return Array.from(map.entries()).map(([k, v]) => ({ name: k === 'Vessel' ? 'Kapal Laut' : k === 'Barge' ? 'Barge/Tongkang' : 'Tug Boat', value: v }))
  }, [vessels])

  const destinationChart = useMemo(() => {
    const map = new Map<string, number>()
    sailedMtd.forEach((v) => {
      const dest = v.destination.split(',')[0].trim() || v.destination
      map.set(dest, (map.get(dest) ?? 0) + v.loadedMt)
    })
    return Array.from(map.entries())
      .map(([k, v]) => ({ name: k, volume: Math.round(v / 1000) }))
      .sort((a, b) => b.volume - a.volume)
  }, [sailedMtd])

  /* -------------------------------- Kolom -------------------------------- */
  const jettyColumns: Column<Jetty>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.code}</span> },
    {
      key: 'name',
      header: 'Nama Fasilitas',
      sort: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-faintest">{siteName(r.siteId)}</p>
        </div>
      ),
    },
    { key: 'capacity', header: 'Kapasitas', align: 'right', sort: (r) => r.capacityMtPerDay, render: (r) => <span className="font-mono text-xs text-ink">{num(r.capacityMtPerDay)} MT/hari</span> },
    { key: 'draft', header: 'Draft Maks', align: 'right', sort: (r) => r.maxDraftM, render: (r) => <span className="font-mono text-xs text-ink-muted">{num1(r.maxDraftM)} m</span> },
    {
      key: 'loading',
      header: 'Barge/Kapal Loading',
      align: 'right',
      sort: (r) => r.bargesLoading,
      render: (r) => (
        <div className="text-right">
          <p className="font-mono text-xs font-semibold text-ink">{num(r.bargesLoading)}</p>
          <p className="text-[11px] text-ink-faintest">unit</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={JETTY_TONE[r.status]} dot>{r.status}</Badge> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) =>
        r.status === 'Maintenance' ? (
          <Button size="sm" variant="success" onClick={() => toast(`${r.name} kembali beroperasi`, 'success')}>
            Selesai Perbaikan
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => toast(`${r.name} dijadwalkan perbaikan`, 'info')}>
            Jadwalkan Perbaikan
          </Button>
        ),
    },
  ]

  const vesselColumns: Column<Vessel>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.code}</span> },
    {
      key: 'name',
      header: 'Nama Kapal/Barge',
      sort: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-faintest">{r.type}</p>
        </div>
      ),
    },
    { key: 'jetty', header: 'Fasilitas Muat', sort: (r) => jettyName(r.jettyId), render: (r) => <span className="text-ink-muted">{jettyName(r.jettyId)}</span> },
    { key: 'customer', header: 'Pembeli', sort: (r) => customerName(r.customerId), render: (r) => <span className="text-ink-muted">{customerName(r.customerId)}</span> },
    { key: 'contract', header: 'Kontrak', render: (r) => <span className="font-mono text-[11px] text-ink-faint">{contractCode(r.contractId)}</span> },
    {
      key: 'eta',
      header: 'ETA / ETB',
      sort: (r) => r.eta,
      render: (r) => (
        <div>
          <p className="text-xs text-ink">{dmy(r.eta)}</p>
          <p className="text-[11px] text-ink-faintest">ETB {dmy(r.etb)}</p>
        </div>
      ),
    },
    {
      key: 'tonnage',
      header: 'Tonnase',
      align: 'right',
      sort: (r) => r.tonnageMt,
      render: (r) => (
        <div className="text-right">
          <p className="font-mono text-xs text-ink">{num(r.tonnageMt)} MT</p>
          <p className="text-[11px] text-ink-faintest">DWT {num(r.dwtMt)}</p>
        </div>
      ),
    },
    { key: 'surveyor', header: 'Surveyor', render: (r) => <span className="text-ink-muted">{r.surveyor}</span> },
    { key: 'destination', header: 'Tujuan', render: (r) => <span className="text-[11px] text-ink-muted">{r.destination}</span> },
    { key: 'bl', header: 'BL Number', render: (r) => <span className="font-mono text-[11px] text-ink-faint">{r.blNumber || '—'}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === 'Waiting' && (
            <Button size="sm" variant="outline" onClick={() => actions.setVesselStatus(r.id, 'Loading')}>
              Mulai Muat
            </Button>
          )}
          {r.status === 'Loading' && (
            <Button size="sm" variant="success" onClick={() => actions.setVesselStatus(r.id, 'Loaded')}>
              Selesai Muat
            </Button>
          )}
          {r.status === 'Loaded' && (
            <Button size="sm" variant="primary" onClick={() => actions.setVesselStatus(r.id, 'Sailed')}>
              Lepas Tambat
            </Button>
          )}
          {(r.status === 'Waiting' || r.status === 'Loading') && (
            <Button size="sm" variant="ghost" onClick={() => actions.setVesselStatus(r.id, 'Cancelled')}>
              Batal
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Pelabuhan & Bongkar Muat"
        subtitle="Pengelolaan fasilitas jetty & barge loader, penjadwalan kapal/barge, serta monitoring proses bongkar muat batubara sampai terbitnya Bill of Lading."
        actions={
          <>
            <Button
              variant="outline"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() =>
                toCSV(
                  vessels.map((v) => ({
                    Kode: v.code,
                    Nama: v.name,
                    Tipe: v.type,
                    Fasilitas: jettyName(v.jettyId),
                    Pembeli: customerName(v.customerId),
                    Kontrak: contractCode(v.contractId),
                    ETA: v.eta,
                    ETB: v.etb,
                    'Tonnase (MT)': v.tonnageMt,
                    'Dimuat (MT)': v.loadedMt,
                    Surveyor: v.surveyor,
                    Tujuan: v.destination,
                    'BL Number': v.blNumber || '-',
                    Status: v.status,
                  })),
                  'kapal-barge',
                )
              }
            >
              Ekspor
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Jadwalkan Kapal
            </Button>
          </>
        }
      >
        <Tabs<TabId>
          tabs={[
            { id: 'jetty', label: 'Fasilitas Muat', count: jetties.length },
            { id: 'vessel', label: 'Kapal & Barge', count: vessels.length },
            { id: 'loading', label: 'Monitoring Muat' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      {/* -------------------------------- KPI -------------------------------- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kapasitas Muat Aktif" value={mtShort(totalCapacity)} unit="/hari" tone="sky" icon={<Anchor className="h-4 w-4" />} hint={`${jetties.filter((j) => j.status === 'Operating').length} fasilitas beroperasi`} />
        <StatCard label="Sedang Dimuat" value={num(loadingNow.length)} unit="unit" tone="amber" delta={avgProgress} deltaLabel={`rata-rata progres ${pct1(avgProgress)}`} icon={<Ship className="h-4 w-4" />} />
        <StatCard label="Menunggu di Luar" value={num(waiting.length)} unit="unit" tone="violet" icon={<Timer className="h-4 w-4" />} hint={`${mtShort(waitingVolume)} ton tersimpan jadwal`} />
        <StatCard label="Terkirim (BL Terbit)" value={mtShort(sailedVolume)} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} hint={`${sailedMtd.length} pengiriman selesai`} />
      </div>

      {/* =========================== FASILITAS MUAT ======================== */}
      {tab === 'jetty' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartFrame title="Kapasitas vs Muatan Terjadwal per Fasilitas" subtitle="dalam ribu metrik ton — kapasitas harian vs akumulasi tonase terjadwal">
                <BarsChart
                  data={jettyChart}
                  xKey="name"
                  series={[
                    { key: 'kapasitas', name: 'Kapasitas (ribu MT/hari)', color: '#38bdf8' },
                    { key: 'muatan', name: 'Muatan terjadwal (ribu MT)', color: '#f59e0b' },
                  ]}
                  yTickFormatter={(v) => num(v)}
                />
              </ChartFrame>
            </div>
            <ChartFrame title="Komposisi Armada Kapal" subtitle="Jumlah unit berdasarkan tipe">
              <DonutChart data={vesselMix} />
            </ChartFrame>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Barge/Kapal Loading" value={num(bargesLoading)} unit="unit" tone="amber" icon={<Ship className="h-4 w-4" />} hint="berada di sisi jetty" />
            <StatCard label="Fasilitas Operasi" value={num(jetties.filter((j) => j.status === 'Operating').length)} unit="dari 4" tone="emerald" icon={<Anchor className="h-4 w-4" />} />
            <StatCard label="Fasilitas Perbaikan" value={num(jetties.filter((j) => j.status === 'Maintenance').length)} unit="unit" tone="rose" icon={<Gauge className="h-4 w-4" />} hint="tidak dapat digunakan" />
            <StatCard label="Muatan Terjadwal" value={mtShort(loadingVolume + waitingVolume)} tone="violet" icon={<TrendingUp className="h-4 w-4" />} hint="loading + waiting" />
          </div>

          <Card>
            <CardHeader title="Daftar Fasilitas Muat" subtitle="Jetty dan barge loader beserta kapasitas, draft maksimum, dan status operasional" />
            <DataTable
              data={jetties}
              columns={jettyColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${r.name} ${siteName(r.siteId)} ${r.status}`}
              searchPlaceholder="Cari fasilitas muat..."
              pageSize={8}
              exportName="fasilitas-muat"
              emptyLabel="Belum ada fasilitas muat"
            />
          </Card>
        </div>
      )}

      {/* ========================== KAPAL & BARGE ========================== */}
      {tab === 'vessel' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Volume Pengiriman per Tujuan" subtitle="dalam ribu metrik ton — berdasarkan pengiriman dengan BL terbit" />
              <div className="p-4 pt-2">
                <BarsChart data={destinationChart} xKey="name" series={[{ key: 'volume', name: 'Volume (ribu MT)', color: '#10b981' }]} yTickFormatter={(v) => num(v)} />
              </div>
            </Card>
            <div className="space-y-4 lg:col-span-2">
              <StatCard label="Total Unit Terjadwal" value={num(vessels.length)} unit="unit" tone="amber" icon={<Ship className="h-4 w-4" />} hint="kapal laut, barge, tug boat" />
              <StatCard label="Pembeli Aktif" value={num(new Set(vessels.map((v) => v.customerId)).size)} unit="perusahaan" tone="sky" icon={<Users className="h-4 w-4" />} />
              <StatCard label="Surveyor Terlibat" value={num(new Set(vessels.map((v) => v.surveyor)).size)} unit="lembaga" tone="violet" icon={<Warehouse className="h-4 w-4" />} hint="SGS, Intertek, dll" />
            </div>
          </div>

          <Card>
            <CardHeader
              title="Jadwal Kapal & Barge"
              subtitle="Penjadwalan kedatangan, penugasan fasilitas muat, dan status operasional bongkar muat"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua site' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                    className="input-sm"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua status' },
                      ...(['Waiting', 'Loading', 'Loaded', 'Sailed', 'Cancelled'] as const).map((s) => ({ value: s, label: s })),
                    ]}
                    className="input-sm"
                  />
                </div>
              }
            />
            <DataTable
              data={filteredVessels}
              columns={vesselColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${r.name} ${r.type} ${customerName(r.customerId)} ${r.destination} ${r.surveyor} ${r.status}`}
              searchPlaceholder="Cari kapal/barge..."
              pageSize={10}
              exportName="kapal-barge"
              initialSort={{ key: 'eta', dir: 'asc' }}
              emptyLabel="Belum ada kapal/barge terjadwal"
            />
          </Card>
        </div>
      )}

      {/* ========================= MONITORING MUAT ========================= */}
      {tab === 'loading' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartFrame title="Muatan Aktif per Fasilitas" subtitle="dalam ribu metrik ton — tonase kapal/barge yang sedang dimuat">
              <BarsChart
                data={loadingNow.map((v) => ({
                  name: v.name,
                  tonase: Math.round(v.tonnageMt / 1000),
                  termuat: Math.round(v.loadedMt / 1000),
                }))}
                xKey="name"
                series={[
                  { key: 'tonase', name: 'Tonase kontrak (ribu MT)', color: '#64748b' },
                  { key: 'termuat', name: 'Sudah dimuat (ribu MT)', color: '#f59e0b' },
                ]}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Ringkasan Bongkar Muat" subtitle="Indikator performa operasional pelabuhan" />
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {[
                  { l: 'Total fasilitas muat', v: num(jetties.length), u: 'unit' },
                  { l: 'Kapasitas harian gabungan', v: mtShort(totalCapacity), u: 'MT/hari' },
                  { l: 'Unit loading saat ini', v: num(loadingNow.length), u: 'unit' },
                  { l: 'Unit menunggu', v: num(waiting.length), u: 'unit' },
                  { l: 'BL terbit', v: num(sailedMtd.filter((v) => v.blNumber).length), u: 'dokumen' },
                  { l: 'Rata-rata laju muat', v: `${num(loadingNow.length ? sum(loadingNow.map((v) => v.loadingRateMtPerDay)) / loadingNow.length : 0)}`, u: 'MT/hari' },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                    <p className="text-[11px] uppercase tracking-wider text-ink-faint">{k.l}</p>
                    <p className="mt-1 text-lg font-bold text-ink">
                      {k.v} <span className="text-[11px] font-medium text-ink-faint">{k.u}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Progres Muatan Aktif" subtitle="Pantau tonase terpenuhi, estimasi sisa waktu muat, dan jadwal lepas tambat" />
            {loadingNow.length === 0 ? (
              <EmptyState icon={<Ship className="h-10 w-10" />} title="Tidak ada muatan aktif" hint="Belum ada kapal/barge yang sedang dalam proses bongkar muat." />
            ) : (
              <div className="grid gap-4 p-4 lg:grid-cols-2">
                {loadingNow.map((v) => {
                  const prog = v.tonnageMt > 0 ? (v.loadedMt / v.tonnageMt) * 100 : 0
                  const remaining = Math.max(0, v.tonnageMt - v.loadedMt)
                  const etaDays = v.loadingRateMtPerDay > 0 ? remaining / v.loadingRateMtPerDay : 0
                  const progTone = prog >= 100 ? 'emerald' : prog >= 60 ? 'amber' : 'sky'
                  return (
                    <div key={v.id} className="rounded-xl border border-line bg-surface-2/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{v.name}</p>
                          <p className="text-[11px] text-ink-faint">
                            {v.type} · {jettyName(v.jettyId)} · {customerName(v.customerId)}
                          </p>
                        </div>
                        <Badge tone={VESSEL_TONE[v.status]} dot>
                          {v.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <p className="kpi-value text-2xl">{pct1(prog)}</p>
                          <p className="text-[11px] text-ink-faintest">tonase terpenuhi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs text-ink">
                            {num(v.loadedMt)} / {num(v.tonnageMt)} MT
                          </p>
                          <p className="text-[11px] text-ink-faintest">laju {num(v.loadingRateMtPerDay)} MT/hari</p>
                        </div>
                      </div>

                      <Progress value={prog} tone={progTone} className="mt-2" />

                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-faintest">Sisa</p>
                          <p className="font-mono text-xs font-semibold text-ink">{num(remaining)} MT</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-faintest">Estimasi</p>
                          <p className="font-mono text-xs font-semibold text-ink">{num1(etaDays)} hari</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-faintest">Tujuan</p>
                          <p className="truncate text-xs font-semibold text-ink" title={v.destination}>
                            {v.destination.split(',')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Prosedur Bongkar Muat" subtitle="Alur operasional standar pengiriman batubara melalui fasilitas pelabuhan" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: '1. Nomination', d: 'Pembeli mengajukan nominasi kapal dan mengirim instruksi pemuatan sesuai kontrak.' },
                { t: '2. NOR & ETB', d: 'Fasilitas menerbitkan Notice of Readiness dan Estimated Time of Berthing.' },
                { t: '3. Draft Survey', d: 'Surveyor independen melakukan draft survey awal sebelum bongkar muat dimulai.' },
                { t: '4. Loading & BL', d: 'Pemuatan berlangsung sesuai laju kontrak; BL terbit setelah draft survey akhir.' },
              ].map((s) => (
                <div key={s.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <p className="text-sm font-semibold text-amber-400">{s.t}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{s.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================== MODAL ============================== */}
      <VesselForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sites={sites}
        jetties={jetties}
        customers={state.customers}
        contracts={state.contracts}
        onSubmit={(r) => {
          actions.addVessel(r)
          setFormOpen(false)
        }}
      />
    </div>
  )
}

/* --------------------------- Form Jadwal Kapal --------------------------- */

function VesselForm({
  open,
  onClose,
  sites,
  jetties,
  customers,
  contracts,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  sites: Array<{ id: string; name: string }>
  jetties: Jetty[]
  customers: Array<{ id: string; name: string }>
  contracts: Array<{ id: string; code: string }>
  onSubmit: (r: {
    siteId: string
    name: string
    type: Vessel['type']
    dwtMt: number
    customerId: string
    contractId: string
    jettyId: string
    eta: string
    etb: string
    tonnageMt: number
    loadingRateMtPerDay: number
    surveyor: Vessel['surveyor']
    destination: string
  }) => void
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [name, setName] = useState('')
  const [type, setType] = useState<Vessel['type']>('Vessel')
  const [dwtMt, setDwtMt] = useState(0)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [contractId, setContractId] = useState(contracts[0]?.id ?? '')
  const [eta, setEta] = useState(TODAY)
  const [etb, setEtb] = useState(TODAY)
  const [tonnageMt, setTonnageMt] = useState(0)
  const [loadingRateMtPerDay, setLoadingRateMtPerDay] = useState(0)
  const [surveyor, setSurveyor] = useState<Vessel['surveyor']>('SGS')
  const [destination, setDestination] = useState('')
  const { toast } = useERP()

  const siteJetties = jetties.filter((j) => j.siteId === siteId)
  const jettyId = siteJetties[0]?.id ?? ''

  const submit = () => {
    if (!name.trim() || !destination.trim()) {
      toast('Nama kapal dan tujuan wajib diisi', 'warning')
      return
    }
    if (tonnageMt <= 0) {
      toast('Tonase muatan harus lebih dari 0 MT', 'warning')
      return
    }
    if (!jettyId) {
      toast('Site terpilih belum memiliki fasilitas muat', 'warning')
      return
    }
    onSubmit({ siteId, name, type, dwtMt, customerId, contractId, jettyId, eta, etb, tonnageMt, loadingRateMtPerDay, surveyor, destination })
  }

  return (
    <Modal open={open} onClose={onClose} title="Jadwalkan Kapal / Barge" subtitle="Registrasi kedatangan kapal atau barge untuk proses bongkar muat">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site" required>
          <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Tipe Unit" required>
          <Select value={type} onChange={(e) => setType(e.target.value as Vessel['type'])} options={['Vessel', 'Barge', 'Tug Boat'].map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Nama Kapal/Barge" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="MV Nama Kapal" />
        </Field>
        <Field label="Deadweight (DWT, MT)">
          <Input type="number" value={dwtMt || ''} onChange={(e) => setDwtMt(Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Pembeli" required>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Kontrak" required>
          <Select value={contractId} onChange={(e) => setContractId(e.target.value)} options={contracts.map((c) => ({ value: c.id, label: c.code }))} />
        </Field>
        <Field label="Fasilitas Muat" required hint={siteJetties.length === 0 ? 'Site ini belum memiliki fasilitas muat' : undefined}>
          <Select value={jettyId} onChange={() => undefined} options={siteJetties.map((j) => ({ value: j.id, label: `${j.name} (${j.code})` }))} disabled={siteJetties.length === 0} />
        </Field>
        <Field label="Surveyor">
          <Select value={surveyor} onChange={(e) => setSurveyor(e.target.value as Vessel['surveyor'])} options={['SGS', 'Cointeste', 'Intertek', 'Geoservices'].map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="ETA (Kedatangan)" required>
          <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
        </Field>
        <Field label="ETB (Mulai Muat)" required>
          <Input type="date" value={etb} onChange={(e) => setEtb(e.target.value)} />
        </Field>
        <Field label="Tonase Muatan (MT)" required>
          <Input type="number" value={tonnageMt || ''} onChange={(e) => setTonnageMt(Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Laju Muat (MT/hari)">
          <Input type="number" value={loadingRateMtPerDay || ''} onChange={(e) => setLoadingRateMtPerDay(Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Tujuan / Pelabuhan Bongkar" required className="sm:col-span-2">
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Port of Qinzhou, China" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={submit}>Simpan Jadwal</Button>
      </div>
    </Modal>
  )
}

/* ------------------------- Panel informasi samping ----------------------- */

export function ShippingLegend() {
  return (
    <Card>
      <CardHeader title="Keterangan Status" subtitle="Definisi status operasional pelabuhan" />
      <div className="space-y-2 p-4">
        {[
          { s: 'Waiting', d: 'Kapal sudah NOR namun belum mendapatkan slot fasilitas muat.' },
          { s: 'Loading', d: 'Proses bongkar muat sedang berlangsung di jetty/barge loader.' },
          { s: 'Loaded', d: 'Pemuatan selesai, menunggu draft survey akhir & terbitnya BL.' },
          { s: 'Sailed', d: 'Kapal telah lepas tambat dan berangkat menuju pelabuhan tujuan.' },
        ].map((x) => (
          <div key={x.s} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/40 p-2.5">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-ink">{x.s}</p>
              <p className="text-[11px] text-ink-muted">{x.d}</p>
            </div>
          </div>
        ))}
      </div>
      <SectionTitle title="Catatan" />
      <p className="px-4 pb-4 text-xs leading-relaxed text-ink-faint">
        Kapasitas muat harian mengacu pada spesifikasi kontrak pengangkutan; deviasi laju muat lebih dari 10% dari rencana wajib
        dilaporkan ke bagian komersial untuk penyesuaian demurrage.
      </p>
    </Card>
  )
}
