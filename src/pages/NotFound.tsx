import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-2/60 text-amber-400">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-ink-strong">404</h1>
        <p className="mt-2 text-sm text-ink-faint">
          Halaman yang Anda cari tidak ditemukan atau Anda tidak memiliki hak akses untuk modul tersebut.
        </p>
        <Link to="/dashboard" className="btn btn-primary mt-6">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
