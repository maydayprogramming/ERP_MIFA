import { useMemo, useState } from 'react'
import { Anchor, CalendarClock, MapPin, Plus, Truck, UserCheck, UserX } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { cx, dmy, num, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import type { UnitAssignment } from '../types'

const PATH = '/dispatch'

const STATUS_TONE: Record<UnitAssignment['status'], 'emerald' | 'sky' | 'rose'> = {
  Active: 'emerald',
  Completed: 'sky',
  Cancelled: 'rose',
}

export default function Dispatch() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const [open, setOpen] = useState(false)

  const active = state.unitAssignments.filter((u) => u.status === 'Active')
  const byShift = (['Shift 1', 'Shift 2', 'Shift 3'] as const).map((s) => ({ shift: s, count: active.filter((u) => u.shift === s).length }))
  const byPit = useMemo(() => {
    const acc = new Map<string, number>()
    for (const u of active) acc.set(u.pit, (acc.get(u.pit) ?? 0) + 1)
    return [...acc.entries()].sort((a, b) => b[1] - a[1])
  }, [active])

  const noOperator = state.equipment.filter((e) => !e.operator).length
  const cancelled = state.unitAssignments.filter((u) => u.status === 'Cancelled')

  const columns = useMemo<Column<UnitAssignment>[]>(
    () => [
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
      {
        key: 'operator',
        header: 'Operator',
        sort: (r) => r.operatorId,
        render: (r) => {
          const emp = state.employees.find((e) => e.id === r.operatorId)
          return emp ? (
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{emp.name}</p>
              <p className="truncate text-[11px] text-ink-faint">{emp.position}</p>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
              <UserX className="h-3.5 w-3.5" /> Belum ada operator
            </span>
          )
        },
      },
      { key: 'pit', header: 'Pit / Area', sort: (r) => r.pit, render: (r) => <span className="text-ink-muted">{r.pit}</span> },
      { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.shift}</span> },
      { key: 'start', header: 'Mulai', sort: (r) => r.startAt, render: (r) => <span className="text-[11px] text-ink-muted">{r.startAt}</span> },
      { key: 'end', header: 'Selesai', sort: (r) => r.endAt ?? '', render: (r) => <span className="text-[11px] text-ink-faint">{r.endAt ?? '—'}</span> },
      { key: 'reason', header: 'Alasan / Catatan', render: (r) => <span className="max-w-[240px] truncate text-[11px] text-ink-faint">{r.reason}</span> },
      { key: 'assignedBy', header: 'Ditugaskan', render: (r) => <span className="text-[11px] text-ink-faint">{r.assignedBy}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.equipment, state.employees],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch & Alokasi Armada"
        subtitle="Modul 4 — penugasan unit dan operator ke pit/area per shift. Perubahan alokasi dicatat beserta alasannya sehingga riwayat penempatan dapat dilacak."
        actions={
          <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Penugasan Baru
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Penugasan Aktif" value={num(active.length)} icon={<Anchor className="h-4 w-4" />} tone="emerald" hint={`dari ${state.equipment.length} unit terdaftar`} />
        <StatCard label="Unit Tanpa Operator" value={num(noOperator)} icon={<UserX className="h-4 w-4" />} tone={noOperator > 0 ? 'rose' : 'emerald'} hint="Perlu penugasan" />
        <StatCard label="Pit / Area Terpakai" value={num(byPit.length)} icon={<MapPin className="h-4 w-4" />} tone="sky" hint="Sebaran penugasan aktif" />
        <StatCard label="Alokasi Dibatalkan" value={num(cancelled.length)} icon={<CalendarClock className="h-4 w-4" />} tone="amber" hint="Dengan alasan tercatat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Sebaran per Shift" subtitle="Jumlah unit yang ditugaskan pada masing-masing shift" />
          <div className="space-y-2.5 p-4 pt-0">
            {byShift.map((s) => (
              <div key={s.shift} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-ink">{s.shift}</p>
                  <span className="text-sm font-bold text-ink">{s.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" style={{ width: `${(s.count / Math.max(1, active.length)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Sebaran per Pit / Area" subtitle="Konsentrasi armada pada area kerja" />
          <div className="space-y-2 p-4 pt-0">
            {byPit.map(([pit, count]) => (
              <div key={pit} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2">
                <span className="text-xs text-ink">{pit}</span>
                <span className="chip !px-2 !py-0.5 !text-[10px]">{count} unit</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Personel Berlisensi" subtitle="Kesiapan operator terhadap unit yang ditugaskan" />
          <div className="space-y-2 p-4 pt-0">
            {state.employees
              .filter((e) => e.position.toLowerCase().includes('operator'))
              .slice(0, 6)
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3.5 py-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-muted">{e.name.slice(0, 2)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{e.name}</p>
                    <p className="truncate text-[10px] text-ink-faint">{e.certifications.slice(0, 2).join(', ') || 'Belum ada sertifikasi'}</p>
                  </div>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Riwayat Penugasan Unit" subtitle="Termasuk penugasan yang dibatalkan beserta alasannya" />
        <DataTable
          data={state.unitAssignments}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari unit, operator, atau pit…"
          search={(r) => `${r.unitId} ${r.operatorId} ${r.pit} ${r.shift} ${r.reason} ${r.status}`}
          initialSort={{ key: 'start', dir: 'desc' }}
          exportName="penugasan-unit"
          pageSize={12}
          actions={(r) =>
            r.status === 'Active' ? (
              <div className="flex justify-end gap-1">
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setUnitAssignmentStatus(r.id, 'Completed')}>
                  Selesaikan
                </ActionButton>
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setUnitAssignmentStatus(r.id, 'Cancelled')}>
                  Batalkan
                </ActionButton>
              </div>
            ) : null
          }
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Penugasan Unit & Operator" subtitle="Penugasan menentukan siapa bertanggung jawab atas unit pada pit dan shift tertentu.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addUnitAssignment({
              unitId: String(fd.get('unitId') ?? state.equipment[0]?.id),
              operatorId: String(fd.get('operatorId') ?? ''),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              pit: String(fd.get('pit') ?? 'Pit Timur'),
              shift: String(fd.get('shift') ?? 'Shift 1') as UnitAssignment['shift'],
              startAt: `${String(fd.get('startDate') ?? '2026-10-15')} ${String(fd.get('startTime') ?? '07:00')}`,
              reason: String(fd.get('reason') ?? 'Penugasan rutin'),
              assignedBy: user?.name ?? 'Sesi aktif',
            })
            setOpen(false)
            toast('Penugasan unit dibuat dan berstatus aktif.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit / Alat" required>
              <Select name="unitId" options={state.equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} />
            </Field>
            <Field label="Operator" required>
              <Select
                name="operatorId"
                options={[
                  { value: '', label: '— Belum ditentukan —' },
                  ...state.employees.filter((e) => e.position.toLowerCase().includes('operator')).map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
            </Field>
            <Field label="Pit / Area" required>
              <Input name="pit" defaultValue="Pit Timur" required />
            </Field>
            <Field label="Shift" required>
              <Select name="shift" options={['Shift 1', 'Shift 2', 'Shift 3']} defaultValue="Shift 1" />
            </Field>
            <Field label="Tanggal Mulai" required>
              <Input name="startDate" type="date" defaultValue="2026-10-15" required />
            </Field>
            <Field label="Jam Mulai" required>
              <Input name="startTime" type="time" defaultValue="07:00" required />
            </Field>
            <Field label="Alasan Penugasan" className="sm:col-span-2">
              <Textarea name="reason" rows={2} placeholder="mis. Penugasan rutin OB Removal, atau penggantian akibat breakdown…" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Buat Penugasan
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
