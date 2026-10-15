import { useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Printer,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../components/Topbar'
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, Field, Input, Modal, SectionTitle, Select, StatCard, StatusBadge, Tabs, type Column } from '../components/ui'
import { ChartFrame, DonutChart, BarsChart } from '../components/charts'
import { useERP } from '../store'
import { useMetrics, monthLabel } from '../lib/metrics'
import { dmy, idr, mtShort, num, num1, pct1, sum, toCSV, usd } from '../lib/format'

/* --------------------------- Report definitions --------------------------- */

interface ReportDef {
  id: string
  title: string
  category: 'Operasional' | 'Komersial' | 'K3LH' | 'Keuangan' | 'Kepatuhan'
  description: string
  frequency: 'Harian' | 'Mingguan' | 'Bulanan' | 'Triwulan' | 'Tahunan'
  authority: string
  formats: Array<'PDF' | 'Excel' | 'CSV'>
  build: (state: ReturnType<typeof useERP>['state']) => Array<Record<string, string | number>>
  columns: Column<Record<string, string | number>>[]
}

const REPORT_DEFS: ReportDef[] = [
  {
    id: 'rpt-production',
    title: 'Laporan Produksi & Pengupasan',
    category: 'Operasional',
    description: 'Rekapitulasi produksi batu bara, overburden removal, dan stripping ratio per site untuk satu periode.',
    frequency: 'Bulanan',
    authority: 'Kementerian ESDM · RKAB',
    formats: ['PDF', 'Excel', 'CSV'],
    build: (state) =>
      state.sites.map((s) => {
        const rows = state.production.filter((p) => p.siteId === s.id)
        const coal = sum(rows.map((r) => r.coalMt))
        const ob = sum(rows.map((r) => r.obBcm))
        return {
          Site: s.name,
          Wilayah: s.region,
          'Produksi (MT)': Math.round(coal),
          'Overburden (Bcm)': Number(ob.toFixed(2)),
          'Stripping Ratio': Number((coal > 0 ? ob / coal : 0).toFixed(2)),
          'Ritase Hauling': sum(rows.map((r) => r.haulingTrips)),
          'GCV Rata-rata': Math.round(sum(rows.map((r) => r.gcvAr)) / (rows.length || 1)),
          Status: s.status,
        }
      }),
    columns: [
      { key: 'Site', header: 'Site', sort: (r) => r.Site },
      { key: 'Wilayah', header: 'Wilayah' },
      { key: 'Produksi (MT)', header: 'Produksi (MT)', align: 'right', sort: (r) => Number(r['Produksi (MT)']), render: (r) => num(Number(r['Produksi (MT)'])) },
      { key: 'Overburden (Bcm)', header: 'OB (Bcm)', align: 'right', sort: (r) => Number(r['Overburden (Bcm)']), render: (r) => num1(Number(r['Overburden (Bcm)'])) },
      { key: 'Stripping Ratio', header: 'SR', align: 'right', sort: (r) => Number(r['Stripping Ratio']), render: (r) => num1(Number(r['Stripping Ratio'])) },
      { key: 'Ritase Hauling', header: 'Ritase', align: 'right', sort: (r) => Number(r['Ritase Hauling']), render: (r) => num(Number(r['Ritase Hauling'])) },
      { key: 'GCV Rata-rata', header: 'GCV', align: 'right', sort: (r) => Number(r['GCV Rata-rata']), render: (r) => num(Number(r['GCV Rata-rata'])) },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-rkab',
    title: 'Realisasi RKAB vs Anggaran',
    category: 'Keuangan',
    description: 'Perbandingan pagu anggaran biaya dengan realisasi per kategori, termasuk analisis varians.',
    frequency: 'Bulanan',
    authority: 'Internal · Cost Control',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.budgets.map((b) => ({
        Kategori: b.category,
        Site: state.sites.find((s) => s.id === b.siteId)?.code ?? '-',
        Anggaran: b.budgetIdr,
        Realisasi: b.actualIdr,
        Varians: b.actualIdr - b.budgetIdr,
        'Realisasi (%)': Number(((b.actualIdr / b.budgetIdr) * 100).toFixed(1)),
      })),
    columns: [
      { key: 'Kategori', header: 'Kategori Biaya', sort: (r) => r.Kategori },
      { key: 'Site', header: 'Site' },
      { key: 'Anggaran', header: 'Anggaran', align: 'right', sort: (r) => Number(r.Anggaran), render: (r) => idr(Number(r.Anggaran)) },
      { key: 'Realisasi', header: 'Realisasi', align: 'right', sort: (r) => Number(r.Realisasi), render: (r) => idr(Number(r.Realisasi)) },
      {
        key: 'Varians',
        header: 'Varians',
        align: 'right',
        sort: (r) => Number(r.Varians),
        render: (r) => <span className={Number(r.Varians) > 0 ? 'font-mono text-rose-400' : 'font-mono text-emerald-400'}>{idr(Number(r.Varians))}</span>,
      },
      { key: 'Realisasi (%)', header: '%', align: 'right', sort: (r) => Number(r['Realisasi (%)']), render: (r) => <span className="font-mono">{pct1(Number(r['Realisasi (%)']))}</span> },
    ],
  },
  {
    id: 'rpt-sales',
    title: 'Laporan Penjualan & Pengiriman',
    category: 'Komersial',
    description: 'Rekap sales order, tonase, nilai penjualan, status pengiriman, dan surveyor mutu.',
    frequency: 'Mingguan',
    authority: 'Internal · Komersial',
    formats: ['PDF', 'Excel', 'CSV'],
    build: (state) =>
      state.salesOrders.map((s) => ({
        'No. SO': s.soNo,
        Tanggal: s.date,
        Pelanggan: state.customers.find((c) => c.id === s.customerId)?.name ?? '-',
        Tipe: state.customers.find((c) => c.id === s.customerId)?.type ?? '-',
        'Tonase (MT)': s.tonnageMt,
        'Harga (USD/MT)': s.priceUsdPerMt,
        'Nilai (USD)': Math.round(s.tonnageMt * s.priceUsdPerMt),
        Vessel: s.vesselBarge,
        Surveyor: s.surveyor,
        Status: s.status,
      })),
    columns: [
      { key: 'No. SO', header: 'No. SO', sort: (r) => r['No. SO'], render: (r) => <span className="font-mono text-[12px] text-amber-400">{String(r['No. SO'])}</span> },
      { key: 'Tanggal', header: 'Tanggal', sort: (r) => String(r.Tanggal), render: (r) => dmy(String(r.Tanggal)) },
      { key: 'Pelanggan', header: 'Pelanggan', sort: (r) => r.Pelanggan },
      { key: 'Tipe', header: 'Tipe' },
      { key: 'Tonase (MT)', header: 'Tonase', align: 'right', sort: (r) => Number(r['Tonase (MT)']), render: (r) => num(Number(r['Tonase (MT)'])) },
      { key: 'Harga (USD/MT)', header: 'Harga', align: 'right', sort: (r) => Number(r['Harga (USD/MT)']), render: (r) => num1(Number(r['Harga (USD/MT)'])) },
      { key: 'Nilai (USD)', header: 'Nilai', align: 'right', sort: (r) => Number(r['Nilai (USD)']), render: (r) => <span className="font-mono font-semibold text-emerald-400">{usd(Number(r['Nilai (USD)']))}</span> },
      { key: 'Vessel', header: 'Vessel' },
      { key: 'Surveyor', header: 'Surveyor' },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-coa',
    title: 'Analisa Mutu Batubara (CoA)',
    category: 'Operasional',
    description: 'Ringkasan parameter mutu batubara per site: GCV, total moisture, abu, dan belerang.',
    frequency: 'Bulanan',
    authority: 'Surveyor · SGS/Cointeste',
    formats: ['PDF', 'CSV'],
    build: (state) =>
      state.sites.map((s) => {
        const rows = state.production.filter((p) => p.siteId === s.id)
        const n = rows.length || 1
        return {
          Site: s.name,
          'Jenis Batubara': s.coalType,
          'GCV GAR (kcal/kg)': Math.round(sum(rows.map((r) => r.gcvAr)) / n),
          'Total Moisture (%)': Number((sum(rows.map((r) => r.totalMoisture)) / n).toFixed(1)),
          'Ash (%)': Number((sum(rows.map((r) => r.ash)) / n).toFixed(1)),
          'Sulfur (%)': Number((sum(rows.map((r) => r.sulfur)) / n).toFixed(2)),
        }
      }),
    columns: [
      { key: 'Site', header: 'Site', sort: (r) => r.Site },
      { key: 'Jenis Batubara', header: 'Jenis' },
      { key: 'GCV GAR (kcal/kg)', header: 'GCV', align: 'right', sort: (r) => Number(r['GCV GAR (kcal/kg)']), render: (r) => <span className="font-mono text-emerald-400">{num(Number(r['GCV GAR (kcal/kg)']))}</span> },
      { key: 'Total Moisture (%)', header: 'TM (%)', align: 'right', sort: (r) => Number(r['Total Moisture (%)']), render: (r) => num1(Number(r['Total Moisture (%)'])) },
      { key: 'Ash (%)', header: 'Ash (%)', align: 'right', sort: (r) => Number(r['Ash (%)']), render: (r) => num1(Number(r['Ash (%)'])) },
      { key: 'Sulfur (%)', header: 'S (%)', align: 'right', sort: (r) => Number(r['Sulfur (%)']), render: (r) => num1(Number(r['Sulfur (%)'])) },
    ],
  },
  {
    id: 'rpt-hse',
    title: 'Laporan Statistik K3LH',
    category: 'K3LH',
    description: 'Rekap insiden keselamatan, klasifikasi kejadian, hari hilang kerja, dan status investigasi.',
    frequency: 'Bulanan',
    authority: 'Kementerian ESDM · SMKP',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.incidents.map((i) => ({
        Tanggal: i.date,
        Site: state.sites.find((s) => s.id === i.siteId)?.code ?? '-',
        Klasifikasi: i.type,
        Severity: i.severity,
        Departemen: i.department,
        'Hari Hilang': i.lostDays,
        Status: i.status,
        'Tindakan Korektif': i.correctiveAction,
      })),
    columns: [
      { key: 'Tanggal', header: 'Tanggal', sort: (r) => String(r.Tanggal), render: (r) => dmy(String(r.Tanggal)) },
      { key: 'Site', header: 'Site' },
      { key: 'Klasifikasi', header: 'Klasifikasi', render: (r) => <StatusBadge value={String(r.Klasifikasi)} /> },
      { key: 'Severity', header: 'Severity' },
      { key: 'Departemen', header: 'Departemen' },
      { key: 'Hari Hilang', header: 'Hari Hilang', align: 'right', sort: (r) => Number(r['Hari Hilang']), render: (r) => num(Number(r['Hari Hilang'])) },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
      { key: 'Tindakan Korektif', header: 'Tindakan Korektif', render: (r) => <span className="text-[12px] text-zinc-400">{String(r['Tindakan Korektif'])}</span> },
    ],
  },
  {
    id: 'rpt-fleet',
    title: 'Laporan Utilisasi Armada',
    category: 'Operasional',
    description: 'Ketersediaan, utilisasi, konsumsi bahan bakar, dan status servis setiap unit alat berat.',
    frequency: 'Bulanan',
    authority: 'Internal · Perencanaan Tambang',
    formats: ['Excel', 'CSV'],
    build: (state) =>
      state.equipment.map((e) => ({
        'Kode Unit': e.code,
        Unit: e.name,
        Tipe: e.type,
        Site: state.sites.find((s) => s.id === e.siteId)?.code ?? '-',
        'Hour Meter': e.hourMeter,
        'Availability (%)': e.availabilityPct,
        'Utilisasi (%)': e.utilizationPct,
        'BBM (L/jam)': e.fuelLph,
        'Umur Ban (%)': e.tyreLifePct,
        Status: e.status,
      })),
    columns: [
      { key: 'Kode Unit', header: 'Kode', sort: (r) => r['Kode Unit'], render: (r) => <span className="font-mono text-[12px] text-amber-400">{String(r['Kode Unit'])}</span> },
      { key: 'Unit', header: 'Unit', sort: (r) => r.Unit },
      { key: 'Tipe', header: 'Tipe' },
      { key: 'Site', header: 'Site' },
      { key: 'Hour Meter', header: 'HM (jam)', align: 'right', sort: (r) => Number(r['Hour Meter']), render: (r) => num(Number(r['Hour Meter'])) },
      { key: 'Availability (%)', header: 'Availability', align: 'right', sort: (r) => Number(r['Availability (%)']), render: (r) => pct1(Number(r['Availability (%)'])) },
      { key: 'Utilisasi (%)', header: 'Utilisasi', align: 'right', sort: (r) => Number(r['Utilisasi (%)']), render: (r) => pct1(Number(r['Utilisasi (%)'])) },
      { key: 'BBM (L/jam)', header: 'BBM (L/jam)', align: 'right', sort: (r) => Number(r['BBM (L/jam)']), render: (r) => num(Number(r['BBM (L/jam)'])) },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-ar',
    title: 'Laporan Piutang & Aging',
    category: 'Keuangan',
    description: 'Daftar faktur penjualan outstanding, umur jatuh tempo, dan eksposur piutang per pelanggan.',
    frequency: 'Mingguan',
    authority: 'Internal · Treasury',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.invoices.map((i) => ({
        Invoice: i.invoiceNo,
        'Faktur Pajak': i.taxInvoiceNo,
        Pelanggan: state.customers.find((c) => c.id === i.customerId)?.name ?? '-',
        Tanggal: i.date,
        'Jatuh Tempo': i.dueDate,
        'Nilai (USD)': i.amountUsd,
        Status: i.status,
      })),
    columns: [
      { key: 'Invoice', header: 'No. Invoice', sort: (r) => r.Invoice, render: (r) => <span className="font-mono text-[12px] text-amber-400">{String(r.Invoice)}</span> },
      { key: 'Pelanggan', header: 'Pelanggan', sort: (r) => r.Pelanggan },
      { key: 'Tanggal', header: 'Tanggal', sort: (r) => String(r.Tanggal), render: (r) => dmy(String(r.Tanggal)) },
      { key: 'Jatuh Tempo', header: 'Jatuh Tempo', sort: (r) => String(r['Jatuh Tempo']), render: (r) => dmy(String(r['Jatuh Tempo'])) },
      { key: 'Nilai (USD)', header: 'Nilai', align: 'right', sort: (r) => Number(r['Nilai (USD)']), render: (r) => <span className="font-mono text-emerald-400">{usd(Number(r['Nilai (USD)']))}</span> },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-royalty',
    title: 'Perhitungan Royalti PNBP',
    category: 'Kepatuhan',
    description: 'Perhitungan iuran royalti berdasarkan volume penjualan, nilai kalori, dan tarif PP No. 9/2010.',
    frequency: 'Bulanan',
    authority: 'Kementerian ESDM · PNBP',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.royalties.map((r) => ({
        Periode: r.period,
        Site: state.sites.find((s) => s.id === r.siteId)?.code ?? '-',
        'Volume (MT)': r.volumeMt,
        'Nilai Penjualan (USD)': r.salesValueUsd,
        'Band Kalori': r.gcvBand,
        'Tarif (%)': r.ratePct,
        'Royalti (USD)': r.royaltyUsd,
        Status: r.status,
      })),
    columns: [
      { key: 'Periode', header: 'Periode', sort: (r) => String(r.Periode), render: (r) => <span className="font-mono">{monthLabel(String(r.Periode))}</span> },
      { key: 'Site', header: 'Site' },
      { key: 'Volume (MT)', header: 'Volume', align: 'right', sort: (r) => Number(r['Volume (MT)']), render: (r) => num(Number(r['Volume (MT)'])) },
      { key: 'Nilai Penjualan (USD)', header: 'Nilai Penjualan', align: 'right', sort: (r) => Number(r['Nilai Penjualan (USD)']), render: (r) => usd(Number(r['Nilai Penjualan (USD)'])) },
      { key: 'Band Kalori', header: 'Band Kalori' },
      { key: 'Tarif (%)', header: 'Tarif', align: 'right', render: (r) => <Badge tone="warning">{Number(r['Tarif (%)'])}%</Badge> },
      { key: 'Royalti (USD)', header: 'Royalti', align: 'right', sort: (r) => Number(r['Royalti (USD)']), render: (r) => <span className="font-mono font-semibold text-rose-400">{usd(Number(r['Royalti (USD)']))}</span> },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-inventory',
    title: 'Laporan Inventori & Stockpile',
    category: 'Operasional',
    description: 'Posisi stok batubara di stockpile, nilai persediaan gudang, dan status replenishment.',
    frequency: 'Mingguan',
    authority: 'Internal · Logistik',
    formats: ['Excel', 'CSV'],
    build: (state) => [
      ...state.stockpiles.map((s) => ({
        Kategori: 'Stockpile Batubara',
        Item: s.name,
        Site: state.sites.find((x) => x.id === s.siteId)?.code ?? '-',
        Kuantitas: s.tonnageMt,
        Satuan: 'MT',
        Status: s.status,
      })),
      ...state.warehouseItems.map((w) => ({
        Kategori: 'Gudang Barang',
        Item: `${w.sku} — ${w.name}`,
        Site: state.sites.find((x) => x.id === w.siteId)?.code ?? '-',
        Kuantitas: w.stock,
        Satuan: w.unit,
        Status: w.stock < w.minStock ? 'Perlu replenish' : 'Aman',
      })),
    ],
    columns: [
      { key: 'Kategori', header: 'Kategori', sort: (r) => r.Kategori },
      { key: 'Item', header: 'Item', sort: (r) => r.Item },
      { key: 'Site', header: 'Site' },
      { key: 'Kuantitas', header: 'Kuantitas', align: 'right', sort: (r) => Number(r.Kuantitas), render: (r) => num(Number(r.Kuantitas)) },
      { key: 'Satuan', header: 'Satuan' },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-hr',
    title: 'Laporan SDM & Absensi',
    category: 'Operasional',
    description: 'Rekap kehadiran shift, jam lembur, dan produktivitas tenaga kerja per site.',
    frequency: 'Bulanan',
    authority: 'Internal · SDM',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.employees.reduce<Array<Record<string, string | number>>>((acc, e) => {
        const found = acc.find((a) => a.Departemen === e.department)
        if (found) {
          found['Jumlah Karyawan'] = Number(found['Jumlah Karyawan']) + 1
          found['Total Gaji (Rp)'] = Number(found['Total Gaji (Rp)']) + e.salaryIdr
        } else {
          acc.push({ Departemen: e.department, 'Jumlah Karyawan': 1, 'Total Gaji (Rp)': e.salaryIdr })
        }
        return acc
      }, []),
    columns: [
      { key: 'Departemen', header: 'Departemen', sort: (r) => r.Departemen },
      { key: 'Jumlah Karyawan', header: 'Jumlah', align: 'right', sort: (r) => Number(r['Jumlah Karyawan']), render: (r) => num(Number(r['Jumlah Karyawan'])) },
      { key: 'Total Gaji (Rp)', header: 'Total Gaji', align: 'right', sort: (r) => Number(r['Total Gaji (Rp)']), render: (r) => idr(Number(r['Total Gaji (Rp)'])) },
    ],
  },
  {
    id: 'rpt-capex',
    title: 'Realisasi Investasi (CAPEX)',
    category: 'Keuangan',
    description: 'Progres fisik dan finansial setiap proyek investasi infrastruktur dan armada.',
    frequency: 'Triwulan',
    authority: 'Internal · Corporate Planning',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.capex.map((c) => ({
        Kode: c.code,
        Proyek: c.name,
        Site: state.sites.find((s) => s.id === c.siteId)?.code ?? '-',
        Mulai: c.startDate,
        Target: c.endDate,
        Anggaran: c.budgetIdr,
        Terpakai: c.spentIdr,
        'Progres (%)': c.progressPct,
        Status: c.status,
      })),
    columns: [
      { key: 'Kode', header: 'Kode', sort: (r) => r.Kode, render: (r) => <span className="font-mono text-[12px] text-amber-400">{String(r.Kode)}</span> },
      { key: 'Proyek', header: 'Proyek', sort: (r) => r.Proyek },
      { key: 'Site', header: 'Site' },
      { key: 'Mulai', header: 'Mulai', sort: (r) => String(r.Mulai), render: (r) => dmy(String(r.Mulai)) },
      { key: 'Target', header: 'Target', sort: (r) => String(r.Target), render: (r) => dmy(String(r.Target)) },
      { key: 'Anggaran', header: 'Anggaran', align: 'right', sort: (r) => Number(r.Anggaran), render: (r) => idr(Number(r.Anggaran)) },
      { key: 'Terpakai', header: 'Terpakai', align: 'right', sort: (r) => Number(r.Terpakai), render: (r) => idr(Number(r.Terpakai)) },
      { key: 'Progres (%)', header: 'Progres', align: 'right', sort: (r) => Number(r['Progres (%)']), render: (r) => <span className="font-mono">{Number(r['Progres (%)'])}%</span> },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
  {
    id: 'rpt-env',
    title: 'Laporan Kepatuhan Lingkungan',
    category: 'Kepatuhan',
    description: 'Hasil monitoring parameter lingkungan terhadap baku mutu AMDAL dan status kepatuhan.',
    frequency: 'Triwulan',
    authority: 'Dinas LH · AMDAL',
    formats: ['PDF', 'Excel'],
    build: (state) =>
      state.environmental.map((e) => ({
        Tanggal: e.date,
        Parameter: e.parameter,
        Lokasi: e.location,
        Site: state.sites.find((s) => s.id === e.siteId)?.code ?? '-',
        Hasil: e.value,
        Satuan: e.unit,
        'Baku Mutu': e.threshold,
        Status: e.status,
      })),
    columns: [
      { key: 'Tanggal', header: 'Tanggal', sort: (r) => String(r.Tanggal), render: (r) => dmy(String(r.Tanggal)) },
      { key: 'Parameter', header: 'Parameter', sort: (r) => r.Parameter },
      { key: 'Lokasi', header: 'Lokasi Sampling' },
      { key: 'Site', header: 'Site' },
      { key: 'Hasil', header: 'Hasil', align: 'right', sort: (r) => Number(r.Hasil), render: (r) => num1(Number(r.Hasil)) },
      { key: 'Satuan', header: 'Satuan' },
      { key: 'Baku Mutu', header: 'Baku Mutu', align: 'right', sort: (r) => Number(r['Baku Mutu']), render: (r) => num1(Number(r['Baku Mutu'])) },
      { key: 'Status', header: 'Status', render: (r) => <StatusBadge value={String(r.Status)} /> },
    ],
  },
]

/* ------------------------------- Page ------------------------------- */

export default function Reports() {
  const { state, toast } = useERP()
  const m = useMetrics()
  const [category, setCategory] = useState<'Semua' | ReportDef['category']>('Semua')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<ReportDef | null>(null)

  const filtered = useMemo(
    () =>
      REPORT_DEFS.filter(
        (r) => (category === 'Semua' || r.category === category) && (r.title.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [category, query],
  )

  const byCategory = (['Operasional', 'Komersial', 'K3LH', 'Keuangan', 'Kepatuhan'] as const).map((c) => ({
    name: c,
    value: REPORT_DEFS.filter((r) => r.category === c).length,
  }))

  return (
    <div>
      <PageHeader
        title="Pusat Laporan"
        subtitle="Katalog laporan operasional, komersial, K3LH, keuangan, dan kepatuhan regulasi — dengan pratinjau data dan ekspor multi-format."
        actions={
          <>
            <Button variant="secondary" icon={<CalendarClock className="h-4 w-4" />}>
              Jadwal Otomatis
            </Button>
            <Button variant="primary" icon={<FileBarChart className="h-4 w-4" />} onClick={() => setActive(REPORT_DEFS[0])}>
              Buka Laporan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Laporan Tersedia" value={num(REPORT_DEFS.length)} unit="template" hint="Siap generate kapan saja" icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Produksi Bulan Ini" value={mtShort(m.coalMtd)} hint={`${num1(m.obMtd)} Bcm overburden`} icon={<Layers className="h-4 w-4" />} tone="sky" />
        <StatCard label="Penjualan MTD" value={usd(m.revenueMtd)} hint={`${pct1(m.rkabPct)} realisasi RKAB`} icon={<BarChart3 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Kepatuhan K3LH" value={pct1(m.complianceRate)} hint={`${m.openIncidents} insiden terbuka`} icon={<ShieldCheck className="h-4 w-4" />} tone="violet" />
        <StatCard label="Royalti & PNBP YTD" value={usd(m.royaltyYtd)} hint="Kewajiban negara" icon={<FileSpreadsheet className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs
          tabs={[
            { id: 'Semua', label: 'Semua', count: REPORT_DEFS.length },
            { id: 'Operasional', label: 'Operasional', count: byCategory[0].value },
            { id: 'Komersial', label: 'Komersial', count: byCategory[1].value },
            { id: 'K3LH', label: 'K3LH', count: byCategory[2].value },
            { id: 'Keuangan', label: 'Keuangan', count: byCategory[3].value },
            { id: 'Kepatuhan', label: 'Kepatuhan', count: byCategory[4].value },
          ]}
          active={category}
          onChange={(v) => setCategory(v as typeof category)}
        />
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input className="input input-sm !pl-9" placeholder="Cari laporan…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => (
          <Card key={r.id} className="flex flex-col transition-colors hover:border-zinc-700">
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone="neutral">{r.category}</Badge>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">{r.frequency}</span>
                </div>
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-zinc-50">{r.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">{r.description}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-600">Format:</span>
                {r.formats.map((f) => (
                  <span key={f} className="chip !text-[10px]">
                    {f}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">Otoritas: {r.authority}</p>
            </div>
            <div className="flex items-center gap-2 border-t border-zinc-800 p-4">
              <Button variant="primary" size="sm" icon={<FileBarChart className="h-3.5 w-3.5" />} onClick={() => setActive(r)} className="flex-1">
                Generate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => {
                  toCSV(r.build(state), r.id)
                  toast(`Laporan ${r.title} diunduh sebagai CSV`, 'success')
                }}
              >
                CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-4">
          <EmptyState icon={<Search className="h-6 w-6" />} title="Laporan tidak ditemukan" hint="Coba kata kunci lain atau pilih kategori berbeda." />
        </Card>
      )}

      <SectionTitle title="Analitik Cepat" subtitle="Visualisasi ringkas untuk mendukung penyusunan laporan periodik" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame title="Distribusi Laporan" subtitle="Jumlah template per kategori">
          <DonutChart data={byCategory} centerValue={num(REPORT_DEFS.length)} centerLabel="Template laporan" height={240} />
        </ChartFrame>
        <ChartFrame
          className="xl:col-span-2"
          title="Data Pendukung Laporan"
          subtitle="Produksi batubara dan overburden removal 12 bulan terakhir"
        >
          <BarsChart
            data={m.monthly.map((r) => ({ label: r.label, coal: r.coal / 1000, ob: r.ob / 1000 }))}
            xKey="label"
            series={[
              { key: 'coal', name: 'Batubara (Rb MT)', color: '#f59e0b' },
              { key: 'ob', name: 'Overburden (Rb Bcm)', color: '#38bdf8' },
            ]}
            valueFormatter={(v) => num1(v)}
            yTickFormatter={(v) => num1(v)}
          />
        </ChartFrame>
      </div>

      {/* --------------------------- Report viewer --------------------------- */}
      <ReportViewer report={active} onClose={() => setActive(null)} />
    </div>
  )
}

/* ----------------------------- Viewer modal ----------------------------- */

function ReportViewer({ report, onClose }: { report: ReportDef | null; onClose: () => void }) {
  const { state, toast } = useERP()
  const [period, setPeriod] = useState('2026-10')
  const [siteFilter, setSiteFilter] = useState('all')

  const rows = useMemo(() => {
    if (!report) return []
    const built = report.build(state)
    if (siteFilter === 'all') return built
    const site = state.sites.find((s) => s.id === siteFilter)
    if (!site) return built
    return built.filter((r) => Object.values(r).some((v) => String(v).includes(site.code) || String(v).includes(site.name)))
  }, [report, state, siteFilter])

  if (!report) return null

  const numericKeys = Object.keys(rows[0] ?? {}).filter((k) => rows.every((r) => typeof r[k] === 'number'))

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title={report.title}
      subtitle={`${report.category} · ${report.frequency} · ${report.authority}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Tutup</Button>
          <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => toast('Laporan dikirim ke antrean cetak', 'info')}>
            Cetak
          </Button>
          <Button
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toCSV(rows, report.id)
              toast('Laporan berhasil diekspor', 'success')
            }}
          >
            Ekspor Data
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Parameter */}
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:grid-cols-4">
          <Field label="Periode">
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </Field>
          <Field label="Site">
            <Select
              options={[{ value: 'all', label: 'Semua Site' }, ...state.sites.map((s) => ({ value: s.id, label: s.name }))]}
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            />
          </Field>
          <Field label="Format Output">
            <Select options={report.formats.map((f) => ({ value: f, label: f }))} defaultValue={report.formats[0]} />
          </Field>
          <Field label="Mata Uang">
            <Select options={['IDR — Rupiah', 'USD — Dolar AS']} defaultValue="USD — Dolar AS" />
          </Field>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Jumlah Baris', value: num(rows.length) },
            { label: 'Periode', value: monthLabel(period) },
            ...numericKeys.slice(0, 2).map((k) => ({ label: `Total ${k}`, value: num(sum(rows.map((r) => Number(r[k])))) })),
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
              <p className="text-[11px] text-zinc-500">{s.label}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-amber-400">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-800">
          <DataTable
            data={rows}
            columns={report.columns}
            rowKey={(r) => Object.values(r).join('|')}
            pageSize={10}
            searchable
            searchPlaceholder="Cari dalam laporan…"
            exportName={report.id}
            emptyLabel="Tidak ada data untuk parameter laporan ini"
            initialSort={{ key: report.columns[0].key, dir: 'desc' }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Laporan dibuat pada {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
          </span>
          <span className="flex items-center gap-2">
            <Send className="h-3.5 w-3.5" /> Siap dikirim ke {report.authority}
          </span>
        </div>
      </div>
    </Modal>
  )
}
