import { useMemo, useState } from 'react'
import {
  Banknote,
  Building,
  Coins,
  FileText,
  Landmark,
  Percent,
  PiggyBank,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { COMPANY } from '../data/seed'
import { useERP } from '../store'
import { useMetrics, monthLabel } from '../lib/metrics'
import { daysBetween, dmy, idr, idrFull, num, num1, pct1, sum, usd } from '../lib/format'
import type { Bill, BudgetLine, CapexProject, Invoice, JournalEntry, RoyaltyRecord } from '../types'

type TabId = 'ledger' | 'receivable' | 'payable' | 'budget' | 'capex' | 'tax'

export default function Finance() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('ledger')
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [capexOpen, setCapexOpen] = useState(false)

  const customerName = (id: string) => state.customers.find((c) => c.id === id)?.name ?? '-'
  const vendorName = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? '-'
  const siteCode = (id: string) => state.sites.find((s) => s.id === id)?.code ?? '-'

  /* ------------------------------- AR Aging ------------------------------ */
  const arAging = useMemo(() => {
    const buckets = [
      { label: 'Belum jatuh tempo', min: -9999, max: 0 },
      { label: '1–30 hari', min: 1, max: 30 },
      { label: '31–60 hari', min: 31, max: 60 },
      { label: '61–90 hari', min: 61, max: 90 },
      { label: '> 90 hari', min: 91, max: 99999 },
    ]
    return buckets.map((b) => {
      const rows = state.invoices.filter((i) => {
        if (i.status === 'Paid') return false
        const overdue = daysBetween(i.dueDate, '2026-10-15')
        return overdue >= b.min && overdue <= b.max
      })
      return {
        label: b.label,
        count: rows.length,
        amount: Math.round(sum(rows.map((r) => r.amountUsd))),
        tone: b.max <= 0 ? 'emerald' : b.max <= 30 ? 'sky' : b.max <= 60 ? 'amber' : 'rose',
      }
    })
  }, [state.invoices])

  const arAgingChart = arAging.map((a) => ({ label: a.label.replace('Belum jatuh tempo', 'Belum JT'), value: a.amount / 1_000_000 }))

  const apAging = useMemo(() => {
    const buckets = [
      { label: 'Belum jatuh tempo', min: -9999, max: 0 },
      { label: '1–30 hari', min: 1, max: 30 },
      { label: '31–60 hari', min: 31, max: 60 },
      { label: '> 60 hari', min: 61, max: 99999 },
    ]
    return buckets.map((b) => {
      const rows = state.bills.filter((i) => {
        if (i.status === 'Paid') return false
        const overdue = daysBetween(i.dueDate, '2026-10-15')
        return overdue >= b.min && overdue <= b.max
      })
      return { label: b.label, count: rows.length, amount: Math.round(sum(rows.map((r) => r.amountIdr))) }
    })
  }, [state.bills])

  /* ------------------------------- Columns ------------------------------- */
  const journalColumns: Column<JournalEntry>[] = [
    { key: 'journalNo', header: 'No. Jurnal', sort: (r) => r.journalNo, render: (r) => <span className="font-mono text-[12px] text-amber-400">{r.journalNo}</span> },
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-zinc-400">{dmy(r.date)}</span> },
    { key: 'module', header: 'Modul', sort: (r) => r.module, render: (r) => <Badge tone="neutral">{r.module}</Badge> },
    { key: 'account', header: 'Akun', sort: (r) => r.account, render: (r) => <span className="font-mono text-[12px] text-zinc-200">{r.account}</span> },
    { key: 'description', header: 'Keterangan', render: (r) => <span className="text-[12px] text-zinc-400">{r.description}</span> },
    { key: 'debit', header: 'Debit', align: 'right', sort: (r) => r.debit, render: (r) => <span className="font-mono text-emerald-400">{r.debit ? idr(r.debit) : '-'}</span> },
    { key: 'credit', header: 'Kredit', align: 'right', sort: (r) => r.credit, render: (r) => <span className="font-mono text-sky-400">{r.credit ? idr(r.credit) : '-'}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const invoiceColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', header: 'No. Invoice', sort: (r) => r.invoiceNo, render: (r) => <span className="font-mono text-[12px] font-medium text-amber-400">{r.invoiceNo}</span> },
    { key: 'taxInvoiceNo', header: 'Faktur Pajak', render: (r) => <span className="font-mono text-[11px] text-zinc-500">{r.taxInvoiceNo}</span> },
    { key: 'customerId', header: 'Pelanggan', sort: (r) => customerName(r.customerId), render: (r) => <span className="text-zinc-200">{customerName(r.customerId)}</span> },
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-zinc-400">{dmy(r.date)}</span> },
    {
      key: 'dueDate',
      header: 'Jatuh Tempo',
      sort: (r) => r.dueDate,
      render: (r) => {
        const od = daysBetween(r.dueDate, '2026-10-15')
        return (
          <div>
            <p className="text-zinc-300">{dmy(r.dueDate)}</p>
            {r.status !== 'Paid' && od > 0 && <p className="text-[11px] text-rose-400">Terlambat {od} hari</p>}
          </div>
        )
      },
    },
    { key: 'amountUsd', header: 'Nilai', align: 'right', sort: (r) => r.amountUsd, render: (r) => <span className="font-mono font-semibold text-emerald-400">{usd(r.amountUsd)}</span> },
    { key: 'amountIdr', header: 'Ekuivalen IDR', align: 'right', render: (r) => <span className="font-mono text-zinc-500">{idr(r.amountUsd * COMPANY.fx)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const billColumns: Column<Bill>[] = [
    { key: 'billNo', header: 'No. Tagihan', sort: (r) => r.billNo, render: (r) => <span className="font-mono text-[12px] font-medium text-amber-400">{r.billNo}</span> },
    { key: 'vendorId', header: 'Vendor', sort: (r) => vendorName(r.vendorId), render: (r) => <span className="text-zinc-200">{vendorName(r.vendorId)}</span> },
    { key: 'poId', header: 'Referensi PO', render: (r) => <span className="font-mono text-[11px] text-zinc-500">{state.purchaseOrders.find((p) => p.id === r.poId)?.poNo ?? '-'}</span> },
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-zinc-400">{dmy(r.date)}</span> },
    {
      key: 'dueDate',
      header: 'Jatuh Tempo',
      sort: (r) => r.dueDate,
      render: (r) => {
        const od = daysBetween(r.dueDate, '2026-10-15')
        return (
          <div>
            <p className="text-zinc-300">{dmy(r.dueDate)}</p>
            {r.status !== 'Paid' && od > 0 && <p className="text-[11px] text-rose-400">Terlambat {od} hari</p>}
          </div>
        )
      },
    },
    { key: 'amountIdr', header: 'Nilai', align: 'right', sort: (r) => r.amountIdr, render: (r) => <span className="font-mono font-semibold text-emerald-400">{idr(r.amountIdr)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const budgetColumns: Column<BudgetLine>[] = [
    { key: 'category', header: 'Kategori Biaya', sort: (r) => r.category, render: (r) => <span className="text-zinc-200">{r.category}</span> },
    { key: 'siteId', header: 'Site', sort: (r) => siteCode(r.siteId), render: (r) => <span className="chip">{siteCode(r.siteId)}</span> },
    { key: 'period', header: 'Periode', render: (r) => <span className="text-zinc-400">{r.period}</span> },
    { key: 'budgetIdr', header: 'Anggaran', align: 'right', sort: (r) => r.budgetIdr, render: (r) => <span className="font-mono">{idr(r.budgetIdr)}</span> },
    { key: 'actualIdr', header: 'Realisasi', align: 'right', sort: (r) => r.actualIdr, render: (r) => <span className="font-mono text-emerald-400">{idr(r.actualIdr)}</span> },
    {
      key: 'variance',
      header: 'Varians',
      align: 'right',
      sort: (r) => r.actualIdr - r.budgetIdr,
      render: (r) => {
        const v = r.actualIdr - r.budgetIdr
        return <span className={`font-mono ${v > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{v > 0 ? '+' : ''}{idr(v)}</span>
      },
    },
    {
      key: 'progress',
      header: 'Realisasi',
      render: (r) => (
        <div className="w-28">
          <Progress value={(r.actualIdr / r.budgetIdr) * 100} tone={r.actualIdr > r.budgetIdr ? 'rose' : r.actualIdr / r.budgetIdr > 0.9 ? 'amber' : 'emerald'} />
          <p className="mt-1 text-[10px] text-zinc-600">{pct1((r.actualIdr / r.budgetIdr) * 100)}</p>
        </div>
      ),
    },
  ]

  const capexColumns: Column<CapexProject>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-[12px] text-amber-400">{r.code}</span> },
    { key: 'name', header: 'Nama Proyek', sort: (r) => r.name, render: (r) => <span className="text-zinc-200">{r.name}</span> },
    { key: 'siteId', header: 'Site', sort: (r) => siteCode(r.siteId), render: (r) => <span className="chip">{siteCode(r.siteId)}</span> },
    { key: 'startDate', header: 'Mulai', sort: (r) => r.startDate, render: (r) => <span className="text-zinc-400">{dmy(r.startDate)}</span> },
    { key: 'endDate', header: 'Target Selesai', sort: (r) => r.endDate, render: (r) => <span className="text-zinc-400">{dmy(r.endDate)}</span> },
    { key: 'budgetIdr', header: 'Anggaran', align: 'right', sort: (r) => r.budgetIdr, render: (r) => <span className="font-mono">{idr(r.budgetIdr)}</span> },
    { key: 'spentIdr', header: 'Terpakai', align: 'right', sort: (r) => r.spentIdr, render: (r) => <span className="font-mono text-emerald-400">{idr(r.spentIdr)}</span> },
    {
      key: 'progress',
      header: 'Progres',
      render: (r) => (
        <div className="w-28">
          <Progress value={r.progressPct} tone={r.progressPct > 90 ? 'emerald' : 'amber'} />
          <p className="mt-1 text-[10px] text-zinc-600">{r.progressPct}%</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const royaltyColumns: Column<RoyaltyRecord>[] = [
    { key: 'period', header: 'Periode', sort: (r) => r.period, render: (r) => <span className="font-mono text-zinc-200">{monthLabel(r.period)}</span> },
    { key: 'siteId', header: 'Site', sort: (r) => siteCode(r.siteId), render: (r) => <span className="chip">{siteCode(r.siteId)}</span> },
    { key: 'volumeMt', header: 'Volume', align: 'right', sort: (r) => r.volumeMt, render: (r) => <span className="font-mono">{num(r.volumeMt)} MT</span> },
    { key: 'salesValueUsd', header: 'Nilai Penjualan', align: 'right', sort: (r) => r.salesValueUsd, render: (r) => <span className="font-mono">{usd(r.salesValueUsd)}</span> },
    { key: 'gcvBand', header: 'Band Kalori', render: (r) => <span className="text-[12px] text-zinc-400">{r.gcvBand}</span> },
    { key: 'ratePct', header: 'Tarif', align: 'right', sort: (r) => r.ratePct, render: (r) => <Badge tone="warning">{r.ratePct}%</Badge> },
    { key: 'royaltyUsd', header: 'Royalti PNBP', align: 'right', sort: (r) => r.royaltyUsd, render: (r) => <span className="font-mono font-semibold text-rose-400">{usd(r.royaltyUsd)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const budgetChart = [...state.budgets].sort((a, b) => b.budgetIdr - a.actualIdr).slice(0, 8).map((b) => ({
    label: b.category.split(' ')[0],
    budget: b.budgetIdr / 1e9,
    actual: b.actualIdr / 1e9,
  }))

  const totalDebit = sum(state.journals.map((j) => j.debit))
  const totalCredit = sum(state.journals.map((j) => j.credit))
  const capexTotal = sum(state.capex.map((c) => c.budgetIdr))
  const capexSpent = sum(state.capex.map((c) => c.spentIdr))

  return (
    <div>
      <PageHeader
        title="Keuangan & RKAB"
        subtitle="Buku besar, piutang dan utang usaha, realisasi RKAB, investasi modal, serta perhitungan royalti (PNBP) dan kewajiban pajak."
        actions={
          <>
            <Button variant="secondary" icon={<PiggyBank className="h-4 w-4" />} onClick={() => setCapexOpen(true)}>
              Proyek Investasi
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setBudgetOpen(true)}>
              Anggaran RKAB
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pendapatan Penjualan" value={usd(m.revenueTotal)} delta={m.revenueDelta} deltaLabel="MTD vs bulan lalu" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Realisasi RKAB" value={pct1(m.rkabPct)} hint={`${idr(m.actualTotal)} dari ${idr(m.budgetTotal)}`} icon={<Percent className="h-4 w-4" />} tone={m.rkabPct > 100 ? 'rose' : 'emerald'} />
        <StatCard label="Piutang Usaha" value={usd(m.arOutstanding)} hint={`${usd(m.arOverdue)} jatuh tempo`} icon={<Wallet className="h-4 w-4" />} tone={m.arOverdue > 0 ? 'rose' : 'emerald'} />
        <StatCard label="Utang Usaha" value={idr(m.apOutstanding)} hint={`${idr(m.apOverdue)} jatuh tempo`} icon={<Receipt className="h-4 w-4" />} tone={m.apOverdue > 0 ? 'rose' : 'violet'} />
        <StatCard label="Royalti PNBP YTD" value={usd(m.royaltyYtd)} hint={`Tarif ${m.royaltyRate.rate}% (${m.royaltyRate.band})`} icon={<Landmark className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'ledger', label: 'Buku Besar', count: state.journals.length },
            { id: 'receivable', label: 'Piutang (AR)', count: state.invoices.length },
            { id: 'payable', label: 'Utang (AP)', count: state.bills.length },
            { id: 'budget', label: 'RKAB & Anggaran', count: state.budgets.length },
            { id: 'capex', label: 'Investasi (CAPEX)', count: state.capex.length },
            { id: 'tax', label: 'Royalti & Pajak' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'ledger' && (
        <Card className="mt-4">
          <CardHeader
            title="Buku Besar & Jurnal Umum"
            subtitle="Entri jurnal otomatis dari modul penjualan, pengadaan, produksi, dan SDM"
            actions={
              <div className="flex gap-2">
                <Badge tone="emerald">Debit {idr(totalDebit)}</Badge>
                <Badge tone="info">Kredit {idr(totalCredit)}</Badge>
              </div>
            }
          />
          <DataTable
            data={state.journals}
            columns={journalColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.journalNo} ${r.account} ${r.description} ${r.module} ${r.status}`}
            searchPlaceholder="Cari nomor jurnal, akun, keterangan…"
            exportName="buku-besar"
            initialSort={{ key: 'journalNo', dir: 'desc' }}
          />
        </Card>
      )}

      {tab === 'receivable' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Analisis Umur Piutang"
              subtitle="Distribusi outstanding piutang berdasarkan umur jatuh tempo (juta USD)"
              actions={<Badge tone="danger">{usd(m.arOverdue)} terlambat</Badge>}
            >
              <BarsChart
                data={arAgingChart}
                xKey="label"
                series={[{ key: 'value', name: 'Outstanding (Jt USD)', color: '#f59e0b' }]}
                valueFormatter={(v) => `${num1(v)} Jt USD`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Ringkasan Piutang" subtitle="Eksposur piutang usaha" icon={<Wallet className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {arAging.map((a) => (
                  <div key={a.label} className="flex items-center justify-between border-b border-zinc-800 pb-2.5 last:border-0">
                    <span className="text-xs text-zinc-400">{a.label}</span>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-semibold ${a.tone === 'rose' ? 'text-rose-400' : a.tone === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>{usd(a.amount)}</p>
                      <p className="text-[10px] text-zinc-600">{a.count} invoice</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Total Outstanding</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{usd(m.arOutstanding)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">Ekuivalen {idr(m.arOutstanding * COMPANY.fx)}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Daftar Invoice Penjualan" subtitle="Faktur penjualan domestik dan ekspor beserta status pembayaran" />
            <DataTable
              data={state.invoices}
              columns={invoiceColumns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.invoiceNo} ${customerName(r.customerId)} ${r.status}`}
              searchPlaceholder="Cari invoice, pelanggan…"
              exportName="faktur-penjualan"
              initialSort={{ key: 'invoiceNo', dir: 'desc' }}
            />
          </Card>
        </div>
      )}

      {tab === 'payable' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Analisis Umur Utang"
              subtitle="Distribusi outstanding utang usaha (miliar rupiah)"
              actions={<Badge tone={m.apOverdue > 0 ? 'danger' : 'success'}>{idr(m.apOverdue)} terlambat</Badge>}
            >
              <BarsChart
                data={apAging.map((a) => ({ label: a.label.replace('Belum jatuh tempo', 'Belum JT'), value: a.amount / 1e9 }))}
                xKey="label"
                series={[{ key: 'value', name: 'Outstanding (Rp M)', color: '#a78bfa' }]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Ringkasan Utang" subtitle="Eksposur utang usaha" icon={<Receipt className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {apAging.map((a) => (
                  <div key={a.label} className="flex items-center justify-between border-b border-zinc-800 pb-2.5 last:border-0">
                    <span className="text-xs text-zinc-400">{a.label}</span>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-zinc-100">{idr(a.amount)}</p>
                      <p className="text-[10px] text-zinc-600">{a.count} tagihan</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Total Utang</span>
                    <span className="font-mono text-sm font-bold text-violet-400">{idr(m.apOutstanding)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">{num(m.poPending)} PO menunggu persetujuan</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Daftar Tagihan Vendor" subtitle="Faktur dari vendor barang dan jasa operasional" />
            <DataTable
              data={state.bills}
              columns={billColumns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.billNo} ${vendorName(r.vendorId)} ${r.status}`}
              searchPlaceholder="Cari tagihan, vendor…"
              exportName="tagihan-vendor"
              initialSort={{ key: 'billNo', dir: 'desc' }}
            />
          </Card>
        </div>
      )}

      {tab === 'budget' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Anggaran vs Realisasi RKAB"
              subtitle="Perbandingan pagu anggaran dan realisasi biaya per kategori (miliar rupiah)"
              actions={<Badge tone={m.rkabPct > 100 ? 'danger' : 'emerald'}>{pct1(m.rkabPct)} realisasi</Badge>}
            >
              <BarsChart
                data={budgetChart}
                xKey="label"
                series={[
                  { key: 'budget', name: 'Anggaran (Rp M)', color: '#3f3f46' },
                  { key: 'actual', name: 'Realisasi (Rp M)', color: '#34d399' },
                ]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Realisasi RKAB 2026" subtitle="Akumulasi terhadap pagu tahunan" icon={<Percent className="h-4 w-4" />} />
              <div className="space-y-5 p-5">
                <div>
                  <Progress value={m.rkabPct} tone={m.rkabPct > 100 ? 'rose' : 'emerald'} label="Biaya operasional" />
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    {idr(m.actualTotal)} dari {idr(m.budgetTotal)}
                  </p>
                </div>
                <div>
                  <Progress value={82.6} tone="amber" label="Biaya produksi" />
                  <p className="mt-1.5 text-[11px] text-zinc-600">Rp 1,42 T dari Rp 1,72 T</p>
                </div>
                <div>
                  <Progress value={64.1} tone="sky" label="Investasi CAPEX" />
                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    {idr(capexSpent)} dari {idr(capexTotal)}
                  </p>
                </div>
                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  {[
                    { label: 'Selisih (hemat)', value: idr(m.budgetTotal - m.actualTotal), tone: 'text-emerald-400' },
                    { label: 'Kategori terbesar', value: 'Jasa Kontraktor', tone: 'text-zinc-200' },
                    { label: 'Deviasi tertinggi', value: 'Tyres & Ban (+7,4%)', tone: 'text-rose-400' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className={`font-mono font-semibold ${r.tone}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Detail Anggaran RKAB"
              subtitle="Pagu anggaran, realisasi, dan varians per kategori biaya"
              actions={<Badge tone="neutral">{state.budgets.length} kategori</Badge>}
            />
            <DataTable
              data={state.budgets}
              columns={budgetColumns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.category} ${r.period} ${siteCode(r.siteId)}`}
              searchPlaceholder="Cari kategori biaya…"
              exportName="rkab-2026"
              initialSort={{ key: 'budgetIdr', dir: 'desc' }}
            />
          </Card>
        </div>
      )}

      {tab === 'capex' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Anggaran CAPEX" value={idr(capexTotal)} hint={`${state.capex.length} proyek investasi`} icon={<Building className="h-4 w-4" />} tone="violet" />
            <StatCard label="Realisasi" value={idr(capexSpent)} hint={`${pct1((capexSpent / capexTotal) * 100)} dari pagu`} icon={<Coins className="h-4 w-4" />} tone="emerald" />
            <StatCard label="Proyek Berjalan" value={num(state.capex.filter((c) => c.status === 'Ongoing').length)} unit="proyek" hint="Dalam eksekusi" icon={<TrendingUp className="h-4 w-4" />} tone="sky" />
            <StatCard label="Sisa Pagu" value={idr(capexTotal - capexSpent)} hint="Belum terealisasi" icon={<Banknote className="h-4 w-4" />} tone="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Progres Investasi per Proyek"
              subtitle="Realisasi biaya dibanding pagu anggaran (miliar rupiah)"
            >
              <BarsChart
                data={state.capex.map((c) => ({ label: c.code.replace('CX-2026-', ''), budget: c.budgetIdr / 1e9, spent: c.spentIdr / 1e9 }))}
                xKey="label"
                series={[
                  { key: 'budget', name: 'Anggaran (Rp M)', color: '#3f3f46' },
                  { key: 'spent', name: 'Terpakai (Rp M)', color: '#a78bfa' },
                ]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <ChartFrame title="Status Proyek" subtitle="Sebaran proyek berdasarkan status eksekusi">
              <DonutChart
                data={(['Planning', 'Ongoing', 'Completed', 'On Hold'] as const).map((s) => ({
                  name: s,
                  value: state.capex.filter((c) => c.status === s).length,
                  color: s === 'Ongoing' ? '#f59e0b' : s === 'Completed' ? '#34d399' : s === 'Planning' ? '#38bdf8' : '#fb7185',
                }))}
                centerValue={num(state.capex.length)}
                centerLabel="Total proyek"
                height={240}
              />
            </ChartFrame>
          </div>

          <Card>
            <CardHeader title="Daftar Proyek Investasi" subtitle="Proyek CAPEX infrastruktur, armada, dan fasilitas pendukung tambang" />
            <DataTable
              data={state.capex}
              columns={capexColumns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.code} ${r.name} ${r.status}`}
              searchPlaceholder="Cari proyek…"
              exportName="proyek-investasi"
            />
          </Card>
        </div>
      )}

      {tab === 'tax' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Realisasi Royalti (PNBP)"
              subtitle="Kewajiban royalti bulanan berdasarkan nilai penjualan (juta USD)"
              actions={<Badge tone="rose">Total {usd(m.royaltyYtd)}</Badge>}
            >
              <TrendChart
                data={state.royalties.map((r) => ({ label: monthLabel(r.period), royalty: r.royaltyUsd / 1_000_000, volume: r.volumeMt / 1000 }))}
                xKey="label"
                series={[
                  { key: 'royalty', name: 'Royalti (Jt USD)', color: '#fb7185' },
                  { key: 'volume', name: 'Volume (Rb MT)', color: '#38bdf8', type: 'line' },
                ]}
                valueFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Struktur Tarif Royalti" subtitle="Berdasarkan PP No. 9/2010 jo. PP No. 1/2017" icon={<Landmark className="h-4 w-4" />} />
              <div className="divide-y divide-zinc-800">
                {[
                  { band: 'GAR > 5.200', rate: 4 },
                  { band: 'GAR 4.201 – 5.200', rate: 5 },
                  { band: 'GAR 3.401 – 4.200', rate: 6 },
                  { band: 'GAR 3.101 – 3.400', rate: 7 },
                  { band: 'GAR 2.101 – 3.100', rate: 8 },
                  { band: 'GAR ≤ 2.100', rate: 9 },
                ].map((r) => (
                  <div key={r.band} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-[12px] text-zinc-400">{r.band}</span>
                    <Badge tone={m.royaltyRate.band === r.band ? 'amber' : 'neutral'}>{r.rate}%</Badge>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 p-4">
                <p className="text-[11px] text-zinc-500">Tarif berlaku periode berjalan</p>
                <p className="mt-1 text-sm font-semibold text-amber-400">
                  {m.royaltyRate.band} &middot; {m.royaltyRate.rate}%
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">Rata-rata GCV bulan ini {num(m.avgGcv)} kcal/kg</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader title="Kewajiban Pajak" subtitle="Akumulasi kewajiban fiskal perusahaan" icon={<FileText className="h-4 w-4" />} />
              <div className="space-y-3 p-5">
                {[
                  { label: 'PPh Final 22 Ekspor', value: usd(m.revenueTotal * 0.03) },
                  { label: 'PPN Penjualan', value: idr(m.revenueTotal * 15850 * 0.011) },
                  { label: 'PPh 21/26 Karyawan', value: idr(18_600_000_000) },
                  { label: 'PBB & Retribusi', value: idr(4_200_000_000) },
                  { label: 'Bea Masuk Alat Berat', value: idr(6_800_000_000) },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-zinc-800 pb-2.5 last:border-0">
                    <span className="text-xs text-zinc-400">{r.label}</span>
                    <span className="font-mono text-sm font-semibold text-zinc-100">{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader title="Realisasi Royalti per Periode" subtitle="Perhitungan PNBP berdasarkan volume, nilai penjualan, dan tarif kalori" />
              <DataTable
                data={state.royalties}
                columns={royaltyColumns}
                rowKey={(r) => r.id}
                pageSize={10}
                search={(r) => `${r.period} ${r.gcvBand} ${r.status}`}
                searchPlaceholder="Cari periode, band kalori…"
                exportName="royalti-pnbp"
                initialSort={{ key: 'period', dir: 'desc' }}
              />
            </Card>
          </div>
        </div>
      )}

      <SectionTitle title="Ringkasan Keuangan" subtitle="Indikator posisi dan kinerja keuangan perusahaan" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Debit Jurnal', value: idr(totalDebit), sub: `${state.journals.length} entri tercatat`, tone: 'text-emerald-400', icon: FileText },
          { label: 'Total Kredit Jurnal', value: idr(totalCredit), sub: 'Balanced entry control', tone: 'text-sky-400', icon: FileText },
          { label: 'Arus Kas Bersih', value: usd(18_400_000), sub: 'Operasional + investasi', tone: 'text-amber-400', icon: Banknote },
          { label: 'Rasio Likuiditas', value: '2,14x', sub: 'Aset lancar : kewajiban lancar', tone: 'text-violet-400', icon: Coins },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-800/60 text-zinc-400">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">{s.label}</p>
                <p className={`mt-1 font-mono text-xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-[11px] text-zinc-600">{s.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <BudgetForm open={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <CapexForm open={capexOpen} onClose={() => setCapexOpen(false)} />
    </div>
  )
}

function BudgetForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    category: '',
    siteId: state.sites[0]?.id ?? '',
    budgetIdr: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Anggaran RKAB"
      subtitle="Pendaftaran pagu anggaran biaya operasional tahunan"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Percent className="h-4 w-4" />}
            onClick={() => {
              if (!form.category || !form.budgetIdr) {
                toast('Kategori dan nilai anggaran wajib diisi', 'warning')
                return
              }
              actions.addBudget({
                category: form.category,
                siteId: form.siteId,
                period: 'RKAB 2026',
                budgetIdr: Number(form.budgetIdr),
                actualIdr: 0,
              })
              setForm({ ...form, category: '', budgetIdr: '' })
              onClose()
            }}
          >
            Simpan Anggaran
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kategori Biaya" required className="sm:col-span-2">
          <Input placeholder="contoh: Biaya Studi Kelayakan" value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Site">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Nilai Anggaran (Rp)" required>
          <Input type="number" min={0} placeholder="contoh: 150000000000" value={form.budgetIdr} onChange={(e) => set('budgetIdr', e.target.value)} />
        </Field>
        <Field label="Catatan" className="sm:col-span-2">
          <Textarea placeholder="Dasar perhitungan anggaran, asumsi volume, atau referensi harga…" />
        </Field>
      </div>
    </Modal>
  )
}

function CapexForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    code: '',
    name: '',
    siteId: state.sites[0]?.id ?? '',
    startDate: '2026-11-01',
    endDate: '2027-10-31',
    budgetIdr: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Proyek Investasi Baru"
      subtitle="Pendaftaran proyek capital expenditure infrastruktur atau armada"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Building className="h-4 w-4" />}
            onClick={() => {
              if (!form.name || !form.budgetIdr) {
                toast('Nama proyek dan anggaran wajib diisi', 'warning')
                return
              }
              actions.addCapex({
                code: form.code || `CX-2026-${String(Math.floor(Math.random() * 90) + 10)}`,
                name: form.name,
                siteId: form.siteId,
                startDate: form.startDate,
                endDate: form.endDate,
                budgetIdr: Number(form.budgetIdr),
                spentIdr: 0,
                progressPct: 0,
                status: 'Planning',
              })
              setForm({ ...form, code: '', name: '', budgetIdr: '' })
              onClose()
            }}
          >
            Simpan Proyek
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kode Proyek" hint="Kosongkan untuk generate otomatis">
          <Input placeholder="CX-2026-XX" value={form.code} onChange={(e) => set('code', e.target.value)} />
        </Field>
        <Field label="Nama Proyek" required>
          <Input placeholder="Nama proyek investasi" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Site">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Anggaran (Rp)" required>
          <Input type="number" min={0} placeholder="contoh: 250000000000" value={form.budgetIdr} onChange={(e) => set('budgetIdr', e.target.value)} />
        </Field>
        <Field label="Tanggal Mulai">
          <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Target Selesai">
          <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </Field>
        <Field label="Deskripsi Proyek" className="sm:col-span-2">
          <Textarea placeholder="Ruang lingkup pekerjaan, deliverable, dan pertimbangan investasi…" />
        </Field>
      </div>
    </Modal>
  )
}
