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
  time: string
  user: string
  action: string
  module: string
}

export interface User {
  id: ID
  name: string
  email: string
  role: 'Super Admin' | 'GM Operasional' | 'Manager Keuangan' | 'Manager HSE' | 'Staff Produksi'
  avatar: string
}
