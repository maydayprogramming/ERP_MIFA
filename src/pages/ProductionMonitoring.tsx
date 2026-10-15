import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, Mountain, Plus, RotateCcw, Send } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, dmy, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { TrendChart } from '../components/charts'
import type { ProductionLog } from '../types'

const PATH = '/monitoring-produksi'

const STATUS_TONE: Record<ProductionLog['status'], 'zinc' | 'amber' | 'sky' | 'emerald' | 'rose'> = {
  Draft: 'zinc',
  Submitted: 'amber',
  Verified: 'sky',
  Approved: 'emerald',
  Returned: 'rose',
}

const FLOW: Array<{ status: ProductionLog['status']; label: string; hint: string }> = [
  { status: 'Draft', label: 'Draft', hint: 'Diinput operator / foreman, belum dikirim.' },
  { status: 'Submitted', label: 'Dikirim', hint: 'Menunggu pemeriksaan foreman.' },
  { status: 'Verified', label: 'Diverifikasi', hint: 'Menunggu persetujuan supervisor.' },
  { status: 'Approved', label: 'Disetujui', hint: 'Menjadi acuan biaya dan penagihan.' },
]

export default function ProductionMonitoring() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [returnNote, setReturnNote] = useState<ProductionLog | null>(null)
  const [detail, setDetail] = useState<ProductionLog | null>(null)

  const columns = useMemo<Column<ProductionLog>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
      { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.shift}</span> },
      {
        key: 'contract',
        header: 'Kontrak / Pit',
        sort: (r) => r.contractId,
        render: (r) => {
          const c = state.projectContracts.find((x) => x.id === r.contractId)
          return (
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{r.pit}</p>
              <p className="truncate text-[11px] text-ink-faint">{c?.code ?? '-'} · {r.activity}</p>
            </div>
          )
        },
      },
      { key: 'qty', header: 'Volume', align: 'right', sort: (r) => r.qty, render: (r) => <span className="tbl-num font-semibold text-ink">{num(r.qty)}</span> },
      { key: 'unit', header: 'Satuan', render: (r) => <span className="text-ink-faintest">{r.unit}</span> },
      {
        key: 'prod',
        header: 'Produktivitas',
        align: 'right',
        sort: (r) => (r.operatingHours > 0 ? r.qty / r.operatingHours : 0),
        render: (r) => <span className="tbl-num text-ink-muted">{r.operatingHours > 0 ? `${num1(r.qty / r.operatingHours)} ${r.unit}/jam` : '—'}</span>,
      },
      { key: 'method', header: 'Metode', sort: (r) => r.method, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.method}</span> },
      { key: 'source', header: 'Sumber', sort: (r) => r.source, render: (r) => <span className="text-[11px] text-ink-faint">{r.source}</span> },
      { key: 'inputBy', header: 'Input', sort: (r) => r.inputBy, render: (r) => <span className="text-[11px] text-ink-faint">{r.inputBy}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.projectContracts],
  )

  const statusCount = (s: ProductionLog['status']) => state.productionLogs.filter((l) => l.status === s).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Produksi"
        subtitle="Modul 3 — pencatatan hasil pekerjaan, target versus aktual, dan data terverifikasi. Seluruh perhitungan biaya dan penagihan memakai angka dari modul ini, bukan duplikasi."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Input Hasil
            </ActionButton>
            <ActionButton module={PATH} need="export" variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => toast('Ekspor log produksi dalam format CSV dijalankan.', 'info')}>
              Ekspor
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Realisasi Bulan Ini" value={num(m.actualThisMonth)} unit="BCM" icon={<Mountain className="h-4 w-4" />} tone="amber" delta={m.volumeDelta} deltaLabel="vs bulan lalu" />
        <StatCard label="Capaian Target" value={pct1(m.achievement)} icon={<CheckCircle2 className="h-4 w-4" />} tone={m.achievement >= 95 ? 'emerald' : 'amber'} hint={`Target ${num(m.targetThisMonth)} BCM`} />
        <StatCard label="Menunggu Verifikasi" value={num(statusCount('Submitted'))} icon={<Clock className="h-4 w-4" />} tone="sky" hint="Diperiksa foreman" />
        <StatCard label="Dikembalikan" value={num(statusCount('Returned'))} icon={<AlertTriangle className="h-4 w-4" />} tone="rose" hint="Perlu koreksi input" />
      </div>

      {/* Alur kerja */}
      <Card>
        <CardHeader title="Alur Verifikasi Data Produksi" subtitle="Operator input → Foreman verifikasi → Supervisor setujui. Setiap langkah tercatat pada audit trail." />
        <div className="grid gap-3 p-4 sm:grid-cols-4">
          {FLOW.map((f, i) => (
            <div key={f.status} className="relative rounded-xl border border-line bg-surface-2/40 p-3.5">
              <div className="flex items-center justify-between">
                <Badge tone={STATUS_TONE[f.status]} dot>
                  {f.label}
                </Badge>
                <span className="text-lg font-bold text-ink">{statusCount(f.status)}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{f.hint}</p>
              {i < FLOW.length - 1 && <span className="absolute -right-2 top-1/2 hidden h-0.5 w-4 bg-line-strong sm:block" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tren Realisasi Volume" subtitle="Hanya laporan yang sudah disetujui — konsisten dengan angka biaya dan tagihan" />
          <div className="p-4 pt-0">
            <TrendChart
              data={m.monthly as unknown as Array<Record<string, string | number>>}
              xKey="label"
              series={[
                { key: 'bcm', name: 'OB Removal (BCM)' },
                { key: 'ton', name: 'Coal Getting (Ton)', type: 'line' },
                { key: 'km', name: 'Road (Km)', type: 'line' },
              ]}
              height={250}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Ringkasan Metode Pengukuran" subtitle="Metode harus sesuai ketentuan kontrak" />
          <div className="space-y-2.5 p-4 pt-0">
            {(['Survey', 'Timbangan', 'Hitung Trip', 'Estimasi'] as const).map((method) => {
              const rows = state.productionLogs.filter((l) => l.method === method)
              const total = sum(rows.map((l) => l.qty))
              return (
                <div key={method} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-medium text-ink">{method}</p>
                    <span className="text-xs font-bold text-ink-muted">{num(total)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-ink-faintest">{rows.length} laporan · {pct1(rows.length / Math.max(1, state.productionLogs.length) * 100)} dari total</p>
                </div>
              )
            })}
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5">
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
                Metode <span className="font-semibold">Estimasi</span> tidak digunakan untuk penagihan. Selisih di atas ambang 2% wajib disertai alasan tertulis.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Log Produksi Lapangan"
          subtitle={`Kewenangan sesi: ${authority(PATH)}. Daftar ini sudah difilter sesuai lingkup data peran Anda.`}
        />
        <DataTable
          data={state.productionLogs}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari kode, pit, aktivitas, atau petugas input…"
          search={(r) => `${r.code} ${r.pit} ${r.activity} ${r.inputBy} ${r.method} ${r.status}`}
          initialSort={{ key: 'date', dir: 'desc' }}
          exportName="log-produksi"
          pageSize={12}
          onRowClick={(r) => setDetail(r)}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {r.status === 'Draft' && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" icon={<Send className="h-3.5 w-3.5" />} onClick={() => actions.setProductionLogStatus(r.id, 'Submitted')}>
                  Kirim
                </ActionButton>
              )}
              {r.status === 'Submitted' && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => actions.setProductionLogStatus(r.id, 'Verified')}>
                  Verifikasi
                </ActionButton>
              )}
              {r.status === 'Verified' && (
                <>
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => actions.setProductionLogStatus(r.id, 'Approved')}>
                    Setujui
                  </ActionButton>
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setReturnNote(r)}>
                    Kembalikan
                  </ActionButton>
                </>
              )}
              {r.status === 'Returned' && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" icon={<Send className="h-3.5 w-3.5" />} onClick={() => actions.setProductionLogStatus(r.id, 'Submitted')}>
                  Kirim Ulang
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      {/* Detail */}
      {detail && (
        <Card>
          <CardHeader
            title={`${detail.code} — ${detail.pit}`}
            subtitle={`${detail.activity} · ${detail.shift} · ${dmy(detail.date)}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Volume tercatat', `${num(detail.qty)} ${detail.unit}`],
              ['Jam operasi', `${num1(detail.operatingHours)} jam`],
              ['Produktivitas', detail.operatingHours > 0 ? `${num1(detail.qty / detail.operatingHours)} ${detail.unit}/jam` : '—'],
              ['Metode pengukuran', detail.method],
              ['Sumber data', detail.source],
              ['Unit pelaksana', `${detail.unitIds.length} unit`],
              ['Diinput oleh', detail.inputBy],
              ['Status', detail.status],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
              </div>
            ))}
          </div>
          {(detail.verifiedBy || detail.approvedBy || detail.correctionNote) && (
            <div className="border-t border-line p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Riwayat pemeriksaan</p>
              <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                {detail.verifiedBy && <li>Diverifikasi oleh {detail.verifiedBy}</li>}
                {detail.approvedBy && <li>Disetujui oleh {detail.approvedBy}</li>}
                {detail.correctionNote && <li className="text-amber-600 dark:text-amber-300">Catatan koreksi: {detail.correctionNote}</li>}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Modal input */}
      <Modal open={open} onClose={() => setOpen(false)} title="Input Hasil Produksi" subtitle="Data dicatat di dekat sumber kejadian. Simpan sebagai draft sebelum dikirim untuk diperiksa.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addProductionLog({
              date: String(fd.get('date') ?? ''),
              shift: String(fd.get('shift') ?? 'Shift 1') as ProductionLog['shift'],
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              contractId: String(fd.get('contractId') ?? state.projectContracts[0]?.id),
              pit: String(fd.get('pit') ?? 'Pit Timur'),
              activity: String(fd.get('activity') ?? 'OB Removal') as ProductionLog['activity'],
              unitIds: [],
              qty: Number(fd.get('qty') ?? 0),
              unit: String(fd.get('unit') ?? 'BCM') as ProductionLog['unit'],
              method: String(fd.get('method') ?? 'Survey') as ProductionLog['method'],
              operatingHours: Number(fd.get('operatingHours') ?? 0),
              source: String(fd.get('source') ?? 'Manual') as ProductionLog['source'],
              inputBy: user?.name ?? 'Sesi aktif',
            })
            setOpen(false)
            toast('Hasil produksi disimpan sebagai draft. Kirim untuk diperiksa foreman.', 'success')
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
            <Field label="Kontrak" required>
              <Select name="contractId" options={state.projectContracts.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
            </Field>
            <Field label="Pit / Area" required>
              <Input name="pit" defaultValue="Pit Timur" required />
            </Field>
            <Field label="Aktivitas" required>
              <Select name="activity" options={['OB Removal', 'Coal Getting', 'Hauling', 'Road Maintenance', 'Dewatering']} defaultValue="OB Removal" />
            </Field>
            <Field label="Satuan" required>
              <Select name="unit" options={['BCM', 'Ton', 'Km']} defaultValue="BCM" />
            </Field>
            <Field label="Volume" required>
              <Input name="qty" type="number" min={0} step="0.01" placeholder="41800" required />
            </Field>
            <Field label="Jam Operasi" hint="Dasar perhitungan produktivitas.">
              <Input name="operatingHours" type="number" min={0} step="0.1" defaultValue={21.5} />
            </Field>
            <Field label="Metode Pengukuran" required>
              <Select name="method" options={['Survey', 'Timbangan', 'Hitung Trip', 'Estimasi']} defaultValue="Survey" />
            </Field>
            <Field label="Sumber Data" required>
              <Select name="source" options={['Manual', 'Import', 'GPS']} defaultValue="Manual" />
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

      {/* Modal kembalikan */}
      <Modal open={!!returnNote} onClose={() => setReturnNote(null)} title="Kembalikan untuk Koreksi" subtitle="Alasan wajib diisi agar petugas input tahu apa yang harus diperbaiki.">
        {returnNote && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              actions.setProductionLogStatus(returnNote.id, 'Returned', String(fd.get('note') ?? ''))
              toast(`Laporan ${returnNote.code} dikembalikan untuk diperbaiki.`, 'warning')
              setReturnNote(null)
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-line bg-surface-2/40 p-3.5 text-xs text-ink-muted">
              {returnNote.code} · {num(returnNote.qty)} {returnNote.unit} · {returnNote.pit}
            </div>
            <Field label="Alasan Pengembalian" required>
              <Textarea name="note" rows={3} placeholder="mis. Tonase tidak sesuai data weighbridge, mohon koreksi…" required />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="ghost" onClick={() => setReturnNote(null)}>
                Batal
              </Button>
              <ActionButton module={PATH} need="approve" type="submit" icon={<RotateCcw className="h-4 w-4" />}>
                Kembalikan
              </ActionButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
