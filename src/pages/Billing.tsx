import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FileText, Plus, Scale, Send } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, idrFull, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { BillingReconciliation } from '../types'

const PATH = '/rekonsiliasi'

const STATUS_TONE: Record<BillingReconciliation['status'], 'zinc' | 'amber' | 'emerald' | 'sky' | 'violet'> = {
  Draft: 'zinc',
  'Awaiting Owner Approval': 'amber',
  Approved: 'emerald',
  'Ready to Bill': 'sky',
  Invoiced: 'violet',
  Paid: 'emerald',
}

const FLOW: Array<{ status: BillingReconciliation['status']; label: string; desc: string }> = [
  { status: 'Draft', label: 'Draft', desc: 'Volume internal disusun dari log produksi yang sudah disetujui.' },
  { status: 'Awaiting Owner Approval', label: 'Menunggu Persetujuan Owner', desc: 'Dokumen pengukuran bersama dikirim ke pemilik tambang.' },
  { status: 'Approved', label: 'Disetujui Owner', desc: 'Volume disetujui pemilik tambang menjadi dasar penagihan.' },
  { status: 'Ready to Bill', label: 'Siap Ditagih', desc: 'Paket penagihan lengkap dengan tarif efektif dan dokumen pendukung.' },
  { status: 'Invoiced', label: 'Ditagihkan', desc: 'Faktur diterbitkan dan tercatat sebagai piutang.' },
  { status: 'Paid', label: 'Dibayar', desc: 'Pembayaran diterima dan direkonsiliasi.' },
]

export default function Billing() {
  const { state, actions, toast } = useERP()
  const { authority } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<BillingReconciliation | null>(null)

  const columns = useMemo<Column<BillingReconciliation>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'period', header: 'Periode', sort: (r) => r.period, render: (r) => <span className="text-ink-muted">{r.period}</span> },
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
      { key: 'internal', header: 'Volume Internal', align: 'right', sort: (r) => r.internalVolume, render: (r) => <span className="tbl-num text-ink">{num(r.internalVolume)}</span> },
      { key: 'submitted', header: 'Diajukan', align: 'right', sort: (r) => r.submittedVolume, render: (r) => <span className="tbl-num text-ink-muted">{num(r.submittedVolume)}</span> },
      {
        key: 'approved',
        header: 'Disetujui Owner',
        align: 'right',
        sort: (r) => r.approvedVolume,
        render: (r) => <span className="tbl-num font-semibold text-ink">{r.approvedVolume > 0 ? num(r.approvedVolume) : '—'}</span>,
      },
      {
        key: 'variance',
        header: 'Selisih',
        align: 'right',
        sort: (r) => r.internalVolume - r.approvedVolume,
        render: (r) => {
          const v = r.approvedVolume > 0 ? r.internalVolume - r.approvedVolume : 0
          return <span className={cx('tbl-num font-medium', v > 0 ? 'text-amber-400' : 'text-emerald-400')}>{r.approvedVolume > 0 ? num(v) : '—'}</span>
        },
      },
      { key: 'rate', header: 'Tarif', align: 'right', sort: (r) => r.rateIdr, render: (r) => <span className="tbl-num text-ink-faint">{idrFull(r.rateIdr)}</span> },
      {
        key: 'value',
        header: 'Nilai',
        align: 'right',
        sort: (r) => r.approvedVolume * r.rateIdr,
        render: (r) => <span className="tbl-num font-semibold text-ink">{r.approvedVolume > 0 ? idrFull(r.approvedVolume * r.rateIdr) : '—'}</span>,
      },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.projectContracts],
  )

  const statusData = FLOW.map((f) => ({ name: f.label, value: state.billingReconciliations.filter((b) => b.status === f.status).length }))
  const varianceByPeriod = useMemo(() => {
    const periods = [...new Set(state.billingReconciliations.map((b) => b.period))]
    return periods.map((p) => {
      const rows = state.billingReconciliations.filter((b) => b.period === p)
      return {
        name: p,
        internal: sum(rows.map((r) => r.internalVolume)),
        disetujui: sum(rows.map((r) => r.approvedVolume)),
      }
    })
  }, [state.billingReconciliations])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekonsiliasi & Billing"
        subtitle="Modul 14 — rekonsiliasi volume pekerjaan, selisih beserta alasannya, tarif efektif, dan paket penagihan. Volume tagihan mengacu pada angka yang sudah disetujui pemilik tambang, bukan angka internal."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Rekonsiliasi Baru
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<Send className="h-4 w-4" />} onClick={() => toast('Paket penagihan diajukan ke pemilik tambang.', 'info')}>
              Ajukan ke Owner
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Volume Internal Bulan Ini" value={num(m.recInternal)} unit="BCM" icon={<Scale className="h-4 w-4" />} tone="sky" hint="Dari log produksi disetujui" />
        <StatCard label="Disetujui Owner" value={num(m.recApproved)} unit="BCM" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" hint="Dasar penagihan" />
        <StatCard
          label="Selisih Rekonsiliasi"
          value={num(m.recVariance)}
          unit="BCM"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={m.recVariance > 0 ? 'amber' : 'emerald'}
          hint={m.recSubmitted > 0 ? pct1((m.recVariance / m.recSubmitted) * 100) + ' dari yang diajukan' : '—'}
        />
        <StatCard label="Nilai Siap Ditagih" value={idrFull(m.billableValue)} icon={<FileText className="h-4 w-4" />} tone="violet" hint="Ready to bill + invoiced" />
      </div>

      <Card>
        <CardHeader title="Alur Rekonsiliasi sampai Pembayaran" subtitle="Tahapan status beserta dokumen yang menyertainya" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((f, i) => (
            <div key={f.status} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
              <div className="flex items-center justify-between">
                <Badge tone={STATUS_TONE[f.status]} dot>
                  {f.label}
                </Badge>
                <span className="text-[10px] font-bold text-ink-faintest">Tahap {i + 1}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{f.desc}</p>
              <p className="mt-2 text-lg font-bold text-ink">{state.billingReconciliations.filter((b) => b.status === f.status).length}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volume Internal vs Disetujui Owner" subtitle="Per periode — selisih harus memiliki alasan tertulis" />
          <div className="p-4 pt-0">
            <BarsChart data={varianceByPeriod as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'internal', name: 'Internal' }, { key: 'disetujui', name: 'Disetujui owner' }]} height={250} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Sebaran Status Rekonsiliasi" subtitle="Posisi seluruh paket penagihan" />
          <div className="p-4 pt-0">
            <DonutChart data={statusData} height={250} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Daftar Rekonsiliasi" subtitle={`Kewenangan sesi: ${authority(PATH)}`} />
        <DataTable
          data={state.billingReconciliations}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari kode, kontrak, atau periode…"
          search={(r) => `${r.code} ${r.period} ${r.contractId} ${r.varianceReason} ${r.status}`}
          initialSort={{ key: 'period', dir: 'desc' }}
          exportName="rekonsiliasi-billing"
          pageSize={12}
          onRowClick={(r) => setDetail(r)}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {r.status === 'Draft' && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setBillingReconciliationStatus(r.id, 'Awaiting Owner Approval')}>
                  Ajukan
                </ActionButton>
              )}
              {r.status === 'Awaiting Owner Approval' && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setBillingReconciliationStatus(r.id, 'Approved')}>
                  Catat Persetujuan
                </ActionButton>
              )}
              {r.status === 'Approved' && (
                <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setBillingReconciliationStatus(r.id, 'Ready to Bill')}>
                  Siapkan Paket
                </ActionButton>
              )}
              {r.status === 'Ready to Bill' && (
                <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setBillingReconciliationStatus(r.id, 'Invoiced')}>
                  Terbitkan Faktur
                </ActionButton>
              )}
              {r.status === 'Invoiced' && (
                <ActionButton module={PATH} need="close" size="sm" variant="ghost" onClick={() => actions.setBillingReconciliationStatus(r.id, 'Paid')}>
                  Catat Pembayaran
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      {detail && (
        <Card>
          <CardHeader
            title={`${detail.code} — ${detail.period}`}
            subtitle={`Diajukan oleh ${detail.preparedBy}${detail.reviewedBy ? ` · ditinjau ${detail.reviewedBy}` : ''}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
              {[
                ['Volume internal', `${num(detail.internalVolume)} ${detail.unit}`],
                ['Volume diajukan', `${num(detail.submittedVolume)} ${detail.unit}`],
                ['Volume disetujui owner', detail.approvedVolume > 0 ? `${num(detail.approvedVolume)} ${detail.unit}` : 'Menunggu'],
                ['Tarif efektif', idrFull(detail.rateIdr)],
                ['Nilai penagihan', detail.approvedVolume > 0 ? idrFull(detail.approvedVolume * detail.rateIdr) : '—'],
                ['Selisih', detail.approvedVolume > 0 ? `${num(detail.internalVolume - detail.approvedVolume)} ${detail.unit}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Alasan Selisih</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail.varianceReason}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Dokumen Pendukung</p>
                <ul className="mt-1.5 space-y-1 text-[11px] text-ink-muted">
                  <li>• Laporan produksi disetujui periode {detail.period}</li>
                  <li>• Berita acara pengukuran bersama</li>
                  <li>• Rincian tarif efektif sesuai kontrak</li>
                  <li>• Ringkasan downtime & pembebanan</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Rekonsiliasi Baru" subtitle="Volume internal diambil dari log produksi yang sudah disetujui. Selisih wajib disertai alasan.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addBillingReconciliation({
              period: String(fd.get('period') ?? m.currentMonth),
              contractId: String(fd.get('contractId') ?? state.projectContracts[0]?.id),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              internalVolume: Number(fd.get('internalVolume') ?? 0),
              submittedVolume: Number(fd.get('submittedVolume') ?? 0),
              approvedVolume: 0,
              unit: String(fd.get('unit') ?? 'BCM') as BillingReconciliation['unit'],
              rateIdr: Number(fd.get('rateIdr') ?? 0),
              varianceReason: String(fd.get('varianceReason') ?? ''),
              preparedBy: 'Sesi aktif',
            })
            setOpen(false)
            toast('Rekonsiliasi dibuat sebagai draft.', 'success')
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
            <Field label="Volume Internal" required>
              <Input name="internalVolume" type="number" min={0} step="0.01" placeholder="1180400" required />
            </Field>
            <Field label="Volume Diajukan" required>
              <Input name="submittedVolume" type="number" min={0} step="0.01" placeholder="1180400" required />
            </Field>
            <Field label="Satuan" required>
              <Select name="unit" options={['BCM', 'Ton', 'Jam', 'Km']} defaultValue="BCM" />
            </Field>
            <Field label="Tarif Efektif (IDR)" required>
              <Input name="rateIdr" type="number" min={0} placeholder="78500" required />
            </Field>
            <Field label="Alasan Selisih" className="sm:col-span-2" hint="Wajib diisi bila volume diajukan berbeda dari internal.">
              <Textarea name="varianceReason" rows={3} placeholder="mis. Koreksi bersama metode survey, volume di luar area kontrak…" />
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
    </div>
  )
}
