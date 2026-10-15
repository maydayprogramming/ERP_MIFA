import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, ClipboardCheck, Package, Plus, Warehouse as WarehouseIcon } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, idrFull, num, pct0, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { WarehouseItem } from '../types'

const PATH = '/gudang'

export default function Warehouse() {
  const { state, actions, toast } = useERP()
  const { authority } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [adjust, setAdjust] = useState<WarehouseItem | null>(null)
  const [tab, setTab] = useState<'stok' | 'kritis'>('stok')

  const columns = useMemo<Column<WarehouseItem>[]>(
    () => [
      { key: 'sku', header: 'SKU', sort: (r) => r.sku, render: (r) => <span className="font-mono text-xs text-ink">{r.sku}</span> },
      { key: 'name', header: 'Nama Barang', sort: (r) => r.name, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.category}</span> },
      { key: 'unit', header: 'Satuan', render: (r) => <span className="text-ink-faint">{r.unit}</span> },
      {
        key: 'stock',
        header: 'Stok',
        align: 'right',
        sort: (r) => r.stock,
        render: (r) => (
          <span className={cx('tbl-num font-semibold', r.stock <= r.minStock ? 'text-rose-400' : 'text-ink')}>{num(r.stock)}</span>
        ),
      },
      { key: 'min', header: 'Min', align: 'right', sort: (r) => r.minStock, render: (r) => <span className="tbl-num text-ink-faint">{num(r.minStock)}</span> },
      { key: 'max', header: 'Maks', align: 'right', sort: (r) => r.maxStock, render: (r) => <span className="tbl-num text-ink-faint">{num(r.maxStock)}</span> },
      {
        key: 'status',
        header: 'Status Stok',
        sort: (r) => r.stock / r.maxStock,
        render: (r) => {
          const pct = (r.stock / r.maxStock) * 100
          if (r.stock <= r.minStock) return <Badge tone="rose" dot>Di bawah minimum</Badge>
          if (pct < 40) return <Badge tone="amber" dot>Menipis</Badge>
          return <Badge tone="emerald" dot>Aman</Badge>
        },
      },
      { key: 'location', header: 'Lokasi', sort: (r) => r.location, render: (r) => <span className="text-[11px] text-ink-faint">{r.location}</span> },
      { key: 'cost', header: 'Harga Satuan', align: 'right', sort: (r) => r.unitCostIdr, render: (r) => <span className="tbl-num text-ink-muted">{idrFull(r.unitCostIdr)}</span> },
      {
        key: 'value',
        header: 'Nilai Stok',
        align: 'right',
        sort: (r) => r.stock * r.unitCostIdr,
        render: (r) => <span className="tbl-num font-semibold text-ink">{idrFull(r.stock * r.unitCostIdr)}</span>,
      },
    ],
    [],
  )

  const byCategory = useMemo(() => {
    const cats = [...new Set(state.warehouseItems.map((i) => i.category))]
    return cats.map((c) => ({
      name: c,
      value: sum(state.warehouseItems.filter((i) => i.category === c).map((i) => i.stock * i.unitCostIdr)),
      item: state.warehouseItems.filter((i) => i.category === c).length,
    }))
  }, [state.warehouseItems])

  const totalValue = sum(state.warehouseItems.map((i) => i.stock * i.unitCostIdr))
  const critical = m.lowStockItems

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Gudang"
        subtitle="Modul 9 — master barang, penerimaan, pengeluaran, transfer antar lokasi, retur, reservasi part untuk work order, dan stock opname. Stok fisik dan stok sistem harus dapat direkonsiliasi."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Barang Baru
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => toast('Stock opname terjadwal dibuka.', 'info')}>
              Stock Opname
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total SKU" value={num(state.warehouseItems.length)} icon={<Package className="h-4 w-4" />} tone="sky" hint="Master barang terdaftar" />
        <StatCard label="Nilai Stok" value={idrFull(totalValue)} icon={<Boxes className="h-4 w-4" />} tone="amber" hint="Seluruh lokasi" />
        <StatCard label="Di Bawah Minimum" value={num(critical.length)} icon={<AlertTriangle className="h-4 w-4" />} tone={critical.length > 0 ? 'rose' : 'emerald'} hint="Perlu pengadaan segera" />
        <StatCard label="PR Menunggu" value={num(state.purchaseOrders.filter((p) => p.status === 'Pending Approval').length)} icon={<ArrowUpFromLine className="h-4 w-4" />} tone="violet" hint="Purchase requisition" />
      </div>

      {critical.length > 0 && (
        <Card className="border-rose-500/25">
          <CardHeader title="Barang Kritis" subtitle="Stok di bawah minimum — dapat langsung dijadikan dasar purchase requisition" />
          <div className="grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {critical.map((i) => (
              <div key={i.id} className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                    <p className="truncate text-[11px] text-ink-faint">{i.sku} · {i.location}</p>
                  </div>
                  <Badge tone="rose">{num(i.stock)}</Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-ink-faint">
                  Minimum {num(i.minStock)} {i.unit} · kekurangan {num(Math.max(0, i.minStock - i.stock))} {i.unit}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nilai Stok per Kategori" subtitle="Komposisi nilai persediaan gudang" />
          <div className="p-4 pt-0">
            <DonutChart data={byCategory} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Stok versus Ambang Minimum" subtitle="Barang dengan posisi paling rawan" />
          <div className="p-4 pt-0">
            <BarsChart
              data={[...state.warehouseItems]
                .sort((a, b) => a.stock / a.maxStock - b.stock / b.maxStock)
                .slice(0, 8)
                .map((i) => ({ name: i.sku.slice(-6), stok: i.stock, min: i.minStock })) as unknown as Array<Record<string, string | number>>}
              xKey="name"
              series={[
                { key: 'stok', name: 'Stok' },
                { key: 'min', name: 'Minimum', type: 'line' },
              ]}
              height={240}
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['stok', 'Master Barang & Stok'],
              ['kritis', `Perlu Pengadaan (${critical.length})`],
            ] as Array<['stok' | 'kritis', string]>
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
              {l}
            </button>
          ))}
        </div>
        <CardHeader
          title={tab === 'stok' ? 'Daftar Barang Gudang' : 'Daftar Barang Kritis'}
          subtitle={`Kewenangan sesi: ${authority(PATH)}. Penyesuaian stok dicatat pada audit trail.`}
        />
        <DataTable
          data={tab === 'stok' ? state.warehouseItems : critical}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari SKU, nama, kategori, atau lokasi…"
          search={(r) => `${r.sku} ${r.name} ${r.category} ${r.location}`}
          initialSort={{ key: 'sku', dir: 'asc' }}
          exportName="inventory-gudang"
          pageSize={12}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              <ActionButton module={PATH} need="create" size="sm" variant="ghost" icon={<ArrowDownToLine className="h-3.5 w-3.5" />} onClick={() => setAdjust(r)}>
                Sesuaikan Stok
              </ActionButton>
              {r.stock <= r.minStock && (
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => toast(`Purchase requisition untuk ${r.name} disiapkan.`, 'info')}>
                  Ajukan PR
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Barang Gudang Baru" subtitle="Tambahkan master barang beserta ambang minimum dan maksimum.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addWarehouseItem({
              sku: String(fd.get('sku') ?? ''),
              name: String(fd.get('name') ?? ''),
              category: String(fd.get('category') ?? 'Spare Part') as WarehouseItem['category'],
              unit: String(fd.get('unit') ?? 'pcs'),
              stock: Number(fd.get('stock') ?? 0),
              minStock: Number(fd.get('minStock') ?? 0),
              maxStock: Number(fd.get('maxStock') ?? 0),
              location: String(fd.get('location') ?? 'Gudang Utama'),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              unitCostIdr: Number(fd.get('unitCostIdr') ?? 0),
            })
            setOpen(false)
            toast('Master barang baru ditambahkan.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU" required>
              <Input name="sku" placeholder="SP-HYD-0042" required />
            </Field>
            <Field label="Nama Barang" required>
              <Input name="name" placeholder="Selang hidrolik excavator" required />
            </Field>
            <Field label="Kategori" required>
              <Select name="category" options={['Spare Part', 'Consumable', 'ATK', 'Safety', 'Tyres', 'Bahan Peledak']} defaultValue="Spare Part" />
            </Field>
            <Field label="Satuan" required>
              <Input name="unit" defaultValue="pcs" required />
            </Field>
            <Field label="Stok Awal" required>
              <Input name="stock" type="number" min={0} defaultValue={0} required />
            </Field>
            <Field label="Stok Minimum" required>
              <Input name="minStock" type="number" min={0} defaultValue={5} required />
            </Field>
            <Field label="Stok Maksimum" required>
              <Input name="maxStock" type="number" min={0} defaultValue={50} required />
            </Field>
            <Field label="Lokasi Penyimpanan">
              <Input name="location" defaultValue="Gudang Utama" />
            </Field>
            <Field label="Harga Satuan (IDR)">
              <Input name="unitCostIdr" type="number" min={0} placeholder="2450000" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Barang
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!adjust} onClose={() => setAdjust(null)} title="Penyesuaian Stok" subtitle="Gunakan untuk koreksi hasil stock opname, kerusakan, atau kehilangan. Selalu sertakan alasan.">
        {adjust && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              actions.adjustStock(adjust.id, Number(fd.get('delta') ?? 0))
              toast(`Stok ${adjust.name} disesuaikan.`, 'success')
              setAdjust(null)
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
              <p className="text-xs text-ink-faint">Barang</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{adjust.name}</p>
              <p className="mt-1 text-[11px] text-ink-faintest">
                Stok sistem saat ini: <span className="font-semibold text-ink">{num(adjust.stock)}</span> {adjust.unit}
              </p>
            </div>
            <Field label="Selisih (gunakan tanda negatif untuk pengurangan)" required>
              <Input name="delta" type="number" placeholder="mis. 3 atau -2" required />
            </Field>
            <Field label="Alasan Penyesuaian" required>
              <Textarea name="reason" rows={3} placeholder="mis. Hasil stock opname 15 Okt, selisih 3 unit rusak…" required />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="ghost" onClick={() => setAdjust(null)}>
                Batal
              </Button>
              <ActionButton module={PATH} need="approve" type="submit" icon={<WarehouseIcon className="h-4 w-4" />}>
                Simpan Penyesuaian
              </ActionButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
