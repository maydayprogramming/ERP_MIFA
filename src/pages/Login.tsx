import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2, Lock, Mail, Pickaxe, ShieldCheck, UserCog } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { RedirectIfAuthed } from '../auth/RequireAuth'
import { Badge, Button, Card, Field, Input } from '../components/ui'
import { cx } from '../lib/format'
import { ACCOUNTS, ROLE_ORDER, type AuthUser } from '../data/accounts'

/** Peran yang ditonjolkan pada panel demo halaman masuk. */
const FEATURED: AuthUser['role'][] = ['Operator', 'Foreman', 'Supervisor', 'Superintendent', 'Project Manager', 'Commercial Manager', 'Finance Manager', 'Direktur']

const ROLE_BLURB: Record<AuthUser['role'], string> = {
  Operator: 'Input hasil produksi, BBM, dan laporan downtime dari lapangan.',
  Foreman: 'Verifikasi data tim, susun penugasan unit, dan ajukan kebutuhan.',
  Supervisor: 'Setujui data operasional departemen sesuai batas kewenangan.',
  Planner: 'Susun rencana produksi, target per shift, dan analisis produktivitas.',
  Superintendent: 'Kendalikan prioritas sumber daya dan tinjau rencana lintas area.',
  'Project Manager': 'Pantau proyek lintas departemen: volume, biaya, dan penagihan.',
  'Operation Manager': 'Bandingkan performa beberapa proyek dan site.',
  'Commercial Manager': 'Kelola master kontrak, tarif, rekonsiliasi, dan paket penagihan.',
  'Finance Manager': 'Awasi budget vs actual, komitmen PO, dan margin proyek.',
  Direktur: 'Indikator strategis dan keputusan yang menunggu persetujuan.',
  'System Admin': 'Kelola akun, konfigurasi, integrasi, dan log audit.',
}

export default function Login() {
  const { login, loginAs, pending, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    document.title = 'Masuk · MIFA Kontraktor ERP'
  }, [])

  const demoAccounts = useMemo(() => {
    const picked = FEATURED.map((r) => ACCOUNTS.find((a) => a.role === r && a.status === 'Active')).filter(Boolean) as AuthUser[]
    const admin = ACCOUNTS.find((a) => a.role === 'System Admin')
    return [...picked, ...(admin ? [admin] : [])]
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) {
      navigate('/dashboard', { replace: true })
    }
  }

  function quickLogin(account: AuthUser) {
    if (loginAs(account.id)) navigate('/dashboard', { replace: true })
  }

  return (
    <RedirectIfAuthed>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ------------------------------ Kiri ------------------------------ */}
        <div className="relative hidden overflow-hidden border-r border-line bg-surface-0 lg:block">
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-amber-500/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
                <Pickaxe className="h-6 w-6 text-zinc-950" />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-ink-strong">
                  MIFA <span className="text-amber-400">Kontraktor</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faintest">Mining Contractor ERP</p>
              </div>
            </div>

            <div className="max-w-lg">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink-strong xl:text-4xl">
                Satu sistem untuk seluruh pekerjaan kontraktor tambang.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-faint">
                Dari rencana produksi, dispatch unit, downtime, BBM, maintenance, gudang, pengadaan, biaya, sampai rekonsiliasi dan
                penagihan — dengan kontrol akses tiga dimensi yang membatasi setiap peran.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['15', 'Modul terintegrasi'],
                  ['11', 'Peran pengguna'],
                  ['3', 'Dimensi hak akses'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl border border-line bg-surface-1/60 p-4">
                    <p className="text-2xl font-bold text-amber-400">{v}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{l}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-8 space-y-2.5">
                {[
                  'Target produksi per shift, pit, dan aktivitas dengan versi revisi.',
                  'Data lapangan terverifikasi berjenjang sebelum menjadi dasar tagihan.',
                  'Actual, committed, accrual, dan forecast dipisahkan pada Cost Control.',
                  'Rekonsiliasi volume dengan selisih dan alasannya sebelum penagihan.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-muted">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-ink-faintest">© 2026 PT MIFA Kontraktor Tambang · Versi demonstrasi 1.0</p>
          </div>
        </div>

        {/* ------------------------------ Kanan ------------------------------ */}
        <div className="flex items-center justify-center bg-surface-1/40 p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
                <Pickaxe className="h-5 w-5 text-zinc-950" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-strong">
                  MIFA <span className="text-amber-400">Kontraktor</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faintest">Mining Contractor ERP</p>
              </div>
            </div>

            <Card className="p-6 sm:p-7">
              <h1 className="text-xl font-bold tracking-tight text-ink-strong">Masuk ke Akun Anda</h1>
              <p className="mt-1.5 text-sm text-ink-faint">Gunakan email perusahaan dan kata sandi yang terdaftar pada direktori akun.</p>

              {error && (
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3.5 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p className="text-xs leading-relaxed text-rose-600 dark:text-rose-300">{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <Field label="Email Perusahaan" required>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faintest" />
                    <Input
                      type="email"
                      className="!pl-9"
                      placeholder="nama@kontraktor.co.id"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearError()
                      }}
                      autoComplete="username"
                      required
                    />
                  </div>
                </Field>

                <Field label="Kata Sandi" required>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faintest" />
                    <Input
                      type={showPw ? 'text' : 'password'}
                      className="!pl-9 !pr-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        clearError()
                      }}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faintest hover:text-ink"
                      aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-ink-muted">
                    <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-line-strong bg-surface-2 accent-amber-500" />
                    Ingat saya
                  </label>
                  <button type="button" className="text-xs font-medium text-amber-400 hover:text-amber-300">
                    Lupa kata sandi?
                  </button>
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi…
                    </>
                  ) : (
                    <>
                      Masuk <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5">
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
                  Kata sandi demo untuk seluruh akun: <span className="font-mono font-semibold">mifa2026</span>
                </p>
              </div>
            </Card>

            {/* Panel akun demo */}
            <div className="mt-4">
              <button onClick={() => setShowDemo((v) => !v)} className="btn btn-ghost btn-sm w-full justify-between">
                <span className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" /> Akun Demo — {ROLE_ORDER.length} peran
                </span>
                <ChevronRight className={cx('h-4 w-4 transition-transform', showDemo && 'rotate-90')} />
              </button>

              {showDemo && (
                <div className="mt-2.5 max-h-[420px] space-y-1.5 overflow-y-auto rounded-lg border border-line bg-surface-1/60 p-2.5 scrollbar-thin animate-fade-in">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => quickLogin(a)}
                      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left hover:border-amber-500/30 hover:bg-amber-500/5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[10px] font-bold text-white">{a.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{a.role}</p>
                        <p className="truncate text-[10px] text-ink-faint">{ROLE_BLURB[a.role]}</p>
                      </div>
                      <Badge tone="zinc">Lv {a.level || '-'}</Badge>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faintest group-hover:text-amber-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faintest">
              Sistem ini menerapkan kontrol akses tiga dimensi: peran/tindakan, lingkup data, dan kewenangan persetujuan.
              <br />
              Autentikasi penuh akan diterapkan pada lapisan backend.
            </p>
          </div>
        </div>
      </div>
    </RedirectIfAuthed>
  )
}
