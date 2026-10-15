import { useMemo, useState } from 'react'
import {
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Fuel,
  Package,
  Plus,
  Settings2,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart } from '../components/charts'
import { useERP } from '../store'
import { ActionButton } from '../auth/ActionButton'
import { useMetrics } from '../lib/metrics'
import { dmy, idr, idrFull, num, num1, pct1, sum } from '../lib/format'
import type { PurchaseOrder, Vendor } from '../types'

type TabId = 'orders' | 'vendors' | 'spend'

export default function Purchasing() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('orders')
  const [statusFilter, setStatusFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [vendorOpen, setVendorOpen] = useState(false)
  const [detail, setDetail] = useState<PurchaseOrder | null>(null)

  const vendorName = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? '-'
  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? '-'

  const filtered = useMemo(
    () => state.purchaseOrders.filter((p) => (statusFilter === 'all' || p.status === statusFilter) && (catFilter === 'all' || p.category === catFilter)),
    [state.purchaseOrders, statusFilter, catFilter],
  )

  const columns: Column<PurchaseOrder>[] = [
    { key: 'poNo', header: 'No. PO', sort: (r) => r.poNo, render: (r) => <span className="font-mono text-[13px] font-medium text-amber-400">{r.poNo}</span> },
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
    { key: 'vendor', header: 'Vendor', sort: (r) => vendorName(r.vendorId), render: (r) => <span className="text-ink">{vendorName(r.vendorId)}</span> },
    { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <CategoryBadge category={r.category} /> },
    { key: 'items', header: 'Item', align: 'right', sort: (r) => r.items, render: (r) => <span className="font-mono">{num(r.items)}</span> },
    { key: 'siteId', header: 'Site Tujuan', sort: (r) => siteName(r.siteId), render: (r) => <span className="text-ink-muted">{siteName(r.siteId)}</span> },
    { key: 'amountIdr', header: 'Nilai', align: 'right', sort: (r) => r.amountIdr, render: (r) => <span className="font-mono font-semibold text-emerald-400">{idr(r.amountIdr)}</span> },
    { key: 'deliveryDate', header: 'Pengiriman', sort: (r) => r.deliveryDate, render: (r) => <span className="text-ink-muted">{dmy(r.deliveryDate)}</span> },
    { key: 'requestedBy', header: 'Pemohon', render: (r) => <span className="text-[12px] text-ink-faint">{r.requestedBy}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const vendorColumns: Column<Vendor>[] = [
    { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-[13px] text-amber-400">{r.code}</span> },
    { key: 'name', header: 'Nama Vendor', sort: (r) => r.name, render: (r) => <span className="font-medium text-ink-strong">{r.name}</span> },
    { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <CategoryBadge category={r.category} /> },
    { key: 'city', header: 'Lokasi', render: (r) => <span className="text-ink-muted">{r.city}</span> },
    { key: 'contact', header: 'Kontak', render: (r) => <span className="text-[12px] text-ink-faint">{r.contact}</span> },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      sort: (r) => r.rating,
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-faintest'}`} />
          ))}
        </span>
      ),
    },
    { key: 'totalSpendIdr', header: 'Total Pengadaan', align: 'right', sort: (r) => r.totalSpendIdr, render: (r) => <span className="font-mono">{idr(r.totalSpendIdr)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  const byCategory = Object.entries(
    state.purchaseOrders.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + (p.status !== 'Rejected' ? p.amountIdr : 0)
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value: Math.round(value / 1e9) }))
    .sort((a, b) => b.value - a.value)

  const bySiteSpend = state.sites.map((s) => ({
    label: s.code,
    value: Math.round(sum(state.purchaseOrders.filter((p) => p.siteId === s.id && p.status !== 'Rejected').map((p) => p.amountIdr)) / 1e9),
  }))

  const pending = state.purchaseOrders.filter((p) => p.status === 'Pending Approval')
  const pendingValue = sum(pending.map((p) => p.amountIdr))
  const approvedValue = sum(state.purchaseOrders.filter((p) => ['Approved', 'Received'].includes(p.status)).map((p) => p.amountIdr))

  return (
    <div>
      <PageHeader
        title="Pembelian & Vendor"
        subtitle="Pengelolaan permintonan dan purchase order untuk bahan bakar, bahan peledak, suku cadang, ban, jasa kontraktor, serta evaluasi kinerja vendor."
        actions={
          <>
            <Button variant="secondary" icon={<Building2 className="h-4 w-4" />} onClick={() => setVendorOpen(true)}>
              Vendor Baru
            </Button>
            <ActionButton action="purchasing.create" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Purchase Order
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Pengadaan" value={idr(m.poValue)} hint={`${num(state.purchaseOrders.length)} purchase order`} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Menunggu Persetujuan" value={num(m.poPending)} unit="PO" hint={idr(pendingValue)} icon={<ClipboardCheck className="h-4 w-4" />} tone={m.poPending > 0 ? 'amber' : 'emerald'} />
        <StatCard label="Nilai Disetujui" value={idr(approvedValue)} hint="PO approved & received" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Utang Usaha" value={idr(m.apOutstanding)} hint={`${idr(m.apOverdue)} jatuh tempo`} icon={<BarChart3 className="h-4 w-4" />} tone={m.apOverdue > 0 ? 'rose' : 'violet'} />
        <StatCard label="Vendor Terdaftar" value={num(state.vendors.length)} unit="vendor" hint={`${state.vendors.filter((v) => v.status === 'Approved').length} approved`} icon={<Building2 className="h-4 w-4" />} tone="sky" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'orders', label: 'Purchase Order', count: filtered.length },
            { id: 'vendors', label: 'Vendor', count: state.vendors.length },
            { id: 'spend', label: 'Analisis Pengadaan' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'orders' && (
        <>
          {pending.length > 0 && (
            <Card className="mt-4">
              <CardHeader
                title="Antrean Persetujuan"
                subtitle={`${pending.length} PO senilai ${idr(pendingValue)} menunggu keputusan`}
                icon={<ClipboardCheck className="h-4 w-4" />}
                actions={<Badge tone="warning">{pending.length} item</Badge>}
              />
              <div className="divide-y divide-line">
                {pending.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">
                        {p.poNo} — {vendorName(p.vendorId)}
                      </p>
                      <p className="text-[11px] text-ink-faintest">
                        {p.category} &middot; {p.items} item &middot; kirim {dmy(p.deliveryDate)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-400">{idr(p.amountIdr)}</span>
                    <div className="flex gap-2">
                      <ActionButton action="purchasing.approve" size="sm" variant="success" onClick={() => actions.setPurchaseOrderStatus(p.id, 'Approved')}>Setujui</ActionButton>
                      <Button size="sm" variant="danger" onClick={() => actions.setPurchaseOrderStatus(p.id, 'Rejected')}>Tolak</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader
              title="Daftar Purchase Order"
              subtitle="Seluruh aktivitas pengadaan barang dan jasa operasional tambang"
              actions={
                <>
                  <Select
                    options={['all', 'Draft', 'Pending Approval', 'Approved', 'Received', 'Rejected'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Status' : v }))}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="!h-8 !w-40 !text-xs"
                  />
                  <Select
                    options={['all', 'Fuel', 'Bahan Peledak', 'Spare Part', 'Tyres', 'Services', 'Consumables'].map((v) => ({ value: v, label: v === 'all' ? 'Semua Kategori' : v }))}
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="!h-8 !w-40 !text-xs"
                  />
                </>
              }
            />
            <DataTable
              data={filtered}
              columns={columns}
              rowKey={(r) => r.id}
              pageSize={12}
              search={(r) => `${r.poNo} ${vendorName(r.vendorId)} ${r.category} ${r.status}`}
              searchPlaceholder="Cari PO, vendor, kategori…"
              exportName="purchase-order"
              initialSort={{ key: 'poNo', dir: 'desc' }}
              onRowClick={setDetail}
              actions={(r) =>
                r.status === 'Pending Approval' ? (
                  <>
                    <ActionButton action="purchasing.approve" size="sm" variant="success" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Approved')}>Setujui</ActionButton>
                    <Button size="sm" variant="ghost" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Rejected')}>Tolak</Button>
                  </>
                ) : r.status === 'Approved' ? (
                  <ActionButton action="purchasing.approve" size="sm" variant="outline" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Received')}>Terima Barang</ActionButton>
                ) : (
                  <StatusBadge value={r.status} />
                )
              }
            />
          </Card>
        </>
      )}

      {tab === 'vendors' && (
        <Card className="mt-4">
          <CardHeader title="Master Vendor" subtitle="Daftar pemasok terverifikasi beserta rating kinerja dan total realisasi pengadaan" />
          <DataTable
            data={state.vendors}
            columns={vendorColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.code} ${r.name} ${r.category} ${r.city}`}
            searchPlaceholder="Cari vendor…"
            exportName="master-vendor"
          />
        </Card>
      )}

      {tab === 'spend' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartFrame title="Pengadaan per Kategori" subtitle="Nilai pengadaan realisasi (miliar rupiah)">
              <BarsChart
                data={byCategory}
                xKey="name"
                series={[{ key: 'value', name: 'Nilai (Rp M)', color: '#f59e0b' }]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>

            <ChartFrame title="Pengadaan per Site" subtitle="Distribusi belanja operasional antar site (miliar rupiah)">
              <BarsChart
                data={bySiteSpend}
                xKey="label"
                series={[{ key: 'value', name: 'Nilai (Rp M)', color: '#38bdf8' }]}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                yTickFormatter={(v) => num1(v)}
              />
            </ChartFrame>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartFrame title="Komposisi Vendor" subtitle="Kontribusi pengadaan berdasarkan kategori vendor">
              <DonutChart
                data={state.vendors.reduce<Array<{ name: string; value: number }>>((acc, v) => {
                  const found = acc.find((a) => a.name === v.category)
                  if (found) found.value += Math.round(v.totalSpendIdr / 1e9)
                  else acc.push({ name: v.category, value: Math.round(v.totalSpendIdr / 1e9) })
                  return acc
                }, [])}
                valueFormatter={(v) => `Rp ${num1(v)} M`}
                centerValue={idr(m.poValue)}
                centerLabel="Total pengadaan"
                height={240}
              />
            </ChartFrame>

            <Card className="xl:col-span-2">
              <CardHeader title="Kategori Prioritas" subtitle="Kontribusi kategori terhadap total belanja operasional" icon={<Boxes className="h-4 w-4" />} />
              <div className="space-y-4 p-5">
                {byCategory.slice(0, 6).map((c, i) => (
                  <div key={c.name}>
                    <Progress value={(c.value / byCategory[0].value) * 100} tone={['amber', 'sky', 'emerald', 'violet', 'rose', 'orange'][i % 6] as 'amber'} label={c.name} />
                    <p className="mt-1 text-[11px] text-ink-faintest">Rp {num1(c.value)} miliar</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <SectionTitle title="Ringkasan Pengadaan" subtitle="Indikator kontrol biaya dan kepatuhan pengadaan" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Kepatuhan Kontrak', value: pct1(94.2), hint: 'PO sesuai kontrak kerangka', icon: CheckCircle2, tone: 'text-emerald-400' },
          { title: 'Lead Time Rata-rata', value: `${num1(18.4)} hari`, hint: 'Dari PO hingga penerimaan', icon: Truck, tone: 'text-sky-400' },
          { title: 'Realisasi vs Anggaran', value: pct1(m.rkabPct), hint: 'Realisasi biaya operasional', icon: BarChart3, tone: 'text-amber-400' },
          { title: 'Efisiensi Harga', value: `${num1(3.8)}%`, hint: 'Penghematan vs harga acuan', icon: Settings2, tone: 'text-violet-400' },
        ].map((s) => (
          <Card key={s.title}>
            <div className="flex items-start gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2/60 text-ink-muted">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">{s.title}</p>
                <p className={`mt-1 font-mono text-xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-[11px] text-ink-faintest">{s.hint}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <PurchaseOrderForm open={formOpen} onClose={() => setFormOpen(false)} />
      <VendorForm open={vendorOpen} onClose={() => setVendorOpen(false)} />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Purchase Order ${detail.poNo}` : ''}
        subtitle={detail ? `${vendorName(detail.vendorId)} · ${dmy(detail.date)}` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
            {detail?.status === 'Pending Approval' && (
              <>
                <Button variant="danger" onClick={() => { actions.setPurchaseOrderStatus(detail.id, 'Rejected'); setDetail(null) }}>Tolak</Button>
                <ActionButton action="purchasing.approve" variant="primary" onClick={() => { actions.setPurchaseOrderStatus(detail.id, 'Approved'); setDetail(null) }}>Setujui</ActionButton>
              </>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/50 p-4">
              <div>
                <p className="text-[11px] text-ink-faint">Nilai Purchase Order</p>
                <p className="font-mono text-xl font-bold text-emerald-400">{idrFull(detail.amountIdr)}</p>
              </div>
              <StatusBadge value={detail.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Vendor', value: vendorName(detail.vendorId) },
                { label: 'Kategori', value: detail.category },
                { label: 'Jumlah Item', value: num(detail.items) },
                { label: 'Site Tujuan', value: siteName(detail.siteId) },
                { label: 'Pemohon', value: detail.requestedBy },
                { label: 'Tanggal PO', value: dmy(detail.date) },
                { label: 'Rencana Kirim', value: dmy(detail.deliveryDate) },
                { label: 'PPN (11%)', value: idr(detail.amountIdr * 0.11) },
                { label: 'Total DPP+PPN', value: idr(detail.amountIdr * 1.11) },
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

      {filtered.length === 0 && tab === 'orders' && (
        <Card className="mt-4">
          <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="Tidak ada purchase order" hint="Ubah filter status atau kategori pengadaan." />
        </Card>
      )}
    </div>
  )
}

/* ------------------------------- Helpers ------------------------------ */

const CAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Fuel,
  'Bahan Peledak': Package,
  'Spare Part': Settings2,
  Tyres: Truck,
  Services: Building2,
  Consumables: Boxes,
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = CAT_ICON[category] ?? Package
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink">
      <Icon className="h-3.5 w-3.5 text-amber-400" />
      {category}
    </span>
  )
}

function PurchaseOrderForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    vendorId: state.vendors[0]?.id ?? '',
    category: 'Fuel' as PurchaseOrder['category'],
    siteId: state.sites[0]?.id ?? '',
    amountIdr: '',
    items: '1',
    requestedBy: '',
    deliveryDate: '2026-11-15',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const amount = Number(form.amountIdr || 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Purchase Order Baru"
      subtitle="Pengajuan pengadaan barang atau jasa untuk kebutuhan operasional"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!form.amountIdr || amount <= 0) {
                toast('Nilai purchase order wajib diisi', 'warning')
                return
              }
              actions.addPurchaseOrder({
                vendorId: form.vendorId,
                category: form.category,
                amountIdr: amount,
                items: Number(form.items || 1),
                siteId: form.siteId,
                requestedBy: form.requestedBy || 'Pengaju Sistem',
                deliveryDate: form.deliveryDate,
                date: '2026-10-15',
              })
              setForm({ ...form, amountIdr: '', requestedBy: '' })
              onClose()
            }}
          >
            Ajukan PO
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Vendor" required>
          <Select options={state.vendors.filter((v) => v.status !== 'Blacklisted').map((v) => ({ value: v.id, label: v.name }))} value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} />
        </Field>
        <Field label="Kategori Pengadaan" required>
          <Select options={['Fuel', 'Bahan Peledak', 'Spare Part', 'Tyres', 'Services', 'Consumables']} value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Site Tujuan">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Jumlah Item">
          <Input type="number" min={1} value={form.items} onChange={(e) => set('items', e.target.value)} />
        </Field>
        <Field label="Nilai PO (Rp)" required hint="Nilai DPP sebelum PPN">
          <Input type="number" min={0} placeholder="contoh: 1500000000" value={form.amountIdr} onChange={(e) => set('amountIdr', e.target.value)} />
        </Field>
        <Field label="Rencana Pengiriman">
          <Input type="date" value={form.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} />
        </Field>
        <Field label="Pemohon" className="sm:col-span-2">
          <Input placeholder="Nama pemohon / departemen" value={form.requestedBy} onChange={(e) => set('requestedBy', e.target.value)} />
        </Field>
      </div>
      {amount > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-line bg-surface-2/50 p-4">
          {[
            { label: 'DPP', value: idrFull(amount) },
            { label: 'PPN 11%', value: idrFull(amount * 0.11) },
            { label: 'Total', value: idrFull(amount * 1.11) },
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

function VendorForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    name: '',
    category: 'Spare Part' as Vendor['category'],
    city: '',
    contact: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  void state

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrasi Vendor Baru"
      subtitle="Vendor akan berstatus pending hingga melalui verifikasi dokumen"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Building2 className="h-4 w-4" />}
            onClick={() => {
              if (!form.name) {
                toast('Nama vendor wajib diisi', 'warning')
                return
              }
              actions.addVendor({ name: form.name, category: form.category, city: form.city || '-', contact: form.contact || '-' })
              setForm({ ...form, name: '', city: '', contact: '' })
              onClose()
            }}
          >
            Simpan Vendor
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Vendor" required className="sm:col-span-2">
          <Input placeholder="PT …" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <Select options={['Fuel', 'Bahan Peledak', 'Spare Part', 'Tyres', 'Services', 'Consumables']} value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Kota">
          <Input placeholder="contoh: Palembang" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Kontak / PIC" className="sm:col-span-2">
          <Textarea placeholder="Narahubung, telepon, email, alamat…" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
