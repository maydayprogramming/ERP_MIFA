import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Anchor,
  Blend,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Lock,
  LogIn,
  Mail,
  Mountain,
  Scale,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Button, Field, Input } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import { ACCOUNTS, ROLE_DESC, ROLE_ORDER, type Role } from '../data/accounts'
import { cx } from '../lib/format'
import { useTheme } from '../theme/ThemeProvider'

const DEMO_PASSWORD = 'mifa2026'

const HIGHLIGHTS = [
  { icon: Mountain, title: 'Produksi & RKAB Terpadu', desc: 'Monitoring produksi batubara, pengupasan, dan stripping ratio real-time per pit.' },
  { icon: Blend, title: 'Perencanaan & Blending', desc: 'Formulasi blending multi-stockpile untuk memenuhi spesifikasi kontrak pembeli.' },
  { icon: Anchor, title: 'Pelabuhan & Bongkar Muat', desc: 'Penjadwalan kapal/barge, draft survey, dan penerbitan Bill of Lading.' },
  { icon: Scale, title: 'Legal & Compliance IUP', desc: 'Pengelolaan IUP OP/OPK, PKP2B, AMDAL, dan kewajiban kepatuhan ESDM.' },
]

const STATS = [
  { l: 'Site Tambang', v: '5' },
  { l: 'Kapasitas Produksi', v: '1,25 jt MT/th' },
  { l: 'Modul Terintegrasi', v: '15' },
  { l: 'Kepatuhan Regulasi', v: 'ESDM · DJP · BPJS' },
]

const ROLE_TONE: Record<Role, string> = {
  'Super Admin': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'GM Operasional': 'text-sky-400 border-sky-500/30 bg-sky-500/5',
  'Manager Keuangan': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'Manager HSE': 'text-violet-400 border-violet-500/30 bg-violet-500/5',
  'Staff Produksi': 'text-rose-400 border-rose-500/30 bg-rose-500/5',
}

export default function Login() {
  const { login, loginAs, pending, error, clearError } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    document.title = 'Masuk · MIFA ERP'
  }, [])

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 4, [email, password])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || pending) return
    const ok = await login(email, password, remember)
    if (ok) navigate('/dashboard', { replace: true })
  }

  const quickLogin = (id: string) => {
    if (loginAs(id)) navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-surface-0 text-ink">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-[0.35]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-sky-500/[0.05] blur-[120px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_minmax(400px,460px)] lg:gap-14 lg:px-8">
        {/* ---------------------------- Branding ---------------------------- */}
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
              <Mountain className="h-6 w-6 text-zinc-950" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-ink-strong">
                MIFA <span className="text-amber-400">ERP</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faintest">Enterprise Coal Mining Suite</p>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight text-ink-strong xl:text-[44px]">
            Sistem terpadu pengelolaan
            <span className="text-gradient"> tambang batu bara </span>
            dari pit sampai pelabuhan.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-faint">
            PT MIFA Bara Nusantara mengelola lima site tambang di Sumatera & Kalimantan. Platform ini menghubungkan perencanaan
            tambang, produksi, armada, K3LH, komersial, pelabuhan, hingga kepatuhan legal dalam satu sumber data.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="panel group flex gap-3 p-4 transition-colors hover:border-line-strong">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <h.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{h.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l}>
                <p className="text-lg font-bold text-ink-strong">{s.v}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-faintest">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------- Form ----------------------------- */}
        <section className="w-full">
          <div className="panel p-6 shadow-panel sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 lg:hidden">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
                    <Mountain className="h-5 w-5 text-zinc-950" />
                  </div>
                  <p className="text-sm font-bold text-ink-strong">
                    MIFA <span className="text-amber-400">ERP</span>
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-strong lg:mt-0">Masuk ke Akun Anda</h2>
                <p className="mt-1.5 text-sm text-ink-faint">Gunakan kredensial perusahaan yang terdaftar pada direktori SSO.</p>
              </div>
              <button
                onClick={toggle}
                className="btn btn-ghost !px-2"
                aria-label="Ganti tema"
                title={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
              >
                {theme === 'dark' ? 'Terang' : 'Gelap'}
              </button>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <Field label="Email Perusahaan" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faintest" />
                  <Input
                    type="email"
                    autoComplete="username"
                    className="pl-9"
                    placeholder="nama@mifacoal.co.id"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearError()
                    }}
                  />
                </div>
              </Field>

              <Field label="Kata Sandi" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faintest" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="px-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearError()
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faintest hover:text-ink"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
                  <input type="checkbox" className="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Ingat sesi saya
                </label>
                <span className="text-xs text-ink-faint">Hubungi administrator untuk reset sandi</span>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs leading-relaxed text-rose-400 animate-fade-in">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full justify-center" disabled={!canSubmit || pending} loading={pending} icon={<LogIn className="h-4 w-4" />}>
                {pending ? 'Memverifikasi...' : 'Masuk'}
              </Button>
            </form>

            {/* -------------------------- Akun demo -------------------------- */}
            <div className="mt-6 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <Landmark className="h-3.5 w-3.5" /> Akun Demo (kata sandi: {DEMO_PASSWORD})
                </span>
                <ChevronRight className={cx('h-4 w-4 text-ink-faintest transition-transform', showDemo && 'rotate-90')} />
              </button>

              {showDemo && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {ROLE_ORDER.map((role) => {
                    const acc = ACCOUNTS.filter((a) => a.role === role)[0]
                    if (!acc) return null
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => quickLogin(acc.id)}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-line-strong',
                          ROLE_TONE[role],
                        )}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-ink">
                          {acc.avatar}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-ink">{role}</span>
                          <span className="block truncate text-[11px] text-ink-muted">{ROLE_DESC[role]}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-faint">{acc.site}</span>
                      </button>
                    )
                  })}
                  <p className="pt-1 text-[11px] leading-relaxed text-ink-faintest">
                    Klik salah satu peran untuk masuk langsung dan melihat perbedaan hak akses (menu & tombol aksi) ant peran.
                    Terdapat {ACCOUNTS.length} akun demo pada direktori.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-ink-faintest">
            <p className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Koneksi terenkripsi · Sesi tersimpan pada perangkat ini
            </p>
            <p className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" /> Armada
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> K3LH
              </span>
              <span className="flex items-center gap-1">
                <Anchor className="h-3 w-3" /> Pelabuhan
              </span>
            </p>
          </div>

          <p className="mt-4 text-center text-[11px] text-ink-faintest">
            &copy; 2026 PT MIFA Bara Nusantara · MIFA ERP v1.0.0 ·{' '}
            <Link to="/dashboard" className="link">
              Lanjutkan ke aplikasi
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
