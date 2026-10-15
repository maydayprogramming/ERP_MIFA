import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Landmark,
  Plus,
  Scale,
  ShieldAlert,
  Timer,
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
import { ActionButton } from '../auth/ActionButton'
import { TODAY } from '../store'
import { cx, dmy, daysBetween, isOverdue, num, num1, pct1, sum, toCSV } from '../lib/format'
import type { ComplianceObligation, Permit, PermitType } from '../types'

type TabId = 'permits' | 'compliance' | 'summary'

const PERMIT_TONE: Record<Permit['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  Aktif: 'success',
  'Akan Berakhir': 'warning',
  Expired: 'danger',
  'Proses Perpanjangan': 'info',
}

const COMPLIANCE_TONE: Record<ComplianceObligation['status'], 'success' | 'info' | 'danger' | 'neutral'> = {
  Terpenuhi: 'success',
  Proses: 'info',
  Terlambat: 'danger',
  'Belum Jatuh Tempo': 'neutral',
}

const PERMIT_TYPES: PermitType[] = ['IUP OP', 'IUP OPK', 'PKP2B', 'AMDAL', 'UKL-UPL', 'RKAB', 'SIMBAT', 'HO', 'PNBP', 'Izin Lingkungan']

const CATEGORIES: ComplianceObligation['category'][] = ['Lingkungan', 'Keselamatan', 'Fiskal', 'Tenaga Kerja', 'Operasional']

const RELEVANCE: Record<PermitType, string> = {
  'IUP OP': 'Izin Usaha Pertambangan Operasi Produksi — dasar hukum penambangan batubara.',
  'IUP OPK': 'Izin Usaha Pertambangan Operasi Produksi Khusus — kontrak karya dengan negara.',
  PKP2B: 'Perjanjian Karya Pengusahaan Pertambangan Batubara — rezim kontrak lama.',
  AMDAL: 'Analisis Mengenai Dampak Lingkungan — syarat kelayakan lingkungan.',
  'UKL-UPL': 'Upaya Pengelolaan & Pemantauan Lingkungan — program pengelolaan lingkungan.',
  RKAB: 'Rencana Kerja & Anggaran Biaya — rencana produksi tahunan disetujui ESDM.',
  SIMBAT: 'Surat Izin Membuang Batubara ke Laut — limbah batubara ke badan air.',
  HO: 'Harga Patokan — acuan harga pokok penjualan batubara periode berjalan.',
  PNBP: 'Penerimaan Negara Bukan Pajak — iuran royalti dan kewajiban deviden negara.',
  'Izin Lingkungan': 'Izin menyelenggarakan pengelolaan lingkungan sesuai peraturan daerah.',
}

export default function Legal() {
  const { state, actions, toast } = useERP()
  const [tab, setTab] = useState<TabId>('permits')
  const [siteFilter, setSiteFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [relevance, setRelevance] = useState<PermitType | null>(null)

  const sites = state.sites
  const permits = state.permits
  const compliance = state.compliance
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? '-'
  const siteCode = (id: string) => sites.find((s) => s.id === id)?.code ?? '-'

  /* --------------------------- Hitungan ringkas -------------------------- */
  const expiring = permits.filter((p) => p.status === 'Akan Berakhir' || (daysBetween(TODAY, p.expiryDate) >= 0 && daysBetween(TODAY, p.expiryDate) <= 180))
  const expired = permits.filter((p) => p.status === 'Expired' || isOverdue(p.expiryDate, TODAY))
  const renewing = permits.filter((p) => p.status === 'Proses Perpanjangan')
  const active = permits.filter((p) => p.status === 'Aktif' && !isOverdue(p.expiryDate, TODAY))

  const overdue = compliance.filter((c) => c.status === 'Terlambat')
  const dueSoon = compliance.filter((c) => c.status !== 'Terpenuhi' && c.status !== 'Terlambat' && daysBetween(TODAY, c.dueDate) >= 0 && daysBetween(TODAY, c.dueDate) <= 30)
  const fulfilled = compliance.filter((c) => c.status === 'Terpenuhi')
  const complianceRate = compliance.length ? (fulfilled.length / compliance.length) * 100 : 0
  const obligationsDue30 = compliance.filter((c) => daysBetween(TODAY, c.dueDate) >= 0 && daysBetween(TODAY, c.dueDate) <= 30 && c.status !== 'Terpenuhi')

  const filteredPermits = useMemo(
    () =>
      permits.filter(
        (p) =>
          (siteFilter === 'all' || p.siteId === siteFilter) &&
          (typeFilter === 'all' || p.type === typeFilter) &&
          (statusFilter === 'all' || p.status === statusFilter),
      ),
    [permits, siteFilter, typeFilter, statusFilter],
  )

  const filteredCompliance = useMemo(
    () => compliance.filter((c) => (siteFilter === 'all' || c.siteId === siteFilter) && (catFilter === 'all' || c.category === catFilter)),
    [compliance, siteFilter, catFilter],
  )

  /* ------------------------------- Grafik -------------------------------- */
  const permitByType = useMemo(() => {
    const map = new Map<string, number>()
    permits.forEach((p) => map.set(p.type, (map.get(p.type) ?? 0) + 1))
    return PERMIT_TYPES.map((t) => ({ name: t as string, value: map.get(t) ?? 0 })).filter((r) => r.value > 0)
  }, [permits])

  const permitBySite = useMemo(() => {
    return sites.map((s) => ({
      site: s.code,
      name: s.name,
      aktif: permits.filter((p) => p.siteId === s.id && p.status === 'Aktif' && !isOverdue(p.expiryDate, TODAY)).length,
      berakhir: permits.filter((p) => p.siteId === s.id && (p.status === 'Akan Berakhir' || p.status === 'Expired' || isOverdue(p.expiryDate, TODAY))).length,
    }))
  }, [permits, sites])

  const complianceByCategory = useMemo(() => {
    const map = new Map<string, number>()
    compliance.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1))
    return CATEGORIES.map((c) => ({ name: c as string, value: map.get(c) ?? 0 })).filter((r) => r.value > 0)
  }, [compliance])

  const expiryTimeline = useMemo(() => {
    const buckets: Record<string, number> = { '<30 hari': 0, '30–90 hari': 0, '90–180 hari': 0, '>180 hari': 0 }
    permits.forEach((p) => {
      const d = daysBetween(TODAY, p.expiryDate)
      if (d < 0) buckets['>180 hari'] += 0
      else if (d < 30) buckets['<30 hari'] += 1
      else if (d < 90) buckets['30–90 hari'] += 1
      else if (d < 180) buckets['90–180 hari'] += 1
      else buckets['>180 hari'] += 1
    })
    return Object.entries(buckets).map(([k, v]) => ({ name: k, jumlah: v }))
  }, [permits])

  /* -------------------------------- Kolom -------------------------------- */
  const permitColumns: Column<Permit>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.code}</span> },
    {
      key: 'type',
      header: 'Jenis Izin',
      sort: (r) => r.type,
      render: (r) => (
        <button type="button" onClick={() => setRelevance(r.type)} className="text-left">
          <p className="font-medium text-ink hover:text-amber-400">{r.type}</p>
          <p className="text-[11px] text-ink-faintest">lihat keterangan</p>
        </button>
      ),
    },
    { key: 'number', header: 'Nomor Dokumen', render: (r) => <span className="font-mono text-[11px] text-ink-muted">{r.number}</span> },
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
    { key: 'authority', header: 'Instansi', sort: (r) => r.authority, render: (r) => <span className="text-ink-muted">{r.authority}</span> },
    { key: 'issued', header: 'Terbit', sort: (r) => r.issuedDate, render: (r) => <span className="text-xs text-ink-muted">{dmy(r.issuedDate)}</span> },
    {
      key: 'expiry',
      header: 'Berlaku s/d',
      sort: (r) => r.expiryDate,
      render: (r) => {
        const d = daysBetween(TODAY, r.expiryDate)
        const urgent = d < 0 || d <= 90
        return (
          <div>
            <p className={cx('text-xs font-medium', urgent ? 'text-rose-400' : 'text-ink')}>{dmy(r.expiryDate)}</p>
            <p className={cx('text-[11px]', urgent ? 'text-rose-400/80' : 'text-ink-faintest')}>
              {d < 0 ? `kedaluwarsa ${Math.abs(d)} hari` : `sisa ${d} hari`}
            </p>
          </div>
        )
      },
    },
    {
      key: 'validity',
      header: 'Masa Berlaku',
      width: '130px',
      render: (r) => {
        const total = daysBetween(r.issuedDate, r.expiryDate)
        const used = total - daysBetween(TODAY, r.expiryDate)
        const p = total > 0 ? (used / total) * 100 : 100
        return <Progress value={Math.min(100, Math.max(0, p))} tone={p >= 85 ? 'rose' : p >= 60 ? 'amber' : 'emerald'} />
      },
    },
    { key: 'pic', header: 'Penanggung Jawab', sort: (r) => r.pic, render: (r) => <span className="text-ink-muted">{r.pic}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === 'Aktif' && !isOverdue(r.expiryDate, TODAY) && daysBetween(TODAY, r.expiryDate) <= 365 && (
            <ActionButton action="legal.manage" size="sm" variant="outline" onClick={() => actions.setPermitStatus(r.id, 'Proses Perpanjangan')}>
              Perpanjang
            </ActionButton>
          )}
          {r.status === 'Proses Perpanjangan' && (
            <ActionButton action="legal.manage" size="sm" variant="success" onClick={() => actions.setPermitStatus(r.id, 'Aktif')}>
              Setujui
            </ActionButton>
          )}
          {r.status === 'Expired' && (
            <ActionButton action="legal.manage" size="sm" variant="primary" onClick={() => actions.setPermitStatus(r.id, 'Proses Perpanjangan')}>
              Ajukan Ulang
            </ActionButton>
          )}
        </div>
      ),
    },
  ]

  const complianceColumns: Column<ComplianceObligation>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.code}</span> },
    {
      key: 'obligation',
      header: 'Kewajiban',
      sort: (r) => r.obligation,
      render: (r) => <p className="max-w-xs font-medium text-ink">{r.obligation}</p>,
    },
    { key: 'authority', header: 'Instansi', sort: (r) => r.authority, render: (r) => <span className="text-ink-muted">{r.authority}</span> },
    { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <Badge tone="violet">{r.category}</Badge> },
    {
      key: 'site',
      header: 'Site',
      sort: (r) => siteName(r.siteId),
      render: (r) => <span className="text-ink-muted">{siteName(r.siteId)}</span>,
    },
    { key: 'frequency', header: 'Periodisitas', sort: (r) => r.frequency, render: (r) => <span className="text-xs text-ink-muted">{r.frequency}</span> },
    {
      key: 'due',
      header: 'Jatuh Tempo',
      sort: (r) => r.dueDate,
      render: (r) => {
        const d = daysBetween(TODAY, r.dueDate)
        return (
          <div>
            <p className="text-xs font-medium text-ink">{dmy(r.dueDate)}</p>
            <p className={cx('text-[11px]', d < 0 ? 'text-rose-400' : d <= 14 ? 'text-amber-400' : 'text-ink-faintest')}>
              {d < 0 ? `terlambat ${Math.abs(d)} hari` : `sisa ${d} hari`}
            </p>
          </div>
        )
      },
    },
    { key: 'evidence', header: 'Bukti / Dokumen', render: (r) => <span className="text-[11px] text-ink-faint">{r.evidence}</span> },
    { key: 'pic', header: 'PIC', sort: (r) => r.pic, render: (r) => <span className="text-ink-muted">{r.pic}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) =>
        r.status === 'Terpenuhi' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Terpenuhi
          </span>
        ) : (
          <ActionButton action="legal.manage" size="sm" variant="success" onClick={() => actions.setComplianceStatus(r.id, 'Terpenuhi')}>
            Tandai Terpenuhi
          </ActionButton>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Legal & Compliance IUP"
        subtitle="Manajemen izin pertambangan (IUP OP/OPK, PKP2B), dokumen AMDAL & UKL-UPL, RKAB, serta monitoring kewajiban kepatuhan regulasi Kementerian ESDM dan instansi terkait."
        actions={
          <>
            <Button
              variant="outline"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() =>
                toCSV(
                  permits.map((p) => ({
                    Kode: p.code,
                    Jenis: p.type,
                    Nomor: p.number,
                    Site: siteName(p.siteId),
                    Instansi: p.authority,
                    Terbit: p.issuedDate,
                    'Berlaku s/d': p.expiryDate,
                    'Sisa Hari': daysBetween(TODAY, p.expiryDate),
                    PIC: p.pic,
                    Status: p.status,
                  })),
                  'izin-pertambangan',
                )
              }
            >
              Ekspor
            </Button>
            <ActionButton action="legal.manage" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Daftarkan Izin
            </ActionButton>
          </>
        }
      >
        <Tabs<TabId>
          tabs={[
            { id: 'permits', label: 'Izin & Perizinan', count: permits.length },
            { id: 'compliance', label: 'Kewajiban Kepatuhan', count: compliance.length },
            { id: 'summary', label: 'Ringkasan & Analisis' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      {/* -------------------------------- KPI -------------------------------- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Izin Aktif" value={num(active.length)} unit={`dari ${permits.length}`} tone="emerald" icon={<BadgeCheck className="h-4 w-4" />} hint={`${pct1((active.length / Math.max(1, permits.length)) * 100)} portofolio izin`} />
        <StatCard label="Akan Berakhir ≤ 180 Hari" value={num(expiring.length)} unit="dokumen" tone="amber" delta={expiring.length > 0 ? 100 : 0} deltaLabel="perlu persiapan perpanjangan" icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Kedaluwarsa" value={num(expired.length)} unit="dokumen" tone="rose" icon={<ShieldAlert className="h-4 w-4" />} hint="wajib segera ditindaklanjuti" />
        <StatCard label="Tingkat Kepatuhan" value={pct1(complianceRate)} tone="sky" icon={<Scale className="h-4 w-4" />} hint={`${fulfilled.length}/${compliance.length} kewajiban terpenuhi`} />
      </div>

      {/* ============================ IZIN ============================== */}
      {tab === 'permits' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartFrame title="Komposisi Jenis Izin" subtitle="Jumlah dokumen per jenis perizinan pertambangan">
              <DonutChart data={permitByType} />
            </ChartFrame>
            <ChartFrame title="Distribusi Masa Berlaku Izin" subtitle="Jumlah izin berdasarkan sisa masa berlaku">
              <BarsChart
                data={expiryTimeline}
                xKey="name"
                series={[{ key: 'jumlah', name: 'Jumlah izin', color: '#f59e0b' }]}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>
            <div className="space-y-3">
              {[
                { l: 'Proses Perpanjangan', v: num(renewing.length), t: 'sky' as const, i: <FileText className="h-4 w-4" /> },
                { l: 'Total Dokumen', v: num(permits.length), t: 'violet' as const, i: <Landmark className="h-4 w-4" /> },
                { l: 'Jatuh Tempo ≤ 30 Hari', v: num(obligationsDue30.length), t: 'rose' as const, i: <AlertTriangle className="h-4 w-4" /> },
              ].map((k) => (
                <StatCard key={k.l} label={k.l} value={k.v} tone={k.t} icon={k.i} />
              ))}
            </div>
          </div>

          <Card>
            <CardHeader
              title="Registrasi Izin & Perizinan"
              subtitle="Seluruh dokumen legal yang menjadi dasar penyelenggaraan kegiatan pertambangan batubara"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua site' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                    className="input-sm"
                  />
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua jenis' }, ...PERMIT_TYPES.map((t) => ({ value: t, label: t }))]}
                    className="input-sm"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua status' },
                      ...(['Aktif', 'Akan Berakhir', 'Expired', 'Proses Perpanjangan'] as const).map((s) => ({ value: s, label: s })),
                    ]}
                    className="input-sm"
                  />
                </div>
              }
            />
            <DataTable
              data={filteredPermits}
              columns={permitColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${r.type} ${r.number} ${siteName(r.siteId)} ${r.authority} ${r.pic} ${r.status}`}
              searchPlaceholder="Cari izin..."
              pageSize={10}
              exportName="izin-pertambangan"
              initialSort={{ key: 'expiry', dir: 'asc' }}
              emptyLabel="Belum ada izin terdaftar"
            />
          </Card>
        </div>
      )}

      {/* ========================= KEPATUHAN =========================== */}
      {tab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartFrame title="Kewajiban per Kategori" subtitle="Distribusi kewajiban kepatuhan berdasarkan kategori regulasi">
              <DonutChart data={complianceByCategory} />
            </ChartFrame>
            <ChartFrame title="Status Pemenuhan" subtitle="Rekap jumlah kewajiban berdasarkan status penanganan">
              <BarsChart
                data={[
                  { name: 'Terpenuhi', jumlah: fulfilled.length },
                  { name: 'Proses', jumlah: compliance.filter((c) => c.status === 'Proses').length },
                  { name: 'Terlambat', jumlah: overdue.length },
                  { name: 'Belum Jatuh Tempo', jumlah: compliance.filter((c) => c.status === 'Belum Jatuh Tempo').length },
                ]}
                xKey="name"
                series={[{ key: 'jumlah', name: 'Jumlah kewajiban', color: '#38bdf8' }]}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>
            <div className="space-y-3">
              <StatCard label="Terlambat" value={num(overdue.length)} unit="kewajiban" tone="rose" icon={<AlertTriangle className="h-4 w-4" />} hint="perlu eskalasi segera" />
              <StatCard label="Jatuh Tempo ≤ 30 Hari" value={num(dueSoon.length)} unit="kewajiban" tone="amber" icon={<Timer className="h-4 w-4" />} />
              <StatCard label="Tingkat Kepatuhan" value={pct1(complianceRate)} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} hint={`${fulfilled.length} terpenuhi`} />
            </div>
          </div>

          {overdue.length > 0 && (
            <Card className="border-rose-500/30">
              <CardHeader title="Eskalasi Kepatuhan" subtitle="Kewajiban yang terlambat dipenuhi dan memerlukan tindakan korektif" />
              <div className="grid gap-3 p-4 lg:grid-cols-3">
                {overdue.map((c) => (
                  <div key={c.id} className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{c.code}</p>
                      <Badge tone="danger" dot>
                        {Math.abs(daysBetween(TODAY, c.dueDate))} hari
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{c.obligation}</p>
                    <p className="mt-2 text-[11px] text-ink-faint">
                      {c.authority} · PIC {c.pic}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Daftar Kewajiban Kepatuhan"
              subtitle="Monitoring kewajiban pelaporan, pembayaran, dan pengujian sesuai regulasi yang berlaku"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua site' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                    className="input-sm"
                  />
                  <Select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    options={[{ value: 'all', label: 'Semua kategori' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                    className="input-sm"
                  />
                </div>
              }
            />
            <DataTable
              data={filteredCompliance}
              columns={complianceColumns}
              rowKey={(r) => r.id}
              search={(r) => `${r.code} ${r.obligation} ${r.authority} ${r.category} ${siteName(r.siteId)} ${r.pic} ${r.status}`}
              searchPlaceholder="Cari kewajiban kepatuhan..."
              pageSize={10}
              exportName="kewajiban-kepatuhan"
              initialSort={{ key: 'due', dir: 'asc' }}
              emptyLabel="Belum ada kewajiban kepatuhan"
            />
          </Card>
        </div>
      )}

      {/* =========================== RINGKASAN ========================== */}
      {tab === 'summary' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Kondisi Izin per Site" subtitle="Jumlah izin aktif vs izin yang perlu perhatian di setiap site tambang" />
              <div className="p-4 pt-2">
                <BarsChart
                  data={permitBySite}
                  xKey="site"
                  series={[
                    { key: 'aktif', name: 'Izin aktif', color: '#10b981' },
                    { key: 'berakhir', name: 'Akan berakhir / kedaluwarsa', color: '#f43f5e' },
                  ]}
                  yTickFormatter={(v) => num(v)}
                />
              </div>
            </Card>
            <div className="space-y-3 lg:col-span-2">
              <StatCard label="Nilai Kepatuhan" value={pct1(complianceRate)} tone="emerald" icon={<Scale className="h-4 w-4" />} hint="rasio kewajiban terpenuhi" />
              <StatCard label="Izin Perlu Tindakan" value={num(expiring.length + expired.length)} unit="dokumen" tone="amber" icon={<Timer className="h-4 w-4" />} />
              <StatCard label="Site Terlisensi" value={num(new Set(permits.map((p) => p.siteId)).size)} unit={`dari ${sites.length}`} tone="sky" icon={<Landmark className="h-4 w-4" />} />
            </div>
          </div>

          <Card>
            <CardHeader title="Matriks Jenis Perizinan" subtitle="Dasar hukum dan relevansi setiap jenis dokumen perizinan pertambangan" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {PERMIT_TYPES.map((t) => {
                const count = permits.filter((p) => p.type === t).length
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRelevance(t)}
                    className="rounded-xl border border-line bg-surface-2/40 p-3.5 text-left transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{t}</p>
                      <Badge tone={count > 0 ? 'amber' : 'neutral'}>{count}</Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{RELEVANCE[t]}</p>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Rencana Aksi Kepatuhan" subtitle="Prioritas tindakan berdasarkan sisa masa berlaku izin dan status kewajiban" />
            <DataTable
              data={[
                ...expired.map((p) => ({ ref: p.code, item: `Perpanjang ${p.type} ${p.number}`, site: siteName(p.siteId), due: p.expiryDate, priority: 'Kritis', owner: p.pic, days: daysBetween(TODAY, p.expiryDate) })),
                ...expiring.map((p) => ({ ref: p.code, item: `Siapkan perpanjangan ${p.type}`, site: siteName(p.siteId), due: p.expiryDate, priority: daysBetween(TODAY, p.expiryDate) <= 90 ? 'Tinggi' : 'Sedang', owner: p.pic, days: daysBetween(TODAY, p.expiryDate) })),
                ...overdue.map((c) => ({ ref: c.code, item: c.obligation, site: siteName(c.siteId), due: c.dueDate, priority: 'Kritis', owner: c.pic, days: daysBetween(TODAY, c.dueDate) })),
                ...obligationsDue30.map((c) => ({ ref: c.code, item: c.obligation, site: siteName(c.siteId), due: c.dueDate, priority: 'Tinggi', owner: c.pic, days: daysBetween(TODAY, c.dueDate) })),
              ]
                .sort((a, b) => a.days - b.days)
                .slice(0, 20)}
              columns={[
                { key: 'priority', header: 'Prioritas', sort: (r) => r.priority, render: (r) => <Badge tone={r.priority === 'Kritis' ? 'danger' : r.priority === 'Tinggi' ? 'warning' : 'info'} dot>{r.priority}</Badge> },
                { key: 'item', header: 'Tindakan', render: (r) => <p className="max-w-sm text-ink">{r.item}</p> },
                { key: 'ref', header: 'Referensi', render: (r) => <span className="font-mono text-[11px] text-ink-faint">{r.ref}</span> },
                { key: 'site', header: 'Site', render: (r) => <span className="text-ink-muted">{r.site}</span> },
                {
                  key: 'due',
                  header: 'Batas Waktu',
                  sort: (r) => r.due,
                  render: (r) => (
                    <div>
                      <p className="text-xs text-ink">{dmy(r.due)}</p>
                      <p className={cx('text-[11px]', r.days < 0 ? 'text-rose-400' : 'text-ink-faintest')}>
                        {r.days < 0 ? `${Math.abs(r.days)} hari terlambat` : `sisa ${r.days} hari`}
                      </p>
                    </div>
                  ),
                },
                { key: 'owner', header: 'PIC', render: (r) => <span className="text-ink-muted">{r.owner}</span> },
              ]}
              rowKey={(r) => `${r.ref}-${r.item}`}
              pageSize={20}
              exportName="rencana-aksi-kepatuhan"
              emptyLabel="Tidak ada tindakan prioritas"
            />
          </Card>

          <Card>
            <CardHeader title="Dasar Regulasi" subtitle="Kerangka peraturan utama yang menjadi acuan kepatuhan usaha pertambangan batubara" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { t: 'UU No. 11/1967', d: 'Ketentuan-ketentuan pokok pertambangan (sebagaimana diubah terakhir dengan UU No. 4/2009).' },
                { t: 'UU No. 3/2020', d: 'Perubahan atas UU Minerba — sentralisasi perizinan dan tata cara perpanjangan IUP.' },
                { t: 'PP No. 9/2010', d: 'Kegiatan usaha pertambangan mineral & batubara — besaran iuran produksi/royalti.' },
                { t: 'PP No. 23/2010', d: 'Pelaksanaan kegiatan usaha pertambangan mineral & batubara.' },
                { t: 'PP No. 78/2010', d: 'Rehabilitasi lahan dan reklamasi pada kegiatan pertambangan.' },
                { t: 'PP No. 27/2021', d: 'Pengusahaan pertambangan mineral & batubara — evaluasi RKAB dan tata cara penyesuaian.' },
              ].map((r) => (
                <div key={r.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <p className="text-sm font-semibold text-amber-400">{r.t}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{r.d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================ MODAL ============================= */}
      <PermitForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sites={sites}
        onSubmit={(r) => {
          actions.addPermit(r)
          setFormOpen(false)
        }}
      />

      <Modal
        open={relevance !== null}
        onClose={() => setRelevance(null)}
        title={relevance ? `Keterangan: ${relevance}` : ''}
        subtitle="Relevansi dan dasar hukum dokumen perizinan"
      >
        {relevance && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="text-sm leading-relaxed text-ink-muted">{RELEVANCE[relevance]}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">Jumlah Dokumen</p>
                <p className="mt-1 text-lg font-bold text-ink">{num(permits.filter((p) => p.type === relevance).length)}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">Site Terkait</p>
                <p className="mt-1 text-lg font-bold text-ink">{num(new Set(permits.filter((p) => p.type === relevance).map((p) => p.siteId)).size)}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">Rata-rata Sisa</p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {num1(
                    permits.filter((p) => p.type === relevance).length > 0
                      ? sum(permits.filter((p) => p.type === relevance).map((p) => Math.max(0, daysBetween(TODAY, p.expiryDate)))) /
                          permits.filter((p) => p.type === relevance).length
                      : 0,
                  )}{' '}
                  <span className="text-[11px] font-medium text-ink-faint">hari</span>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={() => setRelevance(null)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ---------------------------- Form Izin Baru ---------------------------- */

function PermitForm({
  open,
  onClose,
  sites,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  sites: Array<{ id: string; name: string }>
  onSubmit: (r: {
    type: PermitType
    siteId: string
    number: string
    authority: string
    issuedDate: string
    expiryDate: string
    pic: string
  }) => void
}) {
  const [type, setType] = useState<PermitType>('IUP OP')
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [number, setNumber] = useState('')
  const [authority, setAuthority] = useState('')
  const [issuedDate, setIssuedDate] = useState(TODAY)
  const [expiryDate, setExpiryDate] = useState(TODAY)
  const [pic, setPic] = useState('')
  const { toast } = useERP()

  const submit = () => {
    if (!number.trim() || !authority.trim() || !pic.trim()) {
      toast('Nomor dokumen, instansi, dan PIC wajib diisi', 'warning')
      return
    }
    if (daysBetween(issuedDate, expiryDate) < 0) {
      toast('Tanggal berlaku harus setelah tanggal terbit', 'warning')
      return
    }
    onSubmit({ type, siteId, number, authority, issuedDate, expiryDate, pic })
  }

  return (
    <Modal open={open} onClose={onClose} title="Daftarkan Izin Baru" subtitle="Registrasi dokumen perizinan pertambangan ke dalam sistem legal">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis Izin" required>
          <Select value={type} onChange={(e) => setType(e.target.value as PermitType)} options={PERMIT_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Site" required>
          <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Nomor Dokumen" required>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="420/KAB-BPPT/2019" />
        </Field>
        <Field label="Instansi Penerbit" required>
          <Input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Kementerian ESDM" />
        </Field>
        <Field label="Tanggal Terbit" required>
          <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
        </Field>
        <Field label="Berlaku Sampai" required>
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </Field>
        <Field label="Penanggung Jawab (PIC)" required className="sm:col-span-2">
          <Input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Legal & Compliance" />
        </Field>
      </div>
      <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3.5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          {RELEVANCE[type]}
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={submit}>Simpan Izin</Button>
      </div>
    </Modal>
  )
}
