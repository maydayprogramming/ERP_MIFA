import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Gauge, Plus, Timer } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { DowntimeEvent } from '../types'

const PATH = '/downtime'

const CATEGORIES: DowntimeEvent['category'][] = [
  'Mechanical',
  'Electrical',
  'Tyre/Undercarriage',
  'Planned Maintenance',
  'Waiting Operator',
  'Waiting Fuel',
  'Waiting Material',
  'Road/Traffic',
  'Weather',
  'No Work/Front Unavailable',
  'Operational Delay',
  'Lainnya',
]

const CATEGORY_TONE: Record<string, 'rose' | 'amber' | 'sky' | 'violet' | 'zinc'> = {
  Mechanical: 'rose',
  Electrical: 'rose',
  'Tyre/Undercarriage': 'rose',
  'Planned Maintenance': 'sky',
  'Waiting Operator': 'amber',
  'Waiting Fuel': 'amber',
  'Waiting Material': 'amber',
  'Road/Traffic': 'amber',
  Weather: 'violet',
  'No Work/Front Unavailable': 'violet',
  'Operational Delay': 'violet',
  Lainnya: 'zinc',
}

export default function Downtime() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)

  const columns = useMemo<Column<DowntimeEvent>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      {
        key: 'unit',
        header: 'Unit',
        sort: (r) => r.unitId,
        render: (r) => {
          const eq = state.equipment.find((e) => e.id === r.unitId)
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{eq?.code ?? '-'}</p>
              <p className="truncate text-[11px] text-ink-faint">{eq?.name ?? '-'}</p>
            </div>
          )
        },
      },
      { key: 'start', header: 'Mulai', sort: (r) => r.startedAt, render: (r) => <span className="text-[11px] text-ink-muted">{r.startedAt}</span> },
      { key: 'end', header: 'Selesai', sort: (r) => r.endedAt ?? '', render: (r) => <span className="text-[11px] text-ink-faint">{r.endedAt ?? '— berjalan —'}</span> },
      { key: 'duration', header: 'Durasi', align: 'right', sort: (r) => r.durationHours, render: (r) => <span className="tbl-num font-semibold text-ink">{num1(r.durationHours)} jam</span> },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <Badge tone={CATEGORY_TONE[r.category] ?? 'zinc'} dot>{r.category}</Badge> },
      { key: 'sub', header: 'Sub-kategori', sort: (r) => r.subCategory, render: (r) => <span className="text-[11px] text-ink-faint">{r.subCategory}</span> },
      { key: 'desc', header: 'Kronologi', render: (r) => <span className="max-w-[280px] truncate text-[11px] text-ink-faint">{r.description}</span> },
      {
        key: 'impact',
        header: 'Dampak',
        align: 'right',
        sort: (r) => r.impactQty ?? 0,
        render: (r) => <span className="tbl-num text-ink-muted">{r.impactQty ? `${num(r.impactQty)} ${r.impactUnit ?? ''}` : '—'}</span>,
      },
      {
        key: 'verify',
        header: 'Verifikasi',
        sort: (r) => r.verifiedBy ?? '',
        render: (r) =>
          r.verifiedBy ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {r.verifiedBy}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Belum
            </span>
          ),
      },
      {
        key: 'wo',
        header: 'WO',
        render: (r) =>
          r.workOrderId ? (
            <span className="chip !px-2 !py-0.5 !text-[10px]">Terhubung</span>
          ) : (
            <span className="text-[11px] text-ink-faintest">—</span>
          ),
      },
    ],
    [state.equipment],
  )

  const totalHours = sum(state.downtimeEvents.map((d) => d.durationHours))
  const unverified = state.downtimeEvents.filter((d) => !d.verifiedBy).length
  const mechanical = sum(state.downtimeEvents.filter((d) => ['Mechanical', 'Electrical', 'Tyre/Undercarriage'].includes(d.category)).map((d) => d.durationHours))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downtime & Performa Alat"
        subtitle="Modul 6 — pencatatan waktu tidak produktif, penyebab, durasi, status unit sebelum/sesudah, dan dampaknya terhadap produksi. Downtime yang berkaitan dengan kerusakan dikaitkan ke work order."
        actions={
          <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Lapor Downtime
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Downtime Tercatat" value={num1(totalHours)} unit="jam" icon={<Timer className="h-4 w-4" />} tone="rose" hint={`${state.downtimeEvents.length} peristiwa`} />
        <StatCard label="Downtime Bulan Ini" value={num1(m.downtimeHours)} unit="jam" icon={<Gauge className="h-4 w-4" />} tone="amber" hint={`${m.downtimeThisMonth.length} peristiwa`} />
        <StatCard label="Kerusakan Mekanik/Elektrik" value={num1(mechanical)} unit="jam" icon={<AlertTriangle className="h-4 w-4" />} tone="violet" hint={totalHours > 0 ? pct1((mechanical / totalHours) * 100) + ' dari total' : '—'} />
        <StatCard label="Belum Diverifikasi" value={num(unverified)} icon={<Clock className="h-4 w-4" />} tone={unverified > 0 ? 'rose' : 'emerald'} hint="Tanpa penyebab final" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Downtime per Kategori" subtitle="Bulan ini — jam tidak produktif menurut penyebab" />
          <div className="p-4 pt-0">
            <DonutChart data={m.downtimeByCategory} height={250} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Unit dengan Downtime Terbesar" subtitle="Fokus perbaikan pada unit yang paling sering tidak produktif" />
          <div className="divide-y divide-line">
            {m.topDowntimeUnits.map((t) => (
              <div key={t.event.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
                  <Gauge className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.unit?.code ?? '-'}</p>
                  <p className="truncate text-[11px] text-ink-faint">{t.event.category}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">{num1(t.event.durationHours)} jam</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Log Downtime" subtitle="Kewenangan sesi: lihat & verifikasi. Durasi tanpa waktu selesai dihitung dari jam berjalan." />
        <DataTable
          data={state.downtimeEvents}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari unit, kategori, atau kronologi…"
          search={(r) => `${r.code} ${r.category} ${r.subCategory} ${r.description} ${r.reportedBy}`}
          initialSort={{ key: 'start', dir: 'desc' }}
          exportName="downtime"
          pageSize={12}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {!r.verifiedBy && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setDowntimeStatus(r.id, { verifiedBy: user?.name ?? 'Sesi aktif', statusAfter: r.endedAt ? r.statusAfter : 'Running' })}>
                  Verifikasi
                </ActionButton>
              )}
              {!r.workOrderId && ['Mechanical', 'Electrical', 'Tyre/Undercarriage'].includes(r.category) && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => toast('Downtime dikaitkan ke work order baru (Modul Maintenance).', 'info')}>
                  Hubungkan WO
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Lapor Downtime Unit" subtitle="Catat segera saat kejadian. Kategori downtime menentukan apakah unit perlu work order.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addDowntimeEvent({
              unitId: String(fd.get('unitId') ?? state.equipment[0]?.id),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              startedAt: `${String(fd.get('date') ?? '2026-10-15')} ${String(fd.get('startTime') ?? '08:00')}`,
              endedAt: fd.get('endTime') ? `${String(fd.get('date') ?? '2026-10-15')} ${String(fd.get('endTime'))}` : undefined,
              durationHours: Number(fd.get('durationHours') ?? 0),
              statusBefore: String(fd.get('statusBefore') ?? 'Running'),
              statusAfter: String(fd.get('statusAfter') ?? 'Breakdown'),
              category: String(fd.get('category') ?? 'Mechanical') as DowntimeEvent['category'],
              subCategory: String(fd.get('subCategory') ?? ''),
              description: String(fd.get('description') ?? ''),
              reportedBy: user?.name ?? 'Sesi aktif',
            })
            setOpen(false)
            toast('Downtime dicatat. Menunggu verifikasi foreman.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit / Alat" required>
              <Select name="unitId" options={state.equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} />
            </Field>
            <Field label="Kategori Downtime" required>
              <Select name="category" options={CATEGORIES} defaultValue="Mechanical" />
            </Field>
            <Field label="Tanggal" required>
              <Input name="date" type="date" defaultValue="2026-10-15" required />
            </Field>
            <Field label="Durasi (jam)" required>
              <Input name="durationHours" type="number" step="0.01" min={0} defaultValue={1} required />
            </Field>
            <Field label="Jam Mulai">
              <Input name="startTime" type="time" defaultValue="08:00" />
            </Field>
            <Field label="Jam Selesai" hint="Kosongkan bila peristiwa masih berjalan.">
              <Input name="endTime" type="time" />
            </Field>
            <Field label="Status Sebelum">
              <Select name="statusBefore" options={['Running', 'Standby', 'Maintenance', 'Breakdown', 'Idle']} defaultValue="Running" />
            </Field>
            <Field label="Status Sesudah">
              <Select name="statusAfter" options={['Running', 'Standby', 'Maintenance', 'Breakdown', 'Idle']} defaultValue="Breakdown" />
            </Field>
            <Field label="Sub-kategori">
              <Input name="subCategory" placeholder="mis. Hydraulic pump, Ban bocor…" />
            </Field>
            <Field label="Dampak Volume (opsional)">
              <Input name="impactQty" type="number" min={0} step="0.01" placeholder="mis. 1850" />
            </Field>
            <Field label="Kronologi / Deskripsi" className="sm:col-span-2">
              <Textarea name="description" rows={3} placeholder="Apa yang terjadi, bagian apa yang bermasalah, tindakan awal…" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Laporan
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
