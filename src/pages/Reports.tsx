import { useMemo, useState } from 'react'
import { Bell, Download, FileBarChart, FileSpreadsheet, Filter, History, ScrollText } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics, TODAY } from '../lib/metrics'
import { cx, dmy, idrFull, num, num1, pct1 } from '../lib/format'
import { Badge, Button, Card, CardHeader, EmptyState, Select, StatCard } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { TrendChart } from '../components/charts'
import { AUTHORITY_LABEL } from '../data/accounts'

const PATH = '/laporan'

interface ReportDef {
  id: string
  title: string
  module: string
  desc: string
  formats: string[]
  owner: string
}

const REPORTS: ReportDef[] = [
  { id: 'r1', title: 'Laporan Produksi Harian per Shift', module: '/monitoring-produksi', desc: 'Volume, jam operasi, dan produktivitas per shift dan pit.', formats: ['PDF', 'Excel'], owner: 'Supervisor' },
  { id: 'r2', title: 'Laporan Target vs Realisasi Bulanan', module: '/perencanaan', desc: 'Perbandingan target yang disetujui dengan realisasi terdokumentasi.', formats: ['PDF', 'Excel'], owner: 'Planner' },
  { id: 'r3', title: 'Laporan Downtime & Penyebab', module: '/downtime', desc: 'Jam tidak produktif per unit, kategori, dan dampak produksi.', formats: ['PDF', 'Excel'], owner: 'Superintendent' },
  { id: 'r4', title: 'Laporan Ketersediaan & Pemanfaatan Armada', module: '/master-unit', desc: 'Availability, utilization, dan jam meter seluruh unit.', formats: ['PDF', 'Excel'], owner: 'Operation Manager' },
  { id: 'r5', title: 'Laporan Work Order & Biaya Maintenance', module: '/maintenance', desc: 'WO terbuka, terlambat, biaya suku cadang dan jasa.', formats: ['PDF', 'Excel'], owner: 'Superintendent' },
  { id: 'r6', title: 'Rekapitulasi Penerimaan & Konsumsi BBM', module: '/bbm', desc: 'Penerimaan, pengeluaran, stok akhir, dan selisih per tangki.', formats: ['PDF', 'Excel'], owner: 'Supervisor' },
  { id: 'r7', title: 'Laporan Stok & Nilai Persediaan', module: '/gudang', desc: 'Posisi stok, barang di bawah minimum, dan nilai persediaan.', formats: ['PDF', 'Excel'], owner: 'Warehouse' },
  { id: 'r8', title: 'Laporan Statistik HSE', module: '/hse', desc: 'LTIFR, TRIR, hari tanpa LTI, dan status tindakan korektif.', formats: ['PDF'], owner: 'Supervisor' },
  { id: 'r9', title: 'Laporan Biaya Proyek & Margin', module: '/biaya', desc: 'Actual vs committed per kategori dan margin indikatif proyek.', formats: ['PDF', 'Excel'], owner: 'Finance Manager' },
  { id: 'r10', title: 'Laporan Rekonsiliasi & Penagihan', module: '/rekonsiliasi', desc: 'Volume internal, disetujui owner, selisih, dan status tagihan.', formats: ['PDF', 'Excel'], owner: 'Commercial Manager' },
  { id: 'r11', title: 'Laporan Personel & Kompetensi', module: '/personel', desc: 'Komposisi personel, sertifikasi, dan penugasan aktif.', formats: ['PDF', 'Excel'], owner: 'Supervisor' },
  { id: 'r12', title: 'Laporan Ringkasan Eksekutif', module: '/dashboard', desc: 'Indikator strategis seluruh proyek untuk pimpinan.', formats: ['PDF'], owner: 'Direktur' },
]

export default function Reports() {
  const { state, toast } = useERP()
  const { role, authority, can } = useAuth()
  const m = useMetrics()
  const [category, setCategory] = useState('Semua')

  const categories = ['Semua', ...new Set(REPORTS.map((r) => r.module))]
  const visible = category === 'Semua' ? REPORTS : REPORTS.filter((r) => r.module === category)

  const activityByType = useMemo(() => {
    const types = ['create', 'edit', 'approve', 'delete', 'export', 'login'] as const
    return types.map((t) => ({ name: t, value: state.activity.filter((a) => a.type === t).length }))
  }, [state.activity])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan, Notifikasi & Audit Trail"
        subtitle="Modul 15 — laporan standar, eskalasi, riwayat perubahan, dan log aktivitas penting. Semua laporan memakai angka yang sama dengan modul operasional agar tidak terjadi perbedaan versi."
        actions={
          <ActionButton module={PATH} need="export" icon={<Download className="h-4 w-4" />} onClick={() => toast('Ekspor laporan ringkasan dijalankan.', 'info')}>
            Ekspor Ringkasan
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Laporan Tersedia" value={num(visible.length)} icon={<FileBarChart className="h-4 w-4" />} tone="sky" hint="Sesuai lingkup peran Anda" />
        <StatCard label="Entri Audit Trail" value={num(state.activity.length)} icon={<History className="h-4 w-4" />} tone="violet" hint="Riwayat perubahan data" />
        <StatCard label="Notifikasi Terkirim" value={num(state.notifications.length)} icon={<Bell className="h-4 w-4" />} tone="amber" hint={`${state.notifications.filter((n) => !n.read).length} belum dibaca`} />
        <StatCard label="Kewenangan Ekspor" value={authority(PATH) === 'none' ? 'Tidak ada' : AUTHORITY_LABEL[authority(PATH)]} icon={<FileSpreadsheet className="h-4 w-4" />} tone={authority(PATH) === 'none' ? 'rose' : 'emerald'} hint={`Peran ${role}`} />
      </div>

      <Card>
        <CardHeader title="Tren Realisasi Volume" subtitle="Dasar seluruh laporan produksi — angka identik dengan modul Monitoring" />
        <div className="p-4 pt-0">
          <TrendChart
            data={m.monthly as unknown as Array<Record<string, string | number>>}
            xKey="label"
            series={[
              { key: 'bcm', name: 'OB Removal (BCM)' },
              { key: 'ton', name: 'Coal Getting (Ton)', type: 'line' },
            ]}
            height={240}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Daftar Laporan Standar"
          subtitle="Laporan yang modulnya tidak boleh diakses oleh peran Anda otomatis disembunyikan."
          actions={
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-ink-faintest" />
              <Select value={category} onChange={(e) => setCategory(e.target.value)} options={categories} className="!h-8 !w-auto !py-0 text-xs" />
            </div>
          }
        />
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const allowed = can(r.module)
            return (
              <div key={r.id} className={cx('rounded-xl border p-4', allowed ? 'border-line bg-surface-2/40' : 'border-dashed border-line opacity-55')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{r.title}</p>
                  <FileBarChart className="h-4 w-4 shrink-0 text-amber-400" />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{r.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    {r.formats.map((f) => (
                      <span key={f} className="chip !px-1.5 !py-0.5 !text-[10px]">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-ink-faintest">Pemilik: {r.owner}</span>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <ActionButton
                    module={PATH}
                    need="export"
                    size="sm"
                    variant="ghost"
                    icon={<Download className="h-3.5 w-3.5" />}
                    onClick={() => toast(`Laporan "${r.title}" diunduh.`, 'success')}
                  >
                    Unduh
                  </ActionButton>
                  {!allowed && <p className="mt-1.5 text-[10px] text-ink-faintest">Modul sumber tidak dapat diakses peran Anda.</p>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Audit Trail" subtitle="Riwayat perubahan data penting — siapa, apa, dan kapan" />
          <div className="max-h-[420px] divide-y divide-line overflow-y-auto scrollbar-thin">
            {state.activity.slice(0, 40).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', a.type === 'approve' ? 'bg-emerald-400' : a.type === 'create' ? 'bg-sky-400' : a.type === 'delete' ? 'bg-rose-400' : a.type === 'export' ? 'bg-violet-400' : 'bg-amber-400')} />
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
          <CardHeader title="Aktivitas per Jenis" subtitle="Sebaran perubahan berdasarkan kategori tindakan" />
          <div className="space-y-2.5 p-4 pt-0">
            {activityByType.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <ScrollText className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium capitalize text-ink">{a.name}</span>
                </div>
                <span className="text-sm font-bold text-ink">{num(a.value)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line p-4">
            <p className="text-[11px] leading-relaxed text-ink-faint">
              Setiap pembuatan, perubahan status, persetujuan, penolakan, dan penutupan transaksi dicatat. Log audit bersifat hanya-tambah
              (append-only) dan tidak dapat diubah melalui antarmuka aplikasi.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Ringkasan Angka Kunci" subtitle="Referensi cepat untuk laporan eksekutif" />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Indikator</th>
                <th className="text-right">Nilai</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Realisasi volume bulan ini', `${num(m.actualThisMonth)} BCM`, `Target ${num(m.targetThisMonth)} BCM (${pct1(m.achievement)})`],
                ['Ketersediaan armada', pct1(m.fleetAvailability), `${m.fleetOperating} dari ${m.fleetTotal} unit beroperasi`],
                ['Jam downtime bulan ini', `${num1(m.downtimeHours)} jam`, `${m.downtimeThisMonth.length} peristiwa tercatat`],
                ['Biaya aktual bulan ini', idrFull(m.costActual), `Komitmen PO ${idrFull(m.costCommitted)}`],
                ['Selisih rekonsiliasi', `${num(m.recVariance)} BCM`, `Dari volume diajukan ${num(m.recSubmitted)} BCM`],
                ['LTIFR 12 bulan', num1(m.ltifr), `${m.lti12} LTI · ${m.fatalities} fatalitas`],
                ['Hari tanpa LTI', `${num(m.daysSinceLTI)} hari`, 'Sejak insiden terakhir'],
                ['Tindakan korektif terbuka', `${num(m.openCA)} item`, `${m.overdueCA} melewati tenggat`],
                ['Kepatuhan lingkungan', pct1(m.complianceRate), `${m.envExceeded} parameter melebihi ambang`],
              ].map(([k, v, note]) => (
                <tr key={k}>
                  <td className="font-medium text-ink">{k}</td>
                  <td className="tbl-num font-semibold text-ink">{v}</td>
                  <td className="text-[11px] text-ink-faint">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-4">
          <EmptyState
            icon={<FileBarChart className="h-5 w-5 text-ink-faintest" />}
            title="Laporan dihitung dari data sumber"
            hint={`Tidak ada angka yang dimasukkan manual. Tanggal acuan aplikasi: ${dmy(TODAY)}.`}
          />
        </div>
      </Card>
    </div>
  )
}
