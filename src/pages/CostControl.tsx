import { useMemo, useState } from 'react'
import { AlertTriangle, Calculator, PiggyBank, Plus, TrendingDown, Wallet } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, idrFull, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { CostTransaction } from '../types'

const PATH = '/biaya'

const TYPE_TONE: Record<CostTransaction['costType'], 'emerald' | 'sky' | 'amber' | 'violet'> = {
  Actual: 'emerald',
  Committed: 'sky',
  Accrual: 'amber',
  Forecast: 'violet',
}

const TYPE_DESC: Record<CostTransaction['costType'], string> = {
  Actual: 'Sudah terjadi dan didukung dokumen — dipakai untuk laporan laba rugi.',
  Committed: 'Komitmen melalui PO atau kontrak, belum menjadi biaya aktual.',
  Accrual: 'Beban yang sudah menjadi kewajiban tetapi dokumennya belum lengkap.',
  Forecast: 'Perkiraan untuk perencanaan; tidak boleh dicampur dengan aktual.',
}

export default function CostControl() {
  const { state, actions, toast } = useERP()
  const { authority } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'transaksi' | 'proyek'>('transaksi')

  const columns = useMemo<Column<CostTransaction>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'period', header: 'Periode', sort: (r) => r.period, render: (r) => <span className="text-ink-muted">{r.period}</span> },
      {
        key: 'contract',
        header: 'Proyek',
        sort: (r) => r.contractId,
        render: (r) => <span className="text-ink">{state.projectContracts.find((c) => c.id === r.contractId)?.code ?? '-'}</span>,
      },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.category}</span> },
      { key: 'desc', header: 'Keterangan', render: (r) => <span className="max-w-[260px] truncate text-[11px] text-ink-faint">{r.description}</span> },
      {
        key: 'type',
        header: 'Jenis Biaya',
        sort: (r) => r.costType,
        render: (r) => (
          <Badge tone={TYPE_TONE[r.costType]} dot>
            {r.costType}
          </Badge>
        ),
      },
      { key: 'amount', header: 'Nilai', align: 'right', sort: (r) => r.amountIdr, render: (r) => <span className="tbl-num font-semibold text-ink">{idrFull(r.amountIdr)}</span> },
      { key: 'source', header: 'Sumber', sort: (r) => r.source, render: (r) => <span className="text-[11px] text-ink-faint">{r.source}</span> },
      { key: 'ref', header: 'Referensi', render: (r) => <span className="font-mono text-[10px] text-ink-faintest">{r.sourceRef ?? '—'}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={r.status === 'Posted' ? 'emerald' : r.status === 'Reconciled' ? 'sky' : 'zinc'} dot>{r.status}</Badge> },
    ],
    [state.projectContracts],
  )

  const totalCommitment = m.costActual + m.costCommitted
  const revenue = sum(m.byProject.filter((p) => p.revenue > 0).map((p) => p.revenue))
  const margin = revenue > 0 ? ((revenue - totalCommitment) / revenue) * 100 : 0

  const costPerUnit = m.actualThisMonth > 0 ? m.costActual / m.actualThisMonth : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Control & Profitabilitas"
        subtitle="Modul 13 — budget versus actual, biaya per BCM/ton/jam, komitmen PO, dan margin indikatif. Actual, committed, accrual, dan forecast ditampilkan terpisah agar tidak menyesatkan."
        actions={
          <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Transaksi Biaya
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Biaya Aktual" value={idrFull(m.costActual)} icon={<Wallet className="h-4 w-4" />} tone="rose" hint="Sudah terjadi & terdokumentasi" />
        <StatCard label="Komitmen PO" value={idrFull(m.costCommitted)} icon={<Calculator className="h-4 w-4" />} tone="amber" hint="Belum menjadi aktual" />
        <StatCard label="Accrual & Forecast" value={idrFull(m.costAccrual + m.costForecast)} icon={<TrendingDown className="h-4 w-4" />} tone="violet" hint="Beban & perkiraan" />
        <StatCard label="Margin Indikatif" value={pct1(margin)} icon={<PiggyBank className="h-4 w-4" />} tone={margin >= 0 ? 'emerald' : 'rose'} hint={`Pendapatan disetujui ${idrFull(revenue)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Jenis Biaya: Definisi" subtitle="Empat jenis biaya tidak boleh dijumlahkan sembarangan" />
          <div className="space-y-2.5 p-4 pt-0">
            {(Object.keys(TYPE_DESC) as Array<CostTransaction['costType']>).map((t) => (
              <div key={t} className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <div className="flex items-center justify-between">
                  <Badge tone={TYPE_TONE[t]} dot>
                    {t}
                  </Badge>
                  <span className="text-sm font-bold text-ink">
                    {idrFull(sum(state.costTransactions.filter((x) => x.costType === t && x.period === m.currentMonth).map((x) => x.amountIdr)))}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">{TYPE_DESC[t]}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Komposisi Biaya Bulan Ini" subtitle="Aktual + committed + accrual menurut kategori" />
          <div className="p-4 pt-0">
            <DonutChart data={m.costByCategory} height={250} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tren Biaya: Aktual vs Komitmen" subtitle="Selisih menunjukkan eksposur yang belum terwujud sebagai biaya" />
          <div className="p-4 pt-0">
            <BarsChart data={m.monthlyCost as unknown as Array<Record<string, string | number>>} xKey="label" series={[{ key: 'actual', name: 'Actual' }, { key: 'committed', name: 'Committed' }]} stacked height={250} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Biaya per Satuan Produksi" subtitle="Efisiensi biaya terhadap volume yang disetujui" />
          <div className="space-y-3 p-4 pt-0">
            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Biaya per BCM</p>
              <p className="mt-1.5 text-2xl font-bold text-ink">Rp {num(Math.round(costPerUnit))}</p>
              <p className="mt-1 text-[11px] text-ink-faint">Dihitung dari biaya aktual ÷ realisasi {num(m.actualThisMonth)} BCM</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Tarif kontrak rata-rata', idrFull(sum(m.byProject.map((p) => p.contract.rateIdr)) / Math.max(1, m.byProject.length))],
                ['Volume disetujui owner', `${num(m.recApproved)} BCM`],
                ['Selisih rekonsiliasi', `${num(m.recVariance)} BCM`],
                ['Proyek bermargin negatif', `${m.byProject.filter((p) => p.margin < 0).length} dari ${m.byProject.length}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['transaksi', 'Transaksi Biaya'],
              ['proyek', 'Margin per Proyek'],
            ] as Array<['transaksi' | 'proyek', string]>
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'transaksi' ? (
          <DataTable
            data={state.costTransactions}
            columns={columns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode, kategori, atau keterangan…"
            search={(r) => `${r.code} ${r.category} ${r.description} ${r.costType} ${r.source}`}
            initialSort={{ key: 'period', dir: 'desc' }}
            exportName="transaksi-biaya"
            pageSize={12}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Proyek</th>
                  <th className="text-right">Tarif</th>
                  <th className="text-right">Volume Disetujui</th>
                  <th className="text-right">Pendapatan</th>
                  <th className="text-right">Biaya Aktual</th>
                  <th className="text-right">Komitmen</th>
                  <th className="text-right">Margin Indikatif</th>
                </tr>
              </thead>
              <tbody>
                {m.byProject.map((p) => (
                  <tr key={p.contract.id}>
                    <td>
                      <p className="font-medium text-ink">{p.contract.name}</p>
                      <p className="text-[11px] text-ink-faint">{p.contract.code}</p>
                    </td>
                    <td className="tbl-num">{idrFull(p.contract.rateIdr)}</td>
                    <td className="tbl-num">{num(p.revenue > 0 ? p.volumeToDate : 0)}</td>
                    <td className="tbl-num">{idrFull(p.revenue)}</td>
                    <td className="tbl-num">{idrFull(p.costActual)}</td>
                    <td className="tbl-num">{idrFull(p.costCommitted)}</td>
                    <td className={cx('tbl-num font-semibold', p.margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{pct1(p.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Peringatan Varians" subtitle="Item yang perlu perhatian manajemen biaya" />
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { t: 'Konsumsi BBM unit eq-10', d: '18% di atas baseline unit sejenis — periksa efisiensi mesin atau kebocoran.', tone: 'rose' as const },
            { t: 'Biaya jasa perbaikan', d: 'Komitmen Rp 265 juta untuk overhaul pompa hidrolik belum menjadi aktual.', tone: 'amber' as const },
            { t: 'Mobilisasi Tahap 4', d: 'Perkiraan Rp 520 juta pada November — pastikan masuk rencana kas.', tone: 'violet' as const },
          ].map((w) => (
            <div key={w.t} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className={cx('mt-0.5 h-4 w-4 shrink-0', w.tone === 'rose' ? 'text-rose-400' : w.tone === 'amber' ? 'text-amber-400' : 'text-violet-400')} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{w.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{w.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Transaksi Biaya Baru" subtitle="Pilih jenis biaya dengan benar: Actual, Committed, Accrual, atau Forecast.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addCostTransaction({
              period: String(fd.get('period') ?? m.currentMonth),
              contractId: String(fd.get('contractId') ?? state.projectContracts[0]?.id),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              category: String(fd.get('category') ?? 'Lainnya') as CostTransaction['category'],
              description: String(fd.get('description') ?? ''),
              amountIdr: Number(fd.get('amountIdr') ?? 0),
              costType: String(fd.get('costType') ?? 'Actual') as CostTransaction['costType'],
              source: String(fd.get('source') ?? 'Manual') as CostTransaction['source'],
              sourceRef: String(fd.get('sourceRef') ?? '') || undefined,
            })
            setOpen(false)
            toast('Transaksi biaya dicatat.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proyek / Kontrak" required>
              <Select name="contractId" options={state.projectContracts.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
            </Field>
            <Field label="Periode" required>
              <Input name="period" type="month" defaultValue={m.currentMonth} required />
            </Field>
            <Field label="Kategori Biaya" required>
              <Select
                name="category"
                options={['BBM', 'Suku Cadang', 'Jasa Perbaikan', 'Tenaga Kerja', 'Sewa Alat', 'Mobilisasi', 'Vendor Pihak Ketiga', 'Lainnya']}
                defaultValue="Lainnya"
              />
            </Field>
            <Field label="Jenis Biaya" required hint={TYPE_DESC[String(fd_type()) as CostTransaction['costType']] ?? ''}>
              <Select name="costType" options={['Actual', 'Committed', 'Accrual', 'Forecast']} defaultValue="Actual" />
            </Field>
            <Field label="Nilai (IDR)" required>
              <Input name="amountIdr" type="number" min={0} placeholder="412500000" required />
            </Field>
            <Field label="Sumber Data" required>
              <Select name="source" options={['BBM', 'Warehouse', 'Purchase Order', 'Manual']} defaultValue="Manual" />
            </Field>
            <Field label="Referensi Sumber" hint="Nomor WO, PO, atau kode transaksi BBM.">
              <Input name="sourceRef" placeholder="PO-2026-0142" />
            </Field>
            <Field label="Keterangan" className="sm:col-span-2" required>
              <Textarea name="description" rows={3} placeholder="Uraian singkat transaksi biaya…" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Transaksi
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* helper kecil agar hint pada form tidak error saat render awal */
function fd_type() {
  return 'Actual'
}
