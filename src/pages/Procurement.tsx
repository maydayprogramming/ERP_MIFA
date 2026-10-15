import { useMemo, useState } from 'react'
import { ClipboardList, FileCheck2, Hammer, PackageCheck, Plus, ShoppingCart, Truck } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, dmy, idrFull, num, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { PurchaseOrder, Vendor } from '../types'

const PATH = '/pengadaan'

const STATUS_TONE: Record<PurchaseOrder['status'], 'zinc' | 'amber' | 'emerald' | 'sky' | 'rose'> = {
  Draft: 'zinc',
  'Pending Approval': 'amber',
  Approved: 'emerald',
  Received: 'sky',
  Rejected: 'rose',
}

const VENDOR_TONE: Record<Vendor['status'], 'emerald' | 'amber' | 'rose'> = {
  Approved: 'emerald',
  Pending: 'amber',
  Blacklisted: 'rose',
}

export default function Procurement() {
  const { state, actions, toast } = useERP()
  const { authority } = useAuth()
  const m = useMetrics()
  const [tab, setTab] = useState<'po' | 'vendor'>('po')
  const [open, setOpen] = useState(false)
  const [openVendor, setOpenVendor] = useState(false)

  const poColumns = useMemo<Column<PurchaseOrder>[]>(
    () => [
      { key: 'poNo', header: 'No. PO', sort: (r) => r.poNo, render: (r) => <span className="font-mono text-xs font-semibold text-ink">{r.poNo}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      {
        key: 'vendor',
        header: 'Vendor',
        sort: (r) => r.vendorId,
        render: (r) => <span className="text-ink">{state.vendors.find((v) => v.id === r.vendorId)?.name ?? '-'}</span>,
      },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.category}</span> },
      { key: 'items', header: 'Item', align: 'right', sort: (r) => r.items, render: (r) => <span className="tbl-num text-ink-muted">{num(r.items)}</span> },
      { key: 'amount', header: 'Nilai', align: 'right', sort: (r) => r.amountIdr, render: (r) => <span className="tbl-num font-semibold text-ink">{idrFull(r.amountIdr)}</span> },
      { key: 'delivery', header: 'Pengiriman', sort: (r) => r.deliveryDate, render: (r) => <span className="text-[11px] text-ink-faint">{dmy(r.deliveryDate)}</span> },
      { key: 'requestedBy', header: 'Pemohon', sort: (r) => r.requestedBy, render: (r) => <span className="text-[11px] text-ink-faint">{r.requestedBy}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.vendors],
  )

  const vendorColumns = useMemo<Column<Vendor>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'name', header: 'Nama Vendor', sort: (r) => r.name, render: (r) => <span className="font-medium text-ink">{r.name}</span> },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.category}</span> },
      { key: 'city', header: 'Kota', sort: (r) => r.city, render: (r) => <span className="text-[11px] text-ink-faint">{r.city}</span> },
      { key: 'contact', header: 'Kontak', sort: (r) => r.contact, render: (r) => <span className="text-[11px] text-ink-faint">{r.contact}</span> },
      { key: 'spend', header: 'Total Pembelian', align: 'right', sort: (r) => r.totalSpendIdr, render: (r) => <span className="tbl-num text-ink">{idrFull(r.totalSpendIdr)}</span> },
      {
        key: 'rating',
        header: 'Penilaian',
        align: 'center',
        sort: (r) => r.rating,
        render: (r) => <span className="text-ink-muted">{r.rating ? `${r.rating.toFixed(1)} / 5` : '—'}</span>,
      },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={VENDOR_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [],
  )

  const byCategory = useMemo(() => {
    const cats = [...new Set(state.purchaseOrders.map((p) => p.category))]
    return cats.map((c) => ({
      name: c,
      value: sum(state.purchaseOrders.filter((p) => p.category === c).map((p) => p.amountIdr)),
    }))
  }, [state.purchaseOrders])

  const poValue = sum(state.purchaseOrders.filter((p) => ['Approved', 'Received'].includes(p.status)).map((p) => p.amountIdr))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Pembelian"
        subtitle="Modul 10 — purchase requisition, permintaan penawaran, purchase order, penerimaan barang, dan pencocokan dokumen. Komitmen PO masuk ke Cost Control tanpa menjadi biaya aktual."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Purchase Order
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<FileCheck2 className="h-4 w-4" />} onClick={() => toast('PO berstatus Pending Approval ditampilkan.', 'info')}>
              Setujui PO
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="PO Menunggu Persetujuan" value={num(m.poPending)} icon={<ClipboardList className="h-4 w-4" />} tone="amber" hint="Perlu keputusan pejabat berwenang" />
        <StatCard label="Nilai PO Disetujui" value={idrFull(poValue)} icon={<ShoppingCart className="h-4 w-4" />} tone="sky" hint="Approved + received" />
        <StatCard label="Total PO" value={num(state.purchaseOrders.length)} icon={<PackageCheck className="h-4 w-4" />} tone="emerald" hint="Seluruh status" />
        <StatCard label="Vendor Terdaftar" value={num(state.vendors.length)} icon={<Truck className="h-4 w-4" />} tone="violet" hint={`${state.vendors.filter((v) => v.status === 'Approved').length} disetujui`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nilai PO per Kategori" subtitle="Komposisi komitmen pengadaan" />
          <div className="p-4 pt-0">
            <DonutChart data={byCategory} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Alur Pengadaan" subtitle="Setiap tahap memiliki dokumen dan penanggung jawab yang berbeda" />
          <div className="space-y-2 p-4 pt-0">
            {[
              ['Purchase Requisition', 'Diajukan foreman/supervisor berdasarkan kebutuhan gudang atau WO.'],
              ['Permintaan Penawaran', 'Dikirim ke minimal tiga vendor terdaftar.'],
              ['Evaluasi Penawaran', 'Dibandingkan harga, spesifikasi, dan waktu pengiriman.'],
              ['Purchase Order', 'Disetujui sesuai batas kewenangan, lalu diterbitkan.'],
              ['Penerimaan Barang', 'Dicek terhadap PO, selisih dicatat.'],
              ['Pencocokan Dokumen', 'PO — surat jalan — faktur disamakan sebelum pembayaran.'],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-3 rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{t}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['po', 'Purchase Order'],
              ['vendor', 'Vendor'],
            ] as Array<['po' | 'vendor', string]>
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'po' ? (
          <DataTable
            data={state.purchaseOrders}
            columns={poColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari nomor PO, vendor, atau pemohon…"
            search={(r) => `${r.poNo} ${r.vendorId} ${r.requestedBy} ${r.category} ${r.status}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="purchase-order"
            pageSize={12}
            actions={(r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'Draft' && (
                  <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Pending Approval')}>
                    Ajukan
                  </ActionButton>
                )}
                {r.status === 'Pending Approval' && (
                  <>
                    <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Approved')}>
                      Setujui
                    </ActionButton>
                    <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Rejected')}>
                      Tolak
                    </ActionButton>
                  </>
                )}
                {r.status === 'Approved' && (
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setPurchaseOrderStatus(r.id, 'Received')}>
                    Terima Barang
                  </ActionButton>
                )}
              </div>
            )}
          />
        ) : (
          <DataTable
            data={state.vendors}
            columns={vendorColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari nama, kategori, atau kota…"
            search={(r) => `${r.code} ${r.name} ${r.category} ${r.city}`}
            initialSort={{ key: 'name', dir: 'asc' }}
            exportName="vendor"
            pageSize={12}
            actions={() => (
              <div className="flex justify-end">
                <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => setOpenVendor(true)}>
                  Nilai
                </ActionButton>
              </div>
            )}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Purchase Order Baru" subtitle="Nilai PO menjadi komitmen pada Cost Control sampai barang diterima dan difaktur.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addPurchaseOrder({
              date: '2026-10-15',
              vendorId: String(fd.get('vendorId') ?? state.vendors[0]?.id),
              category: String(fd.get('category') ?? 'Spare Part') as PurchaseOrder['category'],
              amountIdr: Number(fd.get('amountIdr') ?? 0),
              items: Number(fd.get('items') ?? 1),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              requestedBy: 'Sesi aktif',
              deliveryDate: String(fd.get('deliveryDate') ?? '2026-10-22'),
            })
            setOpen(false)
            toast('Purchase order dibuat dan menunggu persetujuan.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor" required>
              <Select name="vendorId" options={state.vendors.filter((v) => v.status === 'Approved').map((v) => ({ value: v.id, label: v.name }))} />
            </Field>
            <Field label="Kategori" required>
              <Select name="category" options={['Fuel', 'Bahan Peledak', 'Spare Part', 'Tyres', 'Services', 'Consumables']} defaultValue="Spare Part" />
            </Field>
            <Field label="Jumlah Item" required>
              <Input name="items" type="number" min={1} defaultValue={1} required />
            </Field>
            <Field label="Nilai (IDR)" required>
              <Input name="amountIdr" type="number" min={0} placeholder="265000000" required />
            </Field>
            <Field label="Tanggal Pengiriman Diharapkan" required>
              <Input name="deliveryDate" type="date" defaultValue="2026-10-22" required />
            </Field>
            <Field label="Site Tujuan">
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
          </div>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
            Batas nilai persetujuan ditentukan pada konfigurasi kontrak dan kewenangan peran. Persetujuan di luar batas akan dieskalasi ke
            pejabat yang lebih tinggi dan tercatat pada audit trail.
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Ajukan PO
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={openVendor} onClose={() => setOpenVendor(false)} title="Vendor Baru" subtitle="Vendor baru berstatus Pending sampai diverifikasi tim procurement.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addVendor({
              name: String(fd.get('name') ?? ''),
              category: String(fd.get('category') ?? 'Spare Part') as Vendor['category'],
              city: String(fd.get('city') ?? ''),
              contact: String(fd.get('contact') ?? ''),
            })
            setOpenVendor(false)
            toast('Vendor baru terdaftar dengan status Pending.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Vendor" required>
              <Input name="name" required />
            </Field>
            <Field label="Kategori" required>
              <Select name="category" options={['Fuel', 'Bahan Peledak', 'Spare Part', 'Tyres', 'Services', 'Consumables']} defaultValue="Spare Part" />
            </Field>
            <Field label="Kota">
              <Input name="city" placeholder="Balikpapan" />
            </Field>
            <Field label="Kontak">
              <Input name="contact" placeholder="Nama / telepon / email" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpenVendor(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Hammer className="h-4 w-4" />}>
              Simpan Vendor
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
