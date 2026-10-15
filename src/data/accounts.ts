/* ==========================================================================
   Direktori akun + model hak akses 3 dimensi — Mining Contractor ERP
   --------------------------------------------------------------------------
   Sesuai Kerangka ERP Modul B (Kontraktor Tambang):

   Dimensi 1 — Role/Action     : tindakan apa yang boleh dilakukan
   Dimensi 2 — Data scope      : proyek/site, departemen, unit mana yang
                                 boleh diakses
   Dimensi 3 — Approval authority : apakah hanya membuat, memeriksa,
                                 memverifikasi, menyetujui, atau menutup

   CATATAN KEAMANAN: ini lapisan autentikasi DEMO sisi klien. Autentikasi
   sesungguhnya (hash bcrypt, JWT, refresh token, rate limiting) akan
   diimplementasikan pada backend API. Batas nilai persetujuan TIDAK
   ditanamkan di kode — harus menjadi konfigurasi yang dapat diaudit.
   ========================================================================== */

export type Role =
  | 'Operator'
  | 'Foreman'
  | 'Supervisor'
  | 'Planner'
  | 'Superintendent'
  | 'Project Manager'
  | 'Operation Manager'
  | 'Commercial Manager'
  | 'Finance Manager'
  | 'Direktur'
  | 'System Admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  avatar: string
  /** Jabatan operasional (level 1–10 pada dokumen). */
  level: number
  /** Penempatan proyek/site — dipakai sebagai data scope. */
  site: string
  department: string
  password: string
  status: 'Active' | 'Inactive'
  lastLogin: string
}

/** Tingkat kewenangan sebuah peran terhadap sebuah modul. */
export type Authority =
  | 'none' // tidak boleh membuka
  | 'view' // hanya melihat
  | 'export' // boleh mengekspor data yang dilihat
  | 'create' // membuat data sendiri
  | 'verify' // memeriksa/memverifikasi data tim
  | 'approve' // menyetujui sesuai limit
  | 'close' // menutup transaksi
  | 'admin' // akses teknis penuh

export const AUTHORITY_RANK: Record<Authority, number> = {
  none: 0,
  view: 1,
  export: 2,
  create: 3,
  verify: 4,
  approve: 5,
  close: 6,
  admin: 7,
}

export const AUTHORITY_LABEL: Record<Authority, string> = {
  none: 'Tidak ada akses',
  view: 'Lihat',
  export: 'Ekspor data',
  create: 'Buat data',
  verify: 'Verifikasi',
  approve: 'Setujui',
  close: 'Tutup transaksi',
  admin: 'Akses teknis',
}

/** Tindakan standar yang dikenali sistem (dokumen §4.1). */
export type Action =
  | 'view'
  | 'create'
  | 'edit_draft'
  | 'submit'
  | 'verify'
  | 'approve'
  | 'reject'
  | 'return_for_correction'
  | 'close'
  | 'reopen'
  | 'export'
  | 'admin_config'

export const ACTION_LABEL: Record<Action, string> = {
  view: 'Melihat data',
  create: 'Membuat data',
  edit_draft: 'Mengubah draft',
  submit: 'Mengirim untuk diperiksa',
  verify: 'Memverifikasi',
  approve: 'Menyetujui',
  reject: 'Menolak dengan alasan',
  return_for_correction: 'Mengembalikan untuk diperbaiki',
  close: 'Menutup transaksi',
  reopen: 'Membuka kembali',
  export: 'Mengekspor data',
  admin_config: 'Mengubah konfigurasi sistem',
}

/* ==========================================================================
   Definisi modul (15 modul + dashboard + tugas + pengaturan)
   ========================================================================== */

export interface ModuleDef {
  path: string
  label: string
  /** Nomor modul pada dokumen kerangka. */
  ref: string
  group: string
  /** Ringkasan fungsi modul. */
  desc: string
}

export const MODULES: ModuleDef[] = [
  { path: '/dashboard', label: 'Dashboard', ref: '—', group: 'Utama', desc: 'Ringkasan operasional yang berbeda menurut peran dan tanggung jawab.' },
  { path: '/tugas-saya', label: 'Tugas Saya', ref: '—', group: 'Utama', desc: 'Daftar item yang membutuhkan tindakan pengguna, bukan sekadar angka.' },
  { path: '/proyek-kontrak', label: 'Proyek & Kontrak', ref: 'Modul 1', group: 'Komersial', desc: 'Identitas proyek, kontrak, tarif, cakupan pekerjaan, masa berlaku, dan aturan pengukuran.' },
  { path: '/perencanaan', label: 'Perencanaan Produksi', ref: 'Modul 2', group: 'Operasional', desc: 'Target harian/mingguan per shift, pit, aktivitas, dan kelompok alat.' },
  { path: '/monitoring-produksi', label: 'Monitoring Produksi', ref: 'Modul 3', group: 'Operasional', desc: 'Pencatatan hasil pekerjaan, target vs aktual, dan data terverifikasi.' },
  { path: '/dispatch', label: 'Dispatch & Alokasi Armada', ref: 'Modul 4', group: 'Operasional', desc: 'Penugasan unit dan operator ke pit/area, pencatatan perubahan alokasi.' },
  { path: '/master-unit', label: 'Master Unit & Alat', ref: 'Modul 5', group: 'Operasional', desc: 'Data aset unit, spesifikasi, kepemilikan, jam meter, dan status operasional.' },
  { path: '/downtime', label: 'Downtime & Performa Alat', ref: 'Modul 6', group: 'Operasional', desc: 'Pencatatan waktu tidak produktif, penyebab, durasi, dan dampaknya.' },
  { path: '/maintenance', label: 'Maintenance & Work Order', ref: 'Modul 7', group: 'Pemeliharaan', desc: 'Alur kerusakan sampai WO, part, mekanik, pengujian, dan penutupan.' },
  { path: '/bbm', label: 'Manajemen BBM', ref: 'Modul 8', group: 'Pemeliharaan', desc: 'Penerimaan, transfer, pengisian ke unit, rekonsiliasi stok, dan konsumsi.' },
  { path: '/gudang', label: 'Inventory & Gudang', ref: 'Modul 9', group: 'Pemeliharaan', desc: 'Master barang, penerimaan, pengeluaran, transfer, retur, reservasi, stock opname.' },
  { path: '/pengadaan', label: 'Procurement & Pembelian', ref: 'Modul 10', group: 'Komersial', desc: 'Purchase requisition, penawaran, purchase order, penerimaan, dan pencocokan dokumen.' },
  { path: '/personel', label: 'Personel, Shift & Kompetensi', ref: 'Modul 11', group: 'SDM', desc: 'Master personel, jadwal shift, penempatan, kompetensi, lisensi, dan serah terima shift.' },
  { path: '/hse', label: 'HSE, Inspeksi & Tindakan Korektif', ref: 'Modul 12', group: 'SDM', desc: 'Inspeksi, hazard, risk assessment, near miss/insiden, PIC, tenggat, dan verifikasi.' },
  { path: '/biaya', label: 'Cost Control & Profitabilitas', ref: 'Modul 13', group: 'Komersial', desc: 'Budget vs actual, biaya per BCM/ton/jam, komitmen PO, dan margin indikatif.' },
  { path: '/rekonsiliasi', label: 'Rekonsiliasi & Billing', ref: 'Modul 14', group: 'Komersial', desc: 'Rekonsiliasi volume pekerjaan, selisih & alasan, tarif efektif, dan paket penagihan.' },
  { path: '/laporan', label: 'Laporan, Notifikasi & Audit', ref: 'Modul 15', group: 'Utama', desc: 'Laporan standar, eskalasi, riwayat perubahan, dan log aktivitas penting.' },
  { path: '/pengaturan', label: 'Pengaturan Sistem', ref: '—', group: 'Sistem', desc: 'Master konfigurasi, akun, peran, ambang notifikasi, dan integrasi.' },
]

export const MODULE_PATHS = MODULES.map((m) => m.path)

/* ==========================================================================
   Dimensi 1 & 3 — matriks kewenangan peran × modul
   ========================================================================== */

export const AUTHORITY_MATRIX: Record<Role, Record<string, Authority>> = {
  Operator: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'none',
    '/perencanaan': 'none',
    '/monitoring-produksi': 'create',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'create',
    '/maintenance': 'create',
    '/bbm': 'create',
    '/gudang': 'none',
    '/pengadaan': 'none',
    '/personel': 'view',
    '/hse': 'create',
    '/biaya': 'none',
    '/rekonsiliasi': 'none',
    '/laporan': 'none',
    '/pengaturan': 'none',
  },
  Foreman: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'view',
    '/monitoring-produksi': 'verify',
    '/dispatch': 'create',
    '/master-unit': 'view',
    '/downtime': 'verify',
    '/maintenance': 'create',
    '/bbm': 'verify',
    '/gudang': 'create',
    '/pengadaan': 'create',
    '/personel': 'verify',
    '/hse': 'verify',
    '/biaya': 'none',
    '/rekonsiliasi': 'view',
    '/laporan': 'view',
    '/pengaturan': 'none',
  },
  Supervisor: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'create',
    '/monitoring-produksi': 'approve',
    '/dispatch': 'approve',
    '/master-unit': 'view',
    '/downtime': 'approve',
    '/maintenance': 'approve',
    '/bbm': 'approve',
    '/gudang': 'approve',
    '/pengadaan': 'verify',
    '/personel': 'approve',
    '/hse': 'approve',
    '/biaya': 'view',
    '/rekonsiliasi': 'verify',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  Planner: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'create',
    '/monitoring-produksi': 'view',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'create',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'view',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'view',
    '/rekonsiliasi': 'create',
    '/laporan': 'create',
    '/pengaturan': 'none',
  },
  Superintendent: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'approve',
    '/monitoring-produksi': 'view',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'approve',
    '/bbm': 'view',
    '/gudang': 'approve',
    '/pengadaan': 'verify',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'view',
    '/rekonsiliasi': 'verify',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  'Project Manager': {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'approve',
    '/monitoring-produksi': 'view',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'view',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'approve',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'view',
    '/rekonsiliasi': 'approve',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  'Operation Manager': {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'view',
    '/monitoring-produksi': 'view',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'view',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'view',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'view',
    '/rekonsiliasi': 'view',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  'Commercial Manager': {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'approve',
    '/perencanaan': 'view',
    '/monitoring-produksi': 'view',
    '/dispatch': 'none',
    '/master-unit': 'none',
    '/downtime': 'view',
    '/maintenance': 'view',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'view',
    '/personel': 'none',
    '/hse': 'none',
    '/biaya': 'view',
    '/rekonsiliasi': 'approve',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  'Finance Manager': {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'none',
    '/monitoring-produksi': 'view',
    '/dispatch': 'none',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'view',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'approve',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'approve',
    '/rekonsiliasi': 'view',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  Direktur: {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'view',
    '/perencanaan': 'view',
    '/monitoring-produksi': 'view',
    '/dispatch': 'view',
    '/master-unit': 'view',
    '/downtime': 'view',
    '/maintenance': 'view',
    '/bbm': 'view',
    '/gudang': 'view',
    '/pengadaan': 'view',
    '/personel': 'view',
    '/hse': 'view',
    '/biaya': 'view',
    '/rekonsiliasi': 'view',
    '/laporan': 'export',
    '/pengaturan': 'none',
  },
  /* System Admin: akses teknis penuh, TETAPI tanpa kewenangan bisnis
     (dokumen §3.11 — admin teknis ≠ approver transaksi bisnis). */
  'System Admin': {
    '/dashboard': 'view',
    '/tugas-saya': 'view',
    '/proyek-kontrak': 'admin',
    '/perencanaan': 'admin',
    '/monitoring-produksi': 'admin',
    '/dispatch': 'admin',
    '/master-unit': 'admin',
    '/downtime': 'admin',
    '/maintenance': 'admin',
    '/bbm': 'admin',
    '/gudang': 'admin',
    '/pengadaan': 'admin',
    '/personel': 'admin',
    '/hse': 'admin',
    '/biaya': 'admin',
    '/rekonsiliasi': 'admin',
    '/laporan': 'admin',
    '/pengaturan': 'admin',
  },
}

/* ==========================================================================
   Dimensi 2 — data scope per peran
   ========================================================================== */

export interface DataScope {
  /** Proyek/site yang boleh diakses. */
  projects: 'all' | string[]
  /** Departemen yang boleh diakses. */
  departments: 'all' | string[]
  /** Keterangan cakupan untuk ditampilkan di UI. */
  note: string
}

export const DEPARTMENTS = ['Produksi', 'Hauling', 'Maintenance', 'Fuel', 'Warehouse', 'Procurement', 'HSE', 'Cost Control', 'Commercial'] as const

export const DATA_SCOPE: Record<Role, DataScope> = {
  Operator: { projects: [], departments: [], note: 'Hanya unit & penugasan sendiri' },
  Foreman: { projects: [], departments: [], note: 'Tim & area yang ditugaskan' },
  Supervisor: { projects: [], departments: [], note: 'Departemen & proyek penugasan' },
  Planner: { projects: [], departments: [], note: 'Proyek penugasan (semua departemen)' },
  Superintendent: { projects: [], departments: [], note: 'Beberapa tim/area dalam proyek' },
  'Project Manager': { projects: [], departments: 'all', note: 'Satu proyek, lintas departemen' },
  'Operation Manager': { projects: 'all', departments: 'all', note: 'Semua proyek, lintas departemen' },
  'Commercial Manager': { projects: 'all', departments: ['Commercial', 'Cost Control'], note: 'Semua proyek — data komersial' },
  'Finance Manager': { projects: 'all', departments: 'all', note: 'Semua proyek — data finansial' },
  Direktur: { projects: 'all', departments: 'all', note: 'Seluruh perusahaan (ringkasan)' },
  'System Admin': { projects: 'all', departments: 'all', note: 'Semua proyek — akses teknis saja' },
}

/** Proyek/site demo pada aplikasi. */
export const PROJECTS = [
  { id: 'prj-1', code: 'OBR-BRU', name: 'Overburden Removal Berau', owner: 'PT Tambang Batu Bara Sejahtera', site: 'Site Berau' },
  { id: 'prj-2', code: 'CG-LHT', name: 'Coal Getting Lahat', owner: 'PT Tambang Batu Bara Sejahtera', site: 'Site Lahat' },
  { id: 'prj-3', code: 'HAU-ME', name: 'Hauling Muara Enim', owner: 'PT Batu Bara Nusantara', site: 'Site Muara Enim' },
  { id: 'prj-4', code: 'RDM-TE', name: 'Road Maintenance Tanjung Enim', owner: 'PT Batu Bara Nusantara', site: 'Site Tanjung Enim' },
  { id: 'prj-5', code: 'DWT-LHT', name: 'Dewatering Lahat', owner: 'PT Tambang Batu Bara Sejahtera', site: 'Site Lahat' },
]

export const ROLE_ORDER: Role[] = [
  'Operator',
  'Foreman',
  'Supervisor',
  'Planner',
  'Superintendent',
  'Project Manager',
  'Operation Manager',
  'Commercial Manager',
  'Finance Manager',
  'Direktur',
  'System Admin',
]

export const ROLE_META: Record<Role, { level: number; desc: string; dept: string }> = {
  Operator: { level: 1, desc: 'Operator alat berat dan petugas lapangan — input di dekat sumber kejadian.', dept: 'Produksi' },
  Foreman: { level: 2, desc: 'Pengawas lapangan — memeriksa dan memvalidasi data timnya.', dept: 'Produksi' },
  Supervisor: { level: 3, desc: 'Pengawas departemen — menyetujui data operasional sesuai batas kewenangan.', dept: 'Produksi' },
  Planner: { level: 4, desc: 'Perencana/engineer — menyusun rencana dan analisis, bukan menyetujui transaksi.', dept: 'Produksi' },
  Superintendent: { level: 5, desc: 'Kepala departemen — mengendalikan rencana dan prioritas sumber daya.', dept: 'Maintenance' },
  'Project Manager': { level: 6, desc: 'Pemimpin proyek — pandangan lintas departemen untuk satu proyek/site.', dept: 'Manajemen' },
  'Operation Manager': { level: 7, desc: 'Manajer operasional — membandingkan beberapa proyek/site.', dept: 'Manajemen' },
  'Commercial Manager': { level: 8, desc: 'Manajer komersial — master kontrak, tarif, dan paket penagihan.', dept: 'Commercial' },
  'Finance Manager': { level: 9, desc: 'Manajer keuangan/biaya — budget vs actual, pembebanan biaya, margin.', dept: 'Cost Control' },
  Direktur: { level: 10, desc: 'Pimpinan perusahaan — indikator strategis dan keputusan yang menunggu.', dept: 'Direksi' },
  'System Admin': { level: 0, desc: 'Administrator teknis — akun, konfigurasi, integrasi, dan log. Tanpa kewenangan bisnis.', dept: 'IT' },
}

export const ROLE_TONE: Record<Role, 'amber' | 'sky' | 'emerald' | 'violet' | 'rose' | 'neutral'> = {
  Operator: 'rose',
  Foreman: 'amber',
  Supervisor: 'sky',
  Planner: 'violet',
  Superintendent: 'violet',
  'Project Manager': 'emerald',
  'Operation Manager': 'emerald',
  'Commercial Manager': 'amber',
  'Finance Manager': 'sky',
  Direktur: 'amber',
  'System Admin': 'neutral',
}

/** Direktori akun demo — dipakai halaman login maupun Pengaturan. */
export const ACCOUNTS: AuthUser[] = [
  { id: 'usr-1', name: 'Budi Santoso', email: 'operator@kontraktor.co.id', role: 'Operator', avatar: 'BS', level: 1, site: 'Site Berau', department: 'Produksi', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 06:10' },
  { id: 'usr-2', name: 'Joko Prasetyo', email: 'foreman@kontraktor.co.id', role: 'Foreman', avatar: 'JP', level: 2, site: 'Site Berau', department: 'Produksi', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 06:25' },
  { id: 'usr-3', name: 'Dedi Kurniawan', email: 'supervisor@kontraktor.co.id', role: 'Supervisor', avatar: 'DK', level: 3, site: 'Site Berau', department: 'Produksi', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 07:00' },
  { id: 'usr-4', name: 'Ir. Sari Wulandari', email: 'planner@kontraktor.co.id', role: 'Planner', avatar: 'SW', level: 4, site: 'Site Lahat', department: 'Produksi', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 07:15' },
  { id: 'usr-5', name: 'Ir. Agus Setiawan', email: 'superintendent@kontraktor.co.id', role: 'Superintendent', avatar: 'AS', level: 5, site: 'Site Berau', department: 'Maintenance', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 07:30' },
  { id: 'usr-6', name: 'Ir. Bambang Wijaya', email: 'pm@kontraktor.co.id', role: 'Project Manager', avatar: 'BW', level: 6, site: 'Site Berau', department: 'Manajemen', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 07:45' },
  { id: 'usr-7', name: 'Rina Hartati, S.E.', email: 'om@kontraktor.co.id', role: 'Operation Manager', avatar: 'RH', level: 7, site: 'Semua Site', department: 'Manajemen', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:00' },
  { id: 'usr-8', name: 'Andi Prasetyo, S.E.', email: 'commercial@kontraktor.co.id', role: 'Commercial Manager', avatar: 'AP', level: 8, site: 'Semua Site', department: 'Commercial', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:10' },
  { id: 'usr-9', name: 'Maya Kusuma, S.E., Ak.', email: 'finance@kontraktor.co.id', role: 'Finance Manager', avatar: 'MK', level: 9, site: 'Semua Site', department: 'Cost Control', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:20' },
  { id: 'usr-10', name: 'Ir. Hendra Gunawan', email: 'direktur@kontraktor.co.id', role: 'Direktur', avatar: 'HG', level: 10, site: 'Semua Site', department: 'Direksi', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:30' },
  { id: 'usr-11', name: 'Fajar Ramadhan', email: 'admin@kontraktor.co.id', role: 'System Admin', avatar: 'FR', level: 0, site: 'Semua Site', department: 'IT', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:40' },
  { id: 'usr-12', name: 'Slamet Riyadi', email: 'operator2@kontraktor.co.id', role: 'Operator', avatar: 'SR', level: 1, site: 'Site Lahat', department: 'Produksi', password: 'mifa2026', status: 'Inactive', lastLogin: '2026-08-02 11:40' },
]

/* ==========================================================================
   Helper hak akses
   ========================================================================== */

/** Dimensi 1 & 3 — tingkat kewenangan peran pada sebuah modul. */
export function authorityOf(role: Role | undefined, path: string): Authority {
  if (!role) return 'none'
  return AUTHORITY_MATRIX[role][path] ?? 'none'
}

/** Apakah peran boleh membuka modul? */
export function canAccess(role: Role | undefined, path: string): boolean {
  return authorityOf(role, path) !== 'none'
}

/** Apakah kewenangan peran minimal setingkat `min`? */
export function hasAuthority(role: Role | undefined, path: string, min: Authority): boolean {
  return AUTHORITY_RANK[authorityOf(role, path)] >= AUTHORITY_RANK[min]
}

/** Dimensi 2 — daftar proyek yang boleh diakses peran. */
export function scopeProjects(role: Role | undefined): string[] {
  if (!role) return []
  const s = DATA_SCOPE[role]
  return s.projects === 'all' ? PROJECTS.map((p) => p.id) : s.projects
}

/** Dimensi 2 — daftar departemen yang boleh diakses peran. */
export function scopeDepartments(role: Role | undefined): string[] {
  if (!role) return []
  const s = DATA_SCOPE[role]
  return s.departments === 'all' ? [...DEPARTMENTS] : s.departments
}

/** Kompatibilitas: peran boleh melakukan tindakan bernama `action` pada modul? */
export function canDo(role: Role | undefined, action: string): boolean {
  /* Nama tindakan mengikuti format "<kelompok>.<tindakan>" pada kerangka dokumen. */
  const map: Record<string, string> = {
    'production.input': '/monitoring-produksi',
    'production.approve': '/monitoring-produksi',
    'planning.create': '/perencanaan',
    'planning.approve': '/perencanaan',
    'downtime.create': '/downtime',
    'downtime.verify': '/downtime',
    'dispatch.create': '/dispatch',
    'maintenance.create': '/maintenance',
    'maintenance.approve': '/maintenance',
    'maintenance.close': '/maintenance',
    'fuel.create': '/bbm',
    'fuel.verify': '/bbm',
    'warehouse.adjust': '/gudang',
    'warehouse.approve': '/gudang',
    'purchasing.create': '/pengadaan',
    'purchasing.approve': '/pengadaan',
    'personnel.manage': '/personel',
    'hse.incident': '/hse',
    'hse.approve': '/hse',
    'contract.manage': '/proyek-kontrak',
    'cost.create': '/biaya',
    'cost.approve': '/biaya',
    'billing.create': '/rekonsiliasi',
    'billing.approve': '/rekonsiliasi',
    'reports.export': '/laporan',
    'users.manage': '/pengaturan',
    'settings.manage': '/pengaturan',
  }
  const path = map[action]
  if (!path) return false
  const need: Authority = action.endsWith('.approve') || action.endsWith('.close') ? 'approve' : action.endsWith('.verify') ? 'verify' : action.endsWith('.manage') ? 'create' : 'create'
  return hasAuthority(role, path, need)
}

/** Apakah peran boleh melihat biaya/margin? (dokumen §3.1, §4.2) */
export function canSeeCost(role: Role | undefined): boolean {
  return authorityOf(role, '/biaya') !== 'none' || authorityOf(role, '/rekonsiliasi') !== 'none'
}

/** System Admin punya akses teknis tetapi bukan approver bisnis. */
export function isTechnicalOnly(role: Role | undefined): boolean {
  return role === 'System Admin'
}
