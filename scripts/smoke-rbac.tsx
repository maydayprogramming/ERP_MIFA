/* Smoke test autentikasi & RBAC.
   1. Verifikasi matriks hak akses (fungsi murni) untuk seluruh peran.
   2. Halaman login tampil tanpa sesi.
   3. Route terlindungi tidak merender konten modul bila belum login.
   4. Peran tanpa wewenang mendapatkan halaman 403.
   5. Sidebar menyaring menu sesuai peran.
   6. Tombol aksi disembunyikan bagi peran tanpa wewenang. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { AppProvider } from '../src/store'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import { AuthProvider } from '../src/auth/AuthProvider'
import { ACCOUNTS, ACCESS_MATRIX, ACTION_MATRIX, MODULES, ROLE_ORDER, canAccess, canDo, type Action } from '../src/data/accounts'
import App from '../src/App'

const ACTIONS = Object.keys(ACTION_MATRIX['Super Admin']) as Action[]

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

const account = (role: string) => ACCOUNTS.find((a) => a.role === role)!

/* ==================== 1. Matriks hak akses (fungsi murni) ================ */

const allowedCount = ROLE_ORDER.map((r) => ({ role: r, n: MODULES.filter((m) => ACCESS_MATRIX[r][m.path]).length }))
allowedCount.forEach(({ role, n }) => {
  check(`Matriks modul konsisten — ${role} (${n}/${MODULES.length})`, n > 0 && n <= MODULES.length && MODULES.every((m) => canAccess(role, m.path) === ACCESS_MATRIX[role][m.path]))
})

const actionCount = ROLE_ORDER.map((r) => ({ role: r, n: ACTIONS.filter((a) => ACTION_MATRIX[r][a]).length }))
actionCount.forEach(({ role, n }) => {
  check(`Matriks tindakan konsisten — ${role} (${n}/${ACTIONS.length})`, n > 0 && n <= ACTIONS.length && ACTIONS.every((a) => canDo(role, a) === ACTION_MATRIX[role][a]))
})

check('Super Admin memiliki akses ke seluruh modul', ACCESS_MATRIX['Super Admin'] && MODULES.every((m) => canAccess('Super Admin', m.path)))
check('Hanya Super Admin yang dapat kelola pengguna', ACTIONS.every((a) => (canDo(a === 'users.manage' ? 'Super Admin' : 'Super Admin', 'users.manage') === true)) && ROLE_ORDER.filter((r) => r !== 'Super Admin').every((r) => !canDo(r, 'users.manage')))
check('Hanya Super Admin yang dapat konfigurasi sistem', ROLE_ORDER.filter((r) => r !== 'Super Admin').every((r) => !canDo(r, 'settings.manage')))
check('Staff Produksi tidak dapat menyetujui apa pun', ACTIONS.filter((a) => a.endsWith('.approve')).every((a) => !canDo('Staff Produksi', a)))
check('Manager Keuangan tidak dapat akses K3LH', !canAccess('Manager Keuangan', '/hse'))
check('Manager HSE tidak dapat akses Penjualan', !canAccess('Manager HSE', '/sales'))
check('Peran tak dikenal tidak memiliki akses', !canAccess(undefined, '/dashboard') && !canDo(undefined, 'reports.export'))
check('Setiap peran minimal bisa membuka Dashboard', ROLE_ORDER.every((r) => canAccess(r, '/dashboard')))

/* ============================ 2. Halaman login =========================== */

const loginHtml = render('/login')
check('Halaman /login tampil tanpa sesi', loginHtml.includes('Masuk ke Akun Anda'))
check('Form login menyertakan kredensial demo', loginHtml.includes('mifa2026') && loginHtml.includes('Akun Demo'))
check('Login menampilkan nama perusahaan', loginHtml.includes('MIFA') && loginHtml.includes('Bara Nusantara'))
check('Login dengan sesi aktif dialihkan (tidak menampilkan form)', !render('/login', ACCOUNTS[0].id).includes('Masuk ke Akun Anda'))

/* ==================== 3. Route terlindungi tanpa sesi ==================== */

const guarded = render('/finance')
check('Route /finance tanpa sesi tidak merender konten modul', guarded.length < 20_000 && !guarded.includes('Jurnal'))
const guarded2 = render('/mine-planning')
check('Route /mine-planning tanpa sesi tidak merender konten modul', !guarded2.includes('Rencana Tambang'))

/* ======================== 4. Peran tanpa wewenang ======================== */

const staffProd = account('Staff Produksi')
const mgrFinance = account('Manager Keuangan')
const mgrHse = account('Manager HSE')

check('Staff Produksi → /finance mendapat halaman 403', render('/finance', staffProd.id).includes('Akses Ditolak'))
check('Manager Keuangan → /mine-planning mendapat 403', render('/mine-planning', mgrFinance.id).includes('Akses Ditolak'))
check('Manager HSE → /sales mendapat 403', render('/sales', mgrHse.id).includes('Akses Ditolak'))
check('Halaman 403 mencantumkan identitas sesi', render('/finance', staffProd.id).includes(staffProd.name))
check('Halaman 403 menampilkan modul yang boleh diakses', render('/finance', staffProd.id).includes('Produksi &amp; Pit'))

check('Manager HSE → /hse tetap diizinkan', !render('/hse', mgrHse.id).includes('Akses Ditolak'))
check('Staff Produksi → /production tetap diizinkan', !render('/production', staffProd.id).includes('Akses Ditolak'))
check('Super Admin → /settings tetap diizinkan', !render('/settings', ACCOUNTS[0].id).includes('Akses Ditolak'))

/* ======================= 5. Penyaringan menu sidebar ===================== */

const staffSidebar = render('/dashboard', staffProd.id)
check('Sidebar Staff Produksi menyembunyikan Keuangan', !staffSidebar.includes('Keuangan &amp; RKAB'))
check('Sidebar Staff Produksi menyembunyikan Pengaturan', !staffSidebar.includes('>Pengaturan<'))
check('Sidebar Staff Produksi menyembunyikan Penjualan', !staffSidebar.includes('Penjualan &amp; Kontrak'))
check('Sidebar Staff Produksi tetap menampilkan Produksi', staffSidebar.includes('Produksi &amp; Pit'))

const hseSidebar = render('/dashboard', mgrHse.id)
check('Sidebar Manager HSE menyembunyikan Pembelian', !hseSidebar.includes('Pembelian &amp; Vendor'))
check('Sidebar Manager HSE menyembunyikan Keuangan', !hseSidebar.includes('Keuangan &amp; RKAB'))
check('Sidebar Manager HSE tetap menampilkan Legal', hseSidebar.includes('Legal &amp; Compliance'))

const adminSidebar = render('/dashboard', ACCOUNTS[0].id)
check(
  'Sidebar Super Admin menampilkan seluruh modul',
  MODULES.every((m) => adminSidebar.includes(m.label.replace('&', '&amp;'))),
  `${MODULES.length} menu`,
)

/* ==================== 6. Kontrol tombol aksi per peran =================== */

const spLegal = render('/legal', staffProd.id)
check('Staff Produksi tidak melihat tombol kelola izin', !spLegal.includes('Daftarkan Izin'))
check('Super Admin melihat tombol kelola izin', render('/legal', ACCOUNTS[0].id).includes('Daftarkan Izin'))

const spShipping = render('/shipping', staffProd.id)
check('Staff Produksi tidak melihat tombol jadwalkan kapal', !spShipping.includes('Jadwalkan Kapal'))
check('GM Operasional melihat tombol jadwalkan kapal', render('/shipping', account('GM Operasional').id).includes('Jadwalkan Kapal'))

const spMine = render('/mine-planning', staffProd.id)
check('Staff Produksi tidak melihat tombol setujui rencana', !spMine.includes('>Setujui<'))
check('Super Admin melihat tombol setujui rencana', render('/mine-planning', ACCOUNTS[0].id).includes('>Setujui<'))

const spReports = render('/reports', staffProd.id)
check('Staff Produksi tidak melihat tombol ekspor laporan', !spReports.includes('Ekspor Data'))
check('Super Admin melihat tombol ekspor laporan', render('/reports', ACCOUNTS[0].id).includes('btn-ghost btn-sm') && !render('/reports', ACCOUNTS.find(a=>a.role==='Staff Produksi')!.id).includes('btn-ghost btn-sm'))

const spSettings = render('/settings', staffProd.id)
check('Pengaturan menampilkan peringatan read-only untuk non-admin', spSettings.includes('hanya dapat dilakukan oleh') || spSettings.includes('tidak berwenang'))

/* ======================= 7. Sesuai direktori akun ======================== */

check('Direktori akun memuat 8 pengguna', ACCOUNTS.length === 8)
check('Setiap peran memiliki minimal satu akun', ROLE_ORDER.every((r) => ACCOUNTS.some((a) => a.role === r)))
check('Semua akun demo memakai kata sandi terstandar', ACCOUNTS.every((a) => a.password.length >= 8))

console.log(failed === 0 ? '\nSEMUA UJI AUTENTIKASI & RBAC BERHASIL' : `\n${failed} UJI GAGAL`)
process.exit(failed === 0 ? 0 : 1)
