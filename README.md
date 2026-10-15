# MIFA ERP — Enterprise Resource Planning untuk Tambang Batu Bara

Aplikasi ERP terintegrasi yang dirancang khusus untuk operasional perusahaan tambang batu bara (IUP Produksi). Mencakup rantai nilai lengkap: **perencanaan & produksi pit → pengelolaan armada → logistik & stockpile → penjualan domestik & ekspor → pengadaan → K3LH & lingkungan → SDM → keuangan & kepatuhan PNBP**.

Dibangun dengan **React 18 + TypeScript + Vite + Tailwind CSS + Recharts**, dengan antarmuka profesional bertema gelap (*dark-first*) yang dioptimalkan untuk ruang kendali operasional tambang.

---

## Menjalankan Aplikasi

```bash
npm install        # install dependensi
npm run dev        # server pengembangan → http://localhost:5173
npm run build      # build produksi ke ./dist
npm run preview    # pratinjau hasil build
npm run typecheck  # pemeriksaan tipe TypeScript
npm run test:smoke # render test seluruh route (SSR)
```

---

## Modul Aplikasi

| # | Modul | Route | Isi Utama |
|---|-------|-------|-----------|
| 1 | **Dashboard Eksekutif** | `/dashboard` | 6 KPI strategis, peringatan manajemen otomatis, tren produksi & overburden, realisasi penjualan vs RKAB, performa per site, level BBM, feed aktivitas |
| 2 | **Produksi & Pit** | `/production` | Laporan produksi harian (form input + workflow Draft→Verified→Approved), analisis mutu batubara, realisasi RKAB vs rencana, master site & cadangan |
| 3 | **Armada & Pemeliharaan** | `/fleet` | Daftar alat berat, hour meter, availability & utilisasi, jadwal servis, work order pemeliharaan, manajemen ban (tyre), tren kinerja armada |
| 4 | **Inventory & Logistik** | `/inventory` | Stockpile batubara (kapasitas & mutu), gudang barang & suku cadang (min–max stock), tangki bahan bakar, mutasi barang & stock opname |
| 5 | **K3LH & Lingkungan** | `/hse` | Register insiden (LTI/MTC/FAC/Near Miss), investigasi, pelatihan & kompetensi, monitoring baku mutu AMDAL, statistik LTIFR/TRIR |
| 6 | **Penjualan & Kontrak** | `/sales` | Sales order dengan alur status 7 tahap, kontrak jual beli domestik & ekspor, master pelanggan, analitik penjualan, CoA & surveyor |
| 7 | **Pembelian & Vendor** | `/purchasing` | Purchase order + antrean persetujuan, master vendor & rating, analisis pengadaan per kategori & site |
| 8 | **SDM & Pengupahan** | `/hr` | Direktori karyawan, absensi & produktivitas shift, komponen pengupahan, matriks kompetensi & sertifikasi |
| 9 | **Keuangan & RKAB** | `/finance` | Buku besar jurnal, piutang & aging AR, utang & aging AP, RKAB vs realisasi, investasi CAPEX, royalti PNBP & kewajiban pajak |
| 10 | **Pusat Laporan** | `/reports` | 12 template laporan dengan generator, pratinjau data, parameter periode/site, ekspor CSV, katalog per kategori & otoritas |
| 11 | **Pengaturan** | `/settings` | Profil perusahaan, pengguna & matriks hak akses, parameter operasional & tarif royalti, spesifikasi mutu kontrak, integrasi sistem, audit trail |

---

## Karakteristik Fungsional

**Alur kerja (workflow) yang berjalan penuh**
- Produksi: Draft → Verified → Approved
- Sales Order: Draft → Confirmed → Loading → Loaded → Shipped → Invoiced → Paid
- Purchase Order: Draft → Pending Approval → Approved → Received / Rejected
- Work Order: Scheduled → In Progress → Completed (+ deteksi Overdue)
- Insiden: Open → Investigation → Closed

**Logika domain tambang batu bara**
- Perhitungan **Stripping Ratio** (OB Bcm / batubara MT) otomatis dari data harian
- Tarif **Royalti PNBP** bertingkat berdasarkan nilai kalori GAR sesuai PP No. 9/2010 jo. PP No. 1/2017 (4%–9%)
- Konversi & pelacakan mutu: GCV (kcal/kg), Total Moisture, Ash, Sulfur, GAR/NAR
- Indikator K3LH: LTIFR, TRIR, hari tanpa LTI, kepatuhan baku mutu lingkungan
- Indikator armada: Physical Availability, Utilisasi, MTBF/MTTR, konsumsi BBM (L/jam), umur ban
- Kurs USD/IDR acuan untuk pelaporan ganda (domestik & ekspor)

**Interaksi & ekspor**
- Pencarian global (site, pelanggan, vendor, armada, SO, PO, karyawan, insiden) dari topbar
- Notifikasi real-time + badge prioritas pada navigasi sidebar
- Setiap tabel dilengkapi: pencarian, pengurutan, paginasi, dan **ekspor CSV**
- Semua perubahan data tersimpan di `localStorage` dan dapat di-*reset* dari Pengaturan

---

## Arsitektur

```
src/
├── types.ts                 Definisi domain (38 tipe data)
├── data/seed.ts             Dataset demo deterministik (situs, armada, produksi, dll.)
├── store.tsx                Context store + persistensi localStorage + toast + audit trail
├── lib/
│   ├── format.ts            Formatter IDR/USD/MT/BCM, tanggal Indonesia, royalti, ekspor CSV
│   └── metrics.ts           Mesin agregasi KPI (useMetrics) untuk seluruh halaman
├── components/
│   ├── Layout.tsx           Shell aplikasi + ambient background + toast stack
│   ├── Sidebar.tsx          Navigasi 5 grup modul dengan badge dinamis
│   ├── Topbar.tsx           Breadcrumb, pencarian global, notifikasi, aksi cepat, menu pengguna
│   ├── ui.tsx               Design system: Button, Card, Badge, Field, Modal, DataTable, StatCard, Tabs, Progress, Toast
│   ├── charts.tsx           Wrapper Recharts bertema gelap (Trend, Bars, Donut)
│   └── ToastHost.tsx        Penghubung toast ↔ store
└── pages/                   11 halaman modul
```

**Design system** didefinisikan sebagai kelas komponen Tailwind di `src/index.css` (`@layer components`) — `.btn`, `.panel`, `.input`, `.tbl`, `.badge`, `.nav-link` — sehingga seluruh UI konsisten dan mudah dikembangkan.

---

## Data Demo

Dataset awal bersifat deterministik (seeded) sehingga tampilan selalu konsisten:
- 5 site tambang (Sumatera Selatan & Kalimantan Timur) dengan IUP, luas areal, dan cadangan
- ±600 record produksi harian (93 hari × site aktif)
- 25 unit alat berat (excavator, haul truck, dozer, grader, water truck, drill)
- 10 pelanggan, 9 kontrak, 22 sales order, 10 vendor, 24 purchase order
- Register insiden, pelatihan, 126 pembacaan parameter lingkungan
- Jurnal keuangan, invoice, tagihan, 14 kategori RKAB, 6 proyek CAPEX, 10 periode royalti

> Aplikasi ini merupakan **prototipe/demo fungsional**. Seluruh data bersifat simulasi dan tidak terhubung ke sistem produksi. Untuk implementasi nyata, lapisan `data/seed.ts` dan `store.tsx` perlu diganti dengan API backend/database.

---

## Teknologi

React 18.3 · TypeScript 5.6 · Vite 5.4 · Tailwind CSS 3.4 · Recharts 2.15 · React Router 6.28 · Lucide Icons · date-fns · clsx

---

© 2026 PT MIFA Bara Nusantara · MIFA ERP v1.0.0
