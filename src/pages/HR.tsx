import { useMemo, useState } from 'react'
import {
  Award,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  Clock,
  DollarSign,
  FileBadge,
  GraduationCap,
  Plus,
  Users,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart } from '../components/charts'
import { useERP } from '../store'
import { dmy, idr, idrFull, num, num1, pct1, sum } from '../lib/format'
import type { Employee } from '../types'

type TabId = 'directory' | 'attendance' | 'payroll' | 'competency'

const ATTENDANCE = [
  { id: 'at-1', date: '2026-10-14', site: 'LHT', shift: 'Shift 1', planned: 412, present: 402, absent: 10, overtime: 38, productivity: 97.6 },
  { id: 'at-2', date: '2026-10-14', site: 'LHT', shift: 'Shift 2', planned: 388, present: 379, absent: 9, overtime: 41, productivity: 97.7 },
  { id: 'at-3', date: '2026-10-14', site: 'LHT', shift: 'Shift 3', planned: 356, present: 341, absent: 15, overtime: 22, productivity: 95.8 },
  { id: 'at-4', date: '2026-10-14', site: 'ME', shift: 'Shift 1', planned: 298, present: 294, absent: 4, overtime: 26, productivity: 98.7 },
  { id: 'at-5', date: '2026-10-14', site: 'ME', shift: 'Shift 2', planned: 276, present: 268, absent: 8, overtime: 19, productivity: 97.1 },
  { id: 'at-6', date: '2026-10-14', site: 'TE', shift: 'Shift 1', planned: 184, present: 179, absent: 5, overtime: 14, productivity: 97.3 },
  { id: 'at-7', date: '2026-10-14', site: 'TE', shift: 'Shift 2', planned: 168, present: 160, absent: 8, overtime: 11, productivity: 95.2 },
  { id: 'at-8', date: '2026-10-14', site: 'BRU', shift: 'Shift 1', planned: 524, present: 511, absent: 13, overtime: 62, productivity: 97.5 },
  { id: 'at-9', date: '2026-10-14', site: 'BRU', shift: 'Shift 2', planned: 498, present: 480, absent: 18, overtime: 55, productivity: 96.4 },
  { id: 'at-10', date: '2026-10-14', site: 'BRU', shift: 'Shift 3', planned: 462, present: 451, absent: 11, overtime: 34, productivity: 97.6 },
  { id: 'at-11', date: '2026-10-13', site: 'LHT', shift: 'Shift 1', planned: 412, present: 408, absent: 4, overtime: 33, productivity: 99.0 },
  { id: 'at-12', date: '2026-10-13', site: 'BRU', shift: 'Shift 2', planned: 498, present: 486, absent: 12, overtime: 48, productivity: 97.6 },
]

const PAYROLL_COMPONENTS = [
  { name: 'Gaji Pokok', value: 8_450_000_000 },
  { name: 'Tunjangan & Premi', value: 5_120_000_000 },
  { name: 'Lembur', value: 2_380_000_000 },
  { name: 'BPJS Ketenagakerjaan', value: 1_890_000_000 },
  { name: 'Insentif Produksi', value: 1_640_000_000 },
  { name: 'Tunjangan Masa Kerja', value: 980_000_000 },
  { name: 'Biaya Pelatihan', value: 620_000_000 },
]

const CERT_POOL = ['POP Excavator', 'POP Haul Truck', 'POP Dozer', 'K3 Umum', 'P3K', 'Fire Fighting', 'Work at Height', 'Defensive Driving', 'First Aider', 'GWO', 'Lifting Supervisor', 'H2S Awareness']

export default function HR() {
  const { state, actions, toast } = useERP()
  const [tab, setTab] = useState<TabId>('directory')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.code ?? '-'

  const employees = useMemo(
    () => state.employees.filter((e) => (deptFilter === 'all' || e.department === deptFilter) && (statusFilter === 'all' || e.status === statusFilter)),
    [state.employees, deptFilter, statusFilter],
  )

  const columns: Column<Employee>[] = [
    { key: 'nip', header: 'NIP', sort: (r) => r.nip, render: (r) => <span className="font-mono text-[12px] text-amber-400">{r.nip}</span> },
    {
      key: 'name',
      header: 'Nama Karyawan',
      sort: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-surface-3 to-surface-2 text-[10px] font-bold text-ink">
            {r.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
          </span>
          <span className="font-medium text-ink-strong">{r.name}</span>
        </div>
      ),
    },
    { key: 'position', header: 'Jabatan', sort: (r) => r.position, render: (r) => <span className="text-ink">{r.position}</span> },
    { key: 'department', header: 'Departemen', sort: (r) => r.department, render: (r) => <Badge tone="neutral">{r.department}</Badge> },
    { key: 'siteId', header: 'Site', sort: (r) => siteName(r.siteId), render: (r) => <span className="chip">{siteName(r.siteId)}</span> },
    { key: 'joinDate', header: 'Bergabung', sort: (r) => r.joinDate, render: (r) => <span className="text-ink-muted">{dmy(r.joinDate)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    { key: 'salaryIdr', header: 'Gaji Pokok', align: 'right', sort: (r) => r.salaryIdr, render: (r) => <span className="font-mono">{idr(r.salaryIdr)}</span> },
    {
      key: 'certifications',
      header: 'Sertifikasi',
      render: (r) => (
        <div className="flex max-w-[180px] flex-wrap gap-1">
          {r.certifications.length === 0 ? (
            <span className="text-[11px] text-ink-faintest">Belum ada</span>
          ) : (
            r.certifications.slice(0, 2).map((c) => <span key={c} className="chip !text-[10px]">{c}</span>)
          )}
          {r.certifications.length > 2 && <span className="chip !text-[10px]">+{r.certifications.length - 2}</span>}
        </div>
      ),
    },
  ]

  const byDept = useMemo(() => {
    const map = new Map<string, number>()
    state.employees.forEach((e) => map.set(e.department, (map.get(e.department) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ label: name.replace('Perencanaan Tambang', 'Perenc. Tambang'), name, value }))
  }, [state.employees])

  const payrollByDept = useMemo(() => {
    const map = new Map<string, number>()
    state.employees.forEach((e) => map.set(e.department, (map.get(e.department) ?? 0) + e.salaryIdr))
    return [...map.entries()]
      .map(([name, value]) => ({ label: name.replace('Perencanaan Tambang', 'Perenc. Tambang'), name, value: Math.round((value * 1.4) / 1e9) }))
      .sort((a, b) => b.value - a.value)
  }, [state.employees])

  const statusMix = (['Permanent', 'Contract', 'Outsource'] as const).map((s) => ({
    name: s,
    value: state.employees.filter((e) => e.status === s).length,
  }))

  const certMatrix = CERT_POOL.map((c) => ({
    cert: c,
    holders: state.employees.filter((e) => e.certifications.includes(c)).length,
    valid: state.employees.filter((e) => e.certifications.includes(c)).length,
  }))

  const totalPlanned = sum(ATTENDANCE.map((a) => a.planned))
  const totalPresent = sum(ATTENDANCE.map((a) => a.present))
  const attendanceRate = (totalPresent / totalPlanned) * 100
  const payrollTotal = sum(PAYROLL_COMPONENTS.map((p) => p.value))

  return (
    <div>
      <PageHeader
        title="SDM & Pengupahan"
        subtitle="Manajemen data karyawan, kehadiran shift, biaya pengupahan, serta monitoring kompetensi dan sertifikasi keselamatan kerja."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
            Tambah Karyawan
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Karyawan" value={num(1284)} unit="orang" hint={`${state.employees.length} tercatat pada modul demo`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Karyawan Tetap" value={num(812)} unit="orang" hint="63% dari total tenaga kerja" icon={<BadgeCheck className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Biaya Pengupahan" value={idr(payrollTotal)} hint="Realisasi bulan berjalan" icon={<DollarSign className="h-4 w-4" />} tone="violet" />
        <StatCard label="Tingkat Kehadiran" value={pct1(attendanceRate)} hint={`${num(totalPlanned - totalPresent)} orang tidak hadir`} icon={<CalendarCheck className="h-4 w-4" />} tone={attendanceRate > 95 ? 'emerald' : 'amber'} />
        <StatCard label="Jam Kerja Lembur" value={num(sum(ATTENDANCE.map((a) => a.overtime)))} unit="jam" hint="Akumulasi 2 hari terakhir" icon={<Clock className="h-4 w-4" />} tone="sky" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'directory', label: 'Direktori Karyawan', count: employees.length },
            { id: 'attendance', label: 'Absensi Shift' },
            { id: 'payroll', label: 'Pengupahan' },
            { id: 'competency', label: 'Kompetensi & Sertifikasi' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'directory' && (
        <Card className="mt-4">
          <CardHeader
            title="Direktori Karyawan"
            subtitle="Data tenaga kerja operasional dan kantor pusat beserta status kepegawaian"
            actions={
              <>
                <Select
                  options={['all', 'Produksi', 'Perencanaan Tambang', 'Pemeliharaan', 'HSE', 'Keuangan', 'SDM', 'Logistik', 'Pengadaan', 'Legal & Compliance'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Departemen' : v }))}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="!h-8 !w-44 !text-xs"
                />
                <Select
                  options={['all', 'Permanent', 'Contract', 'Outsource'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Status' : v }))}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="!h-8 !w-36 !text-xs"
                />
              </>
            }
          />
          <DataTable
            data={employees}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.nip} ${r.name} ${r.position} ${r.department} ${r.status}`}
            searchPlaceholder="Cari NIP, nama, jabatan…"
            exportName="direktori-karyawan"
            initialSort={{ key: 'name', dir: 'asc' }}
          />
        </Card>
      )}

      {tab === 'attendance' && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Kehadiran per Site & Shift"
              subtitle="Perbandingan rencana vs kehadiran aktual (orang)"
              actions={<Badge tone="emerald">{pct1(attendanceRate)} kehadiran</Badge>}
            >
              <BarsChart
                data={ATTENDANCE.slice(0, 10).map((a) => ({ label: `${a.site} ${a.shift.replace('Shift ', 'S')}`, planned: a.planned, present: a.present }))}
                xKey="label"
                series={[
                  { key: 'planned', name: 'Rencana', color: '#3f3f46' },
                  { key: 'present', name: 'Hadir', color: '#34d399' },
                ]}
                valueFormatter={(v) => `${num(v)} org`}
                yTickFormatter={(v) => num(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Ringkasan Kehadiran" subtitle="Agregasi absensi 2 hari terakhir" icon={<CalendarCheck className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {[
                  { label: 'Total rencana', value: `${num(totalPlanned)} org` },
                  { label: 'Total hadir', value: `${num(totalPresent)} org` },
                  { label: 'Tidak hadir', value: `${num(totalPlanned - totalPresent)} org` },
                  { label: 'Jam lembur', value: `${num(sum(ATTENDANCE.map((a) => a.overtime)))} jam` },
                  { label: 'Produktivitas rata-rata', value: pct1(sum(ATTENDANCE.map((a) => a.productivity)) / ATTENDANCE.length) },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                    <span className="text-xs text-ink-muted">{r.label}</span>
                    <span className="font-mono text-sm font-semibold text-ink-strong">{r.value}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-600 dark:text-amber-200">
                  Shift 3 Site Tanjung Enim mencatat kehadiran terendah (95,2%). Tinjau ulang jadwal rotasi dan transportasi karyawan.
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title="Detail Absensi Shift" subtitle="Rekap kehadiran per site, shift, dan tanggal" />
            <DataTable
              data={ATTENDANCE}
              columns={[
                { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
                { key: 'site', header: 'Site', sort: (r) => r.site, render: (r) => <span className="chip">{r.site}</span> },
                { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="text-ink">{r.shift}</span> },
                { key: 'planned', header: 'Rencana', align: 'right', sort: (r) => r.planned, render: (r) => <span className="font-mono">{num(r.planned)}</span> },
                { key: 'present', header: 'Hadir', align: 'right', sort: (r) => r.present, render: (r) => <span className="font-mono text-emerald-400">{num(r.present)}</span> },
                { key: 'absent', header: 'Absen', align: 'right', sort: (r) => r.absent, render: (r) => <span className="font-mono text-rose-400">{num(r.absent)}</span> },
                { key: 'overtime', header: 'Lembur (jam)', align: 'right', sort: (r) => r.overtime, render: (r) => <span className="font-mono text-sky-400">{num(r.overtime)}</span> },
                {
                  key: 'productivity',
                  header: 'Produktivitas',
                  align: 'right',
                  sort: (r) => r.productivity,
                  render: (r) => (
                    <div>
                      <p className="font-mono text-ink-strong">{pct1(r.productivity)}</p>
                      <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div className={`h-full rounded-full ${r.productivity > 97 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${r.productivity}%` }} />
                      </div>
                    </div>
                  ),
                },
              ]}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.site} ${r.shift} ${r.date}`}
              searchPlaceholder="Cari site, shift, tanggal…"
              exportName="absensi-shift"
            />
          </Card>
        </>
      )}

      {tab === 'payroll' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame title="Komponen Biaya Pengupahan" subtitle="Struktur biaya tenaga kerja bulanan">
              <DonutChart
                data={PAYROLL_COMPONENTS.map((p) => ({ name: p.name, value: Math.round(p.value / 1e9) }))}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                centerValue={idr(payrollTotal)}
                centerLabel="Total pengupahan"
                height={250}
              />
            </ChartFrame>

            <ChartFrame
              className="xl:col-span-2"
              title="Biaya Pengupahan per Departemen"
              subtitle="Realisasi biaya gaji & tunjangan (miliar rupiah)"
            >
              <BarsChart
                data={payrollByDept}
                xKey="label"
                series={[{ key: 'value', name: 'Biaya (Rp M)', color: '#a78bfa' }]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Rincian Komponen Pengupahan" subtitle="Realisasi biaya per komponen bulan Oktober 2026" />
              <div className="overflow-x-auto scrollbar-thin">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Komponen</th>
                      <th className="text-right">Nilai</th>
                      <th className="text-right">Porsi</th>
                      <th className="text-right">Per Karyawan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYROLL_COMPONENTS.map((p) => (
                      <tr key={p.name}>
                        <td className="text-ink">{p.name}</td>
                        <td className="tbl-num text-emerald-400">{idr(p.value)}</td>
                        <td className="tbl-num text-ink-muted">{pct1((p.value / payrollTotal) * 100)}</td>
                        <td className="tbl-num text-ink">{idr(p.value / 1284)}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-2/30">
                      <td className="font-semibold text-ink-strong">Total</td>
                      <td className="tbl-num font-semibold text-amber-400">{idrFull(payrollTotal)}</td>
                      <td className="tbl-num">100%</td>
                      <td className="tbl-num font-semibold">{idr(payrollTotal / 1284)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Struktur Tenaga Kerja" subtitle="Sebaran berdasarkan status kepegawaian" icon={<Briefcase className="h-4 w-4" />} />
              <div className="space-y-4 p-5">
                {statusMix.map((s, i) => (
                  <div key={s.name}>
                    <Progress value={(s.value / state.employees.length) * 100} tone={['amber', 'sky', 'violet'][i] as 'amber'} label={`${s.name} (${s.value})`} />
                  </div>
                ))}
                <div className="space-y-2 border-t border-line pt-3">
                  {[
                    { label: 'Rata-rata masa kerja', value: '5,8 tahun' },
                    { label: 'Rasio staff : operasional', value: '1 : 6,4' },
                    { label: 'Biaya per MT produksi', value: `Rp ${num1((payrollTotal * 12) / 9_800_000)}` },
                    { label: 'Anggaran SDM RKAB', value: `${idr(312_000_000_000)} (${pct1(88.4)})` },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span className="text-ink-faint">{r.label}</span>
                      <span className="font-mono font-semibold text-ink">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'competency' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Matriks Kompetensi & Sertifikasi" subtitle="Jumlah pemegang sertifikat keselamatan dan kompetensi teknis" actions={<Badge tone="info">{CERT_POOL.length} program sertifikasi</Badge>} />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {certMatrix.map((c) => (
                <div key={c.cert} className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileBadge className="h-4 w-4 shrink-0 text-amber-400" />
                      <p className="text-[13px] font-medium text-ink">{c.cert}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink-strong">{c.holders}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${(c.holders / state.employees.length) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-faintest">{pct1((c.holders / state.employees.length) * 100)} dari tenaga kerja terdata</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Kepatuhan Sertifikasi" subtitle="Status validitas sertifikat keselamatan wajib" icon={<Award className="h-4 w-4" />} />
            <div className="space-y-4 p-5">
              {[
                { label: 'K3 Umum (wajib)', value: 96.4, tone: 'emerald' as const },
                { label: 'POP per unit', value: 91.2, tone: 'amber' as const },
                { label: 'P3K & tanggap darurat', value: 88.7, tone: 'amber' as const },
                { label: 'Work at Height', value: 74.3, tone: 'rose' as const },
                { label: 'Lifting Supervisor', value: 69.8, tone: 'rose' as const },
              ].map((r) => (
                <Progress key={r.label} value={r.value} tone={r.tone} label={r.label} />
              ))}
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] p-3 text-[11px] leading-relaxed text-rose-600 dark:text-rose-200">
                14 karyawan memiliki sertifikat Work at Height yang akan berakhir dalam 30 hari. Jadwalkan refresh training sebelum masa berlaku habis.
              </div>
            </div>
          </Card>
        </div>
      )}

      <SectionTitle title="Ringkasan SDM" subtitle="Indikator kunci pengelolaan sumber daya manusia" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ChartFrame title="Sebaran Departemen" subtitle="Jumlah karyawan per departemen">
          <BarsChart
            data={byDept}
            xKey="label"
            series={[{ key: 'value', name: 'Karyawan', color: '#38bdf8' }]}
            valueFormatter={(v) => `${num(v)} org`}
            yTickFormatter={(v) => num(v)}
          />
        </ChartFrame>

        {[
          { label: 'Karyawan Aktif', value: num(1284), sub: 'Termasuk 214 tenaga outsourced', icon: Users, tone: 'text-sky-400' },
          { label: 'Rekrutmen Tahun Ini', value: num(186), sub: '108 posisi operasional', icon: GraduationCap, tone: 'text-emerald-400' },
          { label: 'Biaya per Bulan', value: idr(payrollTotal), sub: 'Termasuk tunjangan & lembur', icon: DollarSign, tone: 'text-violet-400' },
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
      <EmployeeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function EmployeeForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    name: '',
    position: '',
    department: 'Produksi',
    siteId: state.sites[0]?.id ?? '',
    joinDate: '2026-10-15',
    status: 'Permanent' as Employee['status'],
    salaryIdr: '',
    certifications: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Karyawan Baru"
      subtitle="Registrasi data tenaga kerja ke direktori perusahaan"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Users className="h-4 w-4" />}
            onClick={() => {
              if (!form.name || !form.position) {
                toast('Nama dan jabatan wajib diisi', 'warning')
                return
              }
              actions.addEmployee({
                name: form.name,
                position: form.position,
                department: form.department,
                siteId: form.siteId,
                joinDate: form.joinDate,
                status: form.status,
                salaryIdr: Number(form.salaryIdr || 0),
                certifications: form.certifications ? form.certifications.split(',').map((c) => c.trim()).filter(Boolean) : [],
              })
              setForm({ ...form, name: '', position: '', salaryIdr: '', certifications: '' })
              onClose()
            }}
          >
            Simpan Karyawan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" required>
          <Input placeholder="Nama lengkap karyawan" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Jabatan" required>
          <Input placeholder="contoh: Supervisor Produksi" value={form.position} onChange={(e) => set('position', e.target.value)} />
        </Field>
        <Field label="Departemen">
          <Select options={['Produksi', 'Perencanaan Tambang', 'Pemeliharaan', 'HSE', 'Keuangan', 'SDM', 'Logistik', 'Pengadaan', 'Legal & Compliance']} value={form.department} onChange={(e) => set('department', e.target.value)} />
        </Field>
        <Field label="Site Penempatan">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Tanggal Bergabung">
          <Input type="date" value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
        </Field>
        <Field label="Status Kepegawaian">
          <Select options={['Permanent', 'Contract', 'Outsource']} value={form.status} onChange={(e) => set('status', e.target.value)} />
        </Field>
        <Field label="Gaji Pokok (Rp)">
          <Input type="number" min={0} placeholder="contoh: 8500000" value={form.salaryIdr} onChange={(e) => set('salaryIdr', e.target.value)} />
        </Field>
        <Field label="Sertifikasi" hint="Pisahkan dengan koma" className="sm:col-span-2">
          <Input placeholder="K3 Umum, POP Haul Truck, P3K" value={form.certifications} onChange={(e) => set('certifications', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
