import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Hammer, PackageCheck, Plus, Wrench } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, dmy, idrFull, num, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import type { MaintenanceJob } from '../types'

const PATH = '/maintenance'

const STATUS_TONE: Record<MaintenanceJob['status'], 'sky' | 'amber' | 'emerald' | 'rose'> = {
  Scheduled: 'sky',
  'In Progress': 'amber',
  Completed: 'emerald',
  Overdue: 'rose',
}

const TYPE_TONE: Record<MaintenanceJob['type'], 'emerald' | 'amber' | 'rose' | 'sky'> = {
  Preventive: 'emerald',
  Corrective: 'amber',
  Major: 'rose',
  Inspection: 'sky',
}

export default function Maintenance() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<MaintenanceJob | null>(null)

  const columns = useMemo<Column<MaintenanceJob>[]>(
    () => [
      { key: 'woNo', header: 'No. WO', sort: (r) => r.woNo, render: (r) => <span className="font-mono text-xs font-semibold text-ink">{r.woNo}</span> },
      {
        key: 'unit',
        header: 'Unit',
        sort: (r) => r.equipmentId,
        render: (r) => {
          const eq = state.equipment.find((e) => e.id === r.equipmentId)
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{eq?.code ?? '-'}</p>
              <p className="truncate text-[11px] text-ink-faint">{eq?.name ?? '-'}</p>
            </div>
          )
        },
      },
      { key: 'type', header: 'Jenis', sort: (r) => r.type, render: (r) => <Badge tone={TYPE_TONE[r.type]} dot>{r.type}</Badge> },
      { key: 'desc', header: 'Pekerjaan', render: (r) => <span className="max-w-[260px] truncate text-[11px] text-ink-faint">{r.description}</span> },
      { key: 'sched', header: 'Jadwal', sort: (r) => r.scheduledDate, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.scheduledDate)}</span> },
      { key: 'mechanic', header: 'Mekanik', sort: (r) => r.mechanic, render: (r) => <span className="text-[11px] text-ink-faint">{r.mechanic}</span> },
      { key: 'cost', header: 'Biaya', align: 'right', sort: (r) => r.costIdr, render: (r) => <span className="tbl-num font-medium text-ink">{idrFull(r.costIdr)}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.equipment],
  )

  const byType = (['Preventive', 'Corrective', 'Major', 'Inspection'] as const).map((t) => ({
    name: t,
    jumlah: state.maintenance.filter((w) => w.type === t).length,
    biaya: sum(state.maintenance.filter((w) => w.type === t).map((w) => w.costIdr)),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance & Work Order"
        subtitle="Modul 7 — alur dari pelaporan kerusakan sampai penutupan WO: pengecekan, kebutuhan part, mekanik, biaya, pengujian, dan penutupan. WO hanya dapat ditutup setelah pengujian berhasil."
        actions={
          <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Work Order Baru
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="WO Terbuka" value={num(m.openWO)} icon={<Wrench className="h-4 w-4" />} tone="amber" hint="Belum selesai" />
        <StatCard label="WO Terlambat" value={num(m.overdueWO)} icon={<AlertTriangle className="h-4 w-4" />} tone={m.overdueWO > 0 ? 'rose' : 'emerald'} hint="Melewati jadwal" />
        <StatCard label="Biaya Maintenance Bulan Ini" value={idrFull(sum(state.maintenance.filter((w) => w.scheduledDate.slice(0, 7) === m.currentMonth).map((w) => w.costIdr)))} icon={<Hammer className="h-4 w-4" />} tone="rose" hint="Suku cadang + jasa" />
        <StatCard label="Servis ≤ 60 Jam" value={num(m.dueSoon)} icon={<ClipboardCheck className="h-4 w-4" />} tone="sky" hint="Unit mendekati jadwal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Work Order per Jenis" subtitle="Sebaran pekerjaan preventif, korektif, mayor, dan inspeksi" />
          <div className="p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Jenis</th>
                    <th className="text-right">Jumlah WO</th>
                    <th className="text-right">Total Biaya</th>
                    <th className="text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {byType.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <Badge tone={TYPE_TONE[t.name as MaintenanceJob['type']]} dot>
                          {t.name}
                        </Badge>
                      </td>
                      <td className="tbl-num">{t.jumlah}</td>
                      <td className="tbl-num">{idrFull(t.biaya)}</td>
                      <td className="tbl-num text-ink-faint">{idrFull(t.jumlah ? t.biaya / t.jumlah : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Alur Penutupan Work Order" subtitle="Setiap tahap tercatat pada audit trail" />
          <div className="space-y-2.5 p-4 pt-0">
            {[
              ['1. Laporan kerusakan', 'Operator/foreman melaporkan gejala atau downtime tercatat di modul Downtime.'],
              ['2. Pemeriksaan awal', 'Mekanik memeriksa kondisi unit dan menentukan kebutuhan part.'],
              ['3. Pengajuan part', 'Part diambil dari gudang atau diajukan melalui purchase requisition.'],
              ['4. Pelaksanaan', 'Mekanik/teknisi eksternal melakukan perbaikan, biaya dicatat.'],
              ['5. Pengujian', 'Unit diuji berjalan minimal 30 menit sebelum ditutup.'],
              ['6. Penutupan', 'WO ditutup, status unit diperbarui, biaya masuk ke Cost Control.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-ink">{t}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Daftar Work Order" subtitle={`Kewenangan sesi: ${authority(PATH)}`} />
        <DataTable
          data={state.maintenance}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari nomor WO, unit, atau deskripsi…"
          search={(r) => `${r.woNo} ${r.description} ${r.mechanic} ${r.type} ${r.status}`}
          initialSort={{ key: 'sched', dir: 'desc' }}
          exportName="work-order"
          pageSize={12}
          onRowClick={(r) => setDetail(r)}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {r.status === 'Scheduled' && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setMaintenanceStatus(r.id, 'In Progress')}>
                  Mulai
                </ActionButton>
              )}
              {r.status === 'In Progress' && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setMaintenanceStatus(r.id, 'Completed')}>
                  Uji & Tutup
                </ActionButton>
              )}
              {r.status === 'Overdue' && (
                <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setMaintenanceStatus(r.id, 'In Progress')}>
                  Tindak Lanjuti
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      {detail && (
        <Card>
          <CardHeader
            title={`${detail.woNo} — ${detail.type}`}
            subtitle={`Jadwal ${dmy(detail.scheduledDate)} · Mekanik ${detail.mechanic}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Deskripsi Pekerjaan</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{detail.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Status', detail.status],
                  ['Biaya tercatat', idrFull(detail.costIdr)],
                  ['Jadwal', dmy(detail.scheduledDate)],
                  ['Mekanik', detail.mechanic],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                    <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Checklist Penutupan</p>
                <ul className="space-y-1.5">
                  {['Pemeriksaan awal selesai', 'Part tersedia dan terpasang', 'Pengujian berjalan minimal 30 menit', 'Jam meter unit diperbarui', 'Biaya tercatat pada Cost Control'].map((c, i) => (
                    <li key={c} className={cx('flex items-center gap-2 text-xs', detail.status === 'Completed' || i < 2 ? 'text-ink' : 'text-ink-faintest')}>
                      <PackageCheck className={cx('h-3.5 w-3.5', detail.status === 'Completed' || i < 2 ? 'text-emerald-400' : 'text-ink-faintest')} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Downtime Terkait</p>
              <div className="space-y-2">
                {state.downtimeEvents
                  .filter((d) => d.unitId === detail.equipmentId)
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.id} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                      <p className="text-xs font-medium text-ink">{d.code}</p>
                      <p className="truncate text-[10px] text-ink-faint">
                        {d.category} · {num(d.durationHours)} jam
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Work Order Baru" subtitle="Buat WO untuk perbaikan korektif, preventif, mayor, atau inspeksi.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addMaintenance({
              equipmentId: String(fd.get('equipmentId') ?? state.equipment[0]?.id),
              type: String(fd.get('type') ?? 'Corrective') as MaintenanceJob['type'],
              description: String(fd.get('description') ?? ''),
              scheduledDate: String(fd.get('scheduledDate') ?? '2026-10-15'),
              costIdr: Number(fd.get('costIdr') ?? 0),
              mechanic: String(fd.get('mechanic') ?? ''),
            })
            setOpen(false)
            toast('Work order dibuat. Unit diperbarui ke status Maintenance.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit / Alat" required>
              <Select name="equipmentId" options={state.equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} />
            </Field>
            <Field label="Jenis Pekerjaan" required>
              <Select name="type" options={['Preventive', 'Corrective', 'Major', 'Inspection']} defaultValue="Corrective" />
            </Field>
            <Field label="Jadwal" required>
              <Input name="scheduledDate" type="date" defaultValue="2026-10-15" required />
            </Field>
            <Field label="Mekanik / Teknisi">
              <Input name="mechanic" placeholder="mis. Mekanik Senior — Andi" />
            </Field>
            <Field label="Perkiraan Biaya (IDR)">
              <Input name="costIdr" type="number" min={0} placeholder="187300000" />
            </Field>
            <Field label="Deskripsi Pekerjaan" className="sm:col-span-2" required>
              <Textarea name="description" rows={3} placeholder="mis. Ganti selang hidrolik lengan excavator dan uji beban…" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Buat Work Order
            </ActionButton>
          </div>
          {user?.role === 'Operator' && (
            <p className="text-[11px] text-ink-faint">Operator hanya dapat melaporkan gejala kerusakan; pembuatan WO dilakukan foreman/atasan.</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
