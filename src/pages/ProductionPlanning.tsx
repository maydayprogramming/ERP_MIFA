import { useMemo, useState } from 'react'
import { ClipboardList, GitBranch, LayoutList, Plus, Target, TrendingUp } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, num, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart } from '../components/charts'
import type { ProductionTarget } from '../types'

const PATH = '/perencanaan'

const STATUS_TONE: Record<ProductionTarget['status'], 'emerald' | 'amber' | 'sky' | 'violet' | 'zinc'> = {
  Approved: 'emerald',
  Submitted: 'amber',
  Draft: 'zinc',
  Revised: 'sky',
}

const PITS = ['Pit Timur', 'Pit Selatan', 'Pit Tengah', 'Jalan Hauling Utara', 'Jalan Hauling Selatan']

export default function ProductionPlanning() {
  const { state, actions, toast } = useERP()
  const { authority, canDo } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [revise, setRevise] = useState<ProductionTarget | null>(null)

  const perContract = useMemo(
    () =>
      state.projectContracts.map((c) => ({
        name: c.code.replace('KTR-2026-', ''),
        target: sum(state.productionTargets.filter((t) => t.contractId === c.id && t.period === m.currentMonth && t.status === 'Approved').map((t) => t.targetQty)),
        actual: sum(state.productionLogs.filter((l) => l.contractId === c.id && l.status === 'Approved' && l.date.slice(0, 7) === m.currentMonth).map((l) => l.qty)),
      })),
    [state.projectContracts, state.productionTargets, state.productionLogs, m.currentMonth],
  )

  const columns = useMemo<Column<ProductionTarget>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      {
        key: 'contract',
        header: 'Kontrak',
        sort: (r) => r.contractId,
        render: (r) => {
          const c = state.projectContracts.find((x) => x.id === r.contractId)
          return (
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{c?.code ?? '-'}</p>
              <p className="truncate text-[11px] text-ink-faint">{c?.name ?? '-'}</p>
            </div>
          )
        },
      },
      { key: 'pit', header: 'Pit / Area', sort: (r) => r.pit, render: (r) => <span className="text-ink-muted">{r.pit}</span> },
      { key: 'activity', header: 'Aktivitas', sort: (r) => r.activity, render: (r) => <span className="text-ink-muted">{r.activity}</span> },
      { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.shift}</span> },
      { key: 'target', header: 'Target', align: 'right', sort: (r) => r.targetQty, render: (r) => <span className="tbl-num font-semibold text-ink">{num(r.targetQty)}</span> },
      { key: 'unit', header: 'Satuan', render: (r) => <span className="text-ink-faintest">{r.unit}</span> },
      {
        key: 'version',
        header: 'Versi',
        align: 'center',
        sort: (r) => r.version,
        render: (r) => (
          <span className="chip !px-1.5 !text-[10px]" title="Revisi tidak menghapus versi sebelumnya">
            v{r.version}
          </span>
        ),
      },
      { key: 'planner', header: 'Perencana', sort: (r) => r.planner, render: (r) => <span className="text-[11px] text-ink-faint">{r.planner}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.projectContracts],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perencanaan Produksi"
        subtitle="Modul 2 — target harian/mingguan per shift, pit, aktivitas, dan kelompok alat. Revisi rencana disimpan sebagai versi baru; baseline yang sudah disetujui tidak hilang."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Rencana Baru
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<Target className="h-4 w-4" />} onClick={() => toast('Rencana berstatus Submitted ditampilkan untuk persetujuan.', 'info')}>
              Setujui Rencana
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Capaian Target Bulan Ini" value={pct1(m.achievement)} icon={<TrendingUp className="h-4 w-4" />} tone={m.achievement >= 95 ? 'emerald' : 'amber'} hint={`${num(m.actualThisMonth)} dari ${num(m.targetThisMonth)} BCM`} />
        <StatCard label="Rencana Menunggu Tinjauan" value={num(state.productionTargets.filter((t) => t.status === 'Submitted').length)} icon={<ClipboardList className="h-4 w-4" />} tone="sky" hint="Perlu persetujuan Superintendent" />
        <StatCard label="Total Target Disetujui" value={num(m.targetThisMonth)} unit="BCM" icon={<Target className="h-4 w-4" />} tone="violet" hint={`Periode ${m.currentMonth}`} />
        <StatCard label="Versi Revisi Aktif" value={num(state.productionTargets.filter((t) => t.version > 1).length)} icon={<GitBranch className="h-4 w-4" />} tone="amber" hint="Rencana yang pernah direvisi" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Target vs Realisasi per Kontrak" subtitle="Hanya laporan berstatus Approved yang dihitung sebagai realisasi" />
          <div className="p-4 pt-0">
            <BarsChart data={perContract as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'target', name: 'Target' }, { key: 'actual', name: 'Realisasi' }]} height={250} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Komposisi Rencana per Aktivitas" subtitle="Sebaran target bulan ini menurut jenis pekerjaan" />
          <div className="space-y-2.5 p-4 pt-0">
            {(['OB Removal', 'Coal Getting', 'Hauling', 'Road Maintenance', 'Dewatering'] as const).map((act) => {
              const total = sum(state.productionTargets.filter((t) => t.activity === act && t.period === m.currentMonth && t.status === 'Approved').map((t) => t.targetQty))
              const max = Math.max(1, ...(['OB Removal', 'Coal Getting', 'Hauling', 'Road Maintenance', 'Dewatering'] as const).map((x) => sum(state.productionTargets.filter((t) => t.activity === x && t.period === m.currentMonth && t.status === 'Approved').map((t) => t.targetQty))))
              return (
                <div key={act}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <p className="text-xs font-medium text-ink-muted">{act}</p>
                    <span className="text-xs font-bold text-ink">{num(total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${(total / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Rencana Produksi" subtitle="Baseline, revisi, dan alasan perubahan tercatat pada setiap versi" />
        <DataTable
          data={state.productionTargets}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari pit, aktivitas, atau perencana…"
          search={(r) => `${r.code} ${r.pit} ${r.activity} ${r.shift} ${r.planner}`}
          initialSort={{ key: 'code', dir: 'desc' }}
          exportName="rencana-produksi"
          pageSize={10}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {r.status === 'Draft' && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setProductionTargetStatus(r.id, 'Submitted')}>
                  Ajukan
                </ActionButton>
              )}
              {r.status === 'Submitted' && (
                <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setProductionTargetStatus(r.id, 'Approved')}>
                  Setujui
                </ActionButton>
              )}
              {r.status === 'Approved' && (
                <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => setRevise(r)}>
                  Revisi
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      {/* Modal rencana baru */}
      <Modal open={open} onClose={() => setOpen(false)} title="Rencana Produksi Baru" subtitle="Rencana disimpan sebagai draft. Perlu diajukan lalu disetujui sebelum menjadi acuan operasional.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addProductionTarget({
              code: `TGT-${String(state.productionTargets.length + 1).padStart(3, '0')}`,
              contractId: String(fd.get('contractId') ?? state.projectContracts[0]?.id),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              period: String(fd.get('period') ?? m.currentMonth),
              shift: String(fd.get('shift') ?? 'Shift 1') as ProductionTarget['shift'],
              pit: String(fd.get('pit') ?? 'Pit Timur'),
              activity: String(fd.get('activity') ?? 'OB Removal') as ProductionTarget['activity'],
              unit: String(fd.get('unit') ?? 'BCM') as ProductionTarget['unit'],
              targetQty: Number(fd.get('targetQty') ?? 0),
              version: 1,
              planner: 'Sesi aktif',
              reason: String(fd.get('reason') ?? 'Rencana awal'),
            })
            setOpen(false)
            toast('Rencana produksi dibuat sebagai draft.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kontrak" required>
              <Select name="contractId" options={state.projectContracts.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
            </Field>
            <Field label="Periode" required>
              <Input name="period" type="month" defaultValue={m.currentMonth} required />
            </Field>
            <Field label="Shift" required>
              <Select name="shift" options={['Shift 1', 'Shift 2', 'Shift 3']} defaultValue="Shift 1" />
            </Field>
            <Field label="Pit / Area" required>
              <Select name="pit" options={PITS} defaultValue="Pit Timur" />
            </Field>
            <Field label="Aktivitas" required>
              <Select name="activity" options={['OB Removal', 'Coal Getting', 'Hauling', 'Road Maintenance', 'Dewatering']} defaultValue="OB Removal" />
            </Field>
            <Field label="Satuan" required>
              <Select name="unit" options={['BCM', 'Ton', 'Km']} defaultValue="BCM" />
            </Field>
            <Field label="Target Volume" required>
              <Input name="targetQty" type="number" min={0} placeholder="42000" required />
            </Field>
            <Field label="Alasan / Asumsi Rencana" className="sm:col-span-2">
              <Textarea name="reason" rows={3} placeholder="Asumsi produktivitas, jumlah unit, kondisi lapangan…" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Draft
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Modal revisi */}
      <Modal open={!!revise} onClose={() => setRevise(null)} title="Revisi Rencana Produksi" subtitle="Versi sebelumnya tetap tersimpan sebagai riwayat. Selisih dicatat sebagai alasan revisi.">
        {revise && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              actions.setProductionTargetStatus(revise.id, 'Revised', String(fd.get('reason') ?? ''))
              toast(`Rencana ${revise.code} direvisi menjadi versi ${revise.version + 1}.`, 'success')
              setRevise(null)
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
              <p className="text-xs text-ink-faint">Baseline saat ini</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {revise.code} · {num(revise.targetQty)} {revise.unit} · v{revise.version}
              </p>
              <p className="mt-1 text-[11px] text-ink-faintest">{revise.reason}</p>
            </div>
            <Field label="Target Baru" required>
              <Input name="targetQty" type="number" defaultValue={revise.targetQty} min={0} required />
            </Field>
            <Field label="Alasan Revisi" required>
              <Textarea name="reason" rows={3} placeholder="mis. Produktivitas aktual 6% lebih rendah dari asumsi karena kualitas material…" required />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="ghost" onClick={() => setRevise(null)}>
                Batal
              </Button>
              <ActionButton module={PATH} need="approve" type="submit" icon={<LayoutList className="h-4 w-4" />}>
                Simpan Revisi
              </ActionButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
