/* ==========================================================================
   Direktori akun demo + matriks hak akses (RBAC)
   --------------------------------------------------------------------------
   CATATAN KEAMANAN: modul ini adalah lapisan autentikasi DEMO sisi klien.
   Kredensial di sini hanya untuk keperluan demo/development. Autentikasi
   sesungguhnya (hash bcrypt, JWT, refresh token, rate limiting) akan
   diimplementasikan pada backend API di tahap berikutnya.
   ========================================================================== */

export type Role = 'Super Admin' | 'GM Operasional' | 'Manager Keuangan' | 'Manager HSE' | 'Staff Produksi'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  avatar: string
  site: string
  password: string
  /** Status akun pada direktori (demo). */
  status: 'Active' | 'Inactive'
  /** Waktu login terakhir (demo). */
  lastLogin: string
}

export const ROLE_ORDER: Role[] = ['Super Admin', 'GM Operasional', 'Manager Keuangan', 'Manager HSE', 'Staff Produksi']

export const ROLE_DESC: Record<Role, string> = {
  'Super Admin': 'Akses penuh seluruh modul, pengelolaan pengguna, dan konfigurasi sistem.',
  'GM Operasional': 'Akses penuh modul operasional & komersial, tanpa konfigurasi sistem.',
  'Manager Keuangan': 'Fokus keuangan, penjualan, pembelian, SDM, dan pelaporan fiskal.',
  'Manager HSE': 'Fokus K3LH, lingkungan, kepatuhan AMDAL, dan pelaporan regulasi.',
  'Staff Produksi': 'Input harian produksi, armada, dan K3LH di site penugasan.',
}

/** Direktori akun demo — dipakai halaman login maupun Pengaturan. */
export const ACCOUNTS: AuthUser[] = [
  { id: 'usr-1', name: 'Ir. Bambang Setiawan', email: 'bambang@mifacoal.co.id', role: 'Super Admin', avatar: 'BS', site: 'Semua Site', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:12' },
  { id: 'usr-2', name: 'Ir. Hendra Wijaya', email: 'hendra@mifacoal.co.id', role: 'GM Operasional', avatar: 'HW', site: 'Semua Site', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 07:45' },
  { id: 'usr-3', name: 'Maya Kusuma, S.E., Ak.', email: 'maya@mifacoal.co.id', role: 'Manager Keuangan', avatar: 'MK', site: 'Kantor Pusat', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-14 16:20' },
  { id: 'usr-4', name: 'Siti Nurhaliza, S.T.', email: 'siti@mifacoal.co.id', role: 'Manager HSE', avatar: 'SN', site: 'Semua Site', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 06:58' },
  { id: 'usr-5', name: 'Dedi Prasetyo', email: 'dedi@mifacoal.co.id', role: 'Staff Produksi', avatar: 'DP', site: 'Site Lahat', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-15 08:30' },
  { id: 'usr-6', name: 'Fitri Ramadani', email: 'fitri@mifacoal.co.id', role: 'Staff Produksi', avatar: 'FR', site: 'Site Muara Enim', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-14 14:05' },
  { id: 'usr-7', name: 'Agus Salim, S.T.', email: 'agus@mifacoal.co.id', role: 'Manager HSE', avatar: 'AS', site: 'Site Berau', password: 'mifa2026', status: 'Active', lastLogin: '2026-10-13 09:15' },
  { id: 'usr-8', name: 'Yanti Lestari', email: 'yanti@mifacoal.co.id', role: 'Staff Produksi', avatar: 'YL', site: 'Site Tanjung Enim', password: 'mifa2026', status: 'Inactive', lastLogin: '2026-08-02 11:40' },
]

/* ==========================================================================
   Matriks hak akses modul
   ========================================================================== */

export interface ModuleDef {
  path: string
  label: string
  group: string
}

export const MODULES: ModuleDef[] = [
  { path: '/dashboard', label: 'Dashboard Eksekutif', group: 'Utama' },
  { path: '/production', label: 'Produksi & Pit', group: 'Operasional Tambang' },
  { path: '/mine-planning', label: 'Perencanaan Tambang', group: 'Operasional Tambang' },
  { path: '/fleet', label: 'Armada & Maintenance', group: 'Operasional Tambang' },
  { path: '/inventory', label: 'Inventory & Logistik', group: 'Operasional Tambang' },
  { path: '/hse', label: 'K3LH & Lingkungan', group: 'Operasional Tambang' },
  { path: '/shipping', label: 'Pelabuhan & Bongkar Muat', group: 'Komersial' },
  { path: '/sales', label: 'Penjualan & Kontrak', group: 'Komersial' },
  { path: '/purchasing', label: 'Pembelian & Vendor', group: 'Komersial' },
  { path: '/legal', label: 'Legal & Compliance IUP', group: 'Komersial' },
  { path: '/hr', label: 'SDM & Pengupahan', group: 'SDM & Keuangan' },
  { path: '/finance', label: 'Keuangan & RKAB', group: 'SDM & Keuangan' },
  { path: '/reports', label: 'Pusat Laporan', group: 'Utama' },
  { path: '/settings', label: 'Pengaturan', group: 'Sistem' },
]

export const ACCESS_MATRIX: Record<Role, Record<string, boolean>> = {
  'Super Admin': {
    '/dashboard': true, '/production': true, '/mine-planning': true, '/fleet': true, '/inventory': true, '/hse': true,
    '/shipping': true, '/sales': true, '/purchasing': true, '/legal': true, '/hr': true, '/finance': true,
    '/reports': true, '/settings': true,
  },
  'GM Operasional': {
    '/dashboard': true, '/production': true, '/mine-planning': true, '/fleet': true, '/inventory': true, '/hse': true,
    '/shipping': true, '/sales': true, '/purchasing': true, '/legal': true, '/hr': true, '/finance': true,
    '/reports': true, '/settings': false,
  },
  'Manager Keuangan': {
    '/dashboard': true, '/production': true, '/mine-planning': false, '/fleet': false, '/inventory': true, '/hse': false,
    '/shipping': true, '/sales': true, '/purchasing': true, '/legal': true, '/hr': true, '/finance': true,
    '/reports': true, '/settings': false,
  },
  'Manager HSE': {
    '/dashboard': true, '/production': true, '/mine-planning': false, '/fleet': false, '/inventory': false, '/hse': true,
    '/shipping': false, '/sales': false, '/purchasing': false, '/legal': true, '/hr': true, '/finance': false,
    '/reports': true, '/settings': false,
  },
  'Staff Produksi': {
    '/dashboard': true, '/production': true, '/mine-planning': true, '/fleet': true, '/inventory': true, '/hse': true,
    '/shipping': false, '/sales': false, '/purchasing': false, '/legal': false, '/hr': false, '/finance': false,
    '/reports': true, '/settings': false,
  },
}

/* ==========================================================================
   Matriks hak akses tindakan (write/approve)
   ========================================================================== */

export type Action =
  | 'production.input'
  | 'production.approve'
  | 'planning.create'
  | 'planning.approve'
  | 'blending.manage'
  | 'shipping.schedule'
  | 'shipping.release'
  | 'sales.create'
  | 'sales.approve'
  | 'purchasing.create'
  | 'purchasing.approve'
  | 'inventory.adjust'
  | 'fleet.wo'
  | 'hse.incident'
  | 'hr.employee'
  | 'finance.post'
  | 'legal.manage'
  | 'reports.export'
  | 'users.manage'
  | 'settings.manage'

export const ACTION_LABEL: Record<Action, string> = {
  'production.input': 'Input laporan produksi harian',
  'production.approve': 'Verifikasi & setujui laporan produksi',
  'planning.create': 'Buat rencana tambang',
  'planning.approve': 'Setujui rencana tambang',
  'blending.manage': 'Kelola resep blending',
  'shipping.schedule': 'Jadwalkan kapal/barge',
  'shipping.release': 'Lepas tambat & terbitkan BL',
  'sales.create': 'Buat sales order',
  'sales.approve': 'Konfirmasi sales order',
  'purchasing.create': 'Buat purchase order',
  'purchasing.approve': 'Setujui purchase order',
  'inventory.adjust': 'Penyesuaian stok gudang',
  'fleet.wo': 'Buat & tutup work order',
  'hse.incident': 'Lapor & tutup insiden K3',
  'hr.employee': 'Kelola data karyawan',
  'finance.post': 'Posting jurnal & approval keuangan',
  'legal.manage': 'Kelola izin & kewajiban kepatuhan',
  'reports.export': 'Ekspor laporan',
  'users.manage': 'Kelola pengguna & hak akses',
  'settings.manage': 'Konfigurasi parameter sistem',
}

export const ACTION_MATRIX: Record<Role, Record<Action, boolean>> = {
  'Super Admin': {
    'production.input': true, 'production.approve': true, 'planning.create': true, 'planning.approve': true, 'blending.manage': true,
    'shipping.schedule': true, 'shipping.release': true, 'sales.create': true, 'sales.approve': true, 'purchasing.create': true,
    'purchasing.approve': true, 'inventory.adjust': true, 'fleet.wo': true, 'hse.incident': true, 'hr.employee': true,
    'finance.post': true, 'legal.manage': true, 'reports.export': true, 'users.manage': true, 'settings.manage': true,
  },
  'GM Operasional': {
    'production.input': true, 'production.approve': true, 'planning.create': true, 'planning.approve': true, 'blending.manage': true,
    'shipping.schedule': true, 'shipping.release': true, 'sales.create': true, 'sales.approve': true, 'purchasing.create': true,
    'purchasing.approve': true, 'inventory.adjust': true, 'fleet.wo': true, 'hse.incident': true, 'hr.employee': true,
    'finance.post': false, 'legal.manage': true, 'reports.export': true, 'users.manage': false, 'settings.manage': false,
  },
  'Manager Keuangan': {
    'production.input': false, 'production.approve': false, 'planning.create': false, 'planning.approve': false, 'blending.manage': false,
    'shipping.schedule': true, 'shipping.release': false, 'sales.create': true, 'sales.approve': true, 'purchasing.create': true,
    'purchasing.approve': true, 'inventory.adjust': true, 'fleet.wo': false, 'hse.incident': false, 'hr.employee': true,
    'finance.post': true, 'legal.manage': true, 'reports.export': true, 'users.manage': false, 'settings.manage': false,
  },
  'Manager HSE': {
    'production.input': false, 'production.approve': false, 'planning.create': false, 'planning.approve': false, 'blending.manage': false,
    'shipping.schedule': false, 'shipping.release': false, 'sales.create': false, 'sales.approve': false, 'purchasing.create': false,
    'purchasing.approve': false, 'inventory.adjust': false, 'fleet.wo': false, 'hse.incident': true, 'hr.employee': false,
    'finance.post': false, 'legal.manage': true, 'reports.export': true, 'users.manage': false, 'settings.manage': false,
  },
  'Staff Produksi': {
    'production.input': true, 'production.approve': false, 'planning.create': true, 'planning.approve': false, 'blending.manage': false,
    'shipping.schedule': false, 'shipping.release': false, 'sales.create': false, 'sales.approve': false, 'purchasing.create': false,
    'purchasing.approve': false, 'inventory.adjust': true, 'fleet.wo': true, 'hse.incident': true, 'hr.employee': false,
    'finance.post': false, 'legal.manage': false, 'reports.export': false, 'users.manage': false, 'settings.manage': false,
  },
}

/** Apakah peran boleh membuka modul pada path tertentu? */
export function canAccess(role: Role | undefined, path: string): boolean {
  if (!role) return false
  return ACCESS_MATRIX[role][path] === true
}

/** Apakah peran boleh menjalankan tindakan tertentu? */
export function canDo(role: Role | undefined, action: Action): boolean {
  if (!role) return false
  return ACTION_MATRIX[role][action] === true
}

/** Nada badge untuk peran — dipakai sidebar, topbar, dan Pengaturan. */
export const ROLE_TONE: Record<Role, 'amber' | 'sky' | 'emerald' | 'violet' | 'rose'> = {
  'Super Admin': 'amber',
  'GM Operasional': 'sky',
  'Manager Keuangan': 'emerald',
  'Manager HSE': 'violet',
  'Staff Produksi': 'rose',
}
