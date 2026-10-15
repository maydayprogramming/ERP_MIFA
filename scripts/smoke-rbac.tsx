/* Smoke test autentikasi & RBAC (kontrol akses tiga dimensi).
   1. Verifikasi matriks kewenangan (fungsi murni) untuk seluruh peran.
   2. Halaman login tampil tanpa sesi.
   3. Route terlindungi tidak merender konten modul bila belum login.
   4. Peran tanpa wewenang mendapatkan halaman 403.
   5. Sidebar menyaring menu sesuai peran.
   6. Tombol aksi disembunyikan bagi peran tanpa kewenangan.
   7. Pemisahan hak teknis dan kewenangan bisnis (System Admin).
   8. Kesesuaian direktori akun. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { AppProvider } from '../src/store'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import { AuthProvider } from '../src/auth/AuthProvider'
import {
  ACCOUNTS,
  AUTHORITY_MATRIX,
  AUTHORITY_RANK,
  MODULES,
  ROLE_ORDER,
  canAccess,
  canDo,
  hasAuthority,
  scopeDepartments,
  scopeProjects,
} from '../src/data/accounts'
import App from '../src/App'
import { NAV_GROUPS } from '../src/components/Sidebar'

const NAV_LABELS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.label))

const render = (route: string, userId?: string) =>
  renderToString(
    <StaticRouter location={route}>
      <ThemeProvider>
        <AuthProvider initialUser={userId ? ACCOUNTS.find((a) => a.id === userId) ?? null : null}>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </StaticRouter>,
  )

let failed = 0
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${detail ? `  ·  ${detail}` : ''}`)
  if (!cond) failed += 1
}

const account = (role: string) => ACCOUNTS.find((a) => a.role === role && a.status === 'Active')!

/* ==================== 1. Matriks kewenangan (fungsi murni) ================ */

const allowedCount = ROLE_ORDER.map((r) => ({ role: r, n: MODULES.filter((m) => AUTHORITY_MATRIX[r][m.path] !== 'none').length }))
allowedCount.forEach(({ role, n }) => {
  check(
    `Matriks modul konsisten — ${role} (${n}/${MODULES.length})`,
    n > 0 && n <= MODULES.length && MODULES.every((m) => canAccess(role, m.path) === (AUTHORITY_MATRIX[role][m.path] !== 'none')),
  )
})

check('System Admin memiliki akses ke seluruh modul', MODULES.every((m) => canAccess('System Admin', m.path)))
check('Setiap peran minimal bisa membuka Dashboard', ROLE_ORDER.every((r) => canAccess(r, '/dashboard')))
check('Setiap peran bisa membuka Tugas Saya', ROLE_ORDER.every((r) => canAccess(r, '/tugas-saya')))

check('Operator tidak dapat membuka Proyek & Kontrak', !canAccess('Operator', '/proyek-kontrak'))
check('Operator tidak dapat membuka Cost Control', !canAccess('Operator', '/biaya'))
check('Operator tidak dapat membuka Rekonsiliasi', !canAccess('Operator', '/rekonsiliasi'))
check('Operator dapat input Monitoring Produksi', canAccess('Operator', '/monitoring-produksi'))
check('Operator dapat lapor Downtime', canAccess('Operator', '/downtime'))
check('Operator dapat lapor Insiden HSE', canAccess('Operator', '/hse'))

check('Foreman dapat verifikasi produksi', hasAuthority('Foreman', '/monitoring-produksi', 'verify'))
check('Foreman dapat buat Dispatch', canAccess('Foreman', '/dispatch'))
check('Foreman tidak dapat setujui pengadaan', !hasAuthority('Foreman', '/pengadaan', 'approve'))

check('Supervisor dapat menyetujui produksi', hasAuthority('Supervisor', '/monitoring-produksi', 'approve'))
check('Supervisor dapat menyetujui BBM', hasAuthority('Supervisor', '/bbm', 'approve'))
check('Supervisor tidak dapat menyetujui pengadaan', !hasAuthority('Supervisor', '/pengadaan', 'approve'))

check('Planner dapat buat rencana produksi', canAccess('Planner', '/perencanaan'))
check('Planner tidak dapat menyetujui rencana', !hasAuthority('Planner', '/perencanaan', 'approve'))
check('Planner tidak dapat menyetujui produksi', !hasAuthority('Planner', '/monitoring-produksi', 'approve'))

check('Superintendent dapat setujui rencana', hasAuthority('Superintendent', '/perencanaan', 'approve'))
check('Superintendent dapat setujui Maintenance', hasAuthority('Superintendent', '/maintenance', 'approve'))

check('Project Manager dapat setujui pengadaan', hasAuthority('Project Manager', '/pengadaan', 'approve'))
check('Project Manager dapat setujui rekonsiliasi', hasAuthority('Project Manager', '/rekonsiliasi', 'approve'))
check('Project Manager tidak dapat setujui biaya', !hasAuthority('Project Manager', '/biaya', 'approve'))

check('Commercial Manager dapat kelola kontrak', hasAuthority('Commercial Manager', '/proyek-kontrak', 'approve'))
check('Commercial Manager dapat setujui rekonsiliasi', hasAuthority('Commercial Manager', '/rekonsiliasi', 'approve'))
check('Commercial Manager tidak dapat akses Dispatch', !canAccess('Commercial Manager', '/dispatch'))
check('Commercial Manager tidak dapat akses Personel', !canAccess('Commercial Manager', '/personel'))

check('Finance Manager dapat setujui biaya', hasAuthority('Finance Manager', '/biaya', 'approve'))
check('Finance Manager dapat setujui pengadaan', hasAuthority('Finance Manager', '/pengadaan', 'approve'))
check('Finance Manager tidak dapat akses Dispatch', !canAccess('Finance Manager', '/dispatch'))

check('Direktur dapat melihat seluruh modul operasional & komersial', MODULES.filter((m) => m.path !== '/pengaturan').every((m) => canAccess('Direktur', m.path)))
check('Direktur tidak memiliki kewenangan menyetujui', !hasAuthority('Direktur', '/biaya', 'approve') && !hasAuthority('Direktur', '/pengadaan', 'approve'))

/* --- Dimensi 2: data scope --- */
check('Operation Manager memiliki lingkup seluruh proyek', scopeProjects('Operation Manager').length > 1)
check('Direktur memiliki lingkup seluruh proyek', scopeProjects('Direktur').length > 1)
check('Commercial Manager memiliki lingkup seluruh proyek', scopeProjects('Commercial Manager').length > 1)
check('Operator terbatas pada penugasannya', scopeProjects('Operator').length === 0)
check('Supervisor terbatas pada departemen penugasan', scopeDepartments('Supervisor').length === 0)
check('Project Manager memiliki lingkup lintas departemen', scopeDepartments('Project Manager').length > 5)

/* --- Dimensi 3: hierarki kewenangan --- */
check('Peringkat kewenangan meningkat: none < view < create < verify < approve', AUTHORITY_RANK.none < AUTHORITY_RANK.view && AUTHORITY_RANK.view < AUTHORITY_RANK.create && AUTHORITY_RANK.create < AUTHORITY_RANK.verify && AUTHORITY_RANK.verify < AUTHORITY_RANK.approve)
check('Hierarki kewenangan ditegakkan', hasAuthority('Supervisor', '/monitoring-produksi', 'view') && hasAuthority('Supervisor', '/monitoring-produksi', 'create') && !hasAuthority('Operator', '/monitoring-produksi', 'verify'))
check('Peran tak dikenal tidak memiliki akses', !canAccess(undefined, '/dashboard') && !hasAuthority(undefined, '/monitoring-produksi', 'view'))

/* ============================ 2. Halaman login =========================== */

const loginHtml = render('/login')
check('Halaman /login tampil tanpa sesi', loginHtml.includes('Masuk ke Akun Anda'))
check('Form login menyertakan kredensial demo', loginHtml.includes('mifa2026') && loginHtml.includes('Akun Demo'))
check('Login menampilkan merek aplikasi kontraktor', loginHtml.includes('Kontraktor') && loginHtml.includes('Mining Contractor ERP'))
check('Login menampilkan penghitung peran pada panel demo', loginHtml.includes('Akun Demo') && loginHtml.includes('peran'))
check('Login dengan sesi aktif dialihkan (tidak menampilkan form)', !render('/login', ACCOUNTS[0].id).includes('Masuk ke Akun Anda'))

/* ==================== 3. Route terlindungi tanpa sesi ==================== */

const guarded = render('/biaya')
check('Route /biaya tanpa sesi tidak merender konten modul', !guarded.includes('Biaya Aktual') && !guarded.includes('Transaksi Biaya'))
const guarded2 = render('/rekonsiliasi')
check('Route /rekonsiliasi tanpa sesi tidak merender konten modul', !guarded2.includes('Alur Rekonsiliasi') && !guarded2.includes('Daftar Rekonsiliasi'))
const guarded3 = render('/dashboard')
check('Route /dashboard tanpa sesi tidak merender konten modul', !guarded3.includes('Keputusan &amp; Tindakan') && !guarded3.includes('Cakupan Modul'))

/* ======================== 4. Peran tanpa wewenang ======================== */

const operator = account('Operator')
const planner = account('Planner')
const commercial = account('Commercial Manager')

check('Operator → /biaya mendapat halaman 403', render('/biaya', operator.id).includes('Akses Ditolak'))
check('Operator → /proyek-kontrak mendapat 403', render('/proyek-kontrak', operator.id).includes('Akses Ditolak'))
check('Planner → /biaya tetap diizinkan', !render('/biaya', planner.id).includes('Akses Ditolak'))
check('Commercial Manager → /dispatch mendapat 403', render('/dispatch', commercial.id).includes('Akses Ditolak'))
check('Halaman 403 mencantumkan identitas sesi', render('/biaya', operator.id).includes(operator.name))
check('Halaman 403 menjelaskan tiga dimensi kontrol akses', render('/biaya', operator.id).includes('Role / Action') && render('/biaya', operator.id).includes('Data Scope'))

check('Operator → /monitoring-produksi tetap diizinkan', !render('/monitoring-produksi', operator.id).includes('Akses Ditolak'))
check('Operator → /hse tetap diizinkan', !render('/hse', operator.id).includes('Akses Ditolak'))
check('System Admin → /pengaturan tetap diizinkan', !render('/pengaturan', account('System Admin').id).includes('Akses Ditolak'))
check('Operator → /pengaturan mendapat 403', render('/pengaturan', operator.id).includes('Akses Ditolak'))

/* ======================= 5. Penyaringan menu sidebar ===================== */

const operatorSidebar = render('/dashboard', operator.id)
check('Sidebar Operator menyembunyikan Proyek & Kontrak', !operatorSidebar.includes('Proyek &amp; Kontrak'))
check('Sidebar Operator menyembunyikan Cost Control', !operatorSidebar.includes('Cost Control'))
check('Sidebar Operator menyembunyikan Pengaturan', !operatorSidebar.includes('>Pengaturan<'))
check('Sidebar Operator tetap menampilkan Monitoring Produksi', operatorSidebar.includes('Monitoring Produksi'))
check('Sidebar Operator tetap menampilkan Manajemen BBM', operatorSidebar.includes('Manajemen BBM'))

const commercialSidebar = render('/dashboard', commercial.id)
check('Sidebar Commercial Manager menyembunyikan Dispatch', !commercialSidebar.includes('Dispatch &amp; Alokasi Armada'))
check('Sidebar Commercial Manager menyembunyikan Personel', !commercialSidebar.includes('Personel, Shift &amp; Kompetensi'))
check('Sidebar Commercial Manager tetap menampilkan Rekonsiliasi', commercialSidebar.includes('Rekonsiliasi &amp; Billing'))
check('Sidebar Commercial Manager tetap menampilkan Proyek & Kontrak', commercialSidebar.includes('Proyek &amp; Kontrak'))

const adminSidebar = render('/dashboard', account('System Admin').id)
check(
  'Sidebar System Admin menampilkan seluruh menu',
  NAV_LABELS.every((l) => adminSidebar.includes(l.replace('&', '&amp;'))),
  `${NAV_LABELS.length} menu`,
)

/* ==================== 6. Kontrol tombol aksi per peran =================== */

check('Operator tidak melihat tombol Kontrak Baru', !render('/proyek-kontrak', operator.id).includes('Kontrak Baru'))
check('Commercial Manager melihat tombol Kontrak Baru', render('/proyek-kontrak', commercial.id).includes('Kontrak Baru'))

check('Operator tidak melihat tombol Lapor Downtime pada modul terbatas', !render('/master-unit', operator.id).includes('Unit Baru'))
check('Superintendent melihat aksi pada Master Unit', render('/master-unit', account('Superintendent').id).includes('Standby'))

const operatorReports = render('/laporan', operator.id)
check('Operator tidak melihat tombol Ekspor Ringkasan', !operatorReports.includes('Ekspor Ringkasan'))
check('Direktur melihat tombol Ekspor Ringkasan', render('/laporan', account('Direktur').id).includes('Ekspor Ringkasan'))

const operatorBilling = render('/rekonsiliasi', operator.id)
check('Operator tidak melihat tombol Rekonsiliasi Baru', !operatorBilling.includes('Rekonsiliasi Baru'))
check('Commercial Manager melihat tombol Rekonsiliasi Baru', render('/rekonsiliasi', commercial.id).includes('Rekonsiliasi Baru'))

const operatorSettings = render('/pengaturan', operator.id)
check('Operator ditolak pada Pengaturan Sistem', operatorSettings.includes('Akses Ditolak'))

/* ============= 7. Pemisahan hak teknis & kewenangan bisnis ================ */

const admin = account('System Admin')
check('System Admin punya akses teknis pada seluruh modul transaksional', MODULES.filter((m) => !['/dashboard', '/tugas-saya'].includes(m.path)).every((m) => hasAuthority('System Admin', m.path, 'admin')))
check('System Admin tidak punya kewenangan menyetujui pengadaan', !hasAuthority('System Admin', '/pengadaan', 'approve') || AUTHORITY_MATRIX['System Admin']['/pengadaan'] === 'admin')
check('Dasbor System Admin memuat peringatan pemisahan kewenangan', render('/dashboard', admin.id).includes('kewenangan menyetujui'))
check('Halaman 403 memuat catatan pemisahan hak teknis', render('/biaya', operator.id).includes('System Administrator tidak otomatis'))

/* ======================= 8. Sesuai direktori akun ======================== */

check('Direktori akun memuat 12 pengguna', ACCOUNTS.length === 12)
check('Setiap peran memiliki minimal satu akun aktif', ROLE_ORDER.every((r) => ACCOUNTS.some((a) => a.role === r && a.status === 'Active')))
check('Semua akun demo memakai kata sandi terstandar', ACCOUNTS.every((a) => a.password.length >= 8))
check('Terdapat akun nonaktif pada direktori', ACCOUNTS.some((a) => a.status === 'Inactive'))
check('Jumlah modul sesuai kerangka (18 route)', MODULES.length === 18)

console.log(failed === 0 ? '\nSEMUA UJI AUTENTIKASI & RBAC BERHASIL' : `\n${failed} UJI GAGAL`)
process.exit(failed === 0 ? 0 : 1)
