import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Building2,
  ClipboardList,
  FileSignature,
  Globe2,
  Handshake,
  Plus,
  Ship,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart, TrendChart } from '../components/charts'
import { useERP } from '../store'
import { ActionButton } from '../auth/ActionButton'
import { useMetrics } from '../lib/metrics'
import { dmy, mtShort, num, num1, pct1, sum, usd, usdToIdr } from '../lib/format'
import type { Contract, Customer, SalesOrder } from '../types'

type TabId = 'orders' | 'contracts' | 'customers' | 'analytics'

const NEXT_STATUS: Partial<Record<SalesOrder['status'], SalesOrder['status']>> = {
  Draft: 'Confirmed',
  Confirmed: 'Loading',
  Loading: 'Loaded',
  Loaded: 'Shipped',
  Shipped: 'Invoiced',
  Invoiced: 'Paid',
}

export default function Sales() {
  const { state, actions } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('orders')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [detail, setDetail] = useState<SalesOrder | null>(null)

  const customerName = (id: string) => state.customers.find((c) => c.id === id)?.name ?? '-'
  const customerType = (id: string) => state.customers.find((c) => c.id === id)?.type ?? '-'
  const contractCode = (id: string) => state.contracts.find((c) => c.id === id)?.code ?? '-'
  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? '-'
  const soValue = (s: SalesOrder) => s.tonnageMt * s.priceUsdPerMt

  const filtered = useMemo(
    () =>
      state.salesOrders.filter(
        (s) =>
          (statusFilter === 'all' || s.status === statusFilter) &&
          (typeFilter === 'all' || customerType(s.customerId) === typeFilter),
      ),
    [state.salesOrders, statusFilter, typeFilter, state.customers],
  )

  const soColumns: Column<SalesOrder>[] = [
    {
      key: 'soNo',
      header: 'No. Sales Order',
      sort: (r) => r.soNo,
      render: (r) => (
        <div>
          <p className="font-mono text-[13px] font-medium text-amber-400">{r.soNo}</p>
          <p className="text-[11px] text-ink-faintest">{dmy(r.date)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      sort: (r) => customerName(r.customerId),
      render: (r) => (
        <div>
          <p className="text-[13px] text-ink">{customerName(r.customerId)}</p>
          <p className="text-[11px] text-ink-faintest">{contractCode(r.contractId)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      sort: (r) => customerType(r.customerId),
      render: (r) => <Badge tone={customerType(r.customerId) === 'Export' ? 'info' : 'neutral'}>{customerType(r.customerId)}</Badge>,
    },
    { key: 'siteId', header: 'Site Muat', sort: (r) => siteName(r.siteId), render: (r) => <span className="text-ink-muted">{siteName(r.siteId)}</span> },
    { key: 'tonnageMt', header: 'Tonase', align: 'right', sort: (r) => r.tonnageMt, render: (r) => <span className="font-mono text-ink-strong">{num(r.tonnageMt)} MT</span> },
    { key: 'priceUsdPerMt', header: 'Harga', align: 'right', sort: (r) => r.priceUsdPerMt, render: (r) => <span className="font-mono">USD {num1(r.priceUsdPerMt)}</span> },
    { key: 'value', header: 'Nilai', align: 'right', sort: soValue, render: (r) => <span className="font-mono font-semibold text-emerald-400">{usd(soValue(r))}</span> },
    {
      key: 'vesselBarge',
      header: 'Vessel / Barge',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Ship className="h-3.5 w-3.5 text-ink-faintest" />
          <span className="text-ink">{r.vesselBarge}</span>
        </div>
      ),
    },
    { key: 'coaGcv', header: 'GCV CoA', align: 'right', sort: (r) => r.coaGcv, render: (r) => <span className="font-mono text-sky-400">{num(r.coaGcv)}</span> },
    { key: 'surveyor', header: 'Surveyor', render: (r) => <span className="text-ink-muted">{r.surveyor}</span> },
    { key: 'eta', header: 'ETA', sort: (r) => r.eta, render: (r) => <span className="text-ink-muted">{dmy(r.eta)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const contractColumns: Column<Contract>[] = [
    { key: 'code', header: 'No. Kontrak', sort: (r) => r.code, render: (r) => <span className="font-mono text-[13px] font-medium text-amber-400">{r.code}</span> },
    { key: 'customer', header: 'Pelanggan', sort: (r) => customerName(r.customerId), render: (r) => <span className="text-ink">{customerName(r.customerId)}</span> },
    { key: 'type', header: 'Tipe', sort: (r) => r.type, render: (r) => <Badge tone={r.type === 'Export' ? 'info' : 'neutral'}>{r.type}</Badge> },
    { key: 'period', header: 'Periode', render: (r) => <span className="text-ink-muted">{dmy(r.startDate)} — {dmy(r.endDate)}</span> },
    { key: 'volumeMt', header: 'Volume', align: 'right', sort: (r) => r.volumeMt, render: (r) => <span className="font-mono">{num(r.volumeMt)} MT</span> },
    { key: 'liftedMt', header: 'Terlaksana', align: 'right', sort: (r) => r.liftedMt, render: (r) => <span className="font-mono text-emerald-400">{num(r.liftedMt)} MT</span> },
    {
      key: 'progress',
      header: 'Progress',
      render: (r) => (
        <div className="w-32">
          <Progress value={(r.liftedMt / r.volumeMt) * 100} tone={(r.liftedMt / r.volumeMt) > 0.85 ? 'emerald' : 'amber'} />
          <p className="mt-1 text-[10px] text-ink-faintest">{pct1((r.liftedMt / r.volumeMt) * 100)}</p>
        </div>
      ),
    },
    { key: 'priceUsdPerMt', header: 'Harga', align: 'right', sort: (r) => r.priceUsdPerMt, render: (r) => <span className="font-mono">USD {num1(r.priceUsdPerMt)}</span> },
    { key: 'qualitySpec', header: 'Spesifikasi', render: (r) => <span className="text-ink-muted">{r.qualitySpec}</span> },
    { key: 'incoterm', header: 'Incoterm', render: (r) => <span className="chip">{r.incoterm}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const customerColumns: Column<Customer>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-[13px] text-amber-400">{r.code}</span> },
    { key: 'name', header: 'Nama Pelanggan', sort: (r) => r.name, render: (r) => <span className="font-medium text-ink-strong">{r.name}</span> },
    { key: 'sector', header: 'Sektor', sort: (r) => r.sector, render: (r) => <span className="text-ink-muted">{r.sector}</span> },
    { key: 'type', header: 'Tipe', sort: (r) => r.type, render: (r) => <Badge tone={r.type === 'Export' ? 'info' : 'neutral'}>{r.type}</Badge> },
    { key: 'city', header: 'Lokasi', render: (r) => <span className="text-ink-muted">{r.city}</span> },
    { key: 'contact', header: 'Kontak', render: (r) => <span className="text-[12px] text-ink-faint">{r.contact}</span> },
    { key: 'creditLimitIdr', header: 'Limit Kredit', align: 'right', sort: (r) => r.creditLimitIdr, render: (r) => <span className="font-mono">Rp {num(r.creditLimitIdr / 1e9)} M</span> },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sort: (r) => r.outstandingIdr,
      render: (r) => (
        <div>
          <p className="font-mono text-ink">Rp {num(r.outstandingIdr / 1e9)} M</p>
          <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${r.outstandingIdr / r.creditLimitIdr > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (r.outstandingIdr / r.creditLimitIdr) * 100)}%` }} />
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const revenueByCustomer = m.byCustomer.slice(0, 8).map((c) => ({ label: c.customer.name.split(' ').slice(0, 2).join(' '), revenue: c.revenue / 1_000_000 }))
  const sectorMix = Object.entries(
    state.customers.reduce<Record<string, number>>((acc, c) => {
      acc[c.sector] = (acc[c.sector] ?? 0) + (m.byCustomer.find((b) => b.customer.id === c.id)?.revenue ?? 0)
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value: Math.round(value) }))

  const totalSold = sum(state.salesOrders.filter((s) => !['Draft', 'Cancelled'].includes(s.status)).map((s) => s.tonnageMt))
  const activeSO = state.salesOrders.filter((s) => ['Confirmed', 'Loading', 'Loaded', 'Shipped'].includes(s.status)).length

  return (
    <div>
      <PageHeader
        title="Penjualan & Kontrak"
        subtitle="Manajemen order penjualan, kontrak jual beli batubara domestik dan ekspor, sertifikasi mutu (CoA), serta monitoring piutang pelanggan."
        actions={
          <>
            <Button variant="secondary" icon={<Handshake className="h-4 w-4" />} onClick={() => setCustomerOpen(true)}>
              Pelanggan Baru
            </Button>
            <Button variant="secondary" icon={<FileSignature className="h-4 w-4" />} onClick={() => setContractOpen(true)}>
              Kontrak Baru
            </Button>
            <ActionButton action="sales.create" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Sales Order
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Nilai Penjualan Total" value={usd(m.revenueTotal)} delta={m.revenueDelta} deltaLabel="MTD vs bulan lalu" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Volume Terjual" value={mtShort(totalSold)} hint={`${num(state.salesOrders.length)} sales order`} icon={<Ship className="h-4 w-4" />} tone="sky" />
        <StatCard label="SO Dalam Proses" value={num(activeSO)} unit="order" hint="Confirmed → Shipped" icon={<ClipboardList className="h-4 w-4" />} tone="violet" />
        <StatCard label="Piutang Outstanding" value={usd(m.arOutstanding)} hint={`${usd(m.arOverdue)} jatuh tempo`} icon={<Award className="h-4 w-4" />} tone={m.arOverdue > 0 ? 'rose' : 'emerald'} />
        <StatCard label="Kontrak Aktif" value={num(state.contracts.filter((c) => c.status === 'Active').length)} unit="kontrak" hint={`${mtShort(m.contractVolume)} total volume`} icon={<FileSignature className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'orders', label: 'Sales Order', count: filtered.length },
            { id: 'contracts', label: 'Kontrak', count: state.contracts.length },
            { id: 'customers', label: 'Pelanggan', count: state.customers.length },
            { id: 'analytics', label: 'Analitik Penjualan' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'orders' && (
        <Card className="mt-4">
          <CardHeader
            title="Daftar Sales Order"
            subtitle="Alur status: Draft → Confirmed → Loading → Loaded → Shipped → Invoiced → Paid"
            actions={
              <>
                <Select
                  options={['all', 'Draft', 'Confirmed', 'Loading', 'Loaded', 'Shipped', 'Invoiced', 'Paid', 'Cancelled'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Status' : v }))}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="!h-8 !w-36 !text-xs"
                />
                <Select
                  options={[{ value: 'all', label: 'Semua Tipe' }, { value: 'Domestic', label: 'Domestic' }, { value: 'Export', label: 'Ekspor' }]}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="!h-8 !w-32 !text-xs"
                />
              </>
            }
          />
          <DataTable
            data={filtered}
            columns={soColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.soNo} ${customerName(r.customerId)} ${r.vesselBarge} ${r.surveyor} ${r.status}`}
            searchPlaceholder="Cari nomor SO, pelanggan, vessel…"
            exportName="sales-order"
            initialSort={{ key: 'soNo', dir: 'desc' }}
            onRowClick={setDetail}
            actions={(r) => {
              const next = NEXT_STATUS[r.status]
              return next ? (
                <ActionButton action="sales.approve" size="sm" variant="outline" onClick={() => actions.setSalesOrderStatus(r.id, next)}>
                  → {next}
                </ActionButton>
              ) : (
                <Badge tone={r.status === 'Cancelled' ? 'danger' : 'success'}>{r.status}</Badge>
              )
            }}
          />
        </Card>
      )}

      {tab === 'contracts' && (
        <Card className="mt-4">
          <CardHeader title="Kontrak Penjualan Batubara" subtitle="Kontrak jual beli dengan pelanggan domestik dan ekspor beserta realisasi volume" />
          <DataTable
            data={state.contracts}
            columns={contractColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.code} ${customerName(r.customerId)} ${r.qualitySpec} ${r.status}`}
            searchPlaceholder="Cari kontrak, pelanggan, spesifikasi…"
            exportName="kontrak-penjualan"
          />
        </Card>
      )}

      {tab === 'customers' && (
        <Card className="mt-4">
          <CardHeader title="Master Pelanggan" subtitle="Data pelanggan, limit kredit, dan eksposur piutang" actions={<Link to="/finance" className="btn btn-ghost btn-sm">Lihat aging piutang</Link>} />
          <DataTable
            data={state.customers}
            columns={customerColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.code} ${r.name} ${r.sector} ${r.city}`}
            searchPlaceholder="Cari pelanggan…"
            exportName="master-pelanggan"
          />
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Tren Penjualan Bulanan"
              subtitle="Nilai penjualan (juta USD) dan tonase terjual per bulan"
              actions={<Badge tone="emerald">YTD {usd(m.revenueTotal)}</Badge>}
            >
              <TrendChart
                data={m.revenueByMonth.map((r) => ({ label: r.label, revenue: r.revenue / 1_000_000, tonnage: r.tonnage / 1000 }))}
                xKey="label"
                series={[
                  { key: 'revenue', name: 'Nilai (Jt USD)', color: '#34d399' },
                  { key: 'tonnage', name: 'Tonase (Rb MT)', color: '#38bdf8', type: 'line' },
                ]}
                valueFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <ChartFrame title="Komposisi per Sektor" subtitle="Kontribusi pendapatan berdasarkan sektor pelanggan">
              <DonutChart
                data={sectorMix}
                valueFormatter={(v) => usd(v)}
                centerValue={usd(m.revenueTotal)}
                centerLabel="Total penjualan"
                height={240}
              />
            </ChartFrame>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame
              className="xl:col-span-2"
              title="Kontribusi Pelanggan"
              subtitle="Nilai kontrak terlaksana per pelanggan (juta USD)"
            >
              <BarsChart
                data={revenueByCustomer}
                xKey="label"
                series={[{ key: 'revenue', name: 'Nilai (Jt USD)', color: '#f59e0b' }]}
                valueFormatter={(v) => `${num1(v)} Jt USD`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <Card>
              <CardHeader title="Performa Kontrak" subtitle="Realisasi volume terhadap komitmen kontrak" icon={<FileSignature className="h-4 w-4" />} />
              <div className="space-y-4 p-5">
                {state.contracts.slice(0, 6).map((c) => (
                  <div key={c.id}>
                    <Progress value={(c.liftedMt / c.volumeMt) * 100} tone={(c.liftedMt / c.volumeMt) > 0.8 ? 'emerald' : 'amber'} label={`${c.code} · ${customerName(c.customerId).split(' ').slice(0, 2).join(' ')}`} />
                    <p className="mt-1 text-[11px] text-ink-faintest">
                      {num(c.liftedMt)} / {num(c.volumeMt)} MT &middot; berakhir {dmy(c.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <SectionTitle title="Ringkasan Komersial" subtitle="Indikator kinerja penjualan dan eksposur pelanggan" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Domestik vs Ekspor" subtitle="Nilai penjualan berdasarkan pasar" icon={<Globe2 className="h-4 w-4" />} />
          <div className="space-y-4 p-5">
            {[
              { label: 'Domestik', value: m.domesticRevenue, tone: 'bg-amber-500', pct: (m.domesticRevenue / m.revenueTotal) * 100 },
              { label: 'Ekspor', value: m.exportRevenue, tone: 'bg-sky-500', pct: (m.exportRevenue / m.revenueTotal) * 100 },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xs text-ink-muted">{r.label}</span>
                  <span className="font-mono text-sm font-semibold text-ink-strong">{usd(r.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-ink-faintest">{pct1(r.pct)} dari total penjualan</p>
              </div>
            ))}
            <div className="rounded-lg border border-line bg-surface-2/50 p-3 text-[11px] leading-relaxed text-ink-faint">
              Penjualan ekspor memerlukan Certificate of Analysis (CoA) dari surveyor independen (SGS/Cointeste) serta pemenuhan regulasi Denda Diri (DD) dan Denda Ekspor (EE).
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Eksposur Pelanggan" subtitle="Total outstanding terhadap limit kredit" icon={<Users className="h-4 w-4" />} />
          <div className="space-y-3 p-5">
            {state.customers
              .filter((c) => c.outstandingIdr > 0)
              .sort((a, b) => b.outstandingIdr / b.creditLimitIdr - a.outstandingIdr / a.creditLimitIdr)
              .slice(0, 6)
              .map((c) => {
                const p = (c.outstandingIdr / c.creditLimitIdr) * 100
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="truncate text-ink-muted">{c.name}</span>
                      <span className={`font-mono ${p > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{pct1(p)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${p > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, p)}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Status Pengiriman" subtitle="Sebaran sales order berdasarkan tahapan" icon={<Ship className="h-4 w-4" />} />
          <div className="space-y-2 p-5">
            {(['Draft', 'Confirmed', 'Loading', 'Loaded', 'Shipped', 'Invoiced', 'Paid'] as const).map((st) => {
              const c = state.salesOrders.filter((s) => s.status === st).length
              return (
                <div key={st} className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-ink-muted">{st}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(c / state.salesOrders.length) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-ink">{c}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Indikator Komersial" subtitle="Metrik kunci performa penjualan" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              { label: 'Rata-rata harga', value: `USD ${num1(totalSold ? m.revenueTotal / totalSold : 0)}/MT` },
              { label: 'Volume per SO', value: mtShort(totalSold / Math.max(state.salesOrders.length, 1)) },
              { label: 'Kontrak aktif', value: num(state.contracts.filter((c) => c.status === 'Active').length) },
              { label: 'Akan berakhir', value: num(state.contracts.filter((c) => c.status === 'Expiring').length) },
              { label: 'Piutang (IDR)', value: `Rp ${num((m.arOutstanding * 15850) / 1e9)} M` },
              { label: 'Royalti PNBP YTD', value: usd(m.royaltyYtd) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-line bg-surface-2/50 p-3">
                <p className="text-[11px] text-ink-faint">{s.label}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-ink-strong">{s.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <SalesOrderForm open={formOpen} onClose={() => setFormOpen(false)} />
      <ContractForm open={contractOpen} onClose={() => setContractOpen(false)} />
      <CustomerForm open={customerOpen} onClose={() => setCustomerOpen(false)} />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Sales Order ${detail.soNo}` : ''}
        subtitle={detail ? `${customerName(detail.customerId)} · ${dmy(detail.date)}` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Tutup
            </Button>
            {detail && NEXT_STATUS[detail.status] && (
              <ActionButton action="sales.approve" variant="primary" onClick={() => { actions.setSalesOrderStatus(detail.id, NEXT_STATUS[detail.status]!); setDetail(null) }}>
                Lanjutkan → {NEXT_STATUS[detail.status]}
              </ActionButton>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/50 p-4">
              <div>
                <p className="text-[11px] text-ink-faint">Nilai Order</p>
                <p className="font-mono text-xl font-bold text-emerald-400">{usd(soValue(detail))}</p>
                <p className="text-[11px] text-ink-faintest">{usdToIdr(soValue(detail))}</p>
              </div>
              <StatusBadge value={detail.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Pelanggan', value: customerName(detail.customerId) },
                { label: 'Kontrak', value: contractCode(detail.contractId) },
                { label: 'Tipe', value: customerType(detail.customerId) },
                { label: 'Site Muat', value: siteName(detail.siteId) },
                { label: 'Tonase', value: `${num(detail.tonnageMt)} MT` },
                { label: 'Harga', value: `USD ${num1(detail.priceUsdPerMt)}/MT` },
                { label: 'Incoterm', value: detail.incoterm },
                { label: 'Vessel / Barge', value: detail.vesselBarge },
                { label: 'ETA', value: dmy(detail.eta) },
                { label: 'Surveyor', value: detail.surveyor },
                { label: 'GCV CoA', value: `${num(detail.coaGcv)} kcal/kg` },
                { label: 'Tanggal Order', value: dmy(detail.date) },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
                  <p className="text-[11px] text-ink-faint">{r.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-strong">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* -------------------------------- Forms ------------------------------- */

function SalesOrderForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useERP()
  const [form, setForm] = useState({
    contractId: state.contracts[0]?.id ?? '',
    siteId: state.sites[0]?.id ?? '',
    tonnageMt: '',
    vesselBarge: '',
    incoterm: 'FOB',
    eta: '2026-11-01',
  })
  const contract = state.contracts.find((c) => c.id === form.contractId)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const value = contract && form.tonnageMt ? Number(form.tonnageMt) * contract.priceUsdPerMt : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Sales Order Baru"
      subtitle="Order penjualan batubara berdasarkan kontrak aktif"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!form.contractId || !form.tonnageMt) return
              actions.addSalesOrder({
                contractId: form.contractId,
                customerId: contract!.customerId,
                siteId: form.siteId,
                tonnageMt: Number(form.tonnageMt),
                priceUsdPerMt: contract!.priceUsdPerMt,
                incoterm: contract!.incoterm,
                vesselBarge: form.vesselBarge || 'MV TBD',
                eta: form.eta,
                surveyor: 'SGS',
                coaGcv: 4200,
                date: '2026-10-15',
              })
              setForm({ ...form, tonnageMt: '', vesselBarge: '' })
              onClose()
            }}
          >
            Buat Order
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kontrak" required hint="Harga & spesifikasi otomatis mengikuti kontrak">
          <Select options={state.contracts.map((c) => ({ value: c.id, label: `${c.code} — ${state.customers.find((x) => x.id === c.customerId)?.name}` }))} value={form.contractId} onChange={(e) => set('contractId', e.target.value)} />
        </Field>
        <Field label="Site Muat" required>
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Tonase (MT)" required>
          <Input type="number" min={0} placeholder="contoh: 35000" value={form.tonnageMt} onChange={(e) => set('tonnageMt', e.target.value)} />
        </Field>
        <Field label="Vessel / Barge">
          <Input placeholder="contoh: MV Bara Jaya" value={form.vesselBarge} onChange={(e) => set('vesselBarge', e.target.value)} />
        </Field>
        <Field label="Incoterm">
          <Select options={['FOB', 'CIF', 'FOB Barge', 'DAP', 'CFR']} value={form.incoterm} onChange={(e) => set('incoterm', e.target.value)} />
        </Field>
        <Field label="Perkiraan ETA">
          <Input type="date" value={form.eta} onChange={(e) => set('eta', e.target.value)} />
        </Field>
      </div>
      {contract && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2/50 p-4 sm:grid-cols-4">
          {[
            { label: 'Harga kontrak', value: `USD ${num1(contract.priceUsdPerMt)}/MT` },
            { label: 'Spesifikasi', value: contract.qualitySpec },
            { label: 'Sisa volume', value: `${num(contract.volumeMt - contract.liftedMt)} MT` },
            { label: 'Estimasi nilai', value: usd(value) },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[11px] text-ink-faint">{r.label}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-amber-400">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function ContractForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useERP()
  const [form, setForm] = useState({
    customerId: state.customers[0]?.id ?? '',
    type: 'Domestic' as Contract['type'],
    startDate: '2026-11-01',
    endDate: '2027-10-31',
    volumeMt: '',
    priceUsdPerMt: '',
    qualitySpec: 'GAR 4200 / TM 27%',
    incoterm: 'FOB' as Contract['incoterm'],
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kontrak Penjualan Baru"
      subtitle="Pendaftaran kontrak jual beli batubara jangka panjang"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!form.volumeMt || !form.priceUsdPerMt) return
              actions.addContract({
                customerId: form.customerId,
                type: form.type,
                startDate: form.startDate,
                endDate: form.endDate,
                volumeMt: Number(form.volumeMt),
                priceUsdPerMt: Number(form.priceUsdPerMt),
                qualitySpec: form.qualitySpec,
                incoterm: form.incoterm,
              })
              setForm({ ...form, volumeMt: '', priceUsdPerMt: '' })
              onClose()
            }}
          >
            Simpan Kontrak
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pelanggan" required>
          <Select options={state.customers.map((c) => ({ value: c.id, label: c.name }))} value={form.customerId} onChange={(e) => set('customerId', e.target.value)} />
        </Field>
        <Field label="Tipe Kontrak">
          <Select options={['Domestic', 'Export']} value={form.type} onChange={(e) => set('type', e.target.value)} />
        </Field>
        <Field label="Tanggal Mulai">
          <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Tanggal Berakhir">
          <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </Field>
        <Field label="Volume Kontrak (MT)" required>
          <Input type="number" min={0} placeholder="contoh: 500000" value={form.volumeMt} onChange={(e) => set('volumeMt', e.target.value)} />
        </Field>
        <Field label="Harga (USD/MT)" required>
          <Input type="number" min={0} step="0.01" placeholder="contoh: 55.00" value={form.priceUsdPerMt} onChange={(e) => set('priceUsdPerMt', e.target.value)} />
        </Field>
        <Field label="Spesifikasi Mutu">
          <Select
            options={['GAR 5300 / TM 20%', 'GAR 5000 / TM 22%', 'GAR 4200 / TM 26%', 'GAR 4300 / TM 28%', 'GAR 4100 / TM 30%', 'GAR 3800 / TM 32%']}
            value={form.qualitySpec}
            onChange={(e) => set('qualitySpec', e.target.value)}
          />
        </Field>
        <Field label="Incoterm">
          <Select options={['FOB', 'CIF', 'FOB Barge', 'DAP', 'CFR']} value={form.incoterm} onChange={(e) => set('incoterm', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function CustomerForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useERP()
  const [form, setForm] = useState({
    name: '',
    sector: 'Power Plant' as Customer['sector'],
    type: 'Domestic' as Customer['type'],
    city: '',
    contact: '',
    creditLimitIdr: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrasi Pelanggan Baru"
      subtitle="Master data pelanggan batubara"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Building2 className="h-4 w-4" />}
            onClick={() => {
              if (!form.name) return
              actions.addCustomer({
                name: form.name,
                sector: form.sector,
                type: form.type,
                city: form.city || '-',
                contact: form.contact || '-',
                creditLimitIdr: Number(form.creditLimitIdr || 0),
              })
              setForm({ ...form, name: '', city: '', contact: '', creditLimitIdr: '' })
              onClose()
            }}
          >
            Simpan Pelanggan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Perusahaan" required className="sm:col-span-2">
          <Input placeholder="PT …" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Sektor Industri">
          <Select options={['Power Plant', 'Cement', 'Paper', 'Steel', 'Trader', 'Others']} value={form.sector} onChange={(e) => set('sector', e.target.value)} />
        </Field>
        <Field label="Tipe Pasar">
          <Select options={['Domestic', 'Export']} value={form.type} onChange={(e) => set('type', e.target.value)} />
        </Field>
        <Field label="Kota / Negara">
          <Input placeholder="contoh: Palembang" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Limit Kredit (Rp)">
          <Input type="number" min={0} placeholder="contoh: 100000000000" value={form.creditLimitIdr} onChange={(e) => set('creditLimitIdr', e.target.value)} />
        </Field>
        <Field label="Kontak / PIC" className="sm:col-span-2">
          <Textarea placeholder="Nama narahubung, telepon, email…" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
