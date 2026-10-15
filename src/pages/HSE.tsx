import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Droplets,
  GraduationCap,
  Leaf,
  Plus,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Users,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics, monthLabel } from '../lib/metrics'
import { dmy, num, num1, pct1, sum } from '../lib/format'
import type { EnvironmentalReading, Incident, TrainingRecord } from '../types'

type TabId = 'incidents' | 'training' | 'environment' | 'stats'

const SEVERITY_TONE: Record<Incident['severity'], 'danger' | 'warning' | 'info' | 'neutral'> = {
  Fatality: 'danger',
  Major: 'danger',
  Moderate: 'warning',
  Minor: 'info',
}

export default function HSE() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('incidents')
  const [typeFilter, setTypeFilter] = useState('all')
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [trainingOpen, setTrainingOpen] = useState(false)
  const [detail, setDetail] = useState<Incident | null>(null)

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.code ?? '-'

  const incidents = useMemo(
    () => state.incidents.filter((i) => typeFilter === 'all' || i.type === typeFilter),
    [state.incidents, typeFilter],
  )

  const incidentColumns: Column<Incident>[] = [
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
    { key: 'siteId', header: 'Site', sort: (r) => siteName(r.siteId), render: (r) => <span className="chip">{siteName(r.siteId)}</span> },
    { key: 'type', header: 'Klasifikasi', sort: (r) => r.type, render: (r) => <StatusBadge value={r.type} /> },
    {
      key: 'severity',
      header: 'Severity',
      sort: (r) => r.severity,
      render: (r) => <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity}</Badge>,
    },
    { key: 'description', header: 'Deskripsi Kejadian', render: (r) => <span className="text-[12px] text-ink">{r.description}</span> },
    { key: 'person', header: 'Pihak Terlibat', render: (r) => <span className="text-[12px] text-ink-muted">{r.person}</span> },
    { key: 'department', header: 'Departemen', render: (r) => <span className="text-[12px] text-ink-faint">{r.department}</span> },
    { key: 'lostDays', header: 'Hari Hilang', align: 'right', sort: (r) => r.lostDays, render: (r) => <span className={`font-mono ${r.lostDays > 0 ? 'text-rose-400' : 'text-ink-faint'}`}>{num(r.lostDays)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const trainingColumns: Column<TrainingRecord>[] = [
    { key: 'program', header: 'Program Pelatihan', sort: (r) => r.program, render: (r) => <span className="text-ink">{r.program}</span> },
    { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
    { key: 'siteId', header: 'Site', sort: (r) => siteName(r.siteId), render: (r) => <span className="chip">{siteName(r.siteId)}</span> },
    { key: 'attendees', header: 'Peserta', align: 'right', sort: (r) => r.attendees, render: (r) => <span className="font-mono">{num(r.attendees)} org</span> },
    { key: 'trainer', header: 'Penyelenggara', render: (r) => <span className="text-[12px] text-ink-faint">{r.trainer}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const envColumns: Column<EnvironmentalReading>[] = [
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
    { key: 'siteId', header: 'Site', render: (r) => <span className="chip">{siteName(r.siteId)}</span> },
    { key: 'parameter', header: 'Parameter', sort: (r) => r.parameter, render: (r) => <span className="text-ink">{r.parameter}</span> },
    { key: 'location', header: 'Lokasi Sampling', render: (r) => <span className="text-[12px] text-ink-faint">{r.location}</span> },
    {
      key: 'value',
      header: 'Hasil',
      align: 'right',
      sort: (r) => r.value,
      render: (r) => (
        <span className="font-mono text-ink-strong">
          {num1(r.value)} {r.unit}
        </span>
      ),
    },
    {
      key: 'threshold',
      header: 'Baku Mutu',
      align: 'right',
      sort: (r) => r.threshold,
      render: (r) => (
        <span className="font-mono text-ink-faint">
          {num1(r.threshold)} {r.unit}
        </span>
      ),
    },
    {
      key: 'ratio',
      header: 'Rasio',
      align: 'right',
      sort: (r) => r.value / r.threshold,
      render: (r) => (
        <span className={`font-mono ${r.value > r.threshold ? 'text-rose-400' : r.value > r.threshold * 0.9 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {pct1((r.value / r.threshold) * 100)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  /* Statistik */
  const incidentByType = (['LTI', 'MTC', 'FAC', 'Near Miss', 'Environmental', 'Property Damage'] as const).map((t) => ({
    name: t,
    value: state.incidents.filter((i) => i.type === t).length,
  }))

  const incidentTrend = m.months.map((mo, i) => {
    const idx = (i % 9) + 1
    return {
      label: monthLabel(mo),
      incidents: idx,
      nearMiss: idx * 2 + (i % 3),
      observations: idx * 5 + 8,
    }
  })

  const trainingByCategory = Object.entries(
    state.training.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.attendees
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const compliance = state.environmental.filter((e) => e.status === 'Compliant').length
  const complianceRate = (compliance / state.environmental.length) * 100
  const trainingPlanned = state.training.filter((t) => t.status === 'Scheduled')
  const totalAttendees = sum(state.training.map((t) => t.attendees))

  return (
    <div>
      <PageHeader
        title="K3LH & Lingkungan"
        subtitle="Sistem manajemen keselamatan, kesehatan kerja, dan lingkungan — pelaporan insiden, investigasi, pelatihan, serta monitoring baku mutu AMDAL."
        actions={
          <>
            <Button variant="secondary" icon={<GraduationCap className="h-4 w-4" />} onClick={() => setTrainingOpen(true)}>
              Jadwalkan Pelatihan
            </Button>
            <Button variant="primary" icon={<ShieldAlert className="h-4 w-4" />} onClick={() => setIncidentOpen(true)}>
              Lapor Insiden
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Hari Tanpa LTI" value={num(m.daysSinceLTI)} unit="hari" hint="Rekor tertinggi 412 hari" icon={<ShieldCheck className="h-4 w-4" />} tone={m.daysSinceLTI > 180 ? 'emerald' : 'rose'} />
        <StatCard label="LTIFR" value={m.ltifr.toFixed(2)} hint="Lost time injury freq. rate" icon={<TrendingDown className="h-4 w-4" />} tone="sky" />
        <StatCard label="TRIR" value={m.trir.toFixed(2)} hint="Total recordable incident rate" icon={<Activity className="h-4 w-4" />} tone="violet" />
        <StatCard label="Insiden Terbuka" value={num(m.openIncidents)} unit="kasus" hint={`${state.incidents.filter((i) => i.status === 'Investigation').length} dalam investigasi`} icon={<AlertTriangle className="h-4 w-4" />} tone={m.openIncidents > 0 ? 'amber' : 'emerald'} />
        <StatCard label="Kepatuhan Lingkungan" value={pct1(complianceRate)} hint={`${m.envExceeded} pembacaan melampaui ambang`} icon={<Leaf className="h-4 w-4" />} tone={complianceRate > 95 ? 'emerald' : 'amber'} />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'incidents', label: 'Insiden & Investigasi', count: incidents.length },
            { id: 'training', label: 'Pelatihan & Kompetensi', count: state.training.length },
            { id: 'environment', label: 'Monitoring Lingkungan', count: state.environmental.length },
            { id: 'stats', label: 'Statistik & Analisis' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'incidents' && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {state.incidents
              .filter((i) => i.status !== 'Closed')
              .slice(0, 3)
              .map((i) => (
                <Card key={i.id} className="border-amber-500/20">
                  <div className="flex items-start gap-3 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-ink-strong">{i.type}</p>
                        <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{i.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="chip">{siteName(i.siteId)}</span>
                        <span className="chip">{dmy(i.date)}</span>
                        <StatusBadge value={i.status} />
                      </div>
                      <p className="mt-2 text-[11px] text-ink-faintest">
                        <span className="text-ink-faint">Tindakan:</span> {i.correctiveAction}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            {state.incidents.filter((i) => i.status !== 'Closed').length === 0 && (
              <Card className="lg:col-span-3">
                <div className="flex items-center gap-3 p-5 text-sm text-ink-muted">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Seluruh insiden telah ditutup. Tidak ada kasus aktif yang memerlukan tindak lanjut.
                </div>
              </Card>
            )}
          </div>

          <Card className="mt-4">
            <CardHeader
              title="Register Insiden"
              subtitle="Seluruh kejadian K3LH beserta klasifikasi, investigasi, dan status penutupan"
              actions={
                <Select
                  options={['all', 'LTI', 'MTC', 'FAC', 'Near Miss', 'Environmental', 'Property Damage'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Klasifikasi' : v }))}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="!h-8 !w-40 !text-xs"
                />
              }
            />
            <DataTable
              data={incidents}
              columns={incidentColumns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.description} ${r.person} ${r.department} ${r.type} ${r.status}`}
              searchPlaceholder="Cari deskripsi, nama, departemen…"
              exportName="register-insiden"
              initialSort={{ key: 'date', dir: 'desc' }}
              onRowClick={setDetail}
              actions={(r) =>
                r.status !== 'Closed' ? (
                  <Button size="sm" variant="outline" onClick={() => actions.setIncidentStatus(r.id, r.status === 'Open' ? 'Investigation' : 'Closed')}>
                    {r.status === 'Open' ? 'Investigasi' : 'Tutup Kasus'}
                  </Button>
                ) : (
                  <StatusBadge value="Closed" />
                )
              }
            />
          </Card>
        </>
      )}

      {tab === 'training' && (
        <Card className="mt-4">
          <CardHeader
            title="Program Pelatihan & Kompetensi"
            subtitle="Rencana dan realisasi pelatihan K3, teknis, lingkungan, dan sertifikasi POP"
            actions={<Badge tone="info">{trainingPlanned.length} akan datang</Badge>}
          />
          <DataTable
            data={state.training}
            columns={trainingColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.program} ${r.category} ${r.trainer} ${r.status}`}
            searchPlaceholder="Cari program, kategori, penyelenggara…"
            exportName="pelatihan"
            initialSort={{ key: 'date', dir: 'desc' }}
          />
        </Card>
      )}

      {tab === 'environment' && (
        <Card className="mt-4">
          <CardHeader
            title="Monitoring Kualitas Lingkungan"
            subtitle="Pembacaan parameter udara, air, dan kebisingan terhadap baku mutu AMDAL"
            actions={<Badge tone={m.envExceeded ? 'danger' : 'success'}>{m.envExceeded} melebihi ambang</Badge>}
          />
          <DataTable
            data={state.environmental}
            columns={envColumns}
            rowKey={(r) => r.id}
            pageSize={14}
            search={(r) => `${r.parameter} ${r.location} ${r.status}`}
            searchPlaceholder="Cari parameter, lokasi, status…"
            exportName="monitoring-lingkungan"
            initialSort={{ key: 'date', dir: 'desc' }}
          />
        </Card>
      )}

      {tab === 'stats' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Tren Insiden & Observasi"
              subtitle="Jumlah insiden, near miss, dan observasi prosedur per bulan"
              actions={<Badge tone="emerald">Target zero fatality</Badge>}
            >
              <TrendChart
                data={incidentTrend}
                xKey="label"
                series={[
                  { key: 'incidents', name: 'Insiden tercatat', color: '#fb7185' },
                  { key: 'nearMiss', name: 'Near miss', color: '#f59e0b' },
                  { key: 'observations', name: 'Observasi prosedur', color: '#38bdf8', type: 'line' },
                ]}
                valueFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <ChartFrame title="Klasifikasi Insiden" subtitle="Sebaran kejadian berdasarkan klasifikasi K3LH">
              <DonutChart
                data={incidentByType.map((d, i) => ({ ...d, color: ['#fb7185', '#f59e0b', '#fbbf24', '#38bdf8', '#34d399', '#a78bfa'][i] }))}
                centerValue={num(state.incidents.length)}
                centerLabel="Total kejadian"
                height={240}
              />
            </ChartFrame>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame title="Peserta Pelatihan per Kategori" subtitle="Akumulasi jumlah peserta (orang)">
              <BarsChart
                data={trainingByCategory}
                xKey="name"
                series={[{ key: 'value', name: 'Peserta (org)', color: '#a78bfa' }]}
                valueFormatter={(v) => `${num(v)} org`}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>

            <Card className="xl:col-span-2">
              <CardHeader title="Piramida Pengendalian Risiko" subtitle="Tingkat efektivitas tindakan pengendalian K3LH" icon={<ShieldCheck className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {[
                  { level: 'Eliminasi', desc: 'Penghapusan sumber bahaya melalui desain tambang', eff: 96, count: 4 },
                  { level: 'Substitusi', desc: 'Penggantian metode atau material berisiko tinggi', eff: 91, count: 7 },
                  { level: 'Rekayasa', desc: 'Guardrail, barrier, ventilasi, sistem alarm', eff: 88, count: 23 },
                  { level: 'Administrasi', desc: 'Prosedur kerja, izin kerja, briefing', eff: 79, count: 41 },
                  { level: 'APD', desc: 'Alat pelindung diri sebagai lapisan terakhir', eff: 68, count: 86 },
                ].map((r) => (
                  <div key={r.level} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <p className="text-[13px] font-medium text-ink">{r.level}</p>
                      <p className="text-[10px] text-ink-faintest">{r.count} tindakan</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${r.eff}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-faintest">{r.desc}</p>
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold text-emerald-400">{r.eff}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <SectionTitle title="Indikator Kinerja K3LH" subtitle="Metrik utama sistem manajemen keselamatan dan lingkungan" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Rekor Hari Tanpa LTI', value: num(m.daysSinceLTI), sub: 'Target 365 hari', tone: m.daysSinceLTI > 180 ? 'text-emerald-400' : 'text-amber-400', icon: ShieldCheck },
          { label: 'Manjam Terpaparkan', value: '1,96 Jt jam', sub: 'Akumulasi manhours YTD', tone: 'text-sky-400', icon: Users },
          { label: 'Pelatihan Terlaksana', value: `${state.training.filter((t) => t.status === 'Completed').length} program`, sub: `${num(totalAttendees)} total peserta`, tone: 'text-violet-400', icon: BookOpen },
          { label: 'Observasi Prosedur', value: num(486), sub: 'Safe & unsafe observation', tone: 'text-amber-400', icon: Droplets },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2/60 text-ink-muted">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">{s.label}</p>
                <p className={`mt-1 font-mono text-xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-[11px] text-ink-faintest">{s.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <IncidentForm open={incidentOpen} onClose={() => setIncidentOpen(false)} />
      <TrainingForm open={trainingOpen} onClose={() => setTrainingOpen(false)} />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Detail Insiden"
        subtitle={detail ? `${detail.type} · ${siteName(detail.siteId)} · ${dmy(detail.date)}` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
            {detail && detail.status !== 'Closed' && (
              <Button variant="primary" onClick={() => { actions.setIncidentStatus(detail.id, 'Closed'); setDetail(null) }}>
                Tutup Kasus
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge value={detail.type} />
              <Badge tone={SEVERITY_TONE[detail.severity]}>{detail.severity}</Badge>
              <StatusBadge value={detail.status} />
            </div>
            <div>
              <p className="label">Deskripsi Kejadian</p>
              <p className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm leading-relaxed text-ink">{detail.description}</p>
            </div>
            <div>
              <p className="label">Tindakan Korektif</p>
              <p className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm leading-relaxed text-ink">{detail.correctiveAction}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Pihak Terlibat', value: detail.person },
                { label: 'Departemen', value: detail.department },
                { label: 'Hari Hilang Kerja', value: num(detail.lostDays) },
                { label: 'Site', value: siteName(detail.siteId) },
                { label: 'Tanggal', value: dmy(detail.date) },
                { label: 'Klasifikasi', value: detail.type },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
                  <p className="text-[11px] text-ink-faint">{r.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-strong">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* -------------------------------- Forms ------------------------------- */

function IncidentForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    date: '2026-10-15',
    siteId: state.sites[0]?.id ?? '',
    type: 'Near Miss' as Incident['type'],
    severity: 'Minor' as Incident['severity'],
    description: '',
    person: '',
    department: 'Produksi',
    correctiveAction: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Laporan Insiden K3LH"
      subtitle="Pelaporan kejadian keselamatan, kesehatan kerja, atau lingkungan"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<ShieldAlert className="h-4 w-4" />}
            onClick={() => {
              if (!form.description) {
                toast('Deskripsi kejadian wajib diisi', 'warning')
                return
              }
              actions.addIncident({
                date: form.date,
                siteId: form.siteId,
                type: form.type,
                severity: form.severity,
                description: form.description,
                person: form.person || 'Tidak disebutkan',
                department: form.department,
                correctiveAction: form.correctiveAction || 'Menunggu investigasi',
              })
              setForm({ ...form, description: '', person: '', correctiveAction: '' })
              onClose()
            }}
          >
            Simpan Laporan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tanggal Kejadian">
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Site">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Klasifikasi Insiden" required>
          <Select options={['LTI', 'MTC', 'FAC', 'Near Miss', 'Environmental', 'Property Damage']} value={form.type} onChange={(e) => set('type', e.target.value)} />
        </Field>
        <Field label="Tingkat Keparahan">
          <Select options={['Minor', 'Moderate', 'Major', 'Fatality']} value={form.severity} onChange={(e) => set('severity', e.target.value)} />
        </Field>
        <Field label="Pihak Terlibat">
          <Input placeholder="Nama karyawan/pihak terkait" value={form.person} onChange={(e) => set('person', e.target.value)} />
        </Field>
        <Field label="Departemen">
          <Select options={['Produksi', 'Pemeliharaan', 'HSE', 'Logistik', 'Perencanaan Tambang', 'Umum']} value={form.department} onChange={(e) => set('department', e.target.value)} />
        </Field>
        <Field label="Deskripsi Kejadian" required className="sm:col-span-2">
          <Textarea placeholder="Uraian kejadian, lokasi, waktu, faktor penyebab, dan dampak…" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Tindakan Korektif Awal" className="sm:col-span-2">
          <Textarea placeholder="Tindakan segera yang telah dilakukan di lapangan…" value={form.correctiveAction} onChange={(e) => set('correctiveAction', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function TrainingForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    program: '',
    category: 'K3 Umum' as TrainingRecord['category'],
    date: '2026-10-25',
    siteId: state.sites[0]?.id ?? '',
    attendees: '',
    trainer: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Jadwalkan Pelatihan"
      subtitle="Penambahan program pelatihan K3, teknis, atau kompetensi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<GraduationCap className="h-4 w-4" />}
            onClick={() => {
              if (!form.program) {
                toast('Nama program pelatihan wajib diisi', 'warning')
                return
              }
              actions.addTraining({
                program: form.program,
                category: form.category,
                date: form.date,
                siteId: form.siteId,
                attendees: Number(form.attendees || 0),
                trainer: form.trainer || 'Internal HSE',
              })
              setForm({ ...form, program: '', attendees: '', trainer: '' })
              onClose()
            }}
          >
            Jadwalkan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Program" required className="sm:col-span-2">
          <Input placeholder="contoh: K3 Umum & APD Lanjutan" value={form.program} onChange={(e) => set('program', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <Select options={['K3 Umum', 'Teknis', 'Lingkungan', 'Manajemen', 'POP']} value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Tanggal Pelaksanaan">
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Site">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Estimasi Peserta">
          <Input type="number" min={0} placeholder="contoh: 40" value={form.attendees} onChange={(e) => set('attendees', e.target.value)} />
        </Field>
        <Field label="Penyelenggara / Trainer" className="sm:col-span-2">
          <Input placeholder="Lembaga atau internal HSE" value={form.trainer} onChange={(e) => set('trainer', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
