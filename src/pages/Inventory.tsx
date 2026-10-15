import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Fuel,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Truck,
  Warehouse,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Progress, SectionTitle, Select, StatCard, StatusBadge, Tabs, Textarea, type Column } from '../components/ui'
import { BarsChart, ChartFrame, DonutChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics } from '../lib/metrics'
import { dmy, idr, idrFull, mtShort, num, num1, pct1, sum } from '../lib/format'
import type { Stockpile, WarehouseItem } from '../types'

type TabId = 'coal' | 'warehouse' | 'fuel' | 'movement'

interface Movement {
  id: string
  date: string
  type: 'Masuk' | 'Keluar' | 'Mutasi' | 'Opname'
  item: string
  qty: number
  unit: string
  site: string
  ref: string
  pic: string
}

const MOVEMENTS: Movement[] = [
  { id: 'mv-1', date: '2026-10-15', type: 'Masuk', item: 'ANFO (Bag 25 kg)', qty: 400, unit: 'Bag', site: 'LHT', ref: 'GRN-2026-0451', pic: 'Fitri Ramadani' },
  { id: 'mv-2', date: '2026-10-15', type: 'Keluar', item: 'Filter Oki CAT 320D (Set)', qty: 6, unit: 'Set', site: 'LHT', ref: 'GI-2026-0452', pic: 'Dedi Prasetyo' },
  { id: 'mv-3', date: '2026-10-14', type: 'Mutasi', item: 'Tyre 27.00R49 (Haul Truck)', qty: 4, unit: 'Pcs', site: 'BRU', ref: 'MT-2026-0188', pic: 'Bambang Setiawan' },
  { id: 'mv-4', date: '2026-10-14', type: 'Masuk', item: 'Solar (FFM)', qty: 32000, unit: 'Liter', site: 'LHT', ref: 'GRN-2026-0450', pic: 'Rian Pratama' },
  { id: 'mv-5', date: '2026-10-13', type: 'Opname', item: 'Safety Helmet Putih (Supervisor)', qty: 145, unit: 'Pcs', site: 'BRU', ref: 'OPN-2026-0034', pic: 'Yanti Lestari' },
  { id: 'mv-6', date: '2026-10-13', type: 'Keluar', item: 'Detonator Nonel 400ms', qty: 1200, unit: 'Pcs', site: 'LHT', ref: 'GI-2026-0451', pic: 'Hendra Wijaya' },
  { id: 'mv-7', date: '2026-10-12', type: 'Keluar', item: 'Oli Mesin 15W-40 (20 L)', qty: 18, unit: 'Pail', site: 'ME', ref: 'GI-2026-0450', pic: 'Agus Salim' },
  { id: 'mv-8', date: '2026-10-12', type: 'Masuk', item: 'Kawat Las 2.5 mm', qty: 120, unit: 'Kg', site: 'LHT', ref: 'GRN-2026-0449', pic: 'Rudi Hartono' },
  { id: 'mv-9', date: '2026-10-11', type: 'Mutasi', item: 'Grease Cartridge EP2', qty: 80, unit: 'Cartridge', site: 'ME', ref: 'MT-2026-0187', pic: 'Maya Kusuma' },
  { id: 'mv-10', date: '2026-10-11', type: 'Opname', item: 'Gas Detector 4-in-1', qty: 22, unit: 'Unit', site: 'ME', ref: 'OPN-2026-0033', pic: 'Siti Nurhaliza' },
  { id: 'mv-11', date: '2026-10-10', type: 'Keluar', item: 'Safety Shoes S3 Steel Toe', qty: 24, unit: 'Pasang', site: 'BRU', ref: 'GI-2026-0449', pic: 'Zulkifli Harahap' },
  { id: 'mv-12', date: '2026-10-10', type: 'Masuk', item: 'Seal Kit Hydraulic Cylinder', qty: 12, unit: 'Pcs', site: 'LHT', ref: 'GRN-2026-0448', pic: 'Dedi Prasetyo' },
]

export default function Inventory() {
  const { state, actions, toast } = useERP()
  const m = useMetrics()
  const [tab, setTab] = useState<TabId>('coal')
  const [adjust, setAdjust] = useState<WarehouseItem | null>(null)
  const [itemOpen, setItemOpen] = useState(false)

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? '-'
  const siteCode = (id: string) => state.sites.find((s) => s.id === id)?.code ?? '-'

  const stockStatus = (i: WarehouseItem): { label: string; tone: 'danger' | 'warning' | 'success' } => {
    if (i.stock === 0) return { label: 'Habis', tone: 'danger' }
    if (i.stock < i.minStock) return { label: 'Di bawah min', tone: 'danger' }
    if (i.stock < i.minStock * 1.2) return { label: 'Perlu replenish', tone: 'warning' }
    if (i.stock > i.maxStock) return { label: 'Overstock', tone: 'warning' }
    return { label: 'Aman', tone: 'success' }
  }

  const itemColumns: Column<WarehouseItem>[] = [
    { key: 'sku', header: 'SKU', sort: (r) => r.sku, render: (r) => <span className="font-mono text-[12px] text-amber-400">{r.sku}</span> },
    { key: 'name', header: 'Nama Barang', sort: (r) => r.name, render: (r) => <span className="text-ink">{r.name}</span> },
    { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'siteId', header: 'Site', sort: (r) => siteName(r.siteId), render: (r) => <span className="text-ink-muted">{siteCode(r.siteId)}</span> },
    { key: 'location', header: 'Lokasi', render: (r) => <span className="text-[12px] text-ink-faint">{r.location}</span> },
    {
      key: 'stock',
      header: 'Stok',
      align: 'right',
      sort: (r) => r.stock,
      render: (r) => (
        <div>
          <p className="font-mono text-ink-strong">
            {num(r.stock)} {r.unit}
          </p>
          <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${r.stock < r.minStock ? 'bg-rose-500' : r.stock < r.minStock * 1.2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (r.stock / r.maxStock) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: 'minStock', header: 'Min', align: 'right', sort: (r) => r.minStock, render: (r) => <span className="font-mono text-ink-faint">{num(r.minStock)}</span> },
    { key: 'maxStock', header: 'Maks', align: 'right', sort: (r) => r.maxStock, render: (r) => <span className="font-mono text-ink-faint">{num(r.maxStock)}</span> },
    { key: 'unitCostIdr', header: 'Nilai Satuan', align: 'right', sort: (r) => r.unitCostIdr, render: (r) => <span className="font-mono">{idr(r.unitCostIdr)}</span> },
    {
      key: 'value',
      header: 'Nilai Stok',
      align: 'right',
      sort: (r) => r.stock * r.unitCostIdr,
      render: (r) => <span className="font-mono font-semibold text-emerald-400">{idr(r.stock * r.unitCostIdr)}</span>,
    },
    { key: 'status', header: 'Status', sort: (r) => r.stock, render: (r) => <StatusBadge value={stockStatus(r).label} /> },
  ]

  const movementColumns: Column<Movement>[] = [
    { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-ink-muted">{dmy(r.date)}</span> },
    {
      key: 'type',
      header: 'Jenis',
      sort: (r) => r.type,
      render: (r) => (
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${r.type === 'Masuk' ? 'text-emerald-400' : r.type === 'Keluar' ? 'text-rose-400' : r.type === 'Mutasi' ? 'text-sky-400' : 'text-violet-400'}`}>
          {r.type === 'Masuk' ? <ArrowDownToLine className="h-3.5 w-3.5" /> : r.type === 'Keluar' ? <ArrowUpFromLine className="h-3.5 w-3.5" /> : r.type === 'Mutasi' ? <RefreshCw className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
          {r.type}
        </span>
      ),
    },
    { key: 'item', header: 'Barang', sort: (r) => r.item, render: (r) => <span className="text-ink">{r.item}</span> },
    { key: 'qty', header: 'Jumlah', align: 'right', sort: (r) => r.qty, render: (r) => <span className="font-mono">{num(r.qty)} {r.unit}</span> },
    { key: 'site', header: 'Site', render: (r) => <span className="chip">{r.site}</span> },
    { key: 'ref', header: 'Referensi', render: (r) => <span className="font-mono text-[12px] text-amber-400">{r.ref}</span> },
    { key: 'pic', header: 'Petugas', render: (r) => <span className="text-[12px] text-ink-faint">{r.pic}</span> },
  ]

  const stockpileData = useMemo(
    () =>
      state.stockpiles.map((s) => ({
        label: s.name.split('—')[0].trim().replace('Stockpile ', 'SP '),
        value: Math.round(s.tonnageMt / 1000),
        capacity: Math.round(s.capacityMt / 1000),
      })),
    [state.stockpiles],
  )

  const totalStockValue = sum(state.warehouseItems.map((i) => i.stock * i.unitCostIdr))

  return (
    <div>
      <PageHeader
        title="Inventory & Logistik"
        subtitle="Pengelolaan stok batubara di stockpile, gudang barang & suku cadang, bahan bakar, serta pencatatan mutasi dan stock opname."
        actions={
          <>
            <Button variant="secondary" icon={<ClipboardList className="h-4 w-4" />}>
              Stock Opname
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setItemOpen(true)}>
              Item Gudang
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Stok Batubara" value={mtShort(m.stockTotal)} hint={`${pct1((m.stockTotal / m.stockCapacity) * 100)} kapasitas terpakai`} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Kapasitas Stockpile" value={mtShort(m.stockCapacity)} hint={`${state.stockpiles.length} stockpile aktif`} icon={<Boxes className="h-4 w-4" />} tone="sky" />
        <StatCard label="Item Gudang" value={num(state.warehouseItems.length)} unit="SKU" hint={`Nilai ${idr(totalStockValue)}`} icon={<Package className="h-4 w-4" />} tone="violet" />
        <StatCard label="Item Perlu Replenish" value={num(m.lowStockItems.length)} unit="item" hint="Stok di bawah minimum" icon={<AlertTriangle className="h-4 w-4" />} tone={m.lowStockItems.length > 0 ? 'rose' : 'emerald'} />
        <StatCard label="Level BBM Rata-rata" value={pct1(m.fuelLevelPct)} hint={`± ${m.fuelDaysCover} hari operasional`} icon={<Fuel className="h-4 w-4" />} tone={m.fuelLevelPct < 40 ? 'rose' : 'emerald'} />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'coal', label: 'Stockpile Batubara', count: state.stockpiles.length },
            { id: 'warehouse', label: 'Gudang Barang', count: state.warehouseItems.length },
            { id: 'fuel', label: 'Bahan Bakar', count: state.fuelTanks.length },
            { id: 'movement', label: 'Mutasi & Opname' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* ---------------------------- Stockpile ---------------------------- */}
      {tab === 'coal' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {state.stockpiles.map((s) => {
              const p = (s.tonnageMt / s.capacityMt) * 100
              return (
                <Card key={s.id} className="overflow-hidden">
                  <div className="flex items-start justify-between gap-2 border-b border-line p-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink-strong">{s.name}</p>
                      <p className="text-[11px] text-ink-faint">{siteCode(s.siteId)} &middot; {siteName(s.siteId)}</p>
                    </div>
                    <StatusBadge value={s.status} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-lg font-bold text-ink-strong">{mtShort(s.tonnageMt)}</span>
                      <span className="text-[11px] text-ink-faint">dari {mtShort(s.capacityMt)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${p > 90 ? 'bg-rose-500' : p > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, p)}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                      {[
                        { label: 'GCV', value: num(s.gcvAr) },
                        { label: 'Ash', value: `${num1(s.ash)}%` },
                        { label: 'S', value: `${num1(s.sulfur)}%` },
                      ].map((x) => (
                        <div key={x.label}>
                          <p className="font-mono text-xs font-semibold text-ink">{x.value}</p>
                          <p className="text-[10px] text-ink-faintest">{x.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <ChartFrame
            title="Keterisian Stockpile per Lokasi"
            subtitle="Tonase tersimpan dibanding kapasitas nominal (ribuan MT)"
            actions={<Badge tone="amber">{pct1((m.stockTotal / m.stockCapacity) * 100)} terpakai</Badge>}
          >
            <BarsChart
              data={stockpileData}
              xKey="label"
              series={[
                { key: 'value', name: 'Tersimpan (Rb MT)', color: '#f59e0b' },
                { key: 'capacity', name: 'Kapasitas (Rb MT)', color: '#3f3f46' },
              ]}
              valueFormatter={(v) => `${num1(v)} Rb MT`}
              yTickFormatter={(v) => num1(v)}
            />
          </ChartFrame>

          <Card>
            <CardHeader title="Rincian Stockpile" subtitle="Parameter mutu dan status operasional setiap stockpile" />
            <div className="overflow-x-auto scrollbar-thin">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Stockpile</th>
                    <th>Site</th>
                    <th className="text-right">Tonase</th>
                    <th className="text-right">Kapasitas</th>
                    <th className="text-right">Terisi</th>
                    <th className="text-right">GCV</th>
                    <th className="text-right">TM</th>
                    <th className="text-right">Ash</th>
                    <th className="text-right">Sulfur</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stockpiles.map((s) => (
                    <tr key={s.id}>
                      <td className="text-ink">{s.name}</td>
                      <td className="text-ink-muted">{siteCode(s.siteId)}</td>
                      <td className="tbl-num">{num(s.tonnageMt)} MT</td>
                      <td className="tbl-num text-ink-faint">{num(s.capacityMt)} MT</td>
                      <td className="tbl-num">
                        <span className={s.tonnageMt / s.capacityMt > 0.9 ? 'text-rose-400' : 'text-emerald-400'}>{pct1((s.tonnageMt / s.capacityMt) * 100)}</span>
                      </td>
                      <td className="tbl-num text-emerald-400">{num(s.gcvAr)}</td>
                      <td className="tbl-num">{num1(s.moisture)}</td>
                      <td className="tbl-num">{num1(s.ash)}</td>
                      <td className="tbl-num">{num1(s.sulfur)}</td>
                      <td>
                        <StatusBadge value={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------- Warehouse ---------------------------- */}
      {tab === 'warehouse' && (
        <Card className="mt-4">
          <CardHeader
            title="Gudang Barang & Suku Cadang"
            subtitle="Kontrol stok minimum-maksimum, nilai persediaan, dan status replenishment"
            actions={<Badge tone={m.lowStockItems.length ? 'danger' : 'success'}>{m.lowStockItems.length} perlu tindakan</Badge>}
          />
          <DataTable
            data={state.warehouseItems}
            columns={itemColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.sku} ${r.name} ${r.category} ${r.location}`}
            searchPlaceholder="Cari SKU, nama barang, lokasi…"
            exportName="gudang-barang"
            initialSort={{ key: 'stock', dir: 'asc' }}
            actions={(r) => (
              <>
                <Button size="sm" variant="ghost" onClick={() => actions.adjustStock(r.id, 10)} title="Tambah stok">
                  +10
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdjust(r)}>
                  Sesuaikan
                </Button>
              </>
            )}
          />
        </Card>
      )}

      {/* ------------------------------- Fuel ------------------------------- */}
      {tab === 'fuel' && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {state.fuelTanks.map((t) => {
                const p = (t.levelL / t.capacityL) * 100
                return (
                  <Card key={t.id}>
                    <div className="flex items-start justify-between border-b border-line p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                          <Fuel className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-ink-strong">{t.name}</p>
                          <p className="text-[11px] text-ink-faint">
                            {siteCode(t.siteId)} &middot; {t.fuelType}
                          </p>
                        </div>
                      </div>
                      <StatusBadge value={p < 30 ? 'Perlu pengisian' : p < 60 ? 'Normal' : 'Aman'} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-lg font-bold text-ink-strong">{num(t.levelL)} L</span>
                        <span className="text-[11px] text-ink-faint">kapasitas {num(t.capacityL)} L</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
                        <div className={`h-full rounded-full ${p < 30 ? 'bg-rose-500' : p < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] text-ink-faintest">Dip terakhir {dmy(t.lastDip)} &middot; {pct1(p)} terisi</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          <Card>
            <CardHeader title="Ringkasan BBM" subtitle="Konsumsi dan rencana pengisian ulang" icon={<Truck className="h-4 w-4" />} />
            <div className="space-y-4 p-5">
              {[
                { label: 'Total level tangki', value: `${num(sum(state.fuelTanks.map((t) => t.levelL)))} L` },
                { label: 'Total kapasitas', value: `${num(sum(state.fuelTanks.map((t) => t.capacityL)))} L` },
                { label: 'Konsumsi harian (est.)', value: '145.000 L/hari' },
                { label: 'Cakupan operasional', value: `${m.fuelDaysCover} hari` },
                { label: 'Nilai stok BBM', value: idr(sum(state.fuelTanks.map((t) => t.levelL)) * 14300) },
                { label: 'Pengisian berikutnya', value: '17 Okt 2026' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                  <span className="text-xs text-ink-muted">{r.label}</span>
                  <span className="font-mono text-sm font-semibold text-ink-strong">{r.value}</span>
                </div>
              ))}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-600 dark:text-amber-200">
                Fuel Farm LHT-02 berada di bawah 30% kapasitas. Segera jadwalkan pengisian dari Pertamina Patra Niaga untuk menjaga kontinuitas operasional hauling.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------------------- Movement ---------------------------- */}
      {tab === 'movement' && (
        <Card className="mt-4">
          <CardHeader title="Mutasi Barang & Stock Opname" subtitle="Catatan pergerakan barang masuk, keluar, mutasi antar site, dan hasil opname" />
          <DataTable
            data={MOVEMENTS}
            columns={movementColumns}
            rowKey={(r) => r.id}
            pageSize={12}
            search={(r) => `${r.item} ${r.ref} ${r.pic} ${r.type}`}
            searchPlaceholder="Cari barang, referensi, petugas…"
            exportName="mutasi-barang"
            initialSort={{ key: 'date', dir: 'desc' }}
          />
        </Card>
      )}

      <SectionTitle title="Ringkasan Logistik" subtitle="Indikator efektivitas pengelolaan persediaan" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame title="Komposisi Nilai Gudang" subtitle="Kontribusi nilai persediaan per kategori">
          <DonutChart
            data={Object.entries(
              state.warehouseItems.reduce<Record<string, number>>((acc, i) => {
                acc[i.category] = (acc[i.category] ?? 0) + i.stock * i.unitCostIdr
                return acc
              }, {}),
            ).map(([name, value]) => ({ name, value: Math.round(value / 1e9) }))}
            valueFormatter={(v) => `Rp ${num1(v)} M`}
            centerValue={idr(totalStockValue)}
            centerLabel="Nilai persediaan"
            height={240}
          />
        </ChartFrame>

        <Card className="xl:col-span-2">
          <CardHeader title="Item Perlu Perhatian" subtitle="Barang dengan stok di bawah minimum atau mendekati batas" icon={<AlertTriangle className="h-4 w-4" />} />
          <div className="divide-y divide-line">
            {state.warehouseItems
              .filter((i) => i.stock < i.minStock * 1.2)
              .sort((a, b) => a.stock / a.minStock - b.stock / b.minStock)
              .slice(0, 7)
              .map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{i.name}</p>
                    <p className="text-[11px] text-ink-faintest">
                      {i.sku} &middot; {siteCode(i.siteId)} &middot; {i.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-ink-strong">
                      {num(i.stock)} / {num(i.minStock)} {i.unit}
                    </p>
                    <p className="text-[11px] text-rose-400">Defisit {num(Math.max(0, i.minStock - i.stock))} {i.unit}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => actions.adjustStock(i.id, i.minStock - i.stock)}>
                    Isi ke minimum
                  </Button>
                </div>
              ))}
            {state.warehouseItems.filter((i) => i.stock < i.minStock * 1.2).length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-ink-faint">Seluruh item berada di atas stok minimum.</div>
            )}
          </div>
        </Card>
      </div>

      {/* ------------------------------- Modals ------------------------------- */}
      <Modal
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title="Penyesuaian Stok"
        subtitle={adjust ? `${adjust.name} · ${adjust.sku}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdjust(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (adjust) {
                  actions.adjustStock(adjust.id, Number((document.getElementById('adj-qty') as HTMLInputElement)?.value || 0))
                  toast('Stok barang disesuaikan', 'success')
                }
                setAdjust(null)
              }}
            >
              Simpan Penyesuaian
            </Button>
          </>
        }
      >
        {adjust && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2/50 p-4">
              {[
                { label: 'Stok saat ini', value: `${num(adjust.stock)} ${adjust.unit}` },
                { label: 'Stok minimum', value: `${num(adjust.minStock)} ${adjust.unit}` },
                { label: 'Stok maksimum', value: `${num(adjust.maxStock)} ${adjust.unit}` },
                { label: 'Nilai satuan', value: idrFull(adjust.unitCostIdr) },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-[11px] text-ink-faint">{r.label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-ink-strong">{r.value}</p>
                </div>
              ))}
            </div>
            <Field label="Jumlah penyesuaian (+/-)" hint="Gunakan angka negatif untuk pengurangan stok">
              <Input id="adj-qty" type="number" defaultValue={0} />
            </Field>
            <Field label="Alasan penyesuaian">
              <Textarea placeholder="Hasil opname, kerusakan, kedaluwarsa, atau koreksi input…" />
            </Field>
          </div>
        )}
      </Modal>

      <ItemForm open={itemOpen} onClose={() => setItemOpen(false)} />
    </div>
  )
}

function ItemForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, toast } = useERP()
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Spare Part' as WarehouseItem['category'],
    unit: 'Pcs',
    stock: '',
    minStock: '',
    maxStock: '',
    location: '',
    siteId: state.sites[0]?.id ?? '',
    unitCostIdr: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Item Gudang"
      subtitle="Registrasi barang baru ke master persediaan"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={<Warehouse className="h-4 w-4" />}
            onClick={() => {
              if (!form.name || !form.sku) {
                toast('SKU dan nama barang wajib diisi', 'warning')
                return
              }
              actions.addWarehouseItem({
                sku: form.sku,
                name: form.name,
                category: form.category,
                unit: form.unit,
                stock: Number(form.stock || 0),
                minStock: Number(form.minStock || 0),
                maxStock: Number(form.maxStock || 100),
                location: form.location || 'Gudang Utama',
                siteId: form.siteId,
                unitCostIdr: Number(form.unitCostIdr || 0),
              })
              setForm({ ...form, sku: '', name: '', stock: '', minStock: '', maxStock: '', location: '', unitCostIdr: '' })
              onClose()
            }}
          >
            Simpan Item
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="SKU" required>
          <Input placeholder="SPR-XXX-000" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        </Field>
        <Field label="Nama Barang" required className="sm:col-span-1 lg:col-span-2">
          <Input placeholder="Nama barang / suku cadang" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <Select options={['Spare Part', 'Consumable', 'ATK', 'Safety', 'Tyres', 'Bahan Peledak']} value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Satuan">
          <Select options={['Pcs', 'Set', 'Liter', 'Kg', 'Bag', 'Unit', 'Rim', 'Pasang']} value={form.unit} onChange={(e) => set('unit', e.target.value)} />
        </Field>
        <Field label="Site">
          <Select options={state.sites.map((s) => ({ value: s.id, label: s.name }))} value={form.siteId} onChange={(e) => set('siteId', e.target.value)} />
        </Field>
        <Field label="Stok Awal">
          <Input type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
        </Field>
        <Field label="Stok Minimum">
          <Input type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', e.target.value)} />
        </Field>
        <Field label="Stok Maksimum">
          <Input type="number" min={0} value={form.maxStock} onChange={(e) => set('maxStock', e.target.value)} />
        </Field>
        <Field label="Lokasi Penyimpanan">
          <Input placeholder="Gudang Utama - Rack A1" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Harga Satuan (Rp)">
          <Input type="number" min={0} value={form.unitCostIdr} onChange={(e) => set('unitCostIdr', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
