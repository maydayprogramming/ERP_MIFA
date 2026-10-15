# MIFA Kontraktor ERP — Enterprise Resource Planning untuk Kontraktor Tambang Batu Bara

Aplikasi ERP terintegrasi yang dirancang khusus untuk **perusahaan kontraktor tambang batu bara** (mitra kerja pemilik tambang). Mencakup rantai nilai lengkap: **rencana produksi → pencatatan hasil lapangan → dispatch unit & operator → downtime → maintenance & BBM → gudang & pengadaan → biaya proyek → rekonsiliasi & penagihan → pelaporan & audit trail**.

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
npm run test:rbac  # pemeriksaan autentikasi & RBAC tiga dimensi
```

---

## Modul Aplikasi (15 Modul + Utama)

| # | Modul | Route | Isi Utama |
|---|-------|-------|-----------|
| — | **Dashboard Berbasis Peran** | `/dashboard` | 18 variasi dasbor menurut peran: Operator melihat penugasannya, Foreman antrean verifikasi, Direktur indikator strategis. Termasuk panel "keputusan yang menunggu Anda" dan peta cakupan modul |
| — | **Tugas Saya** | `/tugas-saya` | Item yang membutuhkan tindakan pengguna — diurutkan prioritas, dikelompokkan per modul, dengan aturan eskalasi |
| 1 | **Proyek & Kontrak** | `/proyek-kontrak` | Identitas proyek, kontrak kerja, tarif, cakupan pekerjaan, masa berlaku, aturan pengukuran volume, versi amendment, batas nilai persetujuan |
| 2 | **Perencanaan Produksi** | `/perencanaan` | Target harian/mingguan per shift, pit, aktivitas, dan kelompok alat. Revisi disimpan sebagai versi baru — baseline tidak hilang |
| 3 | **Monitoring Produksi** | `/monitoring-produksi` | Pencatatan hasil pekerjaan, target vs aktual, metode pengukuran (survey/timbangan/hitung trip), alur Draft→Submitted→Verified→Approved |
| 4 | **Dispatch & Alokasi Armada** | `/dispatch` | Penugasan unit & operator ke pit/area per shift, sebaran per shift & pit, pencatatan perubahan alokasi beserta alasannya |
| 5 | **Master Unit & Alat** | `/master-unit` | Data aset unit, spesifikasi, kepemilikan, jam meter, status operasional, ketersediaan, pemanfaatan, umur ban, riwayat terkait |
| 6 | **Downtime & Performa Alat** | `/downtime` | Waktu tidak produktif per unit: kategori, sub-kategori, durasi, status sebelum/sesudah, dampak produksi, kaitan ke work order |
| 7 | **Maintenance & Work Order** | `/maintenance` | Alur kerusakan → pemeriksaan → part → mekanik → biaya → pengujian → penutupan. WO hanya ditutup setelah pengujian berhasil |
| 8 | **Manajemen BBM** | `/bbm` | Penerimaan dari pemasok, pengisian ke unit, rekonsiliasi stok per tangki (stok awal + penerimaan − pengeluaran), analisis konsumsi & anomali |
| 9 | **Inventory & Gudang** | `/gudang` | Master barang, stok min–maks, barang kritis, nilai persediaan, penyesuaian stok dengan alasan, stock opname |
| 10 | **Procurement & Pembelian** | `/pengadaan` | Purchase requisition → penawaran → PO → penerimaan → pencocokan dokumen. Master vendor & penilaian |
| 11 | **Personel, Shift & Kompetensi** | `/personel` | Master personel, jadwal shift, penempatan, sertifikasi & lisensi, pelatihan, serah terima shift |
| 12 | **HSE, Inspeksi & Tindakan Korektif** | `/hse` | Inspeksi, hazard, risk assessment, near miss/insiden, PIC, tenggat, verifikasi bukti, penutupan. Pemantauan lingkungan |
| 13 | **Cost Control & Profitabilitas** | `/biaya` | Budget vs actual, biaya per BCM/ton/jam, komitmen PO, margin indikatif. **Actual, Committed, Accrual, dan Forecast dipisahkan** |
| 14 | **Rekonsiliasi & Billing** | `/rekonsiliasi` | Rekonsiliasi volume pekerjaan, selisih & alasannya, tarif efektif, paket penagihan (Draft → Owner Approval → Approved → Ready to Bill → Invoiced → Paid) |
| 15 | **Laporan, Notifikasi & Audit** | `/laporan` | 12 laporan standar, eskalasi, riwayat perubahan, log aktivitas penting (append-only), ringkasan angka kunci |
| — | **Pengaturan Sistem** | `/pengaturan` | Profil, direktori akun & peran, matriks kewenangan 11×18, ambang konfigurasi, integrasi, tampilan |

---

## Karakteristik Fungsional

**Alur kerja (workflow) yang berjalan penuh**
- Produksi: Draft → Submitted → Verified → Approved / Returned for Correction
- Rencana produksi: Draft → Submitted → Approved → Revised (versi bertambah, baseline dipertahankan)
- Dispatch: Active → Completed / Cancelled (dengan alasan)
- Work Order: Scheduled → In Progress → Completed (+ deteksi Overdue)
- BBM: Draft → Submitted → Verified → Reconciled
- Purchase Order: Draft → Pending Approval → Approved → Received / Rejected
- Insiden: Open → Investigation → Closed
- Tindakan korektif: Open → In Progress → Awaiting Verification → Closed / Overdue
- Rekonsiliasi: Draft → Awaiting Owner Approval → Approved → Ready to Bill → Invoiced → Paid

**Logika domain kontraktor tambang**
- Target vs realisasi dihitung **hanya dari laporan berstatus Approved** — konsisten dengan angka biaya dan tagihan
- Produktivitas per jam operasi, jam downtime per kategori, ketersediaan & pemanfaatan armada
- Biaya per BCM/ton/jam, margin indikatif per proyek, pemisahan Actual/Committed/Accrual/Forecast
- Rekonsiliasi stok BBM per tangki dengan ambang selisih yang dapat dikonfigurasi
- Selisih rekonsiliasi volume wajib disertai alasan tertulis sebelum penagihan
- Indikator K3LH: LTIFR, TRIR, hari tanpa LTI, kepatuhan baku mutu lingkungan

**Interaksi & ekspor**
- Pencarian global (kontrak, unit, WO, log produksi, downtime, vendor, personel, insiden) dari topbar — **difilter sesuai hak akses peran**
- Aksi cepat difilter berdasarkan kewenangan peran
- Notifikasi real-time + badge prioritas pada navigasi sidebar
- Setiap tabel dilengkapi: pencarian, pengurutan, paginasi, dan **ekspor CSV**
- Semua perubahan data tersimpan di `localStorage` dan dapat di-*reset* dari Pengaturan

---

## Autentikasi & Hak Akses — Tiga Dimensi

Aplikasi menerapkan **kontrol akses tiga dimensi** sesuai kerangka Modul B. Seluruh aturan terpusat pada `src/data/accounts.ts` — sidebar, route, dan tombol aksi semuanya merujuk ke sumber yang sama.

| Dimensi | Mekanisme | Implementasi |
|---|---|---|
| **1. Role / Action** | Tindakan yang boleh dilakukan per modul: `view, create, edit_draft, submit, verify, approve, reject, return_for_correction, close, reopen, export, admin_config` | `AUTHORITY_MATRIX` + `ActionButton` |
| **2. Data Scope** | Proyek/site, departemen, dan unit mana yang boleh diakses. Foreman tidak melihat data tim lain; Operator hanya unitnya | `DATA_SCOPE` + `scopeProjects()` / `scopeDepartments()` |
| **3. Approval Authority** | Apakah pengguna hanya membuat, memverifikasi, menyetujui, atau menutup transaksi — sesuai matriks delegasi | `AUTHORITY_RANK` + `hasAuthority()` |

**11 peran** (Level 1–10 + Administrator):

| Level | Peran | Fokus |
|---|---|---|
| 1 | Operator | Input hasil produksi, BBM, laporan downtime dari lapangan |
| 2 | Foreman | Verifikasi data tim, susun penugasan unit, ajukan kebutuhan |
| 3 | Supervisor | Setujui data operasional departemen sesuai batas kewenangan |
| 4 | Planner | Susun rencana produksi, target per shift, analisis produktivitas |
| 5 | Superintendent | Kendalikan prioritas sumber daya, tinjau rencana lintas area |
| 6 | Project Manager | Pantau proyek lintas departemen: volume, biaya, penagihan |
| 7 | Operation Manager | Bandingkan performa beberapa proyek dan site |
| 8 | Commercial Manager | Master kontrak, tarif, rekonsiliasi, paket penagihan |
| 9 | Finance Manager | Budget vs actual, komitmen PO, margin proyek |
| 10 | Direktur | Indikator strategis dan keputusan yang menunggu |
| — | System Admin | Akun, konfigurasi, integrasi, log audit |

**Pemisahan hak teknis dan kewenangan bisnis** — sesuai ketentuan kerangka:
> System Administrator **tidak** otomatis memiliki kewenangan menyetujui pembelian, mengubah volume tagihan, atau menutup work order.
> Admin mengelola akun dan konfigurasi, bukan transaksi operasional.

**Batas nilai persetujuan tidak ditanamkan pada kode aplikasi.** Nilai batas disimpan sebagai konfigurasi yang dapat diaudit pada menu **Pengaturan → Ambang & Notifikasi**, sehingga setiap perubahan tercatat dan dapat dipertanggungjawabkan.

**Akun demo** (kata sandi `mifa2026`) — klik salah satu peran pada halaman login untuk masuk langsung dan melihat perbedaan hak akses:

| Email | Peran | Penempatan |
|---|---|---|
| `operator@kontraktor.co.id` | Operator | Site Berau |
| `foreman@kontraktor.co.id` | Foreman | Site Berau |
| `supervisor@kontraktor.co.id` | Supervisor | Site Berau |
| `planner@kontraktor.co.id` | Planner | Site Lahat |
| `superintendent@kontraktor.co.id` | Superintendent | Site Berau |
| `pm@kontraktor.co.id` | Project Manager | Site Berau |
| `om@kontraktor.co.id` | Operation Manager | Semua Site |
| `commercial@kontraktor.co.id` | Commercial Manager | Semua Site |
| `finance@kontraktor.co.id` | Finance Manager | Semua Site |
| `direktur@kontraktor.co.id` | Direktur | Semua Site |
| `admin@kontraktor.co.id` | System Admin | Semua Site |

> Catatan: autentikasi versi ini berjalan di sisi klien untuk keperluan demo. Autentikasi sesungguhnya (hash bcrypt, JWT, refresh token, rate limiting) akan diimplementasikan pada backend API.

---

## Arsitektur

```
src/
├── types.ts                 Definisi domain (62 tipe data — operasional, pemeliharaan, komersial, sistem)
├── data/
│   ├── accounts.ts          SUMBER TUNGGAL: 11 peran, 18 route modul, matriks kewenangan 3 dimensi, direktori akun
│   └── seed.ts              Dataset demo deterministik (kontrak, target, log produksi, downtime, biaya, rekonsiliasi)
├── store.tsx                Context store + persistensi localStorage + toast + audit trail + 30 aksi domain
├── lib/
│   ├── format.ts            Formatter IDR/MT/BCM, tanggal Indonesia, ekspor CSV
│   └── metrics.ts           Mesin agregasi KPI (useMetrics) untuk seluruh halaman
├── auth/
│   ├── AuthProvider.tsx     Sesi login, kewenangan per modul, lingkup data
│   ├── RequireAuth.tsx      Penjaga route + RedirectIfAuthed
│   └── ActionButton.tsx     Tombol aksi terkontrol kewenangan bertingkat
├── components/
│   ├── Layout.tsx           Shell aplikasi + ambient background + toast stack
│   ├── Sidebar.tsx          Navigasi 6 grup modul, difilter RBAC, dengan badge dinamis
│   ├── Topbar.tsx           Breadcrumb, pencarian global, notifikasi, aksi cepat, menu pengguna
│   ├── ui.tsx               Design system: Button, Card, Badge, Field, Modal, DataTable, StatCard, Tabs, Progress, Toast
│   ├── charts.tsx           Wrapper Recharts bertema (Trend, Bars, Donut)
│   └── ToastHost.tsx        Penghubung toast ↔ store
└── pages/                   19 halaman (15 modul + dashboard + tugas saya + pengaturan + login + 403 + 404)
```

**Design system** didefinisikan sebagai kelas komponen Tailwind di `src/index.css` (`@layer components`) — `.btn`, `.panel`, `.input`, `.tbl`, `.badge`, `.nav-link` — sehingga seluruh UI konsisten dan mudah dikembangkan.

---

## Data Demo

Dataset awal bersifat deterministik (seeded) sehingga tampilan selalu konsisten:
- 5 site proyek (Berau, Lahat, Muara Enim, Tanjung Enim)
- 6 kontrak proyek dengan tarif, satuan pembayaran, dan batas persetujuan
- 9 rencana produksi, 12 log produksi, 9 penugasan unit, 8 peristiwa downtime
- 25 unit alat berat, 3 work order prioritas, 8 transaksi pengisian BBM, 3 penerimaan BBM
- 10 master barang gudang, 24 purchase order, 10 vendor
- 8 personel bersertifikasi, 3 serah terima shift, 12 tindakan korektif HSE
- 10 transaksi biaya (actual/committed/accrual/forecast), 6 rekonsiliasi & penagihan
- 16 entri audit trail, 12 tugas berperan

> Aplikasi ini merupakan **prototipe/demo fungsional**. Seluruh data bersifat simulasi dan tidak terhubung ke sistem produksi. Untuk implementasi nyata, lapisan `data/seed.ts` dan `store.tsx` perlu diganti dengan API backend/database.

---

## Pengujian

```bash
npm run typecheck   # tsc --noEmit
npm run build       # build produksi
npm run test:smoke  # render SSR 19 route + kelengkapan APP_ROUTES
npm run test:rbac   # 98 pemeriksaan autentikasi & RBAC tiga dimensi
```

Cakupan `test:rbac`: konsistensi matriks 11 peran × 18 modul, hierarki kewenangan (none < view < export < create < verify < approve < close < admin), lingkup data per peran, halaman login, route terlindungi tanpa sesi, halaman 403 per peran, penyaringan menu sidebar, kontrol tombol aksi per peran, pemisahan hak teknis & kewenangan bisnis, dan kesesuaian direktori akun.

---

## Teknologi

React 18.3 · TypeScript 5.6 · Vite 5.4 · Tailwind CSS 3.4 · Recharts 2.15 · React Router 6.28 · Lucide Icons · date-fns · clsx

---

© 2026 PT MIFA Kontraktor Tambang · MIFA Kontraktor ERP v1.0.0
