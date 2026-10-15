import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Globe2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  Shield,
  UserCog,
  Users,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, Toggle, type Column } from '../components/ui'
import { DataTable } from '../components/ui'
import { useERP } from '../store'
import { COMPANY } from '../data/seed'
import { useTheme, type ThemeMode } from '../theme/ThemeProvider'
import { ACCOUNTS, ACTION_LABEL, ACTION_MATRIX, ACCESS_MATRIX, MODULES, ROLE_DESC, ROLE_ORDER, ROLE_TONE, type Action } from '../data/accounts'
import { useAuth } from '../auth/AuthProvider'
import { cx, dmy, num } from '../lib/format'

type TabId = 'company' | 'users' | 'parameters' | 'integration'


const INTEGRATIONS = [
  { id: 'int-1', name: 'E-SPN BPMP Sumsel', desc: 'Pelaporan produksi & PNBP ke pemerintah provinsi', status: 'Terhubung', sync: '5 menit lalu' },
  { id: 'int-2', name: 'DJP Online (Coretax)', desc: 'Pelaporan & pelunasan pajak elektronik', status: 'Terhubung', sync: '1 jam lalu' },
  { id: 'int-3', name: 'Surveyor SGS Portal', desc: 'Sinkronisasi Certificate of Analysis (CoA)', status: 'Terhubung', sync: '22 menit lalu' },
  { id: 'int-4', name: 'ERP Vendor (SAP)', desc: 'Pertukaran data pembelian & inventory', status: 'Gangguan', sync: '3 hari lalu' },
  { id: 'int-5', name: 'Fleet Telematics (Hexagon)', desc: 'Data GPS & hour meter alat berat real-time', status: 'Terhubung', sync: 'Baru saja' },
  { id: 'int-6', name: 'Bank Mandiri API', desc: 'Rekonsiliasi mutasi rekening & treasury', status: 'Terhubung', sync: '12 menit lalu' },
]

const AUDIT_LOG = [
  { id: 'au-1', time: '2026-10-15 08:42', user: 'Bambang Setiawan', action: 'Menyetujui laporan produksi harian', module: 'Produksi', ip: '10.20.4.11' },
  { id: 'au-2', time: '2026-10-15 09:15', user: 'Hendra Wijaya', action: 'Membuat Sales Order SO-2026-1012', module: 'Penjualan', ip: '10.20.4.23' },
  { id: 'au-3', time: '2026-10-15 10:38', user: 'Agus Salim', action: 'Menutup insiden Near Miss', module: 'HSE', ip: '10.20.8.4' },
  { id: 'au-4', time: '2026-10-15 11:20', user: 'Rudi Hartono', action: 'Menyetujui PO bahan bakar Rp 2,4 M', module: 'Pembelian', ip: '10.20.4.9' },
  { id: 'au-5', time: '2026-10-15 13:05', user: 'Maya Kusuma', action: 'Posting jurnal penjualan JV-2026-3042', module: 'Keuangan', ip: '10.20.2.31' },
  { id: 'au-6', time: '2026-10-15 14:12', user: 'Dedi Prasetyo', action: 'Menyelesaikan WO preventive', module: 'Armada', ip: '10.20.7.18' },
  { id: 'au-7', time: '2026-10-15 15:30', user: 'Fitri Ramadani', action: 'Menutup stok opname gudang', module: 'Inventory', ip: '10.20.7.2' },
  { id: 'au-8', time: '2026-10-15 16:04', user: 'Yanti Lestari', action: 'Menyetujui pengajuan cuti', module: 'SDM', ip: '10.20.3.7' },
]

export default function SettingsPage() {
  const { state, actions, toast } = useERP()
  const { user, logout, can, canAction } = useAuth()
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()
  const [tab, setTab] = useState<TabId>('company')
  const [resetOpen, setResetOpen] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)
  const [emailAlert, setEmailAlert] = useState(true)
  const [autoApprove, setAutoApprove] = useState(false)

  const userColumns: Column<(typeof ACCOUNTS)[number]>[] = [
    {
      key: 'name',
      header: 'Nama Pengguna',
      sort: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-surface-3 to-surface-2 text-[10px] font-bold text-ink">
            {r.avatar}
          </span>
          <div>
            <p className="text-[13px] font-medium text-ink-strong">{r.name}</p>
            <p className="text-[11px] text-ink-faint">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Peran', sort: (r) => r.role, render: (r) => <Badge tone={ROLE_TONE[r.role]}>{r.role}</Badge> },
    { key: 'site', header: 'Cakupan Site', render: (r) => <span className="text-ink-muted">{r.site}</span> },
    { key: 'lastLogin', header: 'Login Terakhir', sort: (r) => r.lastLogin, render: (r) => <span className="font-mono text-[12px] text-ink-faint">{r.lastLogin}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <Button size="sm" variant="ghost" icon={<UserCog className="h-3.5 w-3.5" />}>
          Kelola
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi profil perusahaan, hak akses pengguna, parameter operasional, integrasi sistem, dan jejak audit."
        actions={
          <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={() => toast('Konfigurasi sistem berhasil disimpan', 'success')}>
            Simpan Perubahan
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pengguna Aktif" value={num(ACCOUNTS.filter((u) => u.status === 'Active').length)} unit="akun" hint={`${ACCOUNTS.length} total terdaftar`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Integrasi Terhubung" value={num(INTEGRATIONS.filter((i) => i.status === 'Terhubung').length)} unit="sistem" hint="Dari 6 endpoint" icon={<Globe2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Uptime Sistem" value={pctStr(99.7)} hint="30 hari terakhir" icon={<Shield className="h-4 w-4" />} tone="sky" />
        <StatCard label="Data Tersimpan" value="18,4 MB" hint="Penyimpanan lokal browser" icon={<Database className="h-4 w-4" />} tone="violet" />
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardHeader
            title="Sesi Aktif"
            subtitle="Identitas pengguna yang sedang masuk dan cakupan wewenangnya"
            icon={<Shield className="h-4 w-4" />}
            actions={
              <Button variant="outline" size="sm" icon={<LogOut className="h-3.5 w-3.5" />} onClick={() => { logout(); navigate('/login') }}>
                Akhiri Sesi
              </Button>
            }
          />
          <div className="flex flex-wrap items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold text-zinc-950">
              {user?.avatar ?? '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-strong">{user?.name ?? 'Belum masuk'}</p>
              <p className="text-[11px] text-ink-faint">{user?.email ?? '-'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ROLE_TONE[user?.role ?? 'Super Admin']}>{user?.role ?? '-'}</Badge>
              <Badge tone="neutral">{user?.site ?? 'Semua Site'}</Badge>
              <Badge tone="emerald">
                {MODULES.filter((m) => can(m.path)).length}/{MODULES.length} modul
              </Badge>
              <Badge tone="sky">
                {(Object.keys(ACTION_LABEL) as Action[]).filter((a) => ACTION_MATRIX[user?.role ?? 'Super Admin'][a]).length}/
                {Object.keys(ACTION_LABEL).length} tindakan
              </Badge>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Status Kontrol Akses" subtitle="Ringkasan penerapan RBAC pada aplikasi" icon={<KeyRound className="h-4 w-4" />} />
          <div className="space-y-2.5 p-5">
            {[
              { l: 'Menu & route terkontrol', v: 'Aktif', tone: 'text-emerald-400' },
              { l: 'Tombol aksi terkontrol', v: 'Aktif', tone: 'text-emerald-400' },
              { l: 'Filter cakupan site', v: 'Aktif', tone: 'text-emerald-400' },
              { l: 'Halaman 403 khusus', v: 'Tersedia', tone: 'text-sky-400' },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                <span className="text-xs text-ink-muted">{r.l}</span>
                <span className={cx('font-mono text-xs font-semibold', r.tone)}>{r.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'company', label: 'Profil Perusahaan' },
            { id: 'users', label: 'Pengguna & Hak Akses', count: ACCOUNTS.length },
            { id: 'parameters', label: 'Parameter Sistem' },
            { id: 'integration', label: 'Integrasi & Audit' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'company' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Profil Perusahaan" subtitle="Informasi legal dan identitas korporasi" icon={<Building2 className="h-4 w-4" />} />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="Nama Perusahaan" className="sm:col-span-2">
                <Input defaultValue={COMPANY.name} />
              </Field>
              <Field label="Alamat Kantor Pusat" className="sm:col-span-2">
                <Textarea defaultValue={COMPANY.address} />
              </Field>
              <Field label="Telepon">
                <Input defaultValue={COMPANY.phone} />
              </Field>
              <Field label="Email Korporasi">
                <Input defaultValue={COMPANY.email} />
              </Field>
              <Field label="NPWP">
                <Input defaultValue={COMPANY.npwp} />
              </Field>
              <Field label="Nomor PKP2B">
                <Input defaultValue={COMPANY.pkp2b} />
              </Field>
              <Field label="Tahun Berdiri">
                <Input type="number" defaultValue={COMPANY.since} />
              </Field>
              <Field label="Jumlah Karyawan">
                <Input type="number" defaultValue={COMPANY.employees} />
              </Field>
              <Field label="Mata Uang Pelaporan">
                <Select options={['IDR — Rupiah', 'USD — Dolar AS', 'Dual (IDR & USD)']} defaultValue="Dual (IDR & USD)" />
              </Field>
              <Field label="Kurs Acuan USD/IDR">
                <Input type="number" defaultValue={COMPANY.fx} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Preferensi Aplikasi" subtitle="Pengaturan tampilan dan perilaku sistem" icon={<Settings2 className="h-4 w-4" />} />
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-ink">Autentikasi Dua Faktor</p>
                  <p className="text-[11px] text-ink-faint">Wajib untuk peran Super Admin</p>
                </div>
                <Toggle checked={twoFactor} onChange={setTwoFactor} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-ink">Notifikasi Email</p>
                  <p className="text-[11px] text-ink-faint">Kirim peringatan approval & K3LH</p>
                </div>
                <Toggle checked={emailAlert} onChange={setEmailAlert} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-ink">Auto-approve PO Kecil</p>
                  <p className="text-[11px] text-ink-faint">PO di bawah Rp 100 juta</p>
                </div>
                <Toggle checked={autoApprove} onChange={setAutoApprove} />
              </div>
              <div className="space-y-3 border-t border-line pt-4">
                <Field label="Tema Tampilan" hint="Terapkan langsung ke seluruh aplikasi">
                  <Select
                    options={[
                      { value: 'dark', label: 'Gelap (Dark)' },
                      { value: 'light', label: 'Terang (Light)' },
                      { value: 'system', label: 'Ikuti Sistem Operasi' },
                    ]}
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ThemeMode)}
                  />
                </Field>
                <Field label="Bahasa Antarmuka">
                  <Select options={['Bahasa Indonesia', 'English']} defaultValue="Bahasa Indonesia" />
                </Field>
                <Field label="Zona Waktu">
                  <Select options={['WIB (UTC+7)', 'WITA (UTC+8)', 'WIT (UTC+9)']} defaultValue="WIB (UTC+7)" />
                </Field>
                <Field label="Format Tanggal">
                  <Select options={['DD-MMM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} defaultValue="DD-MMM-YYYY" />
                </Field>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'users' && (
        <Card className="mt-4">
          <CardHeader
            title="Daftar Pengguna"
            subtitle="Manajemen akun, peran, dan cakupan akses modul"
            actions={
              <div className="flex items-center gap-2">
                <Badge tone="amber">{ROLE_ORDER.length} tingkat hak akses</Badge>
                <Badge tone={ROLE_TONE[user?.role ?? 'Super Admin']}>{user?.role ?? 'Super Admin'}</Badge>
              </div>
            }
          />
          {!canAction('users.manage') && (
            <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-200/90">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Anda sedang masuk sebagai <span className="font-semibold">{user?.role}</span>. Pengelolaan pengguna dan hak akses
                hanya dapat dilakukan oleh <span className="font-semibold">Super Admin</span>. Tampilan berikut bersifat hanya-baca.
              </span>
            </div>
          )}
          <DataTable
            data={ACCOUNTS}
            columns={userColumns}
            rowKey={(r) => r.id}
            pageSize={10}
            search={(r) => `${r.name} ${r.email} ${r.role} ${r.site}`}
            searchPlaceholder="Cari pengguna, email, peran…"
            exportName="pengguna"
          />
          <div className="border-t border-line p-5">
            <p className="label">Matriks Hak Akses Modul</p>
            <p className="mb-3 text-[11px] text-ink-faint">
              Matriks ini adalah sumber tunggal kontrol akses — menu sidebar, route, dan tombol aksi mengacu pada tabel berikut.
            </p>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-surface-1">Peran</th>
                    {MODULES.map((m) => (
                      <th key={m.path} className="whitespace-nowrap text-center text-[11px]">
                        {m.label}
                      </th>
                    ))}
                    <th className="text-center">Total Modul</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_ORDER.map((role) => {
                    const total = MODULES.filter((m) => ACCESS_MATRIX[role][m.path]).length
                    return (
                      <tr key={role}>
                        <td className="sticky left-0 bg-surface-1">
                          <p className="font-medium text-ink">{role}</p>
                          <p className="max-w-[220px] text-[10px] leading-snug text-ink-faintest">{ROLE_DESC[role]}</p>
                        </td>
                        {MODULES.map((m) => (
                          <td key={m.path} className="text-center">
                            {ACCESS_MATRIX[role][m.path] ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                            ) : (
                              <span className="text-ink-faintest">—</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center">
                          <Badge tone={total === MODULES.length ? 'amber' : 'neutral'}>
                            {total}/{MODULES.length}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-line p-5">
            <p className="label">Matriks Hak Akses Tindakan</p>
            <p className="mb-3 text-[11px] text-ink-faint">
              Kontrol pada lapisan tombol aksi — peran tanpa wewenang melihat tombol dalam keadaan nonaktif beserta alasannya.
            </p>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-surface-1">Tindakan</th>
                    {ROLE_ORDER.map((r) => (
                      <th key={r} className="whitespace-nowrap text-center text-[11px]">
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(ACTION_LABEL) as Action[]).map((a) => (
                    <tr key={a}>
                      <td className="sticky left-0 bg-surface-1 text-ink">{ACTION_LABEL[a]}</td>
                      {ROLE_ORDER.map((r) => (
                        <td key={r} className="text-center">
                          {ACTION_MATRIX[r][a] ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                          ) : (
                            <span className="text-ink-faintest">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-line p-5">
            <p className="label">Sesi &amp; Keamanan Login</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { l: 'Pengguna terdaftar', v: String(ACCOUNTS.length) },
                { l: 'Tingkat peran', v: String(ROLE_ORDER.length) },
                { l: 'Modul terkontrol', v: String(MODULES.length) },
              ].map((k) => (
                <div key={k.l} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-ink-faint">{k.l}</p>
                  <p className="mt-1 text-lg font-bold text-ink">{k.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-[11px] leading-relaxed text-amber-600 dark:text-amber-200/90">
              Catatan: pada versi ini autentikasi masih berjalan di sisi klien untuk keperluan demo (kata sandi demo{' '}
              <span className="font-mono font-semibold">mifa2026</span>). Autentikasi sesungguhnya dengan hash sandi, token sesi, dan
              rate limiting akan diimplementasikan pada backend API.
            </p>
          </div>
        </Card>
      )}

      {tab === 'parameters' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Parameter Operasional" subtitle="Ambang batas dan target kinerja tambang" icon={<Settings2 className="h-4 w-4" />} />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="Target Produksi Tahunan (MT)">
                <Input type="number" defaultValue={1250000} />
              </Field>
              <Field label="Target Stripping Ratio (Bcm/MT)">
                <Input type="number" step="0.1" defaultValue={4.2} />
              </Field>
              <Field label="Target Availability Armada (%)">
                <Input type="number" step="0.1" defaultValue={85} />
              </Field>
              <Field label="Target Utilisasi Armada (%)">
                <Input type="number" step="0.1" defaultValue={80} />
              </Field>
              <Field label="Minimum Stok BBM (%)">
                <Input type="number" defaultValue={30} />
              </Field>
              <Field label="Ambang Overdue Piutang (hari)">
                <Input type="number" defaultValue={60} />
              </Field>
              <Field label="Hari Tanpa LTI Target">
                <Input type="number" defaultValue={365} />
              </Field>
              <Field label="Ambang Insiden Investigasi (hari)">
                <Input type="number" defaultValue={7} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Parameter Keuangan & Royalti" subtitle="Tarif pajak, royalti, dan konfigurasi kurs" icon={<KeyRound className="h-4 w-4" />} />
            <div className="space-y-5 p-5">
              <div>
                <p className="label">Tarif Royalti PNBP (PP No. 9/2010)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { band: 'GAR > 5.200', rate: 4 },
                    { band: '4.201–5.200', rate: 5 },
                    { band: '3.401–4.200', rate: 6 },
                    { band: '3.101–3.400', rate: 7 },
                    { band: '2.101–3.100', rate: 8 },
                    { band: '≤ 2.100', rate: 9 },
                  ].map((r) => (
                    <div key={r.band} className="rounded-lg border border-line bg-surface-2/50 px-3 py-2">
                      <p className="text-[10px] text-ink-faint">{r.band}</p>
                      <p className="font-mono text-sm font-semibold text-amber-400">{r.rate}%</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tarif PPN (%)">
                  <Input type="number" step="0.1" defaultValue={11} />
                </Field>
                <Field label="PPh Final 22 Ekspor (%)">
                  <Input type="number" step="0.1" defaultValue={3} />
                </Field>
                <Field label="Kurs USD/IDR">
                  <Input type="number" defaultValue={COMPANY.fx} />
                </Field>
                <Field label="Periode RKAB">
                  <Input defaultValue="RKAB 2026" />
                </Field>
              </div>
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] p-3 text-[11px] leading-relaxed text-sky-600 dark:text-sky-200">
                Parameter royalti dihitung otomatis dari nilai kalori GAR setiap produksi. Perubahan tarif mengacu pada peraturan menteri yang berlaku.
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader title="Spesifikasi Mutu Kontrak" subtitle="Parameter spesifikasi batubara per grade penjualan" />
            <div className="overflow-x-auto scrollbar-thin">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th className="text-right">GCV GAR (kcal/kg)</th>
                    <th className="text-right">Total Moisture (%)</th>
                    <th className="text-right">Ash (%)</th>
                    <th className="text-right">Sulfur (%)</th>
                    <th>Pasar</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { grade: 'GAR 5300', gcv: '5.300 – 5.400', tm: '≤ 20', ash: '≤ 3,5', s: '≤ 0,3', market: 'Ekspor premium' },
                    { grade: 'GAR 5000', gcv: '5.000 – 5.200', tm: '≤ 22', ash: '≤ 4,0', s: '≤ 0,4', market: 'Ekspor' },
                    { grade: 'GAR 4300', gcv: '4.300 – 4.500', tm: '≤ 28', ash: '≤ 5,5', s: '≤ 0,5', market: 'PLTU domestic' },
                    { grade: 'GAR 4200', gcv: '4.200 – 4.400', tm: '≤ 26', ash: '≤ 6,0', s: '≤ 0,6', market: 'Ekspor & industri' },
                    { grade: 'GAR 4000', gcv: '4.000 – 4.200', tm: '≤ 29', ash: '≤ 6,5', s: '≤ 0,7', market: 'Semen & kertas' },
                    { grade: 'GAR 3800', gcv: '3.800 – 4.000', tm: '≤ 32', ash: '≤ 9,0', s: '≤ 1,0', market: 'Domestic rendah' },
                  ].map((r) => (
                    <tr key={r.grade}>
                      <td className="font-mono text-amber-400">{r.grade}</td>
                      <td className="tbl-num">{r.gcv}</td>
                      <td className="tbl-num">{r.tm}</td>
                      <td className="tbl-num">{r.ash}</td>
                      <td className="tbl-num">{r.s}</td>
                      <td className="text-ink-muted">{r.market}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'integration' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {INTEGRATIONS.map((i) => (
                <Card key={i.id}>
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${i.status === 'Terhubung' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <Globe2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink-strong">{i.name}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{i.desc}</p>
                        <p className="mt-1.5 text-[11px] text-ink-faintest">Sinkronisasi: {i.sync}</p>
                      </div>
                    </div>
                    <StatusBadge value={i.status} />
                  </div>
                  <div className="border-t border-line px-4 py-2.5">
                    <Progress value={i.status === 'Terhubung' ? 98 : 42} tone={i.status === 'Terhubung' ? 'emerald' : 'rose'} />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader title="Keamanan & Akses" subtitle="Status keamanan sistem dan kebijakan akses" icon={<Shield className="h-4 w-4" />} />
            <div className="space-y-4 p-5">
              {[
                { label: 'Autentikasi dua faktor', value: twoFactor ? 'Aktif' : 'Nonaktif', tone: twoFactor ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Kebijakan password', value: '90 hari rotasi', tone: 'text-sky-400' },
                { label: 'Sesi aktif', value: '14 pengguna', tone: 'text-ink' },
                { label: 'Percobaan login gagal', value: '3 (24 jam)', tone: 'text-amber-400' },
                { label: 'Backup terakhir', value: '2026-10-15 02:00', tone: 'text-ink' },
                { label: 'Enkripsi data', value: 'AES-256', tone: 'text-emerald-400' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                  <span className="text-xs text-ink-muted">{r.label}</span>
                  <span className={`font-mono text-sm font-semibold ${r.tone}`}>{r.value}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => toast('Sinkronisasi manual dijalankan', 'info')}>
                Jalankan Sinkronisasi
              </Button>
            </div>
          </Card>
        </div>
      )}

      <SectionTitle title="Jejak Audit (Audit Trail)" subtitle="Rekaman aktivitas pengguna untuk kepatuhan dan akuntabilitas" />
      <Card>
        <CardHeader title="Log Aktivitas Pengguna" subtitle="Seluruh aktivitas tercatat dengan penanda waktu dan alamat IP" actions={<Badge tone="neutral">{AUDIT_LOG.length} aktivitas</Badge>} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="tbl">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna</th>
                <th>Aktivitas</th>
                <th>Modul</th>
                <th>Alamat IP</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-[12px] text-ink-faint">{a.time}</td>
                  <td className="text-ink">{a.user}</td>
                  <td className="text-ink-muted">{a.action}</td>
                  <td>
                    <Badge tone="neutral">{a.module}</Badge>
                  </td>
                  <td className="font-mono text-[12px] text-ink-faintest">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionTitle title="Zona Berbahaya" subtitle="Tindakan yang berdampak pada data sistem" />
      <Card className="border-rose-500/25">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-strong">Reset Data Demo</p>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              Mengembalikan seluruh data aplikasi — produksi, penjualan, armada, K3LH, dan keuangan — ke kondisi awal seed. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <Button variant="danger" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setResetOpen(true)}>
            Reset Data
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Mail, label: 'Dukungan Teknis', value: 'support@mifacoal.co.id', sub: 'Respons dalam 1x24 jam' },
          { icon: Phone, label: 'Helpdesk Operasional', value: '+62 711 4455 999', sub: 'Senin–Sabtu 07.00–20.00 WIB' },
          { icon: Shield, label: 'Versi Sistem', value: 'MIFA ERP v1.0.0', sub: 'Build 20261015 · RKAB 2026' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2/60 text-ink-muted">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">{s.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink-strong">{s.value}</p>
                <p className="text-[11px] text-ink-faintest">{s.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Konfirmasi Reset Data"
        subtitle="Seluruh perubahan yang Anda buat akan hilang"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                actions.resetData()
                setResetOpen(false)
              }}
            >
              Ya, Reset Data
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-[13px] leading-relaxed text-rose-600 dark:text-rose-200">
              Tindakan ini akan menghapus seluruh data yang Anda tambahkan atau ubahkan melalui aplikasi dan memulihkan dataset demo awal. Pastikan Anda telah mengekspor data yang diperlukan.
            </p>
          </div>
          <p className="text-[12px] text-ink-faint">Ketik <span className="font-mono text-ink">RESET</span> untuk mengonfirmasi:</p>
          <Input placeholder="RESET" />
        </div>
      </Modal>
    </div>
  )
}

function pctStr(v: number) {
  return `${v.toFixed(1).replace('.', ',')}%`
}
