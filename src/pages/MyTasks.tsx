import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, CheckCircle2, Filter, Inbox, ListChecks, TrendingUp } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { TODAY } from '../lib/metrics'
import { cx, daysBetween, dmy, num } from '../lib/format'
import { Badge, Card, CardHeader, EmptyState, StatCard } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { MODULES } from '../data/accounts'
import type { TaskItem } from '../types'

type FilterKey = 'semua' | 'hari-ini' | 'terlambat' | 'kritis'

const PRIORITY_TONE: Record<TaskItem['priority'], 'rose' | 'amber' | 'sky' | 'zinc'> = {
  Kritis: 'rose',
  Tinggi: 'amber',
  Sedang: 'sky',
  Rendah: 'zinc',
}

/**
 * Modul 10 (kerangka) — Halaman Tugas Saya.
 * Menampilkan item yang membutuhkan tindakan pengguna, bukan sekadar angka.
 */
export default function MyTasks() {
  const { state, actions, toast } = useERP()
  const { role, user } = useAuth()
  const [filter, setFilter] = useState<FilterKey>('semua')
  const [done, setDone] = useState<Set<string>>(new Set())

  const mine = useMemo(
    () => state.tasks.filter((t) => t.ownerRole === role && !done.has(t.id)),
    [state.tasks, role, done],
  )

  const filtered = useMemo(() => {
    if (filter === 'hari-ini') return mine.filter((t) => t.dueDate === TODAY)
    if (filter === 'terlambat') return mine.filter((t) => t.dueDate && daysBetween(t.dueDate, TODAY) > 0 && t.status !== 'Done')
    if (filter === 'kritis') return mine.filter((t) => t.priority === 'Kritis' || t.priority === 'Tinggi')
    return mine
  }, [mine, filter])

  const overdue = mine.filter((t) => t.dueDate && daysBetween(t.dueDate, TODAY) > 0).length
  const todayCount = mine.filter((t) => t.dueDate === TODAY).length
  const critical = mine.filter((t) => t.priority === 'Kritis').length

  const byModule = useMemo(() => {
    const acc = new Map<string, TaskItem[]>()
    for (const t of filtered) {
      const list = acc.get(t.module) ?? []
      list.push(t)
      acc.set(t.module, list)
    }
    return [...acc.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Saya"
        subtitle={`Daftar pekerjaan yang membutuhkan tindakan Anda sebagai ${role}. Diurutkan berdasarkan prioritas, bukan modul — agar tidak terlewat.`}
        actions={
          <Badge tone="amber" dot>
            {mine.length} item aktif
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tugas Aktif" value={num(mine.length)} icon={<ListChecks className="h-4 w-4" />} tone="amber" hint={`Peran ${role}`} />
        <StatCard label="Tenggat Hari Ini" value={num(todayCount)} icon={<CalendarClock className="h-4 w-4" />} tone="sky" hint="Perlu dituntaskan" />
        <StatCard label="Terlambat" value={num(overdue)} icon={<AlertTriangle className="h-4 w-4" />} tone="rose" hint="Melewati tenggat" />
        <StatCard label="Prioritas Kritis" value={num(critical)} icon={<TrendingUp className="h-4 w-4" />} tone="violet" hint="Eskalasi otomatis" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faintest">
          <Filter className="h-3.5 w-3.5" /> Filter
        </span>
        {(
          [
            ['semua', 'Semua'],
            ['hari-ini', 'Tenggat hari ini'],
            ['terlambat', 'Terlambat'],
            ['kritis', 'Kritis & tinggi'],
          ] as Array<[FilterKey, string]>
        ).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={cx('chip', filter === key && 'border-amber-500/40 text-amber-400')}>
            {label}
          </button>
        ))}
      </div>

      {/* Grup per modul */}
      {byModule.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="h-6 w-6 text-emerald-400" />}
            title="Tidak ada tugas tertunda"
            hint="Semua item yang menjadi tanggung jawab peran Anda sudah ditangani. Periksa kembali nanti."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {byModule.map(([module, items]) => {
            const mod = MODULES.find((m) => m.path === module)
            return (
              <Card key={module}>
                <CardHeader
                  title={mod?.label ?? module}
                  subtitle={mod?.desc}
                  actions={
                    <Link to={module} className="btn btn-ghost btn-sm">
                      Buka modul
                    </Link>
                  }
                />
                <div className="divide-y divide-line">
                  {items
                    .sort((a, b) => a.priority.localeCompare(b.priority) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
                    .map((t) => {
                      const isOverdue = !!t.dueDate && daysBetween(t.dueDate, TODAY) > 0
                      return (
                        <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <Badge tone={PRIORITY_TONE[t.priority]} dot>
                            {t.priority}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                            <p className="truncate text-[11px] text-ink-faint">{t.detail}</p>
                          </div>
                          {t.dueDate && (
                            <span className={cx('shrink-0 text-[11px] font-medium', isOverdue ? 'text-rose-400' : t.dueDate === TODAY ? 'text-amber-400' : 'text-ink-faint')}>
                              {isOverdue ? `Terlambat ${daysBetween(t.dueDate, TODAY)} hari` : t.dueDate === TODAY ? 'Hari ini' : `Tenggat ${dmy(t.dueDate)}`}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              actions.setTaskStatus(t.id, 'In Progress')
                              setDone((d) => new Set(d).add(t.id))
                              toast(`Tugas "${t.title}" ditandai selesai.`, 'success')
                            }}
                            className="btn btn-ghost btn-sm !px-2"
                            title="Tandai selesai"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Aturan Eskalasi" subtitle="Bagaimana sistem menentukan prioritas dan penerima eskalasi" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Tenggat 1 hari', d: 'Notifikasi ke pemilik tugas dan atasan langsung pada pagi hari.', tone: 'sky' as const },
            { t: 'Tenggat terlampaui', d: 'Eskalasi ke Supervisor/Superintendent ditandai sebagai prioritas tinggi.', tone: 'amber' as const },
            { t: '3 hari terlambat', d: 'Eskalasi ke Operation Manager dan tercatat pada audit trail.', tone: 'rose' as const },
            { t: 'Terkait K3', d: 'Selalu dianggap kritis — tidak pernah diturunkan otomatis.', tone: 'violet' as const },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
              <Badge tone={r.tone}>{r.t}</Badge>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{r.d}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-4">
          <p className="text-[11px] text-ink-faint">
            Pengguna saat ini: <span className="font-semibold text-ink">{user?.name}</span> · {user?.email} · penempatan {user?.site}
          </p>
        </div>
      </Card>
    </div>
  )
}
