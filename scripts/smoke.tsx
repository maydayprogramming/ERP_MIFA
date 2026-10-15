/* Smoke test: render seluruh route aplikasi ke string untuk memastikan
   tidak ada runtime error saat halaman dimuat. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { AppProvider } from '../src/store'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import { AuthProvider } from '../src/auth/AuthProvider'
import { ACCOUNTS, MODULES, canAccess } from '../src/data/accounts'
import App, { APP_ROUTES } from '../src/App'

/* Smoke test menguji seluruh route dengan peran System Admin (akses teknis penuh).
   Pengujian RBAC per-peran dilakukan terpisah melalui render route 403. */
const SESSION_USER = ACCOUNTS.find((a) => a.role === 'System Admin') ?? ACCOUNTS[0]

const routes = [...MODULES.map((m) => m.path), '/halaman-tidak-ada']

let failed = 0
for (const route of routes) {
  try {
    const html = renderToString(
      <StaticRouter location={route}>
        <ThemeProvider>
          <AuthProvider initialUser={SESSION_USER}>
            <AppProvider>
              <App />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </StaticRouter>,
    )
    const text = html.replace(/<[^>]*>/g, '')
    console.log(`OK   ${route.padEnd(22)} ${String(html.length).padStart(7)} bytes  ·  ${text.slice(0, 60).replace(/\s+/g, ' ')}`)
  } catch (err) {
    failed += 1
    console.log(`FAIL ${route}`)
    console.log(String(err).split('\n').slice(0, 8).join('\n'))
  }
}

/* Setiap route wajib memiliki entri pada APP_ROUTES agar kewenangan diperiksa. */
const routedPaths = new Set(APP_ROUTES.map((r) => r.path))
for (const m of MODULES) {
  if (!routedPaths.has(m.path) && m.path !== '/pengaturan') {
    failed += 1
    console.log(`FAIL ${m.path} tidak terdaftar pada APP_ROUTES`)
  }
}
if (!routedPaths.has('/pengaturan')) {
  failed += 1
  console.log('FAIL /pengaturan tidak terdaftar pada APP_ROUTES')
}

/* System Admin harus dapat mengakses seluruh modul. */
for (const m of MODULES) {
  if (!canAccess(SESSION_USER.role, m.path)) {
    failed += 1
    console.log(`FAIL System Admin tidak memiliki akses pada ${m.path}`)
  }
}

console.log(failed === 0 ? `\nSEMUA ROUTE RENDER BERHASIL (${routes.length} route)` : `\n${failed} ROUTE GAGAL`)
process.exit(failed === 0 ? 0 : 1)
