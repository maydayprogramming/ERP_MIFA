/* Smoke test: render seluruh route aplikasi ke string untuk memastikan
   tidak ada runtime error saat halaman dimuat. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { AppProvider } from '../src/store'
import App from '../src/App'

const routes = [
  '/dashboard',
  '/production',
  '/sales',
  '/purchasing',
  '/inventory',
  '/fleet',
  '/hse',
  '/hr',
  '/finance',
  '/reports',
  '/settings',
  '/halaman-tidak-ada',
]

let failed = 0
for (const route of routes) {
  try {
    const html = renderToString(
      <StaticRouter location={route}>
        <AppProvider>
          <App />
        </AppProvider>
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
console.log(failed === 0 ? '\nSEMUA ROUTE RENDER BERHASIL' : `\n${failed} ROUTE GAGAL`)
process.exit(failed === 0 ? 0 : 1)
