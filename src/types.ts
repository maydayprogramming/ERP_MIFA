/* ==========================================================================
   MIFA ERP — Domain Types (Coal Mining Enterprise)
   ========================================================================== */

export type ID = string

/* ---------------------------- Organisasi ---------------------------- */

export interface Site {
  id: ID
  code: string
  name: string
  region: string
  province: string
  iupNo: string
  iupStage: 'Eksplorasi' | 'Konstruksi' | 'Produksi' | 'Pengembangan'
  areaHa: number
  reservesMt: number
  status: 'Operating' | 'Ramp-up' | 'Suspended' | 'Care & Maintenance'
  manager: string
  contractor: string
  coalType: string
  gcvAr: number
}

export interface Employee {
  id: ID
  nip: string
  name: string
  position: string
  department: string
  siteId: ID
  joinDate: string
  status: 'Permanent' | 'Contract' | 'Outsource'
  salaryIdr: number
  certifications: string[]
}

/* ---------------------------- Operasional ---------------------------- */

export type Shift = 'Shift 1' | 'Shift 2' | 'Shift 3'

export interface ProductionRecord {
  id: ID
  date: string
  siteId: ID
  shift: Shift
  coalMt: number
  obBcm: number
  romMt: number
  haulDistanceKm: number
  haulingTrips: number
  gcvAr: number
  totalMoisture: number
  ash: number
  sulfur: number
  status: 'Draft' | 'Verified' | 'Approved'
  createdBy: string
}

export interface Stockpile {
  id: ID
  name: string
  siteId: ID
  capacityMt: number
  tonnageMt: number
  gcvAr: number
  ash: number
  sulfur: number
  moisture: number
  status: 'Filling' | 'Reclaiming' | 'Stable' | 'Closed'
}

export interface WarehouseItem {
  id: ID
  sku: string
  name: string
  category: 'Spare Part' | 'Consumable' | 'ATK' | 'Safety' | 'Tyres' | 'Bahan Peledak'
  unit: string
  stock: number
  minStock: number
  maxStock: number
  location: string
  siteId: ID
  unitCostIdr: number
}

export interface FuelTank {
  id: ID
  name: string
  siteId: ID
  fuelType: 'Solar' | 'Bensin' | 'Oli Aki'
  capacityL: number
  levelL: number
  lastDip: string
}

/* ---------------------------- Armada ---------------------------- */

export type EquipmentType =
  | 'Excavator'
  | 'Haul Truck'
  | 'Dozer'
  | 'Grader'
  | 'Water Truck'
  | 'Drill'
  | 'Loader'
  | 'Support'

export type EquipmentStatus = 'Operating' | 'Standby' | 'Maintenance' | 'Breakdown' | 'Idle'

export interface Equipment {
  id: ID
  code: string
  name: string
  type: EquipmentType
  brand: string
  model: string
  year: number
  siteId: ID
  hourMeter: number
  status: EquipmentStatus
  availabilityPct: number
  utilizationPct: number
  fuelLph: number
  lastServiceHm: number
  nextServiceHm: number
  operator: string
  tyreLifePct: number
}

export interface MaintenanceJob {
  id: ID
  woNo: string
  equipmentId: ID
  type: 'Preventive' | 'Corrective' | 'Major' | 'Inspection'
  description: string
  scheduledDate: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue'
  costIdr: number
  mechanic: string
}

/* ---------------------------- HSE ---------------------------- */

export type IncidentType =
  | 'LTI'
  | 'MTC'
  | 'FAC'
  | 'Near Miss'
  | 'Environmental'
  | 'Property Damage'
  | 'Fatality'

export interface Incident {
  id: ID
  date: string
  siteId: ID
  type: IncidentType
  severity: 'Minor' | 'Moderate' | 'Major' | 'Fatality'
  description: string
  person: string
  department: string
  lostDays: number
  status: 'Open' | 'Investigation' | 'Closed'
  correctiveAction: string
}

export interface TrainingRecord {
  id: ID
  program: string
  category: 'K3 Umum' | 'Teknis' | 'Lingkungan' | 'Manajemen' | 'POP'
  date: string
  siteId: ID
  attendees: number
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  trainer: string
}

export interface EnvironmentalReading {
  id: ID
  date: string
  siteId: ID
  parameter: 'PM10' | 'Debu (TSP)' | 'Noise' | 'pH Air' | 'TSS' | 'COD'
  value: number
  unit: string
  threshold: number
  location: string
  status: 'Compliant' | 'Warning' | 'Exceeded'
}

/* ---------------------------- Komersial ---------------------------- */

export interface Customer {
  id: ID
  code: string
  name: string
  sector: 'Power Plant' | 'Cement' | 'Paper' | 'Trader' | 'Steel' | 'Others'
  type: 'Domestic' | 'Export'
  city: string
  contact: string
  creditLimitIdr: number
  outstandingIdr: number
  status: 'Active' | 'Watchlist' | 'Inactive'
}

export interface Contract {
  id: ID
  code: string
  customerId: ID
  type: 'Domestic' | 'Export'
  startDate: string
  endDate: string
  volumeMt: number
  liftedMt: number
  priceUsdPerMt: number
  qualitySpec: string
  incoterm: 'FOB' | 'CIF' | 'FOB Barge' | 'DAP' | 'CFR'
  status: 'Active' | 'Expiring' | 'Closed' | 'Draft'
}

export interface SalesOrder {
  id: ID
  soNo: string
  date: string
  contractId: ID
  customerId: ID
  siteId: ID
  tonnageMt: number
  priceUsdPerMt: number
  incoterm: string
  vesselBarge: string
  eta: string
  surveyor: 'SGS' | 'Cointeste' | 'Intertek' | 'Geoservices'
  coaGcv: number
  status:
    | 'Draft'
    | 'Confirmed'
    | 'Loading'
    | 'Loaded'
    | 'Shipped'
    | 'Invoiced'
    | 'Paid'
    | 'Cancelled'
}

export interface Vendor {
  id: ID
  code: string
  name: string
  category: 'Fuel' | 'Bahan Peledak' | 'Spare Part' | 'Tyres' | 'Services' | 'Consumables'
  city: string
  contact: string
  rating: number
  status: 'Approved' | 'Pending' | 'Blacklisted'
  totalSpendIdr: number
}

export interface PurchaseOrder {
  id: ID
  poNo: string
  date: string
  vendorId: ID
  category: 'Fuel' | 'Bahan Peledak' | 'Spare Part' | 'Tyres' | 'Services' | 'Consumables'
  amountIdr: number
  items: number
  siteId: ID
  requestedBy: string
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Received' | 'Rejected'
  deliveryDate: string
}

/* ---------------------------- Keuangan ---------------------------- */

export interface JournalEntry {
  id: ID
  date: string
  journalNo: string
  description: string
  account: string
  debit: number
  credit: number
  module: 'Sales' | 'Procurement' | 'Production' | 'HR' | 'Fixed Asset' | 'Cash' | 'General'
  status: 'Draft' | 'Posted' | 'Void'
}

export interface Invoice {
  id: ID
  invoiceNo: string
  date: string
  dueDate: string
  soId: ID
  customerId: ID
  amountUsd: number
  status: 'Outstanding' | 'Partial' | 'Paid' | 'Overdue'
  taxInvoiceNo: string
}

export interface Bill {
  id: ID
  billNo: string
  date: string
  dueDate: string
  vendorId: ID
  poId: ID
  amountIdr: number
  status: 'Outstanding' | 'Partial' | 'Paid' | 'Overdue'
}

export interface BudgetLine {
  id: ID
  category: string
  siteId: ID
  period: string
  budgetIdr: number
  actualIdr: number
}

export interface CapexProject {
  id: ID
  code: string
  name: string
  siteId: ID
  startDate: string
  endDate: string
  budgetIdr: number
  spentIdr: number
  progressPct: number
  status: 'Planning' | 'Ongoing' | 'Completed' | 'On Hold'
}

export interface RoyaltyRecord {
  id: ID
  period: string
  siteId: ID
  volumeMt: number
  salesValueUsd: number
  royaltyUsd: number
  gcvBand: string
  ratePct: number
  status: 'Accrued' | 'Paid' | 'Pending'
}

/* ------------------------ Perencanaan Tambang ----------------------- */

export interface MinePlan {
  id: ID
  code: string
  siteId: ID
  period: string
  pit: string
  bench: string
  planCoalMt: number
  planObBcm: number
  actualCoalMt: number
  actualObBcm: number
  status: 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Revised'
  engineer: string
  notes: string
}

export interface BlendingComponent {
  stockpileId: ID
  pct: number
}

export interface BlendingRecipe {
  id: ID
  code: string
  name: string
  siteId: ID
  targetGcv: number
  targetAsh: number
  targetSulfur: number
  components: BlendingComponent[]
  volumeMt: number
  status: 'Draft' | 'Active' | 'Archived'
}

/* --------------------- Pelabuhan & Bongkar Muat --------------------- */

export interface Jetty {
  id: ID
  code: string
  name: string
  siteId: ID
  capacityMtPerDay: number
  maxDraftM: number
  status: 'Operating' | 'Maintenance' | 'Idle'
  bargesLoading: number
}

export interface Vessel {
  id: ID
  code: string
  name: string
  type: 'Barge' | 'Vessel' | 'Tug Boat'
  dwtMt: number
  customerId: ID
  contractId: ID
  jettyId: ID
  eta: string
  etb: string
  status: 'Waiting' | 'Loading' | 'Loaded' | 'Sailed' | 'Cancelled'
  tonnageMt: number
  loadedMt: number
  loadingRateMtPerDay: number
  blNumber: string
  surveyor: 'SGS' | 'Cointeste' | 'Intertek' | 'Geoservices'
  destination: string
}

/* ---------------------- Legal & Compliance IUP ---------------------- */

export type PermitType =
  | 'IUP OPK'
  | 'IUP OP'
  | 'PKP2B'
  | 'AMDAL'
  | 'UKL-UPL'
  | 'RKAB'
  | 'SIMBAT'
  | 'HO'
  | 'PNBP'
  | 'Izin Lingkungan'

export interface Permit {
  id: ID
  code: string
  type: PermitType
  siteId: ID
  number: string
  authority: string
  issuedDate: string
  expiryDate: string
  status: 'Aktif' | 'Akan Berakhir' | 'Expired' | 'Proses Perpanjangan'
  pic: string
}

export interface ComplianceObligation {
  id: ID
  code: string
  obligation: string
  authority: string
  category: 'Lingkungan' | 'Keselamatan' | 'Fiskal' | 'Tenaga Kerja' | 'Operasional'
  siteId: ID
  dueDate: string
  frequency: 'Bulanan' | 'Triwulan' | 'Tahunan' | 'Insidentil'
  status: 'Terpenuhi' | 'Proses' | 'Terlambat' | 'Belum Jatuh Tempo'
  evidence: string
  pic: string
}


/* ==========================================================================
   Domain Kontraktor Tambang — Mining Contractor ERP (Modul B)
   ========================================================================== */

/** Modul 1 — Proyek & Kontrak: kesepakatan pekerjaan dengan pemilik tambang. */
export interface ProjectContract {
  id: ID
  code: string
  name: string
  /** Pemilik tambang / pemberi kerja. */
  owner: string
  siteId: ID
  startDate: string
  endDate: string
  /** Jenis pekerjaan yang dicakup kontrak. */
  workTypes: Array<'OB Removal' | 'Coal Getting' | 'Hauling' | 'Road Maintenance' | 'Dewatering' | 'Lainnya'>
  /** Satuan pembayaran kontrak. */
  paymentUnit: 'BCM' | 'Ton' | 'Jam' | 'Km' | 'Lump Sum'
  /** Tarif efektif per satuan (IDR). */
  rateIdr: number
  /** Target volume kontrak dalam satuan pembayaran. */
  targetVolume: number
  /** Batas nilai persetujuan (IDR) — konfigurasi, bukan hardcode di logika. */
  approvalLimitIdr: number
  status: 'Draft' | 'Review' | 'Active' | 'Expiring' | 'Closed'
  /** Versi/amendment yang berlaku. */
  version: number
  notes: string
}

/** Modul 2 — Target produksi per shift/pit/aktivitas. */
export interface ProductionTarget {
  id: ID
  code: string
  contractId: ID
  siteId: ID
  period: string
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3'
  pit: string
  activity: 'OB Removal' | 'Coal Getting' | 'Hauling' | 'Road Maintenance' | 'Dewatering'
  unit: 'BCM' | 'Ton' | 'Km'
  targetQty: number
  /** Baseline yang disetujui; revisi disimpan sebagai versi baru. */
  version: number
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revised'
  planner: string
  reason: string
}

/** Modul 3 — Catatan produksi hasil lapangan. */
export interface ProductionLog {
  id: ID
  code: string
  date: string
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3'
  siteId: ID
  contractId: ID
  pit: string
  activity: 'OB Removal' | 'Coal Getting' | 'Hauling' | 'Road Maintenance' | 'Dewatering'
  /** Unit atau kelompok unit pelaksana. */
  unitIds: ID[]
  qty: number
  unit: 'BCM' | 'Ton' | 'Km'
  /** Metode pengukuran yang disepakati. */
  method: 'Survey' | 'Timbangan' | 'Hitung Trip' | 'Estimasi'
  /** Jam operasi dasar yang dipakai produktivitas. */
  operatingHours: number
  source: 'Manual' | 'Import' | 'GPS'
  inputBy: string
  /** Alur verifikasi berjenjang. */
  status: 'Draft' | 'Submitted' | 'Verified' | 'Approved' | 'Returned'
  verifiedBy?: string
  approvedBy?: string
  correctionNote?: string
}

/** Modul 4 — Penugasan unit & operator ke pit/area. */
export interface UnitAssignment {
  id: ID
  unitId: ID
  operatorId: ID
  siteId: ID
  pit: string
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3'
  startAt: string
  endAt?: string
  status: 'Active' | 'Completed' | 'Cancelled'
  reason: string
  assignedBy: string
}

/** Modul 6 — Peristiwa downtime unit. */
export interface DowntimeEvent {
  id: ID
  code: string
  unitId: ID
  siteId: ID
  startedAt: string
  endedAt?: string
  durationHours: number
  /** Status unit sebelum & sesudah kejadian. */
  statusBefore: string
  statusAfter: string
  category: 'Mechanical' | 'Electrical' | 'Tyre/Undercarriage' | 'Planned Maintenance' | 'Waiting Operator' | 'Waiting Fuel' | 'Waiting Material' | 'Road/Traffic' | 'Weather' | 'No Work/Front Unavailable' | 'Operational Delay' | 'Lainnya'
  subCategory: string
  description: string
  reportedBy: string
  verifiedBy?: string
  workOrderId?: ID
  /** Dampak terhadap produksi bila dapat dihitung. */
  impactQty?: number
  impactUnit?: string
  preventiveAction?: string
}

/** Modul 8 — Transaksi pengisian BBM ke unit. */
export interface FuelIssue {
  id: ID
  code: string
  date: string
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3'
  tankId: ID
  unitId: ID
  siteId: ID
  liters: number
  hourMeter: number
  filledBy: string
  receivedBy: string
  status: 'Draft' | 'Submitted' | 'Verified' | 'Reconciled'
  anomaly?: string
}

/** Modul 8 — Penerimaan BBM dari pemasok. */
export interface FuelReceipt {
  id: ID
  code: string
  date: string
  tankId: ID
  supplier: string
  liters: number
  docNo: string
  status: 'Draft' | 'Verified' | 'Approved'
}

/** Modul 11 — Serah terima shift. */
export interface ShiftHandover {
  id: ID
  code: string
  date: string
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3'
  siteId: ID
  fromUser: string
  toUser: string
  items: string[]
  openIssues: string
  status: 'Draft' | 'Submitted' | 'Acknowledged'
}

/** Modul 12 — Tindakan korektif/preventif HSE. */
export interface CorrectiveAction {
  id: ID
  code: string
  source: 'Inspeksi' | 'Near Miss' | 'Insiden' | 'Temuan' | 'Risk Assessment'
  description: string
  siteId: ID
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem'
  pic: string
  dueDate: string
  status: 'Open' | 'In Progress' | 'Awaiting Verification' | 'Closed' | 'Overdue'
  evidence?: string
  verifiedBy?: string
}

/** Modul 13 — Transaksi biaya proyek. */
export interface CostTransaction {
  id: ID
  code: string
  period: string
  contractId: ID
  siteId: ID
  category: 'BBM' | 'Suku Cadang' | 'Jasa Perbaikan' | 'Tenaga Kerja' | 'Sewa Alat' | 'Mobilisasi' | 'Vendor Pihak Ketiga' | 'Lainnya'
  description: string
  amountIdr: number
  /** actual | committed | accrual | forecast — harus dipisahkan. */
  costType: 'Actual' | 'Committed' | 'Accrual' | 'Forecast'
  source: 'BBM' | 'Warehouse' | 'Purchase Order' | 'Manual'
  sourceRef?: string
  status: 'Draft' | 'Posted' | 'Reconciled'
}

/** Modul 14 — Rekonsiliasi volume pekerjaan & paket billing. */
export interface BillingReconciliation {
  id: ID
  code: string
  period: string
  contractId: ID
  siteId: ID
  /** Volume operasional internal yang sudah disetujui. */
  internalVolume: number
  /** Volume yang diajukan ke pemilik tambang. */
  submittedVolume: number
  /** Volume yang disetujui pemilik tambang. */
  approvedVolume: number
  unit: 'BCM' | 'Ton' | 'Jam' | 'Km'
  rateIdr: number
  /** Selisih internal vs disetujui beserta alasannya. */
  varianceReason: string
  status: 'Draft' | 'Awaiting Owner Approval' | 'Approved' | 'Ready to Bill' | 'Invoiced' | 'Paid'
  preparedBy: string
  reviewedBy?: string
}

/** Item pada halaman Tugas Saya. */
export interface TaskItem {
  id: ID
  title: string
  detail: string
  module: string
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'
  dueDate?: string
  status: 'Open' | 'In Progress' | 'Done'
  /** Peran yang seharusnya menangani item ini. */
  ownerRole: string
}

/** Posisi stok bahan bakar per tangki. */
export interface FuelStockPosition {
  tankId: ID
  opening: number
  received: number
  issued: number
  closing: number
  variance: number
}

/* ---------------------------- Sistem ---------------------------- */

export interface Notification {
  id: ID
  title: string
  body: string
  time: string
  type: 'alert' | 'warning' | 'success' | 'info'
  read: boolean
}

export interface ActivityItem {
  id: ID
  /** Waktu kejadian dalam format ISO agar dapat diurutkan dan difilter. */
  time: string
  user: string
  action: string
  module: string
  /** Kategori tindakan untuk audit trail. */
  type: 'create' | 'edit' | 'approve' | 'reject' | 'delete' | 'export' | 'login' | 'system'
  /** Rincian teknis perubahan (nomor dokumen, nilai sebelum/sesudah). */
  detail: string
}

export interface User {
  id: ID
  name: string
  email: string
  role: 'Super Admin' | 'GM Operasional' | 'Manager Keuangan' | 'Manager HSE' | 'Staff Produksi'
  avatar: string
}
