import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Database, Download, Lock, Palette, RotateCcw, Save, ShieldAlert, ShieldCheck, Sliders, UserCog, Users } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'
import { cx, dmy } from '../lib/format'
import { Badge, Button, Card, CardHeader, Input, Select, StatCard, Toggle } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { AUTHORITY_LABEL, AUTHORITY_MATRIX, MODULES, ROLE_META, ROLE_ORDER, type Authority, type Role } from '../data/accounts'

const PATH = '/pengaturan'

const AUTHORITY_COLOR: Record<Authority, string> = {
  none: 'bg-surface-2 text-ink-faintest',
  view: 'bg-zinc-500/15 text-zinc-400',
  export: 'bg-teal-500/15 text-teal-400',
  create: 'bg-sky-500/15 text-sky-400',
  verify: 'bg-violet-500/15 text-violet-400',
  approve: 'bg-amber-500/15 text-amber-400',
  close: 'bg-emerald-500/15 text-emerald-400',
  admin: 'bg-rose-500/15 text-rose-400',
}

const AUTHORITY_SHORT: Record<Authority, string> = {
  none: '—',
  view: 'L',
  export: 'E',
  create: 'B',
  verify: 'V',
  approve: 'S',
  close: 'T',
  admin: 'A',
}

export default function Settings() {
  const { state, actions, toast } = useERP()
  const { user, role, authority } = useAuth()
  const { theme, mode, setMode } = useTheme()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'profil' | 'akun' | 'matrix' | 'konfig' | 'tampilan'>('profil')
  const [thresholds, setThresholds] = useState({
    fuelVariance: '1',
    stockCritical: '100',
    caEscalation: '3',
    billingVariance: '2',
    notifDaily: '07:00',
  })

  const modulePaths = MODULES.filter((m) => m.path !== '/pengaturan')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Master konfigurasi, akun, peran, matriks kewenangan tiga dimensi, ambang notifikasi, dan tampilan. System Administrator mengelola konfigurasi teknis — bukan transaksi bisnis."
        actions={
          <ActionButton module={PATH} need="admin" icon={<Save className="h-4 w-4" />} onClick={() => toast('Konfigurasi sistem disimpan.', 'success')}>
            Simpan Konfigurasi
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peran Terdaftar" value={String(ROLE_ORDER.length)} icon={<ShieldCheck className="h-4 w-4" />} tone="violet" hint="Level 1–10 + admin" />
        <StatCard label="Modul Aktif" value={String(MODULES.length)} icon={<Sliders className="h-4 w-4" />} tone="sky" hint="15 modul + sistem" />
        <StatCard label="Akun Pengguna" value={String(12)} icon={<Users className="h-4 w-4" />} tone="amber" hint="11 aktif · 1 nonaktif" />
        <StatCard label="Kewenangan Sesi" value={AUTHORITY_LABEL[authority(PATH)]} icon={<Lock className="h-4 w-4" />} tone={authority(PATH) === 'admin' ? 'emerald' : 'rose'} hint={`Peran ${role}`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['profil', 'Profil Saya'],
            ['akun', 'Akun & Peran'],
            ['matrix', 'Matriks Kewenangan'],
            ['konfig', 'Ambang & Notifikasi'],
            ['tampilan', 'Tampilan'],
          ] as Array<['profil' | 'akun' | 'matrix' | 'konfig' | 'tampilan', string]>
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
            {l}
          </button>
        ))}
      </div>

      {/* ------------------------------- Profil ------------------------------- */}
      {tab === 'profil' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Identitas Pengguna" subtitle="Data dari direktori akun perusahaan" />
            <div className="p-4 pt-0">
              <div className="flex items-center gap-3.5">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-lg font-bold text-zinc-950">{user?.avatar}</span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink-strong">{user?.name}</p>
                  <p className="truncate text-xs text-ink-faint">{user?.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="amber">{user?.role}</Badge>
                    <Badge tone="sky">Level {user?.level}</Badge>
                  </div>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5">
                {[
                  ['Departemen', user?.department ?? '-'],
                  ['Penempatan', user?.site ?? '-'],
                  ['Status akun', user?.status ?? '-'],
                  ['Login terakhir', user?.lastLogin ?? '-'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                    <dt className="text-xs text-ink-faint">{k}</dt>
                    <dd className="text-sm font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Cakupan Data & Kewenangan" subtitle="Tiga dimensi kontrol akses yang berlaku pada sesi Anda" />
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[
                { t: 'Role / Action', d: 'Tindakan yang boleh dilakukan pada setiap modul, dari melihat hingga mengubah konfigurasi sistem.', icon: ShieldCheck, tone: 'sky' as const },
                { t: 'Data Scope', d: 'Proyek, departemen, dan unit yang boleh diakses. Foreman tidak melihat data tim lain; Operator hanya unitnya.', icon: UserCog, tone: 'violet' as const },
                { t: 'Approval Authority', d: 'Apakah Anda hanya membuat, memverifikasi, menyetujui, atau menutup transaksi sesuai matriks delegasi.', icon: ShieldAlert, tone: 'amber' as const },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <x.icon className="h-4 w-4 text-amber-400" />
                  <p className="mt-2 text-sm font-semibold text-ink">{x.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{x.d}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-line p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Modul yang dapat diakses ({MODULES.filter((m) => authority(m.path) !== 'none').length} dari {MODULES.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.map((m) => {
                  const a = authority(m.path)
                  return (
                    <span key={m.path} className={cx('chip !px-2 !py-0.5 !text-[10px]', a === 'none' && 'opacity-45 line-through')}>
                      {m.label}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="border-t border-line p-4">
              <Button variant="outline" icon={<RotateCcw className="h-4 w-4" />} onClick={() => { actions.resetData(); toast('Data aplikasi dikembalikan ke kondisi awal.', 'warning') }}>
                Reset Data Demo
              </Button>
              <p className="mt-2 text-[11px] text-ink-faint">Mengembalikan seluruh data ke kondisi seed. Tindakan ini dicatat pada audit trail.</p>
            </div>
          </Card>
        </div>
      )}

      {/* -------------------------------- Akun -------------------------------- */}
      {tab === 'akun' && (
        <Card>
          <CardHeader title="Direktori Akun & Peran" subtitle="11 peran dengan tingkat kewenangan yang berbeda. Kata sandi demo untuk seluruh akun: mifa2026" />
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>Level</th>
                  <th>Departemen</th>
                  <th>Penempatan</th>
                  <th>Status</th>
                  <th>Login Terakhir</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'usr-1', name: 'Budi Santoso', email: 'operator@kontraktor.co.id', role: 'Operator', level: 1, department: 'Produksi', site: 'Site Berau', status: 'Active', lastLogin: '2026-10-15 06:10' },
                  { id: 'usr-2', name: 'Joko Prasetyo', email: 'foreman@kontraktor.co.id', role: 'Foreman', level: 2, department: 'Produksi', site: 'Site Berau', status: 'Active', lastLogin: '2026-10-15 06:25' },
                  { id: 'usr-3', name: 'Dedi Kurniawan', email: 'supervisor@kontraktor.co.id', role: 'Supervisor', level: 3, department: 'Produksi', site: 'Site Berau', status: 'Active', lastLogin: '2026-10-15 07:00' },
                  { id: 'usr-4', name: 'Ir. Sari Wulandari', email: 'planner@kontraktor.co.id', role: 'Planner', level: 4, department: 'Produksi', site: 'Site Lahat', status: 'Active', lastLogin: '2026-10-15 07:15' },
                  { id: 'usr-5', name: 'Ir. Agus Setiawan', email: 'superintendent@kontraktor.co.id', role: 'Superintendent', level: 5, department: 'Maintenance', site: 'Site Berau', status: 'Active', lastLogin: '2026-10-15 07:30' },
                  { id: 'usr-6', name: 'Ir. Bambang Wijaya', email: 'pm@kontraktor.co.id', role: 'Project Manager', level: 6, department: 'Manajemen', site: 'Site Berau', status: 'Active', lastLogin: '2026-10-15 07:45' },
                  { id: 'usr-7', name: 'Rina Hartati, S.E.', email: 'om@kontraktor.co.id', role: 'Operation Manager', level: 7, department: 'Manajemen', site: 'Semua Site', status: 'Active', lastLogin: '2026-10-15 08:00' },
                  { id: 'usr-8', name: 'Andi Prasetyo, S.E.', email: 'commercial@kontraktor.co.id', role: 'Commercial Manager', level: 8, department: 'Commercial', site: 'Semua Site', status: 'Active', lastLogin: '2026-10-15 08:10' },
                  { id: 'usr-9', name: 'Maya Kusuma, S.E., Ak.', email: 'finance@kontraktor.co.id', role: 'Finance Manager', level: 9, department: 'Cost Control', site: 'Semua Site', status: 'Active', lastLogin: '2026-10-15 08:20' },
                  { id: 'usr-10', name: 'Ir. Hendra Gunawan', email: 'direktur@kontraktor.co.id', role: 'Direktur', level: 10, department: 'Direksi', site: 'Semua Site', status: 'Active', lastLogin: '2026-10-15 08:30' },
                  { id: 'usr-11', name: 'Fajar Ramadhan', email: 'admin@kontraktor.co.id', role: 'System Admin', level: 0, department: 'IT', site: 'Semua Site', status: 'Active', lastLogin: '2026-10-15 08:40' },
                  { id: 'usr-12', name: 'Slamet Riyadi', email: 'operator2@kontraktor.co.id', role: 'Operator', level: 1, department: 'Produksi', site: 'Site Lahat', status: 'Inactive', lastLogin: '2026-08-02 11:40' },
                ].map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-ink">{a.name}</td>
                    <td className="text-[11px] text-ink-faint">{a.email}</td>
                    <td>
                      <Badge tone={a.role === 'System Admin' ? 'neutral' : a.level >= 8 ? 'amber' : a.level >= 6 ? 'emerald' : 'sky'} dot>
                        {a.role}
                      </Badge>
                    </td>
                    <td className="tbl-num text-ink-muted">{a.level || '-'}</td>
                    <td className="text-[11px] text-ink-faint">{a.department}</td>
                    <td className="text-[11px] text-ink-faint">{a.site}</td>
                    <td>
                      <Badge tone={a.status === 'Active' ? 'emerald' : 'zinc'} dot>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="text-[11px] text-ink-faintest">{a.lastLogin}</td>
                    <td>
                      {a.id !== user?.id && (
                        <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                          Masuk sebagai
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ------------------------------- Matriks ------------------------------- */}
      {tab === 'matrix' && (
        <Card>
          <CardHeader
            title="Matriks Kewenangan Peran × Modul"
            subtitle="L = Lihat · E = Ekspor · B = Buat · V = Verifikasi · S = Setujui · T = Tutup · A = Akses teknis. System Admin memiliki akses teknis tanpa kewenangan bisnis."
          />
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-surface-1">Peran</th>
                  {modulePaths.map((m) => (
                    <th key={m.path} className="whitespace-nowrap text-center text-[10px]" title={m.label}>
                      {m.label.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLE_ORDER.map((r) => (
                  <tr key={r}>
                    <td className="sticky left-0 z-10 bg-surface-1">
                      <p className="text-xs font-semibold text-ink">{r}</p>
                      <p className="text-[10px] text-ink-faintest">Level {ROLE_META[r].level || '-'}</p>
                    </td>
                    {modulePaths.map((m) => {
                      const a: Authority = AUTHORITY_MATRIX[r][m.path] ?? 'none'
                      return (
                        <td key={m.path} className="text-center">
                          <span className={cx('inline-grid h-6 w-6 place-items-center rounded text-[10px] font-bold', AUTHORITY_COLOR[a])} title={`${r} — ${m.label}: ${AUTHORITY_LABEL[a]}`}>
                            {AUTHORITY_SHORT[a]}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-xs font-semibold text-ink">Deskripsi Peran</p>
                <ul className="mt-2 space-y-1.5">
                  {ROLE_ORDER.slice(0, 4).map((r) => (
                    <li key={r} className="text-[11px] text-ink-faint">
                      <span className="font-semibold text-ink">{r}</span> — {ROLE_META[r].desc}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-xs font-semibold text-ink">&nbsp;</p>
                <ul className="mt-2 space-y-1.5">
                  {ROLE_ORDER.slice(4, 8).map((r) => (
                    <li key={r} className="text-[11px] text-ink-faint">
                      <span className="font-semibold text-ink">{r}</span> — {ROLE_META[r].desc}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-xs font-semibold text-ink">&nbsp;</p>
                <ul className="mt-2 space-y-1.5">
                  {ROLE_ORDER.slice(8).map((r) => (
                    <li key={r} className="text-[11px] text-ink-faint">
                      <span className="font-semibold text-ink">{r}</span> — {ROLE_META[r].desc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-line p-4">
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
              <span className="font-semibold">Catatan penting:</span> batas nilai persetujuan tidak ditanamkan pada kode aplikasi.
              Nilai batas disimpan sebagai konfigurasi yang dapat diaudit pada tab “Ambang & Notifikasi”, sehingga perubahan dapat
              dilacak dan dipertanggungjawabkan.
            </p>
          </div>
        </Card>
      )}

      /* ------------------------------ Konfigurasi ------------------------------ */
      {tab === 'konfig' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Ambang Operasional" subtitle="Nilai ambang yang memicu notifikasi dan eskalasi" />
            <div className="space-y-4 p-4 pt-0">
              {[
                { k: 'fuelVariance', label: 'Ambang selisih stok BBM', unit: '%', hint: 'Selisih di atas nilai ini wajib diselidiki.' },
                { k: 'billingVariance', label: 'Ambang selisih rekonsiliasi', unit: '%', hint: 'Selisih di atas nilai ini wajib disertai alasan tertulis.' },
                { k: 'caEscalation', label: 'Eskalasi tindakan korektif', unit: 'hari', hint: 'Terlambat melebihi hari ini dieskalasi ke atasan.' },
                { k: 'stockCritical', label: 'Ambang stok kritis', unit: '% dari minimum', hint: 'Persentase minimum stok yang memicu peringatan.' },
              ].map((f) => (
                <div key={f.k}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink">{f.label}</p>
                      <p className="text-[11px] text-ink-faint">{f.hint}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Input
                        className="!h-9 !w-20 text-right"
                        value={thresholds[f.k as keyof typeof thresholds]}
                        onChange={(e) => setThresholds((t) => ({ ...t, [f.k]: e.target.value }))}
                      />
                      <span className="text-[11px] text-ink-faint">{f.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-xs font-medium text-ink">Waktu kirim notifikasi harian</p>
                  <p className="text-[11px] text-ink-faint">Ringkasan tugas harian dikirim pada waktu ini.</p>
                </div>
                <Input type="time" className="!h-9 !w-28" value={thresholds.notifDaily} onChange={(e) => setThresholds((t) => ({ ...t, notifDaily: e.target.value }))} />
              </div>
            </div>
            <div className="border-t border-line p-4">
              <ActionButton module={PATH} need="admin" icon={<Save className="h-4 w-4" />} onClick={() => toast('Ambang konfigurasi disimpan dan tercatat pada audit trail.', 'success')}>
                Simpan Ambang
              </ActionButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="Integrasi Sistem" subtitle="Status koneksi sumber data eksternal" />
            <div className="space-y-2.5 p-4 pt-0">
              {[
                ['GPS Fleet Tracking', 'Tersambung', 'Pembacaan posisi & jam meter unit', 'emerald' as const],
                ['Weighbridge (Timbangan)', 'Tersambung', 'Tonase batu bara & OB', 'emerald' as const],
                ['Fuel Management System', 'Tersambung', 'Transaksi pengisian BBM', 'emerald' as const],
                ['Sistem Keuangan', 'Belum dikonfigurasi', 'Jurnal & laporan keuangan', 'amber' as const],
                ['ERP Pemilik Tambang', 'Belum dikonfigurasi', 'Pertukaran data volume & penagihan', 'zinc' as const],
              ].map(([name, status, desc, tone]) => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">{name}</p>
                    <p className="text-[11px] text-ink-faint">{desc}</p>
                  </div>
                  <Badge tone={tone as 'emerald' | 'amber' | 'zinc'} dot>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="border-t border-line p-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" icon={<Database className="h-4 w-4" />} onClick={() => toast('Cadangan data dibuat.', 'success')}>
                  Cadangkan Data
                </Button>
                <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => toast('Ekspor konfigurasi dijalankan.', 'info')}>
                  Ekspor Konfigurasi
                </Button>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Status Data Aplikasi" subtitle="Kondisi basis data demonstrasi" />
            <div className="grid gap-3 p-4 sm:grid-cols-4">
              {[
                ['Kontrak proyek', state.projectContracts.length],
                ['Rencana produksi', state.productionTargets.length],
                ['Log produksi', state.productionLogs.length],
                ['Penugasan unit', state.unitAssignments.length],
                ['Peristiwa downtime', state.downtimeEvents.length],
                ['Work order', state.maintenance.length],
                ['Transaksi BBM', state.fuelIssues.length],
                ['Master barang', state.warehouseItems.length],
                ['Purchase order', state.purchaseOrders.length],
                ['Personel', state.employees.length],
                ['Insiden HSE', state.incidents.length],
                ['Tindakan korektif', state.correctiveActions.length],
                ['Transaksi biaya', state.costTransactions.length],
                ['Rekonsiliasi', state.billingReconciliations.length],
                ['Entri audit', state.activity.length],
                ['Notifikasi', state.notifications.length],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                  <p className="mt-0.5 text-lg font-bold text-ink">{String(v)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-line p-4">
              <p className="text-[11px] text-ink-faint">Tanggal acuan aplikasi: {dmy('2026-10-15')}. Seluruh data pada tampilan ini adalah data demonstrasi yang deterministik.</p>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------- Tampilan ------------------------------- */}
      {tab === 'tampilan' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Tema Tampilan" subtitle="Pilih tema terang, gelap, atau mengikuti sistem" />
            <div className="space-y-2.5 p-4 pt-0">
              {(
                [
                  ['light', 'Terang', 'Cocok untuk ruang produksi dengan pencahayaan terang.'],
                  ['dark', 'Gelap', 'Mengurangi ketegangan mata pada ruang kendali malam.'],
                  ['system', 'Mengikuti Sistem', 'Menyesuaikan dengan pengaturan perangkat pengguna.'],
                ] as Array<[typeof mode, string, string]>
              ).map(([key, label, desc]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cx('flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors', mode === key ? 'border-amber-500/40 bg-amber-500/5' : 'border-line bg-surface-2/40 hover:border-line-strong')}
                >
                  <span className={cx('grid h-9 w-9 place-items-center rounded-lg border', mode === key ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-line bg-surface-2 text-ink-faint')}>
                    <Palette className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="text-[11px] text-ink-faint">{desc}</p>
                  </div>
                  {mode === key && <Check className="h-4 w-4 shrink-0 text-amber-400" />}
                </button>
              ))}
            </div>
            <div className="border-t border-line p-4">
              <p className="text-[11px] text-ink-faint">
                Tema aktif: <span className="font-semibold text-ink">{theme === 'dark' ? 'Gelap' : 'Terang'}</span>. Warna aksen amber dipertahankan sesuai preferensi perusahaan.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Preferensi Antarmuka" subtitle="Pengaturan tampilan data dan notifikasi" />
            <div className="divide-y divide-line">
              {[
                ['Tampilkan angka dalam ribuan', 'Memakai pemisah ribuan bahasa Indonesia pada seluruh tabel.'],
                ['Kompakkan tabel', 'Mengurangi jarak baris agar lebih banyak data terlihat.'],
                ['Notifikasi desktop', 'Menampilkan pemberitahuan sistem untuk tugas mendesak.'],
                ['Ringkasan harian via email', 'Mengirim daftar tugas harian setiap pagi.'],
              ].map(([label, desc]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">{label}</p>
                    <p className="text-[11px] text-ink-faint">{desc}</p>
                  </div>
                  <Toggle checked={label !== 'Notifikasi desktop'} onChange={() => undefined} label={label} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
