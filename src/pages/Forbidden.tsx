import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Lock, ShieldAlert, UserCog } from 'lucide-react'
import { Button, Card, CardHeader } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import { MODULES } from '../data/accounts'

export default function Forbidden() {
  const { user, can } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const target = MODULES.find((m) => m.path === location.pathname)
  const allowed = MODULES.filter((m) => can(m.path))

  return (
    <div className="mx-auto max-w-3xl py-6">
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-rose-500/5 px-6 py-10 text-center sm:px-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10">
            <ShieldAlert className="h-8 w-8 text-rose-400" />
          </div>
          <p className="mt-5 font-mono text-5xl font-bold tracking-tight text-rose-400">403</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-strong">Akses Ditolak</h1>
          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-ink-muted">
            {target
              ? `Peran ${user?.role ?? 'Anda'} tidak memiliki hak akses ke modul "${target.label}".`
              : 'Anda tidak memiliki hak akses ke halaman ini.'}{' '}
            Hak akses ditetapkan oleh administrator melalui matriks RBAC pada menu Pengaturan.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <UserCog className="h-4 w-4 text-amber-400" /> Identitas Sesi
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint">Nama</dt>
                  <dd className="text-right font-medium text-ink">{user?.name ?? '-'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint">Peran</dt>
                  <dd className="text-right font-medium text-ink">{user?.role ?? '-'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint">Cakupan Site</dt>
                  <dd className="text-right font-medium text-ink">{user?.site ?? '-'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-faint">Alamat diminta</dt>
                  <dd className="truncate font-mono text-[11px] text-ink-muted">{location.pathname}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Lock className="h-4 w-4 text-emerald-400" /> Modul yang Bisa Diakses
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {allowed.map((m) => (
                  <Link
                    key={m.path}
                    to={m.path}
                    className="chip hover:border-amber-500/40 hover:text-amber-400"
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button variant="outline" icon={<Home className="h-4 w-4" />} onClick={() => navigate('/dashboard')}>
              Ke Dashboard
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Tentang Kontrol Akses Berbasis Peran" subtitle="MIFA ERP menerapkan RBAC (Role-Based Access Control) pada tiga lapisan" />
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { t: 'Lapisan Modul', d: 'Menu pada sidebar dan seluruh route hanya tampil/aktif sesuai matriks hak akses peran.' },
            { t: 'Lapisan Tindakan', d: 'Tombol aksi (buat, setujui, tutup, ekspor) dinonaktifkan bila peran tidak berwenang.' },
            { t: 'Lapisan Data', d: 'Cakupan site menentukan record yang terlihat; administrator mengelolanya pada Pengaturan.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
              <p className="text-sm font-semibold text-ink">{x.t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
