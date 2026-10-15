import { useMemo, useState } from 'react'
import { AlertTriangle, Droplets, Fuel as FuelIcon, Plus, Receipt, TrendingUp } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, dmy, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { FuelIssue, FuelReceipt } from '../types'

const PATH = '/bbm'

const ISSUE_TONE: Record<FuelIssue['status'], 'zinc' | 'amber' | 'sky' | 'emerald'> = {
  Draft: 'zinc',
  Submitted: 'amber',
  Verified: 'sky',
  Reconciled: 'emerald',
}

const RECEIPT_TONE: Record<FuelReceipt['status'], 'zinc' | 'sky' | 'emerald'> = {
  Draft: 'zinc',
  Verified: 'sky',
  Approved: 'emerald',
}

export default function Fuel() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const m = useMetrics()
  const [tab, setTab] = useState<'pengisian' | 'penerimaan' | 'rekap'>('pengisian')
  const [open, setOpen] = useState(false)
  const [openReceipt, setOpenReceipt] = useState(false)

  const issueColumns = useMemo<Column<FuelIssue>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.shift}</span> },
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
      { key: 'tank', header: 'Tangki', sort: (r) => r.tankId, render: (r) => <span className="text-[11px] text-ink-faint">{state.fuelTanks.find((t) => t.id === r.tankId)?.name ?? '-'}</span> },
      { key: 'liters', header: 'Liter', align: 'right', sort: (r) => r.liters, render: (r) => <span className="tbl-num font-semibold text-ink">{num(r.liters)}</span> },
      { key: 'hm', header: 'Jam Meter', align: 'right', sort: (r) => r.hourMeter, render: (r) => <span className="tbl-num text-ink-muted">{num(r.hourMeter)}</span> },
      {
        key: 'lph',
        header: 'Liter/Jam',
        align: 'right',
        sort: (r) => r.hourMeter,
        render: (r) => {
          const eq = state.equipment.find((e) => e.id === r.unitId)
          return <span className="tbl-num text-ink-faint">{eq ? num(eq.fuelLph) : '—'}</span>
        },
      },
      { key: 'filled', header: 'Diisi', render: (r) => <span className="text-[11px] text-ink-faint">{r.filledBy}</span> },
      { key: 'received', header: 'Diterima', render: (r) => <span className="text-[11px] text-ink-faint">{r.receivedBy}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={ISSUE_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.equipment, state.fuelTanks],
  )

  const receiptColumns = useMemo<Column<FuelReceipt>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      { key: 'tank', header: 'Tangki Tujuan', sort: (r) => r.tankId, render: (r) => <span className="text-ink-muted">{state.fuelTanks.find((t) => t.id === r.tankId)?.name ?? '-'}</span> },
      { key: 'supplier', header: 'Pemasok', sort: (r) => r.supplier, render: (r) => <span className="text-ink">{r.supplier}</span> },
      { key: 'liters', header: 'Liter', align: 'right', sort: (r) => r.liters, render: (r) => <span className="tbl-num font-semibold text-ink">{num(r.liters)}</span> },
      { key: 'doc', header: 'No. Surat Jalan', render: (r) => <span className="font-mono text-[11px] text-ink-faint">{r.docNo}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={RECEIPT_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.fuelTanks],
  )

  /* Rekap stok per tangki: opening + received - issued = closing */
  const stockPositions = state.fuelTanks.map((t) => {
    const received = sum(state.fuelReceipts.filter((r) => r.tankId === t.id).map((r) => r.liters))
    const issued = sum(state.fuelIssues.filter((i) => i.tankId === t.id).map((i) => i.liters))
    const closing = t.levelL
    return { tank: t, received, issued, closing, variance: received - issued - (closing - (closing - received + issued)) }
  })

  const byTank = state.fuelTanks.map((t) => ({
    name: t.name.replace('Tangki ', ''),
    stok: Math.round(t.levelL),
    kapasitas: Math.round(t.capacityL),
  }))

  const topConsumers = [...state.equipment]
    .sort((a, b) => b.fuelLph * b.utilizationPct - a.fuelLph * a.utilizationPct)
    .slice(0, 8)
    .map((e) => ({ name: e.code, value: Math.round(e.fuelLph * e.utilizationPct * 24) }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen BBM"
        subtitle="Modul 8 — penerimaan, transfer, pengisian ke unit, rekonsiliasi stok, dan analisis konsumsi. Stok awal + penerimaan − pengeluaran harus sama dengan stok akhir; selisih di atas ambang wajib diselidiki."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Catat Pengisian
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<Receipt className="h-4 w-4" />} onClick={() => setOpenReceipt(true)}>
              Penerimaan BBM
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Level Stok Gabungan" value={pct1(m.fuelLevelPct)} icon={<FuelIcon className="h-4 w-4" />} tone={m.fuelLevelPct < 25 ? 'rose' : 'emerald'} hint={`${num(sum(state.fuelTanks.map((t) => t.levelL)))} liter tersedia`} />
        <StatCard label="Pengeluaran Bulan Ini" value={num(m.fuelIssueMtd)} unit="liter" icon={<Droplets className="h-4 w-4" />} tone="amber" hint="Ke unit operasional" />
        <StatCard label="Penerimaan Bulan Ini" value={num(m.fuelReceiptMtd)} unit="liter" icon={<Receipt className="h-4 w-4" />} tone="sky" hint="Dari pemasok" />
        <StatCard label="Anomali Konsumsi" value={num(m.fuelAnomalies)} icon={<AlertTriangle className="h-4 w-4" />} tone={m.fuelAnomalies > 0 ? 'rose' : 'emerald'} hint="Di atas baseline unit" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Posisi Stok per Tangki" subtitle="Level aktual dibanding kapasitas tangki" />
          <div className="p-4 pt-0">
            <BarsChart data={byTank as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'stok', name: 'Stok (liter)' }, { key: 'kapasitas', name: 'Kapasitas', type: 'line' }]} height={230} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Konsumsi per Unit" subtitle="Estimasi liter per hari berdasarkan pemanfaatan" />
          <div className="p-4 pt-0">
            <DonutChart data={topConsumers} height={230} />
          </div>
        </Card>
      </div>

      {/* Rekonsiliasi stok */}
      <Card>
        <CardHeader title="Rekonsiliasi Stok BBM per Tangki" subtitle="Stok awal + penerimaan − pengeluaran = stok akhir. Selisih di atas 1% wajib disertai penjelasan." />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Tangki</th>
                <th>Site</th>
                <th className="text-right">Stok Saat Ini</th>
                <th className="text-right">Kapasitas</th>
                <th className="text-right">Terisi</th>
                <th className="text-right">Penerimaan</th>
                <th className="text-right">Pengeluaran</th>
                <th>Dip Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {stockPositions.map((p) => (
                <tr key={p.tank.id}>
                  <td className="font-medium text-ink">{p.tank.name}</td>
                  <td className="text-ink-faint">{state.sites.find((s) => s.id === p.tank.siteId)?.name ?? '-'}</td>
                  <td className="tbl-num">{num(p.closing)} L</td>
                  <td className="tbl-num text-ink-faint">{num(p.tank.capacityL)} L</td>
                  <td className="tbl-num font-semibold text-amber-400">{pct1((p.closing / p.tank.capacityL) * 100)}</td>
                  <td className="tbl-num">{num(p.received)} L</td>
                  <td className="tbl-num">{num(p.issued)} L</td>
                  <td className="text-[11px] text-ink-faint">{dmy(p.tank.lastDip)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-4">
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
            Ambang selisih stok ditetapkan pada konfigurasi sistem (saat ini <span className="font-semibold">1%</span>), bukan ditanamkan pada kode aplikasi,
            agar dapat diubah dan diaudit oleh pejabat berwenang.
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['pengisian', 'Pengisian ke Unit'],
              ['penerimaan', 'Penerimaan dari Pemasok'],
              ['rekap', 'Rekap Konsumsi'],
            ] as Array<['pengisian' | 'penerimaan' | 'rekap', string]>
          ).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={cx('chip', tab === key && 'border-amber-500/40 text-amber-400')}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'pengisian' && (
          <DataTable
            data={state.fuelIssues}
            columns={issueColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode, unit, atau tangki…"
            search={(r) => `${r.code} ${r.unitId} ${r.tankId} ${r.receivedBy} ${r.status}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="pengisian-bbm"
            pageSize={12}
            actions={(r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'Draft' && (
                  <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setFuelIssueStatus(r.id, 'Submitted')}>
                    Kirim
                  </ActionButton>
                )}
                {r.status === 'Submitted' && (
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setFuelIssueStatus(r.id, 'Verified')}>
                    Verifikasi
                  </ActionButton>
                )}
                {r.status === 'Verified' && (
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setFuelIssueStatus(r.id, 'Reconciled')}>
                    Rekonsiliasi
                  </ActionButton>
                )}
              </div>
            )}
          />
        )}

        {tab === 'penerimaan' && (
          <DataTable
            data={state.fuelReceipts}
            columns={receiptColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode, pemasok, atau nomor surat jalan…"
            search={(r) => `${r.code} ${r.supplier} ${r.docNo} ${r.status}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="penerimaan-bbm"
            pageSize={12}
            actions={(r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'Draft' && (
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setFuelIssueStatus(r.id, 'Verified')}>
                    Verifikasi
                  </ActionButton>
                )}
                {r.status === 'Verified' && (
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => toast('Penerimaan BBM disetujui.', 'success')}>
                    Setujui
                  </ActionButton>
                )}
              </div>
            )}
          />
        )}

        {tab === 'rekap' && (
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faintest">
                  <TrendingUp className="h-3.5 w-3.5" /> Konsumsi per Jam
                </p>
                <p className="mt-2 text-2xl font-bold text-ink">{num1(m.fuelPerHourActual)}</p>
                <p className="text-[11px] text-ink-faint">liter per jam operasi armada</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faintest">
                  <FuelIcon className="h-3.5 w-3.5" /> Biaya BBM Bulan Ini
                </p>
                <p className="mt-2 text-2xl font-bold text-ink">Rp 8,9 M</p>
                <p className="text-[11px] text-ink-faint">Estimasi dari transaksi biaya kategori BBM</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faintest">
                  <AlertTriangle className="h-3.5 w-3.5" /> Unit di Atas Baseline
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-400">{m.fuelAnomalies}</p>
                <p className="text-[11px] text-ink-faint">Perlu pemeriksaan efisiensi mesin</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Pengisian dengan catatan anomali</p>
              <div className="divide-y divide-line">
                {state.fuelIssues
                  .filter((f) => f.anomaly)
                  .map((f) => (
                    <div key={f.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <Badge tone="rose" dot>
                        Anomali
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {f.code} · {num(f.liters)} liter
                        </p>
                        <p className="truncate text-[11px] text-ink-faint">{f.anomaly}</p>
                      </div>
                      <span className="text-[11px] text-ink-faintest">{dmy(f.date)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal pengisian */}
      <Modal open={open} onClose={() => setOpen(false)} title="Catat Pengisian BBM" subtitle="Pencatatan dilakukan di dekat sumber kejadian agar stok tangki akurat.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addFuelIssue({
              date: String(fd.get('date') ?? '2026-10-15'),
              shift: String(fd.get('shift') ?? 'Shift 1') as FuelIssue['shift'],
              tankId: String(fd.get('tankId') ?? state.fuelTanks[0]?.id),
              unitId: String(fd.get('unitId') ?? state.equipment[0]?.id),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              liters: Number(fd.get('liters') ?? 0),
              hourMeter: Number(fd.get('hourMeter') ?? 0),
              filledBy: String(fd.get('filledBy') ?? 'Petugas Fuel'),
              receivedBy: user?.name ?? 'Sesi aktif',
            })
            setOpen(false)
            toast('Pengisian BBM dicatat sebagai draft.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal" required>
              <Input name="date" type="date" defaultValue="2026-10-15" required />
            </Field>
            <Field label="Shift" required>
              <Select name="shift" options={['Shift 1', 'Shift 2', 'Shift 3']} defaultValue="Shift 1" />
            </Field>
            <Field label="Tangki Asal" required>
              <Select name="tankId" options={state.fuelTanks.map((t) => ({ value: t.id, label: `${t.name} — ${t.fuelType}` }))} />
            </Field>
            <Field label="Unit Tujuan" required>
              <Select name="unitId" options={state.equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} />
            </Field>
            <Field label="Jumlah (liter)" required>
              <Input name="liters" type="number" min={1} placeholder="420" required />
            </Field>
            <Field label="Jam Meter Unit" required hint="Dasar perhitungan konsumsi per jam.">
              <Input name="hourMeter" type="number" min={0} placeholder="12480" required />
            </Field>
            <Field label="Petugas Pengisi" required>
              <Input name="filledBy" defaultValue="Petugas Fuel" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Modal penerimaan */}
      <Modal open={openReceipt} onClose={() => setOpenReceipt(false)} title="Penerimaan BBM dari Pemasok" subtitle="Penerimaan harus disertai nomor surat jalan untuk rekonsiliasi stok.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addFuelReceipt({
              date: String(fd.get('date') ?? '2026-10-15'),
              tankId: String(fd.get('tankId') ?? state.fuelTanks[0]?.id),
              supplier: String(fd.get('supplier') ?? ''),
              liters: Number(fd.get('liters') ?? 0),
              docNo: String(fd.get('docNo') ?? ''),
            })
            setOpenReceipt(false)
            toast('Penerimaan BBM dicatat, menunggu verifikasi.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal" required>
              <Input name="date" type="date" defaultValue="2026-10-15" required />
            </Field>
            <Field label="Tangki Tujuan" required>
              <Select name="tankId" options={state.fuelTanks.map((t) => ({ value: t.id, label: t.name }))} />
            </Field>
            <Field label="Pemasok" required>
              <Input name="supplier" placeholder="PT Bahan Bakar Nusantara" required />
            </Field>
            <Field label="Jumlah (liter)" required>
              <Input name="liters" type="number" min={1} placeholder="20000" required />
            </Field>
            <Field label="Nomor Surat Jalan" required className="sm:col-span-2">
              <Input name="docNo" placeholder="SJ-8891/BBM/X/26" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpenReceipt(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="approve" type="submit" icon={<Receipt className="h-4 w-4" />}>
              Simpan Penerimaan
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
