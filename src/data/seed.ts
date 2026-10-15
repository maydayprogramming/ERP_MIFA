/* ==========================================================================
   MIFA ERP — Deterministic Seed Data
   Data demo realistis untuk operasional tambang batu bara (IUP Produksi).
   ========================================================================== */

import type {
  Site,
  Employee,
  MinePlan,
  BlendingRecipe,
  Jetty,
  Vessel,
  Permit,
  ComplianceObligation,
  ProjectContract,
  ProductionTarget,
  ProductionLog,
  UnitAssignment,
  DowntimeEvent,
  FuelIssue,
  FuelReceipt,
  ShiftHandover,
  CorrectiveAction,
  CostTransaction,
  BillingReconciliation,
  TaskItem,
  ProductionRecord,
  Stockpile,
  WarehouseItem,
  FuelTank,
  Equipment,
  MaintenanceJob,
  Incident,
  TrainingRecord,
  EnvironmentalReading,
  Customer,
  Contract,
  SalesOrder,
  Vendor,
  PurchaseOrder,
  JournalEntry,
  Invoice,
  Bill,
  BudgetLine,
  CapexProject,
  RoyaltyRecord,
  Notification,
  ActivityItem,
  User,
} from '../types'

/* ----------------------------- Utilities ----------------------------- */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20261015)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
const between = (min: number, max: number, dec = 0): number => {
  const v = min + rnd() * (max - min)
  return dec === 0 ? Math.round(v) : Number(v.toFixed(dec))
}
const seq = (n: number, prefix: string, pad = 4, start = 1): string[] =>
  Array.from({ length: n }, (_, i) => `${prefix}${String(start + i).padStart(pad, '0')}`)

const TODAY = new Date('2026-10-15T00:00:00')
export const TODAY_ISO = '2026-10-15'
const daysAgo = (n: number): string => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const daysAhead = (n: number): string => daysAgo(-n)
const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/* ------------------------------- Sites ------------------------------- */

export const SITES: Site[] = [
  {
    id: 'site-lht',
    code: 'LHT',
    name: 'Site Lahat',
    region: 'Sumatera Selatan',
    province: 'Sumatera Selatan',
    iupNo: '420/KAB-BPPT/2019',
    iupStage: 'Produksi',
    areaHa: 8420,
    reservesMt: 78.4,
    status: 'Operating',
    manager: 'Ir. Bambang Setiawan',
    contractor: 'PT Bina Karya Utama',
    coalType: 'Bituminous',
    gcvAr: 4300,
  },
  {
    id: 'site-me',
    code: 'ME',
    name: 'Site Muara Enim',
    region: 'Sumatera Selatan',
    province: 'Sumatera Selatan',
    iupNo: '415/KAB-BPPT/2018',
    iupStage: 'Produksi',
    areaHa: 6180,
    reservesMt: 52.1,
    status: 'Operating',
    manager: 'Ir. Hendra Wijaya',
    contractor: 'PT Mandiri Coal Service',
    coalType: 'Bituminous',
    gcvAr: 4100,
  },
  {
    id: 'site-te',
    code: 'TE',
    name: 'Site Tanjung Enim',
    region: 'Sumatera Selatan',
    province: 'Sumatera Selatan',
    iupNo: '430/KAB-BPPT/2021',
    iupStage: 'Produksi',
    areaHa: 4560,
    reservesMt: 36.8,
    status: 'Ramp-up',
    manager: 'Ir. Siti Nurhaliza',
    contractor: 'PT Bina Karya Utama',
    coalType: 'Sub-bituminous',
    gcvAr: 3900,
  },
  {
    id: 'site-berau',
    code: 'BRU',
    name: 'Site Berau',
    region: 'Kalimantan Timur',
    province: 'Kalimantan Timur',
    iupNo: '890/KALTIM-BPPT/2017',
    iupStage: 'Produksi',
    areaHa: 11240,
    reservesMt: 121.6,
    status: 'Operating',
    manager: 'Ir. Agus Salim',
    contractor: 'PT Gunanya Multi Prima',
    coalType: 'Bituminous',
    gcvAr: 4800,
  },
  {
    id: 'site-kubar',
    code: 'KBR',
    name: 'Site Kutai Barat',
    region: 'Kalimantan Timur',
    province: 'Kalimantan Timur',
    iupNo: '905/KALTIM-BPPT/2020',
    iupStage: 'Konstruksi',
    areaHa: 9860,
    reservesMt: 64.3,
    status: 'Care & Maintenance',
    manager: 'Ir. Rudi Hartono',
    contractor: 'PT Swakarya Mandiri',
    coalType: 'Sub-bituminous',
    gcvAr: 3700,
  },
]

/* ------------------------------ Employee ----------------------------- */

const FIRST = ['Ahmad', 'Budi', 'Citra', 'Dedi', 'Eko', 'Fitri', 'Gunawan', 'Hadi', 'Indra', 'Joko', 'Kartika', 'Lukman', 'Maya', 'Nugroho', 'Oki', 'Putri', 'Rahmat', 'Sari', 'Taufik', 'Usman', 'Vina', 'Wahyu', 'Yanti', 'Zulkifli']
const LAST = ['Pratama', 'Saputra', 'Wibowo', 'Kusuma', 'Nugraha', 'Hidayat', 'Ramadhan', 'Siregar', 'Simbolon', 'Halim', 'Firdaus', 'Maulana', 'Pasaribu', 'Lubis', 'Sihombing', 'Panjaitan', 'Ginting', 'Tarigan', 'Sinaga', 'Batubara']
const fullName = () => `${pick(FIRST)} ${pick(LAST)}`

export const EMPLOYEES: Employee[] = Array.from({ length: 28 }, (_, i) => {
  const dept = pick(['Produksi', 'Perencanaan Tambang', 'Pemeliharaan', 'HSE', 'Keuangan', 'SDM', 'Logistik', 'Pengadaan', 'Legal & Compliance'])
  const posByDept: Record<string, string[]> = {
    Produksi: ['Supervisor Produksi', 'Operator Produksi', 'Shift Foreman', 'Penanggung Jawab Pit'],
    'Perencanaan Tambang': ['Mining Engineer', 'Planner Tambang', 'Surveyor', 'Geolog'],
    Pemeliharaan: ['Mekanik Senior', 'Electrician', 'Mekanik Alat Berat', 'Planner Maintenance'],
    HSE: ['HSE Officer', 'Safety Supervisor', 'Environmental Officer', 'Paramedis'],
    Keuangan: ['Accounting Staff', 'Tax Specialist', 'Treasury Officer', 'Cost Controller'],
    SDM: ['HR Generalist', 'Payroll Officer', 'Training Coordinator'],
    Logistik: ['Warehouse Officer', 'Fleet Dispatcher', 'Customs Officer'],
    Pengadaan: ['Procurement Staff', 'Buyer', 'Contract Administrator'],
    'Legal & Compliance': ['Legal Officer', 'Compliance Analyst'],
  }
  return {
    id: `emp-${i + 1}`,
    nip: `2019${String(1000 + i)}`,
    name: fullName(),
    position: pick(posByDept[dept]),
    department: dept,
    siteId: pick(SITES).id,
    joinDate: daysAgo(between(200, 2600)),
    status: pick(['Permanent', 'Permanent', 'Contract', 'Outsource'] as const),
    salaryIdr: between(5500000, 24000000),
    certifications: (() => {
      const pool = ['POP Excavator', 'POP Haul Truck', 'POP Dozer', 'K3 Umum', 'P3K', 'Fire Fighting', 'GWO', 'First Aider', 'Defensive Driving']
      return pool.filter(() => rnd() > 0.6).slice(0, 3)
    })(),
  }
})

/* ----------------------------- Production ---------------------------- */

export const PRODUCTION: ProductionRecord[] = (() => {
  const rows: ProductionRecord[] = []
  const activeSites = SITES.filter((s) => s.status === 'Operating' || s.status === 'Ramp-up')
  for (let d = 92; d >= 0; d--) {
    for (const site of activeSites) {
      const base = site.code === 'BRU' ? 15200 : site.code === 'LHT' ? 9800 : site.code === 'ME' ? 7200 : 3400
      const coalMt = Number((between(base * 0.82, base * 1.14) / 1000).toFixed(2))
      const obBcm = Number((between(base * 2.6, base * 4.1) / 1000).toFixed(2))
      rows.push({
        id: `prd-${d}-${site.code}`,
        date: daysAgo(d),
        siteId: site.id,
        shift: pick(['Shift 1', 'Shift 2', 'Shift 3'] as const),
        coalMt,
        obBcm,
        romMt: Number((coalMt * between(1.22, 1.42, 2)).toFixed(2)),
        haulDistanceKm: between(2.4, 7.8, 1),
        haulingTrips: between(280, 620),
        gcvAr: between(site.gcvAr - 220, site.gcvAr + 180),
        totalMoisture: between(18, 32, 1),
        ash: between(4, 12, 1),
        sulfur: between(0.3, 1.4, 2),
        status: d > 6 ? 'Approved' : d > 3 ? 'Verified' : 'Draft',
        createdBy: fullName(),
      })
    }
  }
  return rows
})()

/* ----------------------------- Stockpile ----------------------------- */

export const STOCKPILES: Stockpile[] = [
  { id: 'sp-1', name: 'Stockpile A — ROM GAR 4300', siteId: 'site-lht', capacityMt: 180000, tonnageMt: 142000, gcvAr: 4310, ash: 5.2, sulfur: 0.4, moisture: 26, status: 'Reclaiming' },
  { id: 'sp-2', name: 'Stockpile B — Blend Export', siteId: 'site-lht', capacityMt: 150000, tonnageMt: 128500, gcvAr: 4000, ash: 6.8, sulfur: 0.6, moisture: 28, status: 'Filling' },
  { id: 'sp-3', name: 'Stockpile C — Domestic 4100', siteId: 'site-me', capacityMt: 120000, tonnageMt: 61200, gcvAr: 4120, ash: 4.9, sulfur: 0.5, moisture: 27, status: 'Stable' },
  { id: 'sp-4', name: 'Stockpile D — High CV', siteId: 'site-te', capacityMt: 90000, tonnageMt: 44800, gcvAr: 4950, ash: 3.6, sulfur: 0.3, moisture: 24, status: 'Filling' },
  { id: 'sp-5', name: 'Stockpile E — Barge Loading', siteId: 'site-berau', capacityMt: 220000, tonnageMt: 198000, gcvAr: 4800, ash: 4.2, sulfur: 0.4, moisture: 25, status: 'Reclaiming' },
  { id: 'sp-6', name: 'Stockpile F — Low Grade', siteId: 'site-berau', capacityMt: 160000, tonnageMt: 52400, gcvAr: 3500, ash: 9.4, sulfur: 0.9, moisture: 31, status: 'Stable' },
  { id: 'sp-7', name: 'Stockpile G — Blending Pad', siteId: 'site-me', capacityMt: 200000, tonnageMt: 156000, gcvAr: 4200, ash: 6.1, sulfur: 0.5, moisture: 27, status: 'Filling' },
  { id: 'sp-8', name: 'Stockpile H — Closed Legacy', siteId: 'site-te', capacityMt: 70000, tonnageMt: 8200, gcvAr: 3800, ash: 8.1, sulfur: 0.8, moisture: 30, status: 'Closed' },
]

/* --------------------------- Warehouse Items ------------------------- */

export const WAREHOUSE_ITEMS: WarehouseItem[] = [
  { id: 'wh-1', sku: 'SPR-ENG-001', name: 'Filter Oki CAT 320D (Set)', category: 'Spare Part', unit: 'Set', stock: 42, minStock: 30, maxStock: 80, location: 'Gudang Utama - Rack A1', siteId: 'site-lht', unitCostIdr: 1850000 },
  { id: 'wh-2', sku: 'SPR-HYD-014', name: 'Seal Kit Hydraulic Cylinder', category: 'Spare Part', unit: 'Pcs', stock: 18, minStock: 20, maxStock: 60, location: 'Gudang Utama - Rack B3', siteId: 'site-lht', unitCostIdr: 4200000 },
  { id: 'wh-3', sku: 'TYR-1200-24', name: 'Tyre 12.00-24 OTR', category: 'Tyres', unit: 'Pcs', stock: 64, minStock: 40, maxStock: 120, location: 'Tyre Bay - Outdoor', siteId: 'site-me', unitCostIdr: 9800000 },
  { id: 'wh-4', sku: 'TYR-750-65', name: 'Tyre 27.00R49 (Haul Truck)', category: 'Tyres', unit: 'Pcs', stock: 12, minStock: 16, maxStock: 40, location: 'Tyre Bay - Outdoor', siteId: 'site-berau', unitCostIdr: 86000000 },
  { id: 'wh-5', sku: 'BML-ANFO-25', name: 'ANFO (Bag 25 kg)', category: 'Bahan Peledak', unit: 'Bag', stock: 1240, minStock: 800, maxStock: 3000, location: 'Magazine K3 - Bunker 1', siteId: 'site-lht', unitCostIdr: 285000 },
  { id: 'wh-6', sku: 'BML-DET-008', name: 'Detonator Nonel 400ms', category: 'Bahan Peledak', unit: 'Pcs', stock: 8600, minStock: 5000, maxStock: 20000, location: 'Magazine K3 - Bunker 2', siteId: 'site-lht', unitCostIdr: 42500 },
  { id: 'wh-7', sku: 'CNG-OLI-001', name: 'Oli Mesin 15W-40 (20 L)', category: 'Consumable', unit: 'Pail', stock: 96, minStock: 60, maxStock: 200, location: 'Gudang Utama - Rack C2', siteId: 'site-me', unitCostIdr: 2450000 },
  { id: 'wh-8', sku: 'CNG-GRS-030', name: 'Grease Cartridge EP2', category: 'Consumable', unit: 'Cartridge', stock: 380, minStock: 200, maxStock: 600, location: 'Gudang Utama - Rack C4', siteId: 'site-me', unitCostIdr: 165000 },
  { id: 'wh-9', sku: 'SAF-HLM-100', name: 'Safety Helmet Putih (Supervisor)', category: 'Safety', unit: 'Pcs', stock: 145, minStock: 80, maxStock: 250, location: 'Gudang PPE - Rack D1', siteId: 'site-berau', unitCostIdr: 420000 },
  { id: 'wh-10', sku: 'SAF-SEP-220', name: 'Safety Shoes S3 Steel Toe', category: 'Safety', unit: 'Pasang', stock: 68, minStock: 90, maxStock: 200, location: 'Gudang PPE - Rack D2', siteId: 'site-berau', unitCostIdr: 1150000 },
  { id: 'wh-11', sku: 'ATK-KRT-001', name: 'Kertas HVS A4 80gr', category: 'ATK', unit: 'Rim', stock: 120, minStock: 50, maxStock: 200, location: 'Kantor Site - Store', siteId: 'site-te', unitCostIdr: 62000 },
  { id: 'wh-12', sku: 'SPR-TRN-003', name: 'Torque Converter Reman', category: 'Spare Part', unit: 'Unit', stock: 3, minStock: 2, maxStock: 8, location: 'Gudang Utama - Heavy Rack', siteId: 'site-berau', unitCostIdr: 185000000 },
  { id: 'wh-13', sku: 'CNG-WLD-011', name: 'Kawat Las 2.5 mm', category: 'Consumable', unit: 'Kg', stock: 210, minStock: 100, maxStock: 400, location: 'Workshop - Rack W1', siteId: 'site-lht', unitCostIdr: 98000 },
  { id: 'wh-14', sku: 'SPR-BEL-021', name: 'V-Belt Conveyor B650', category: 'Spare Part', unit: 'Meter', stock: 320, minStock: 250, maxStock: 800, location: 'Gudang Utama - Rack B7', siteId: 'site-te', unitCostIdr: 465000 },
  { id: 'wh-15', sku: 'SAF-GAS-005', name: 'Gas Detector 4-in-1', category: 'Safety', unit: 'Unit', stock: 22, minStock: 15, maxStock: 40, location: 'Gudang PPE - Rack D4', siteId: 'site-me', unitCostIdr: 6850000 },
  { id: 'wh-16', sku: 'TYR-1750-25', name: 'Tyre 17.5-25 (Grader)', category: 'Tyres', unit: 'Pcs', stock: 24, minStock: 12, maxStock: 40, location: 'Tyre Bay - Indoor', siteId: 'site-te', unitCostIdr: 14200000 },
]

/* ----------------------------- Fuel Tanks ---------------------------- */

export const FUEL_TANKS: FuelTank[] = [
  { id: 'ft-1', name: 'Fuel Farm LHT-01', siteId: 'site-lht', fuelType: 'Solar', capacityL: 120000, levelL: 86400, lastDip: daysAgo(0) },
  { id: 'ft-2', name: 'Fuel Farm LHT-02', siteId: 'site-lht', fuelType: 'Solar', capacityL: 80000, levelL: 22800, lastDip: daysAgo(0) },
  { id: 'ft-3', name: 'Fuel Farm ME-01', siteId: 'site-me', fuelType: 'Solar', capacityL: 100000, levelL: 71500, lastDip: daysAgo(1) },
  { id: 'ft-4', name: 'Fuel Farm TE-01', siteId: 'site-te', fuelType: 'Solar', capacityL: 60000, levelL: 18900, lastDip: daysAgo(1) },
  { id: 'ft-5', name: 'Fuel Farm BRU-01', siteId: 'site-berau', fuelType: 'Solar', capacityL: 150000, levelL: 132800, lastDip: daysAgo(0) },
  { id: 'ft-6', name: 'Lube & Oil Bank BRU', siteId: 'site-berau', fuelType: 'Oli Aki', capacityL: 30000, levelL: 9600, lastDip: daysAgo(2) },
]

/* ------------------------------ Equipment ---------------------------- */

const EQUIP_MODELS: Array<[Equipment['type'], string, string, number, number]> = [
  ['Excavator', 'CAT 6015B', 'Caterpillar', 6015, 780],
  ['Excavator', 'Komatsu PC3000', 'Komatsu', 3000, 740],
  ['Excavator', 'Hitachi EX3600-6', 'Hitachi', 3600, 700],
  ['Haul Truck', 'CAT 777D', 'Caterpillar', 777, 165],
  ['Haul Truck', 'Komatsu HD785-7', 'Komatsu', 785, 145],
  ['Haul Truck', 'Hitachi EH1700-3', 'Hitachi', 1700, 180],
  ['Haul Truck', 'CAT 773G', 'Caterpillar', 773, 130],
  ['Dozer', 'CAT D11T', 'Caterpillar', 11, 92],
  ['Dozer', 'Komatsu D375A-6', 'Komatsu', 375, 88],
  ['Grader', 'CAT 14M3', 'Caterpillar', 14, 58],
  ['Grader', 'Komatsu GD655-6', 'Komatsu', 655, 52],
  ['Water Truck', 'Isuzu Giga WT-20KL', 'Isuzu', 20000, 42],
  ['Drill', 'Atlas Copco PV-351', 'Atlas Copco', 351, 115],
  ['Loader', 'CAT 980H', 'Caterpillar', 980, 48],
]

export const EQUIPMENT: Equipment[] = (() => {
  const rows: Equipment[] = []
  let n = 0
  for (const site of SITES.filter((s) => s.status !== 'Care & Maintenance')) {
    const fleetSize = site.code === 'BRU' ? 8 : site.code === 'LHT' ? 7 : site.code === 'ME' ? 6 : 4
    const models = [...EQUIP_MODELS].sort(() => rnd() - 0.5).slice(0, fleetSize)
    for (const [type, model, brand, cap, lph] of models) {
      n += 1
      const hm = between(4200, 38400)
      const status = pick(['Operating', 'Operating', 'Operating', 'Standby', 'Maintenance', 'Breakdown', 'Idle'] as const)
      rows.push({
        id: `eq-${n}`,
        code: `${site.code}-${type.slice(0, 2).toUpperCase()}-${String(n).padStart(3, '0')}`,
        name: `${brand} ${model}`,
        type,
        brand,
        model,
        year: between(2014, 2025),
        siteId: site.id,
        hourMeter: hm,
        status,
        availabilityPct: between(78, 97, 1),
        utilizationPct: between(62, 94, 1),
        fuelLph: lph,
        lastServiceHm: hm - between(40, 260),
        nextServiceHm: hm + between(20, 240),
        operator: fullName(),
        tyreLifePct: between(12, 88),
      })
      void cap
    }
  }
  return rows
})()

/* ---------------------------- Maintenance ---------------------------- */

export const MAINTENANCE: MaintenanceJob[] = (() => {
  const rows: MaintenanceJob[] = []
  const descs: Array<[MaintenanceJob['type'], string]> = [
    ['Preventive', 'Servis berkala 500 jam — ganti oli & filter'],
    ['Preventive', 'Greasing & inspeksi undercarriage'],
    ['Corrective', 'Perbaikan kebocoran hydraulic cylinder'],
    ['Corrective', 'Penggantian final drive seal'],
    ['Major', 'Overhaul engine (top end)'],
    ['Inspection', 'Inspeksi struktur boom & arm'],
    ['Corrective', 'Perbaikan sistem electrical'],
    ['Preventive', 'Rotasi & pengecekan tyre'],
    ['Major', 'Rebuilt transmission'],
    ['Corrective', 'Perbaikan radiator & cooling system'],
  ]
  EQUIPMENT.slice(0, 26).forEach((eq, i) => {
    const [type, desc] = descs[i % descs.length]
    const sched = daysAgo(between(-30, 45))
    rows.push({
      id: `mt-${i + 1}`,
      woNo: `WO-2026-${String(1000 + i)}`,
      equipmentId: eq.id,
      type,
      description: desc,
      scheduledDate: sched,
      status: sched < TODAY_ISO && rnd() > 0.35 ? pick(['Completed', 'Overdue'] as const) : pick(['Scheduled', 'In Progress'] as const),
      costIdr: between(12000000, 940000000),
      mechanic: fullName(),
    })
  })
  return rows
})()

/* ------------------------------- Incidents --------------------------- */

export const INCIDENTS: Incident[] = [
  { id: 'inc-1', date: daysAgo(3), siteId: 'site-lht', type: 'Near Miss', severity: 'Minor', description: 'Pekerja hampir terpeleset saat pengecekan tangga haul truck.', person: fullName(), department: 'Pemeliharaan', lostDays: 0, status: 'Investigation', correctiveAction: 'Pemasangan handrail & briefing housekeeping' },
  { id: 'inc-2', date: daysAgo(9), siteId: 'site-berau', type: 'Property Damage', severity: 'Moderate', description: 'Ban haul truck meletus saat manuver di rampe, tubuh jalan terdampak.', person: fullName(), department: 'Produksi', lostDays: 0, status: 'Closed', correctiveAction: 'Review ritase & kondisi haul road' },
  { id: 'inc-3', date: daysAgo(14), siteId: 'site-me', type: 'FAC', severity: 'Minor', description: 'Pekerja terpapar debu saat pengoperasian drill tanpa masker.', person: fullName(), department: 'Produksi', lostDays: 0, status: 'Closed', correctiveAction: 'Pemasangan sprayer & penegakan APD' },
  { id: 'inc-4', date: daysAgo(21), siteId: 'site-te', type: 'MTC', severity: 'Moderate', description: 'Terjepit tangan saat pemasangan conveyor belt.', person: fullName(), department: 'Pemeliharaan', lostDays: 3, status: 'Closed', correctiveAction: 'LOTO procedure refresh training' },
  { id: 'inc-5', date: daysAgo(27), siteId: 'site-lht', type: 'Environmental', severity: 'Minor', description: 'Debu melebihi ambang batas di haul road dekat pemukiman.', person: fullName(), department: 'HSE', lostDays: 0, status: 'Investigation', correctiveAction: 'Penambahan jadwal water truck' },
  { id: 'inc-6', date: daysAgo(34), siteId: 'site-berau', type: 'Near Miss', severity: 'Minor', description: 'Batu lepas dari dinding pit saat loading area.', person: fullName(), department: 'Produksi', lostDays: 0, status: 'Closed', correctiveAction: 'Scaling dinding pit & pengawasan' },
  { id: 'inc-7', date: daysAgo(41), siteId: 'site-me', type: 'LTI', severity: 'Major', description: 'Pekerja cedera punggung saat mengangkat komponen pompa.', person: fullName(), department: 'Pemeliharaan', lostDays: 18, status: 'Closed', correctiveAction: 'Penggunaan lifting device & ergonomi review' },
  { id: 'inc-8', date: daysAgo(52), siteId: 'site-lht', type: 'Near Miss', severity: 'Minor', description: 'Alat berat beroperasi di luar radius aman pekerja lapangan.', person: fullName(), department: 'Produksi', lostDays: 0, status: 'Closed', correctiveAction: 'Pemasangan barrier & spotlight' },
  { id: 'inc-9', date: daysAgo(63), siteId: 'site-te', type: 'Property Damage', severity: 'Minor', description: 'Tabrakan ringan antara grader dan haul truck di simpang jalan.', person: fullName(), department: 'Produksi', lostDays: 0, status: 'Closed', correctiveAction: 'Pemasang rambu & one-way traffic' },
  { id: 'inc-10', date: daysAgo(78), siteId: 'site-berau', type: 'FAC', severity: 'Minor', description: 'Percikan bahan kimia ke mata saat pengecekan battery.', person: fullName(), department: 'Pemeliharaan', lostDays: 0, status: 'Closed', correctiveAction: 'Face shield wajib & eyewash station check' },
  { id: 'inc-11', date: daysAgo(88), siteId: 'site-me', type: 'Near Miss', severity: 'Minor', description: 'Kabel listrik rusak di dekat genangan air.', person: fullName(), department: 'Pemeliharaan', lostDays: 0, status: 'Closed', correctiveAction: 'Inspeksi kelistrikan menyeluruh' },
  { id: 'inc-12', date: daysAgo(96), siteId: 'site-lht', type: 'MTC', severity: 'Moderate', description: 'Pekerja terjatuh dari platform 1,8 m.', person: fullName(), department: 'Produksi', lostDays: 5, status: 'Closed', correctiveAction: 'Fall protection & work at height permit' },
]

/* ------------------------------ Training ---------------------------- */

export const TRAINING: TrainingRecord[] = [
  { id: 'tr-1', program: 'K3 Umum & APD Lanjutan', category: 'K3 Umum', date: daysAhead(6), siteId: 'site-lht', attendees: 84, status: 'Scheduled', trainer: 'Safety Training Institute' },
  { id: 'tr-2', program: 'Operasi & Pemeliharaan Haul Truck', category: 'Teknis', date: daysAgo(8), siteId: 'site-berau', attendees: 36, status: 'Completed', trainer: 'PT United Tractors' },
  { id: 'tr-3', program: 'AMDAL & Pengelolaan Limbah', category: 'Lingkungan', date: daysAhead(12), siteId: 'site-me', attendees: 22, status: 'Scheduled', trainer: 'Envira Consulting' },
  { id: 'tr-4', program: 'POP Excavator Refresh', category: 'POP', date: daysAgo(15), siteId: 'site-te', attendees: 18, status: 'Completed', trainer: 'POP Center Sumsel' },
  { id: 'tr-5', program: 'Manajemen Risiko Tambang (SMKP)', category: 'Manajemen', date: daysAgo(22), siteId: 'site-lht', attendees: 32, status: 'Completed', trainer: 'Internal HSE' },
  { id: 'tr-6', program: 'P3K & Tanggap Darurat', category: 'K3 Umum', date: daysAhead(3), siteId: 'site-berau', attendees: 56, status: 'Scheduled', trainer: 'PMI Batam' },
  { id: 'tr-7', program: 'Fire Fighting Level 1', category: 'K3 Umum', date: daysAgo(31), siteId: 'site-me', attendees: 44, status: 'Completed', trainer: 'Internal HSE' },
  { id: 'tr-8', program: 'Work at Height & Fall Protection', category: 'Teknis', date: daysAhead(9), siteId: 'site-te', attendees: 26, status: 'Scheduled', trainer: 'Total Safety Asia' },
  { id: 'tr-9', program: 'Pemasangan & Audit Pemasangan Hidrolik', category: 'Teknis', date: daysAgo(44), siteId: 'site-berau', attendees: 15, status: 'Completed', trainer: 'Bosch Rexroth' },
  { id: 'tr-10', program: 'Pengelolaan Material Berbahaya (B3)', category: 'Lingkungan', date: daysAhead(16), siteId: 'site-lht', attendees: 20, status: 'Scheduled', trainer: 'Kemen LH' },
]

/* --------------------------- Environmental --------------------------- */

export const ENVIRONMENTAL: EnvironmentalReading[] = (() => {
  const rows: EnvironmentalReading[] = []
  const params: Array<[EnvironmentalReading['parameter'], string, number, number, number]> = [
    ['Debu (TSP)', 'µg/m³', 90, 230, 0],
    ['PM10', 'µg/m³', 50, 150, 0],
    ['Noise', 'dB(A)', 55, 75, 0],
    ['pH Air', '-', 6.5, 9, 1],
    ['TSS', 'mg/L', 30, 200, 0],
    ['COD', 'mg/L', 25, 100, 0],
  ]
  const locs = ['Pit Utara', 'Haul Road KP 4', 'Rom Stockpile', 'Jetty Area', 'Workshop', 'Batas Pemukiman', 'Sungai Outfall']
  let n = 0
  for (let d = 20; d >= 0; d--) {
    for (const [parameter, unit, thr, max, dec] of params) {
      n += 1
      const v = Number((between(thr * 0.5, max, dec) + (dec === 1 ? 0 : 0)).toFixed(dec))
      rows.push({
        id: `env-${n}`,
        date: daysAgo(d),
        siteId: pick(SITES.filter((s) => s.status !== 'Care & Maintenance')).id,
        parameter,
        value: v,
        unit,
        threshold: thr,
        location: pick(locs),
        status: v > thr ? 'Exceeded' : v > thr * 0.9 ? 'Warning' : 'Compliant',
      })
    }
  }
  return rows
})()

/* ------------------------------ Customers ---------------------------- */

export const CUSTOMERS: Customer[] = [
  { id: 'cus-1', code: 'CUS-001', name: 'PT PLN Nusantara Power', sector: 'Power Plant', type: 'Domestic', city: 'Palembang', contact: 'Bpk. Dwi K. — 0812-xxxx-2211', creditLimitIdr: 450000000000, outstandingIdr: 128400000000, status: 'Active' },
  { id: 'cus-2', code: 'CUS-002', name: 'PT Semen Baturaja (Persero)', sector: 'Cement', type: 'Domestic', city: 'Baturaja', contact: 'Ibu Ratna — 0813-xxxx-7788', creditLimitIdr: 180000000000, outstandingIdr: 41200000000, status: 'Active' },
  { id: 'cus-3', code: 'CUS-003', name: 'PT Indocement Tunggal Prakarsa', sector: 'Cement', type: 'Domestic', city: 'Bogor', contact: 'Bpk. Yudi — 0811-xxxx-9932', creditLimitIdr: 220000000000, outstandingIdr: 66750000000, status: 'Watchlist' },
  { id: 'cus-4', code: 'CUS-004', name: 'PT Tjiwi Kimia', sector: 'Paper', type: 'Domestic', city: 'Sidoarjo', contact: 'Ibu Melisa — 0857-xxxx-1102', creditLimitIdr: 90000000000, outstandingIdr: 18300000000, status: 'Active' },
  { id: 'cus-5', code: 'CUS-005', name: 'PT Krakatau Steel', sector: 'Steel', type: 'Domestic', city: 'Cilegon', contact: 'Bpk. Arif — 0812-xxxx-4417', creditLimitIdr: 120000000000, outstandingIdr: 28900000000, status: 'Active' },
  { id: 'cus-6', code: 'CUS-006', name: 'Vitol Singapore Pte Ltd', sector: 'Trader', type: 'Export', city: 'Singapore', contact: 'Mr. Chen — +65 6xxx-1180', creditLimitIdr: 380000000000, outstandingIdr: 94800000000, status: 'Active' },
  { id: 'cus-7', code: 'CUS-007', name: 'Trafigura Pte Ltd', sector: 'Trader', type: 'Export', city: 'Singapore', contact: 'Mr. Tanaka — +65 6xxx-2290', creditLimitIdr: 300000000000, outstandingIdr: 61400000000, status: 'Active' },
  { id: 'cus-8', code: 'CUS-008', name: 'PT Power Indonesia Trading', sector: 'Trader', type: 'Export', city: 'Jakarta', contact: 'Bpk. Fajar — 0819-xxxx-6631', creditLimitIdr: 75000000000, outstandingIdr: 12200000000, status: 'Watchlist' },
  { id: 'cus-9', code: 'CUS-009', name: 'Gunvor Singapore Pte Ltd', sector: 'Trader', type: 'Export', city: 'Singapore', contact: 'Ms. Anna — +65 6xxx-3371', creditLimitIdr: 260000000000, outstandingIdr: 0, status: 'Active' },
  { id: 'cus-10', code: 'CUS-010', name: 'PT Kertas Nusantara', sector: 'Paper', type: 'Domestic', city: 'Perawang', contact: 'Bpk. Syamsul — 0813-xxxx-5540', creditLimitIdr: 60000000000, outstandingIdr: 9400000000, status: 'Inactive' },
]

/* ------------------------------ Contracts ---------------------------- */

export const CONTRACTS: Contract[] = [
  { id: 'ctr-1', code: 'KTR/2026/001', customerId: 'cus-1', type: 'Domestic', startDate: '2026-01-01', endDate: '2026-12-31', volumeMt: 1200000, liftedMt: 742000, priceUsdPerMt: 52.5, qualitySpec: 'GAR 4300 / TM 28%', incoterm: 'FOB', status: 'Active' },
  { id: 'ctr-2', code: 'KTR/2026/002', customerId: 'cus-6', type: 'Export', startDate: '2026-02-01', endDate: '2027-01-31', volumeMt: 800000, liftedMt: 468000, priceUsdPerMt: 58.2, qualitySpec: 'GAR 4200 / TM 26%', incoterm: 'FOB Barge', status: 'Active' },
  { id: 'ctr-3', code: 'KTR/2026/003', customerId: 'cus-2', type: 'Domestic', startDate: '2026-03-01', endDate: '2026-12-31', volumeMt: 420000, liftedMt: 298000, priceUsdPerMt: 49.0, qualitySpec: 'GAR 4100 / TM 30%', incoterm: 'DAP', status: 'Active' },
  { id: 'ctr-4', code: 'KTR/2025/014', customerId: 'cus-7', type: 'Export', startDate: '2025-06-01', endDate: '2026-11-30', volumeMt: 500000, liftedMt: 486000, priceUsdPerMt: 61.4, qualitySpec: 'GAR 5000 / TM 22%', incoterm: 'FOB', status: 'Expiring' },
  { id: 'ctr-5', code: 'KTR/2026/005', customerId: 'cus-3', type: 'Domestic', startDate: '2026-05-01', endDate: '2027-04-30', volumeMt: 360000, liftedMt: 121000, priceUsdPerMt: 47.5, qualitySpec: 'GAR 4000 / TM 29%', incoterm: 'FOB', status: 'Active' },
  { id: 'ctr-6', code: 'KTR/2026/006', customerId: 'cus-9', type: 'Export', startDate: '2026-07-01', endDate: '2027-06-30', volumeMt: 240000, liftedMt: 42000, priceUsdPerMt: 64.0, qualitySpec: 'GAR 5300 / TM 20%', incoterm: 'CIF', status: 'Active' },
  { id: 'ctr-7', code: 'KTR/2026/007', customerId: 'cus-4', type: 'Domestic', startDate: '2026-04-01', endDate: '2026-12-31', volumeMt: 180000, liftedMt: 96000, priceUsdPerMt: 50.2, qualitySpec: 'GAR 4200 / TM 27%', incoterm: 'DAP', status: 'Active' },
  { id: 'ctr-8', code: 'KTR/2026/008', customerId: 'cus-5', type: 'Domestic', startDate: '2026-08-01', endDate: '2027-07-31', volumeMt: 150000, liftedMt: 18000, priceUsdPerMt: 51.8, qualitySpec: 'GAR 4200 / TM 27%', incoterm: 'FOB', status: 'Active' },
  { id: 'ctr-9', code: 'KTR/2026/009', customerId: 'cus-8', type: 'Export', startDate: '2026-09-01', endDate: '2027-02-28', volumeMt: 90000, liftedMt: 0, priceUsdPerMt: 55.0, qualitySpec: 'GAR 3800 / TM 32%', incoterm: 'FOB Barge', status: 'Draft' },
]

/* ----------------------------- Sales Orders -------------------------- */

const VESSEL_NAMES = ['MV Bara Jaya', 'MV Coal Horizon', 'Barge TBH-12', 'Barge TBH-07', 'MV Nusantara IX', 'Barge KMS-21', 'MV Samudra Permai', 'Barge TBH-19']
const SO_STATUSES: SalesOrder['status'][] = ['Draft', 'Confirmed', 'Loading', 'Loaded', 'Shipped', 'Invoiced', 'Paid', 'Paid', 'Paid', 'Confirmed', 'Loading']

export const SALES_ORDERS: SalesOrder[] = Array.from({ length: 22 }, (_, i) => {
  const contract = CONTRACTS[i % CONTRACTS.length]
  const tonnage = between(12000, 68000)
  const status = SO_STATUSES[i % SO_STATUSES.length]
  return {
    id: `so-${i + 1}`,
    soNo: `SO-2026-${String(1001 + i)}`,
    date: daysAgo(between(1, 120)),
    contractId: contract.id,
    customerId: contract.customerId,
    siteId: SITES[i % 4].id,
    tonnageMt: tonnage,
    priceUsdPerMt: contract.priceUsdPerMt,
    incoterm: contract.incoterm,
    vesselBarge: VESSEL_NAMES[i % VESSEL_NAMES.length],
    eta: daysAhead(between(-14, 30)),
    surveyor: pick(['SGS', 'Cointeste', 'Intertek', 'Geoservices'] as const),
    coaGcv: between(contract.priceUsdPerMt > 58 ? 4800 : 3900, contract.priceUsdPerMt > 58 ? 5200 : 4400),
    status,
  }
})

/* -------------------------------- Vendors ----------------------------- */

export const VENDORS: Vendor[] = [
  { id: 'vnd-1', code: 'VND-001', name: 'PT Pertamina Patra Niaga', category: 'Fuel', city: 'Palembang', contact: 'Bpk. Rian — 0711-xxxx-100', rating: 5, status: 'Approved', totalSpendIdr: 412000000000 },
  { id: 'vnd-2', code: 'VND-002', name: 'PT Multi Nitrotama Kimia', category: 'Bahan Peledak', city: 'Gresik', contact: 'Bpk. Deni — 031-xxxx-220', rating: 4, status: 'Approved', totalSpendIdr: 186000000000 },
  { id: 'vnd-3', code: 'VND-003', name: 'PT United Tractors Pandu', category: 'Spare Part', city: 'Jakarta', contact: 'Ibu Sari — 021-xxxx-330', rating: 5, status: 'Approved', totalSpendIdr: 324000000000 },
  { id: 'vnd-4', code: 'VND-004', name: 'PT Gajah Tunggal Tbk', category: 'Tyres', city: 'Tangerang', contact: 'Bpk. Adi — 021-xxxx-440', rating: 4, status: 'Approved', totalSpendIdr: 158000000000 },
  { id: 'vnd-5', code: 'VND-005', name: 'PT Pamapersada Nusantara', category: 'Services', city: 'Jakarta', contact: 'Bpk. Yanto — 021-xxxx-550', rating: 4, status: 'Approved', totalSpendIdr: 890000000000 },
  { id: 'vnd-6', code: 'VND-006', name: 'PT Sucofindo (Persero)', category: 'Services', city: 'Jakarta', contact: 'Ibu Lina — 021-xxxx-660', rating: 5, status: 'Approved', totalSpendIdr: 42000000000 },
  { id: 'vnd-7', code: 'VND-007', name: 'PT Bina Karya Teknik', category: 'Consumables', city: 'Palembang', contact: 'Bpk. Hendra — 0711-xxxx-770', rating: 3, status: 'Approved', totalSpendIdr: 28500000000 },
  { id: 'vnd-8', code: 'VND-008', name: 'PT Sentinel Safety Indonesia', category: 'Consumables', city: 'Bekasi', contact: 'Ibu Wulan — 021-xxxx-880', rating: 4, status: 'Approved', totalSpendIdr: 18900000000 },
  { id: 'vnd-9', code: 'VND-009', name: 'PT Baja Perkasa Logam', category: 'Spare Part', city: 'Surabaya', contact: 'Bpk. Joko — 031-xxxx-990', rating: 3, status: 'Pending', totalSpendIdr: 0 },
  { id: 'vnd-10', code: 'VND-010', name: 'PT Global Mining Services', category: 'Services', city: 'Balikpapan', contact: 'Mr. Lee — 0542-xxxx-110', rating: 2, status: 'Blacklisted', totalSpendIdr: 6200000000 },
]

/* ---------------------------- Purchase Orders ------------------------ */

export const PURCHASE_ORDERS: PurchaseOrder[] = Array.from({ length: 24 }, (_, i) => {
  const vendor = VENDORS[i % VENDORS.length]
  const cat = vendor.category as PurchaseOrder['category']
  const amount =
    cat === 'Fuel'
      ? between(850000000, 4200000000)
      : cat === 'Bahan Peledak'
        ? between(420000000, 1800000000)
        : cat === 'Spare Part'
          ? between(180000000, 2600000000)
          : cat === 'Tyres'
            ? between(320000000, 1900000000)
            : cat === 'Services'
              ? between(1200000000, 8900000000)
              : between(45000000, 480000000)
  const d = between(1, 130)
  return {
    id: `po-${i + 1}`,
    poNo: `PO-2026-${String(2001 + i)}`,
    date: daysAgo(d),
    vendorId: vendor.id,
    category: cat,
    amountIdr: amount,
    items: between(1, 14),
    siteId: SITES[i % 4].id,
    requestedBy: fullName(),
    status: pick(['Draft', 'Pending Approval', 'Pending Approval', 'Approved', 'Approved', 'Received', 'Received', 'Rejected'] as const),
    deliveryDate: addDays(daysAgo(d), between(7, 45)),
  }
})

/* ------------------------------- Journals ---------------------------- */

export const JOURNALS: JournalEntry[] = (() => {
  const accounts: Array<[string, JournalEntry['module']]> = [
    ['1-1010 Kas & Bank — BCA Operasional', 'Cash'],
    ['1-1020 Kas Kecil Site', 'Cash'],
    ['1-2010 Piutang Usaha', 'Sales'],
    ['1-2020 Piutang Usaha Eksport', 'Sales'],
    ['1-3010 Persediaan Batu Bara', 'Production'],
    ['1-3020 Persediaan Bahan & Peralatan', 'Procurement'],
    ['2-1010 Utang Usaha', 'Procurement'],
    ['2-2010 Utang Royalti PNBP', 'Production'],
    ['2-2020 Utang PPh 21/26', 'HR'],
    ['5-1010 Pendapatan Penjualan Batubara', 'Sales'],
    ['5-2010 HPP — Biaya Produksi', 'Production'],
    ['5-3010 Biaya Penjualan & Distribusi', 'Sales'],
    ['6-1010 Biaya Royalti (PNBP)', 'Production'],
    ['6-2010 Biaya PPh Final 22', 'Production'],
    ['6-3010 Biaya Listrik, Air & Gas', 'General'],
    ['6-4010 Biaya Pemeliharaan Alat Berat', 'Fixed Asset'],
    ['6-5010 Biaya Keuangan & Bank', 'Cash'],
  ]
  const rows: JournalEntry[] = []
  for (let i = 0; i < 36; i++) {
    const [account, module] = accounts[i % accounts.length]
    const amount = between(45000000, 9800000000)
    const isDebit = i % 3 !== 2
    rows.push({
      id: `jr-${i + 1}`,
      date: daysAgo(between(0, 60)),
      journalNo: `JV-2026-${String(3001 + i)}`,
      description: `${module} — ${account.split(' ').slice(1).join(' ')}`,
      account,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      module,
      status: pick(['Posted', 'Posted', 'Posted', 'Draft'] as const),
    })
  }
  return rows
})()

/* ------------------------------- Invoices ---------------------------- */

export const INVOICES: Invoice[] = SALES_ORDERS.slice(0, 16).map((so, i) => {
  const date = addDays(so.date, between(3, 14))
  const due = addDays(date, between(30, 60))
  const overdue = due < TODAY_ISO
  return {
    id: `inv-${i + 1}`,
    invoiceNo: `INV/2026/${String(7001 + i)}`,
    date,
    dueDate: due,
    soId: so.id,
    customerId: so.customerId,
    amountUsd: Math.round(so.tonnageMt * so.priceUsdPerMt),
    status: overdue ? 'Overdue' : pick(['Outstanding', 'Outstanding', 'Paid', 'Partial'] as const),
    taxInvoiceNo: `FP-${String(26).padStart(2, '0')}-${String(8100 + i)}`,
  }
})

/* -------------------------------- Bills ------------------------------ */

export const BILLS: Bill[] = PURCHASE_ORDERS.slice(0, 18).map((po, i) => {
  const date = addDays(po.date, between(5, 20))
  const due = addDays(date, between(30, 60))
  const overdue = due < TODAY_ISO
  return {
    id: `bill-${i + 1}`,
    billNo: `BILL-2026-${String(9001 + i)}`,
    date,
    dueDate: due,
    vendorId: po.vendorId,
    poId: po.id,
    amountIdr: Math.round(po.amountIdr * between(0.92, 1.0)),
    status: overdue ? 'Overdue' : pick(['Outstanding', 'Outstanding', 'Paid', 'Partial'] as const),
  }
})

/* ------------------------------- Budgets ----------------------------- */

const BUDGET_CATS = ['Produksi & Pengupahan', 'Bahan Bakar & Pelumas', 'Bahan Peledak', 'Pemeliharaan Alat Berat', 'Tyres & Ban', 'Jasa Kontraktor', 'Royalti & PNBP', 'Pajak (PPh/PBB)', 'Logistik & Bongkar Muat', 'HSE & Lingkungan', 'Umum & Administrasi', 'Izin & Legal', 'Corporate Social', 'Sosialisasi & Donasi']
export const BUDGETS: BudgetLine[] = BUDGET_CATS.map((cat, i) => {
  const budget = between(25000000000, 480000000000)
  const realization = budget * between(0.42, 1.04)
  return {
    id: `bud-${i + 1}`,
    category: cat,
    siteId: SITES[i % 4].id,
    period: 'RKAB 2026',
    budgetIdr: budget,
    actualIdr: Math.round(realization),
  }
})

/* ----------------------------- Capex Projects ------------------------ */

export const CAPEX_PROJECTS: CapexProject[] = [
  { id: 'cx-1', code: 'CX-2026-01', name: 'Pembangunan Crusher & Conveyor 500 TPH', siteId: 'site-lht', startDate: '2026-01-15', endDate: '2027-03-30', budgetIdr: 285000000000, spentIdr: 142000000000, progressPct: 48, status: 'Ongoing' },
  { id: 'cx-2', code: 'CX-2026-02', name: 'Penggantian 6 Unit Haul Truck HD785', siteId: 'site-berau', startDate: '2026-03-01', endDate: '2026-12-15', budgetIdr: 420000000000, spentIdr: 396000000000, progressPct: 94, status: 'Ongoing' },
  { id: 'cx-3', code: 'CX-2026-03', name: 'Jetty & Barge Loading Facility', siteId: 'site-te', startDate: '2026-05-10', endDate: '2027-08-31', budgetIdr: 610000000000, spentIdr: 96000000000, progressPct: 16, status: 'Ongoing' },
  { id: 'cx-4', code: 'CX-2026-04', name: 'Pemasangan Sistem Monitoring Real-Time', siteId: 'site-me', startDate: '2026-02-01', endDate: '2026-10-30', budgetIdr: 74000000000, spentIdr: 72500000000, progressPct: 98, status: 'Completed' },
  { id: 'cx-5', code: 'CX-2026-05', name: 'Rehabilitasi Lahan Bekas Tambang Fase 2', siteId: 'site-berau', startDate: '2026-06-01', endDate: '2027-05-31', budgetIdr: 118000000000, spentIdr: 44000000000, progressPct: 37, status: 'Ongoing' },
  { id: 'cx-6', code: 'CX-2026-06', name: 'Studi Kelayakan Blok Timur', siteId: 'site-kubar', startDate: '2026-08-01', endDate: '2027-01-31', budgetIdr: 18500000000, spentIdr: 8100000000, progressPct: 44, status: 'On Hold' },
]

/* ------------------------------- Royalty ----------------------------- */

export const ROYALTIES: RoyaltyRecord[] = (() => {
  const rows: RoyaltyRecord[] = []
  for (let m = 9; m >= 0; m--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1)
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const site = SITES[m % 4]
    const volume = between(280000, 480000)
    const price = between(48, 62, 2)
    const value = volume * price
    const rate = site.gcvAr >= 5200 ? 4 : site.gcvAr >= 4200 ? 5 : site.gcvAr >= 3400 ? 6 : 7
    rows.push({
      id: `roy-${m + 1}`,
      period,
      siteId: site.id,
      volumeMt: volume,
      salesValueUsd: Math.round(value),
      royaltyUsd: Math.round(value * (rate / 100)),
      gcvBand: `GAR ${site.gcvAr}`,
      ratePct: rate,
      status: m === 0 ? 'Accrued' : m === 1 ? 'Pending' : 'Paid',
    })
  }
  return rows
})()

/* ---------------------------- Notifications -------------------------- */

export const NOTIFICATIONS: Notification[] = [
  { id: 'nt-1', title: 'SO-2026-1003 menunggu persetujuan', body: 'Sales Order 32.000 MT ke PT PLN Nusantara Power memerlukan approval Manager Komersial.', time: '12 menit lalu', type: 'warning', read: false },
  { id: 'nt-2', title: 'Stok tyre di bawah minimum', body: 'Stockpile Gudang Utama: Safety Shoes S3 tersisa 68 pasang (min 90).', time: '48 menit lalu', type: 'alert', read: false },
  { id: 'nt-3', title: 'Work Order jatuh tempo', body: 'WO-2026-1007 — CAT 777D melewati jadwal preventive maintenance.', time: '2 jam lalu', type: 'alert', read: false },
  { id: 'nt-4', title: 'RKAB bulanan terverifikasi', body: 'Realisasi RKAB Oktober 2026 sebesar 78.4% telah diverifikasi oleh Cost Control.', time: '5 jam lalu', type: 'success', read: true },
  { id: 'nt-5', title: 'Laporan K3LH bulanan siap', body: 'Statistik HSE September 2026 siap dikirim ke Kementerian ESDM.', time: '1 hari lalu', type: 'info', read: true },
  { id: 'nt-6', title: 'Faktor debu melebihi ambang', body: 'Haul Road KP 4 tercatat 168 µg/m³ (ambang 150 µg/m³) — tindakan korektif diperlukan.', time: '1 hari lalu', type: 'alert', read: false },
  { id: 'nt-7', title: 'Kontrak ekspirasi dalam 45 hari', body: 'KTR/2025/014 dengan Trafigura Pte Ltd berakhir 30 November 2026.', time: '2 hari lalu', type: 'warning', read: true },
  { id: 'nt-8', title: 'Pembayaran invoice terlambat', body: 'INV/2026/7002 untuk PT Indocement tunggakan > 60 hari.', time: '3 hari lalu', type: 'alert', read: true },
]


/* ==========================================================================
   Seed data domain Kontraktor Tambang (Mining Contractor ERP)
   ========================================================================== */

export const PROJECT_CONTRACTS: ProjectContract[] = [
  { id: 'ctr-1', code: 'KTR-2026-001', name: 'Overburden Removal Berau Tahap 3', owner: 'PT Tambang Batu Bara Sejahtera', siteId: 'site-berau', startDate: '2026-01-01', endDate: '2027-06-30', workTypes: ['OB Removal', 'Hauling'], paymentUnit: 'BCM', rateIdr: 78500, targetVolume: 4200000, approvalLimitIdr: 500000000, status: 'Active', version: 2, notes: 'VO-01 menambah area Pit Timur sebesar 180.000 BCM efektif 01 Apr 2026.' },
  { id: 'ctr-2', code: 'KTR-2026-002', name: 'Coal Getting Lahat', owner: 'PT Tambang Batu Bara Sejahtera', siteId: 'site-lht', startDate: '2026-02-01', endDate: '2027-01-31', workTypes: ['Coal Getting', 'Hauling'], paymentUnit: 'Ton', rateIdr: 42000, targetVolume: 1850000, approvalLimitIdr: 350000000, status: 'Active', version: 1, notes: 'Metode ukur timbangan weighbridge Pit Selatan.' },
  { id: 'ctr-3', code: 'KTR-2026-003', name: 'Hauling Muara Enim', owner: 'PT Batu Bara Nusantara', siteId: 'site-me', startDate: '2026-03-15', endDate: '2027-03-14', workTypes: ['Hauling'], paymentUnit: 'Ton', rateIdr: 18500, targetVolume: 2400000, approvalLimitIdr: 250000000, status: 'Active', version: 1, notes: 'Jarak angkut rata-rata 6,8 km; tarif mencakup perawatan jalan hauling.' },
  { id: 'ctr-4', code: 'KTR-2026-004', name: 'Road Maintenance Tanjung Enim', owner: 'PT Batu Bara Nusantara', siteId: 'site-te', startDate: '2026-01-01', endDate: '2026-12-31', workTypes: ['Road Maintenance'], paymentUnit: 'Km', rateIdr: 9500000, targetVolume: 420, approvalLimitIdr: 120000000, status: 'Expiring', version: 1, notes: 'Perpanjangan 2027 dalam pembahasan; perlu asumsi kenaikan tarif BBM.' },
  { id: 'ctr-5', code: 'KTR-2025-005', name: 'Dewatering Lahat', owner: 'PT Tambang Batu Bara Sejahtera', siteId: 'site-lht', startDate: '2025-07-01', endDate: '2026-10-31', workTypes: ['Dewatering'], paymentUnit: 'Jam', rateIdr: 2850000, targetVolume: 9600, approvalLimitIdr: 90000000, status: 'Expiring', version: 3, notes: 'Sisa 1,5 bulan; negosiasi perpanjangan berjalan.' },
  { id: 'ctr-6', code: 'KTR-2026-006', name: 'OB Removal Berau Tahap 4', owner: 'PT Tambang Batu Bara Sejahtera', siteId: 'site-berau', startDate: '2026-11-01', endDate: '2028-10-31', workTypes: ['OB Removal'], paymentUnit: 'BCM', rateIdr: 82000, targetVolume: 5600000, approvalLimitIdr: 750000000, status: 'Review', version: 1, notes: 'Menunggu persetujuan aktivasi oleh pejabat berwenang.' },
]

export const PRODUCTION_TARGETS: ProductionTarget[] = [
  { id: 'tgt-1', code: 'TGT-1', contractId: 'ctr-1', siteId: 'site-berau', period: '2026-10', shift: 'Shift 1', pit: 'Pit Timur', activity: 'OB Removal', unit: 'BCM', targetQty: 42000, version: 2, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Revisi v2: penyesuaian produktivitas excavator EX-200 setelah penggantian bucket' },
  { id: 'tgt-2', code: 'TGT-2', contractId: 'ctr-1', siteId: 'site-berau', period: '2026-10', shift: 'Shift 2', pit: 'Pit Timur', activity: 'OB Removal', unit: 'BCM', targetQty: 41000, version: 2, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Revisi v2: penyesuaian produktivitas excavator EX-200' },
  { id: 'tgt-3', code: 'TGT-3', contractId: 'ctr-1', siteId: 'site-berau', period: '2026-10', shift: 'Shift 3', pit: 'Pit Timur', activity: 'OB Removal', unit: 'BCM', targetQty: 39500, version: 2, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Shift malam diasumsikan 6% lebih rendah karena visibilitas' },
  { id: 'tgt-4', code: 'TGT-4', contractId: 'ctr-2', siteId: 'site-lht', period: '2026-10', shift: 'Shift 1', pit: 'Pit Selatan', activity: 'Coal Getting', unit: 'Ton', targetQty: 28000, version: 1, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Baseline awal kontrak' },
  { id: 'tgt-5', code: 'TGT-5', contractId: 'ctr-2', siteId: 'site-lht', period: '2026-10', shift: 'Shift 2', pit: 'Pit Selatan', activity: 'Coal Getting', unit: 'Ton', targetQty: 27500, version: 1, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Baseline awal kontrak' },
  { id: 'tgt-6', code: 'TGT-6', contractId: 'ctr-3', siteId: 'site-me', period: '2026-10', shift: 'Shift 1', pit: 'Pit Tengah', activity: 'Hauling', unit: 'Ton', targetQty: 31000, version: 1, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Baseline awal kontrak' },
  { id: 'tgt-7', code: 'TGT-7', contractId: 'ctr-1', siteId: 'site-berau', period: '2026-11', shift: 'Shift 1', pit: 'Pit Timur', activity: 'OB Removal', unit: 'BCM', targetQty: 44000, version: 1, status: 'Submitted', planner: 'Ir. Sari Wulandari', reason: 'Rencana November — menunggu tinjauan Superintendent' },
  { id: 'tgt-8', code: 'TGT-8', contractId: 'ctr-4', siteId: 'site-te', period: '2026-10', shift: 'Shift 1', pit: 'Jalan Hauling Utara', activity: 'Road Maintenance', unit: 'Km', targetQty: 14, version: 1, status: 'Approved', planner: 'Ir. Sari Wulandari', reason: 'Baseline awal kontrak' },
  { id: 'tgt-9', code: 'TGT-9', contractId: 'ctr-1', siteId: 'site-berau', period: '2026-12', shift: 'Shift 1', pit: 'Pit Timur', activity: 'OB Removal', unit: 'BCM', targetQty: 46000, version: 1, status: 'Draft', planner: 'Ir. Sari Wulandari', reason: 'Draft awal — belum disusun lengkap' },
]

export const PRODUCTION_LOGS: ProductionLog[] = [
  { id: 'pl-1', code: 'PRD-2026-1001', date: '2026-10-14', shift: 'Shift 1', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-1', 'eq-4', 'eq-7'], qty: 41800, unit: 'BCM', method: 'Survey', operatingHours: 21.5, source: 'Manual', inputBy: 'Budi Santoso', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-2', code: 'PRD-2026-1002', date: '2026-10-14', shift: 'Shift 2', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-2', 'eq-5', 'eq-8'], qty: 39400, unit: 'BCM', method: 'Survey', operatingHours: 20.8, source: 'Manual', inputBy: 'Slamet Riyadi', status: 'Verified', verifiedBy: 'Joko Prasetyo' },
  { id: 'pl-3', code: 'PRD-2026-1003', date: '2026-10-14', shift: 'Shift 3', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-3', 'eq-6'], qty: 36200, unit: 'BCM', method: 'Survey', operatingHours: 18.4, source: 'GPS', inputBy: 'Budi Santoso', status: 'Submitted' },
  { id: 'pl-4', code: 'PRD-2026-1004', date: '2026-10-14', shift: 'Shift 1', siteId: 'site-lht', contractId: 'ctr-2', pit: 'Pit Selatan', activity: 'Coal Getting', unitIds: ['eq-9', 'eq-12'], qty: 27400, unit: 'Ton', method: 'Timbangan', operatingHours: 19.2, source: 'Import', inputBy: 'Budi Santoso', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-5', code: 'PRD-2026-1005', date: '2026-10-14', shift: 'Shift 2', siteId: 'site-lht', contractId: 'ctr-2', pit: 'Pit Selatan', activity: 'Coal Getting', unitIds: ['eq-10', 'eq-13'], qty: 26800, unit: 'Ton', method: 'Timbangan', operatingHours: 18.6, source: 'Import', inputBy: 'Slamet Riyadi', status: 'Verified', verifiedBy: 'Joko Prasetyo' },
  { id: 'pl-6', code: 'PRD-2026-1006', date: '2026-10-14', shift: 'Shift 1', siteId: 'site-me', contractId: 'ctr-3', pit: 'Pit Tengah', activity: 'Hauling', unitIds: ['eq-14', 'eq-15', 'eq-16'], qty: 30200, unit: 'Ton', method: 'Hitung Trip', operatingHours: 22.0, source: 'Manual', inputBy: 'Budi Santoso', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-7', code: 'PRD-2026-1007', date: '2026-10-14', shift: 'Shift 1', siteId: 'site-te', contractId: 'ctr-4', pit: 'Jalan Hauling Utara', activity: 'Road Maintenance', unitIds: ['eq-17', 'eq-18'], qty: 12.4, unit: 'Km', method: 'Survey', operatingHours: 9.5, source: 'Manual', inputBy: 'Budi Santoso', status: 'Verified', verifiedBy: 'Joko Prasetyo' },
  { id: 'pl-8', code: 'PRD-2026-1008', date: '2026-10-13', shift: 'Shift 1', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-1', 'eq-4'], qty: 40100, unit: 'BCM', method: 'Survey', operatingHours: 20.2, source: 'Manual', inputBy: 'Budi Santoso', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-9', code: 'PRD-2026-1009', date: '2026-10-13', shift: 'Shift 2', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-2', 'eq-5'], qty: 37600, unit: 'BCM', method: 'Survey', operatingHours: 19.4, source: 'Manual', inputBy: 'Slamet Riyadi', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-10', code: 'PRD-2026-1010', date: '2026-10-13', shift: 'Shift 3', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-3', 'eq-6'], qty: 33800, unit: 'BCM', method: 'Survey', operatingHours: 17.1, source: 'GPS', inputBy: 'Budi Santoso', status: 'Approved', verifiedBy: 'Joko Prasetyo', approvedBy: 'Dedi Kurniawan' },
  { id: 'pl-11', code: 'PRD-2026-1011', date: '2026-10-15', shift: 'Shift 1', siteId: 'site-berau', contractId: 'ctr-1', pit: 'Pit Timur', activity: 'OB Removal', unitIds: ['eq-1', 'eq-4', 'eq-7'], qty: 22600, unit: 'BCM', method: 'Survey', operatingHours: 11.2, source: 'Manual', inputBy: 'Budi Santoso', status: 'Draft', correctionNote: 'Shift berjalan — data sementara' },
  { id: 'pl-12', code: 'PRD-2026-1012', date: '2026-10-12', shift: 'Shift 2', siteId: 'site-lht', contractId: 'ctr-2', pit: 'Pit Selatan', activity: 'Coal Getting', unitIds: ['eq-10'], qty: 24900, unit: 'Ton', method: 'Timbangan', operatingHours: 16.8, source: 'Import', inputBy: 'Slamet Riyadi', status: 'Returned', correctionNote: 'Dikembalikan foreman: tonase tidak sesuai weighbridge, mohon koreksi' },
]

export const UNIT_ASSIGNMENTS: UnitAssignment[] = [
  { id: 'ua-1', unitId: 'eq-1', operatorId: 'emp-1', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Penugasan rutin OB Removal', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-2', unitId: 'eq-4', operatorId: 'emp-2', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Penugasan rutin OB Removal', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-3', unitId: 'eq-7', operatorId: 'emp-3', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Pasangan excavator EX-200', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-4', unitId: 'eq-2', operatorId: 'emp-4', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 2', startAt: '2026-10-15 15:00', status: 'Active', reason: 'Penugasan rutin OB Removal', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-5', unitId: 'eq-9', operatorId: 'emp-5', siteId: 'site-lht', pit: 'Pit Selatan', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Coal Getting kontrak KTR-2026-002', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-6', unitId: 'eq-14', operatorId: 'emp-6', siteId: 'site-me', pit: 'Pit Tengah', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Hauling kontrak KTR-2026-003', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-7', unitId: 'eq-3', operatorId: 'emp-7', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 3', startAt: '2026-10-14 23:00', endAt: '2026-10-15 07:00', status: 'Completed', reason: 'Shift malam selesai', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-8', unitId: 'eq-17', operatorId: 'emp-8', siteId: 'site-te', pit: 'Jalan Hauling Utara', shift: 'Shift 1', startAt: '2026-10-15 07:00', status: 'Active', reason: 'Road maintenance kontrak KTR-2026-004', assignedBy: 'Joko Prasetyo' },
  { id: 'ua-9', unitId: 'eq-5', operatorId: '', siteId: 'site-berau', pit: 'Pit Timur', shift: 'Shift 2', startAt: '2026-10-15 15:00', status: 'Cancelled', reason: 'Dibatalkan — unit breakdown, menunggu WO', assignedBy: 'Dedi Kurniawan' },
]

export const DOWNTIME_EVENTS: DowntimeEvent[] = [
  { id: 'dt-1', code: 'DT-2026-0412', unitId: 'eq-5', siteId: 'site-berau', startedAt: '2026-10-14 09:20', endedAt: '2026-10-14 14:05', durationHours: 4.75, statusBefore: 'Running', statusAfter: 'Breakdown', category: 'Mechanical', subCategory: 'Hydraulic pump', description: 'Kebocoran selang hidrolik pada lengan excavator', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo', workOrderId: 'wo-1', impactQty: 1850, impactUnit: 'BCM', preventiveAction: 'Inspeksi selang hidrolik setiap 250 JM' },
  { id: 'dt-2', code: 'DT-2026-0413', unitId: 'eq-6', siteId: 'site-berau', startedAt: '2026-10-14 11:00', endedAt: '2026-10-14 12:30', durationHours: 1.5, statusBefore: 'Standby', statusAfter: 'Running', category: 'Waiting Operator', subCategory: 'Operator belum hadir', description: 'Menunggu operator shift 2 yang terlambat', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo' },
  { id: 'dt-3', code: 'DT-2026-0414', unitId: 'eq-10', siteId: 'site-lht', startedAt: '2026-10-14 08:15', endedAt: '2026-10-14 10:45', durationHours: 2.5, statusBefore: 'Running', statusAfter: 'Breakdown', category: 'Tyre/Undercarriage', subCategory: 'Ban bocor', description: 'Ban depan kanan bocor akibat benda tajam di jalan hauling', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo', workOrderId: 'wo-2', impactQty: 920, impactUnit: 'Ton' },
  { id: 'dt-4', code: 'DT-2026-0415', unitId: 'eq-14', siteId: 'site-me', startedAt: '2026-10-14 13:00', endedAt: '2026-10-14 13:40', durationHours: 0.67, statusBefore: 'Running', statusAfter: 'Running', category: 'Waiting Fuel', subCategory: 'Antrean fuel truck', description: 'Menunggu fuel truck yang tertunda di jalan akses', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo' },
  { id: 'dt-5', code: 'DT-2026-0416', unitId: 'eq-1', siteId: 'site-berau', startedAt: '2026-10-15 06:30', endedAt: undefined, durationHours: 1.2, statusBefore: 'Running', statusAfter: 'Waiting Inspection', category: 'Planned Maintenance', subCategory: 'Pre-start inspection', description: 'Menunggu hasil pemeriksaan awal shift — belum ada penyebab akhir', reportedBy: 'Budi Santoso' },
  { id: 'dt-6', code: 'DT-2026-0417', unitId: 'eq-17', siteId: 'site-te', startedAt: '2026-10-13 15:20', endedAt: '2026-10-13 17:10', durationHours: 1.83, statusBefore: 'Running', statusAfter: 'Running', category: 'Weather', subCategory: 'Hujan deras', description: 'Pekerjaan road maintenance dihentikan sementara karena hujan', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo', impactQty: 2.1, impactUnit: 'Km' },
  { id: 'dt-7', code: 'DT-2026-0418', unitId: 'eq-7', siteId: 'site-berau', startedAt: '2026-10-12 10:00', endedAt: '2026-10-12 11:15', durationHours: 1.25, statusBefore: 'Running', statusAfter: 'Running', category: 'Road/Traffic', subCategory: 'Kemacetan di ROM', description: 'Antrean dumping di area ROM karena dump truck menumpuk', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo', impactQty: 480, impactUnit: 'BCM' },
  { id: 'dt-8', code: 'DT-2026-0419', unitId: 'eq-2', siteId: 'site-berau', startedAt: '2026-10-11 14:00', endedAt: '2026-10-11 15:30', durationHours: 1.5, statusBefore: 'Running', statusAfter: 'Breakdown', category: 'Electrical', subCategory: 'Aki lemah', description: 'Aki tidak mampu men-starter mesin setelah jeda panjang', reportedBy: 'Budi Santoso', verifiedBy: 'Joko Prasetyo', workOrderId: 'wo-3', impactQty: 610, impactUnit: 'BCM' },
]

export const FUEL_ISSUES: FuelIssue[] = [
  { id: 'fi-1', code: 'FU-2026-3101', date: '2026-10-15', shift: 'Shift 1', tankId: 'ft-1', unitId: 'eq-1', siteId: 'site-berau', liters: 420, hourMeter: 12480, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Submitted' },
  { id: 'fi-2', code: 'FU-2026-3102', date: '2026-10-15', shift: 'Shift 1', tankId: 'ft-1', unitId: 'eq-4', siteId: 'site-berau', liters: 385, hourMeter: 8210, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Submitted' },
  { id: 'fi-3', code: 'FU-2026-3103', date: '2026-10-15', shift: 'Shift 1', tankId: 'ft-1', unitId: 'eq-7', siteId: 'site-berau', liters: 298, hourMeter: 5640, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Draft', anomaly: 'Jam meter belum dicatat lengkap' },
  { id: 'fi-4', code: 'FU-2026-3104', date: '2026-10-14', shift: 'Shift 2', tankId: 'ft-2', unitId: 'eq-2', siteId: 'site-berau', liters: 402, hourMeter: 9870, filledBy: 'Petugas Fuel', receivedBy: 'Slamet Riyadi', status: 'Verified' },
  { id: 'fi-5', code: 'FU-2026-3105', date: '2026-10-14', shift: 'Shift 2', tankId: 'ft-2', unitId: 'eq-5', siteId: 'site-berau', liters: 378, hourMeter: 6420, filledBy: 'Petugas Fuel', receivedBy: 'Slamet Riyadi', status: 'Verified' },
  { id: 'fi-6', code: 'FU-2026-3106', date: '2026-10-14', shift: 'Shift 1', tankId: 'ft-3', unitId: 'eq-9', siteId: 'site-lht', liters: 355, hourMeter: 7310, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Reconciled' },
  { id: 'fi-7', code: 'FU-2026-3107', date: '2026-10-14', shift: 'Shift 1', tankId: 'ft-3', unitId: 'eq-10', siteId: 'site-lht', liters: 341, hourMeter: 6890, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Reconciled', anomaly: 'Konsumsi 18% di atas baseline unit sejenis' },
  { id: 'fi-8', code: 'FU-2026-3108', date: '2026-10-13', shift: 'Shift 3', tankId: 'ft-1', unitId: 'eq-3', siteId: 'site-berau', liters: 366, hourMeter: 9120, filledBy: 'Petugas Fuel', receivedBy: 'Budi Santoso', status: 'Reconciled' },
]

export const FUEL_RECEIPTS: FuelReceipt[] = [
  { id: 'fr-1', code: 'RCV-FU-0031', date: '2026-10-12', tankId: 'ft-1', supplier: 'PT Bahan Bakar Nusantara', liters: 20000, docNo: 'SJ-8891/BBM/X/26', status: 'Approved' },
  { id: 'fr-2', code: 'RCV-FU-0032', date: '2026-10-12', tankId: 'ft-2', supplier: 'PT Bahan Bakar Nusantara', liters: 15000, docNo: 'SJ-8892/BBM/X/26', status: 'Approved' },
  { id: 'fr-3', code: 'RCV-FU-0033', date: '2026-10-14', tankId: 'ft-3', supplier: 'PT Energi Tambang Sejahtera', liters: 12000, docNo: 'SJ-4410/ETS/X/26', status: 'Verified' },
]

export const SHIFT_HANDOVERS: ShiftHandover[] = [
  { id: 'sh-1', code: 'SHO-2026-1001', date: '2026-10-15', shift: 'Shift 1', siteId: 'site-berau', fromUser: 'Joko Prasetyo', toUser: 'Foreman Shift 2', items: ['EX-200 unit eq-5 masih breakdown, WO-1 terbuka', 'Target shift 1 tercapai 41.800 BCM dari 42.000 BCM', 'Dump truck eq-7 menunggu inspeksi pre-start'], openIssues: 'Kapasitas dumping di ROM menumpuk pukul 10.00–11.00', status: 'Submitted' },
  { id: 'sh-2', code: 'SHO-2026-1002', date: '2026-10-14', shift: 'Shift 2', siteId: 'site-berau', fromUser: 'Foreman Shift 2', toUser: 'Foreman Shift 3', items: ['eq-2 aki lemah sudah ditangani WO-3', 'Jalan hauling timur berlubang di KM 3,2', 'Sisa BBM tangki ft-2 cukup untuk 1,5 shift'], openIssues: 'Perlu grader untuk perbaikan jalan KM 3,2', status: 'Acknowledged' },
  { id: 'sh-3', code: 'SHO-2026-1003', date: '2026-10-14', shift: 'Shift 3', siteId: 'site-berau', fromUser: 'Foreman Shift 3', toUser: 'Joko Prasetyo', items: ['eq-3 selesai shift, jam meter 9.120', 'Tidak ada insiden K3', 'Realisasi shift 3 36.200 BCM'], openIssues: '-', status: 'Acknowledged' },
]

export const CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  { id: 'ca-1', code: 'CA-2026-0089', source: 'Inspeksi', description: 'Pembatas area dumping di ROM tidak terlihat jelas pada malam hari', siteId: 'site-berau', riskLevel: 'Tinggi', pic: 'Supervisor HSE', dueDate: '2026-10-18', status: 'In Progress' },
  { id: 'ca-2', code: 'CA-2026-0090', source: 'Near Miss', description: 'Operator melewati area blind spot excavator tanpa kontak mata', siteId: 'site-lht', riskLevel: 'Ekstrem', pic: 'Foreman Produksi', dueDate: '2026-10-12', status: 'Overdue' },
  { id: 'ca-3', code: 'CA-2026-0091', source: 'Temuan', description: 'APAR pada workshop belum diperiksa bulanan', siteId: 'site-berau', riskLevel: 'Sedang', pic: 'Mekanik Senior', dueDate: '2026-10-20', status: 'Open' },
  { id: 'ca-4', code: 'CA-2026-0092', source: 'Insiden', description: 'Tumpahan BBM di dekat tangki ft-2 belum dibersihkan', siteId: 'site-berau', riskLevel: 'Tinggi', pic: 'Foreman Fuel', dueDate: '2026-10-16', status: 'Awaiting Verification', evidence: 'Foto area setelah pembersihan' },
  { id: 'ca-5', code: 'CA-2026-0093', source: 'Risk Assessment', description: 'Rambu peringatan lerangan di Pit Timur kurang pada tikungan', siteId: 'site-berau', riskLevel: 'Sedang', pic: 'Supervisor HSE', dueDate: '2026-10-25', status: 'Closed', evidence: 'Foto pemasangan rambu', verifiedBy: 'Supervisor HSE' },
  { id: 'ca-6', code: 'CA-2026-0094', source: 'Inspeksi', description: 'Sabuk pengaman operator grader aus melewati batas', siteId: 'site-te', riskLevel: 'Tinggi', pic: 'Foreman Maintenance', dueDate: '2026-10-19', status: 'Open' },
]

export const COST_TRANSACTIONS: CostTransaction[] = [
  { id: 'cx-1', code: 'CST-2026-0891', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'BBM', description: 'Konsumsi BBM 8 unit OB Removal periode 1–14 Okt', amountIdr: 412500000, costType: 'Actual', source: 'BBM', sourceRef: 'FU-2026-3101 s/d 3108', status: 'Posted' },
  { id: 'cx-2', code: 'CST-2026-0892', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'Suku Cadang', description: 'Selang hidrolik, filter, dan kampas rem untuk WO-1..WO-3', amountIdr: 187300000, costType: 'Actual', source: 'Warehouse', sourceRef: 'WO-1, WO-2, WO-3', status: 'Posted' },
  { id: 'cx-3', code: 'CST-2026-0893', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'Jasa Perbaikan', description: 'Overhaul pompa hidrolik oleh vendor khusus', amountIdr: 265000000, costType: 'Committed', source: 'Purchase Order', sourceRef: 'PO-2026-0142', status: 'Posted' },
  { id: 'cx-4', code: 'CST-2026-0894', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'Tenaga Kerja', description: 'Upah operator & mekanik kontrak KTR-2026-001', amountIdr: 1480000000, costType: 'Actual', source: 'Manual', status: 'Posted' },
  { id: 'cx-5', code: 'CST-2026-0895', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'Sewa Alat', description: 'Sewa 2 unit grader cadangan', amountIdr: 180000000, costType: 'Accrual', source: 'Manual', status: 'Draft' },
  { id: 'cx-6', code: 'CST-2026-0896', period: '2026-10', contractId: 'ctr-2', siteId: 'site-lht', category: 'BBM', description: 'Konsumsi BBM coal getting Lahat', amountIdr: 298400000, costType: 'Actual', source: 'BBM', sourceRef: 'FU-2026-3106, 3107', status: 'Posted' },
  { id: 'cx-7', code: 'CST-2026-0897', period: '2026-10', contractId: 'ctr-2', siteId: 'site-lht', category: 'Suku Cadang', description: 'Ban haul truck eq-10 (2 unit)', amountIdr: 156000000, costType: 'Actual', source: 'Warehouse', sourceRef: 'WO-2', status: 'Posted' },
  { id: 'cx-8', code: 'CST-2026-0898', period: '2026-10', contractId: 'ctr-3', siteId: 'site-me', category: 'BBM', description: 'Konsumsi BBM hauling Muara Enim', amountIdr: 356700000, costType: 'Actual', source: 'BBM', status: 'Posted' },
  { id: 'cx-9', code: 'CST-2026-0899', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', category: 'Vendor Pihak Ketiga', description: 'Jasa surveyor pengukuran volume', amountIdr: 45000000, costType: 'Committed', source: 'Purchase Order', sourceRef: 'PO-2026-0151', status: 'Draft' },
  { id: 'cx-10', code: 'CST-2026-0900', period: '2026-11', contractId: 'ctr-1', siteId: 'site-berau', category: 'Mobilisasi', description: 'Mobilisasi 3 unit tambahan untuk Tahap 4', amountIdr: 520000000, costType: 'Forecast', source: 'Manual', status: 'Draft' },
]

export const BILLING_RECONCILIATIONS: BillingReconciliation[] = [
  { id: 'br-1', code: 'REC-2026-0901', period: '2026-09', contractId: 'ctr-1', siteId: 'site-berau', internalVolume: 1180000, submittedVolume: 1180000, approvedVolume: 1162400, unit: 'BCM', rateIdr: 78500, varianceReason: 'Selisih 17.600 BCM: 12.000 BCM di luar batas area kontrak, 5.600 BCM koreksi bersama metode survey', status: 'Invoiced', preparedBy: 'Andi Prasetyo', reviewedBy: 'Bambang Wijaya' },
  { id: 'br-2', code: 'REC-2026-0902', period: '2026-10', contractId: 'ctr-1', siteId: 'site-berau', internalVolume: 1180400, submittedVolume: 1180400, approvedVolume: 0, unit: 'BCM', rateIdr: 78500, varianceReason: 'Menunggu persetujuan pemilik tambang — dokumen pengukuran bersama dikirim 12 Okt', status: 'Awaiting Owner Approval', preparedBy: 'Andi Prasetyo' },
  { id: 'br-3', code: 'REC-2026-0903', period: '2026-09', contractId: 'ctr-2', siteId: 'site-lht', internalVolume: 792000, submittedVolume: 792000, approvedVolume: 792000, unit: 'Ton', rateIdr: 42000, varianceReason: 'Tanpa selisih — metode timbangan weighbridge disepakati', status: 'Paid', preparedBy: 'Andi Prasetyo', reviewedBy: 'Bambang Wijaya' },
  { id: 'br-4', code: 'REC-2026-0904', period: '2026-10', contractId: 'ctr-2', siteId: 'site-lht', internalVolume: 782400, submittedVolume: 782400, approvedVolume: 0, unit: 'Ton', rateIdr: 42000, varianceReason: 'Dokumen pendukung belum lengkap — CoA 3 batch masih menunggu lab', status: 'Draft', preparedBy: 'Andi Prasetyo' },
  { id: 'br-5', code: 'REC-2026-0905', period: '2026-10', contractId: 'ctr-3', siteId: 'site-me', internalVolume: 884000, submittedVolume: 884000, approvedVolume: 884000, unit: 'Ton', rateIdr: 18500, varianceReason: 'Tanpa selisih', status: 'Ready to Bill', preparedBy: 'Andi Prasetyo', reviewedBy: 'Bambang Wijaya' },
  { id: 'br-6', code: 'REC-2026-0906', period: '2026-09', contractId: 'ctr-4', siteId: 'site-te', internalVolume: 38.5, submittedVolume: 38.5, approvedVolume: 37.2, unit: 'Km', rateIdr: 9500000, varianceReason: 'Selisih 1,3 km: segmen KM 3,2 belum memenuhi spesifikasi kualitas kontrak', status: 'Invoiced', preparedBy: 'Andi Prasetyo', reviewedBy: 'Bambang Wijaya' },
]

export const TASKS: TaskItem[] = [
  { id: 'tsk-1', title: 'Verifikasi laporan produksi shift 3', detail: 'PRD-2026-1003 — 36.200 BCM Pit Timur menunggu verifikasi foreman', module: '/monitoring-produksi', priority: 'Tinggi', dueDate: '2026-10-15', status: 'Open', ownerRole: 'Foreman' },
  { id: 'tsk-2', title: 'Lengkapi jam meter pengisian BBM', detail: 'FU-2026-3103 — unit eq-7 belum mencatat jam meter', module: '/bbm', priority: 'Sedang', dueDate: '2026-10-15', status: 'Open', ownerRole: 'Operator' },
  { id: 'tsk-3', title: 'WO kritis masih terbuka', detail: 'WO-1 excavator eq-5 — kebocoran hidrolik, sudah 1 hari', module: '/maintenance', priority: 'Kritis', dueDate: '2026-10-15', status: 'In Progress', ownerRole: 'Foreman' },
  { id: 'tsk-4', title: 'Downtime tanpa penyebab akhir', detail: 'DT-2026-0416 — unit eq-1 menunggu hasil pemeriksaan awal shift', module: '/downtime', priority: 'Sedang', dueDate: '2026-10-15', status: 'Open', ownerRole: 'Operator' },
  { id: 'tsk-5', title: 'Tindakan korektif melewati tenggat', detail: 'CA-2026-0090 — near miss blind spot excavator, terlambat 3 hari', module: '/hse', priority: 'Kritis', dueDate: '2026-10-12', status: 'Open', ownerRole: 'Supervisor' },
  { id: 'tsk-6', title: 'Koreksi laporan produksi dikembalikan', detail: 'PRD-2026-1012 — tonase tidak sesuai weighbridge, dikembalikan foreman', module: '/monitoring-produksi', priority: 'Tinggi', dueDate: '2026-10-15', status: 'Open', ownerRole: 'Operator' },
  { id: 'tsk-7', title: 'Setujui rencana produksi November', detail: 'TGT-7 — 44.000 BCM per shift menunggu tinjauan Superintendent', module: '/perencanaan', priority: 'Sedang', dueDate: '2026-10-20', status: 'Open', ownerRole: 'Superintendent' },
  { id: 'tsk-8', title: 'Review rekonsiliasi volume Oktober', detail: 'REC-2026-0902 — 1.180.400 BCM menunggu persetujuan pemilik tambang', module: '/rekonsiliasi', priority: 'Tinggi', dueDate: '2026-10-25', status: 'Open', ownerRole: 'Commercial Manager' },
  { id: 'tsk-9', title: 'PR part kritis belum diproses', detail: 'PR-2026-0088 — kampas rem 12 set, stok di bawah minimum', module: '/gudang', priority: 'Tinggi', dueDate: '2026-10-17', status: 'Open', ownerRole: 'Foreman' },
  { id: 'tsk-10', title: 'Rekonsiliasi selisih stok BBM', detail: 'Tangki ft-2 selisih 340 liter melebihi ambang', module: '/bbm', priority: 'Sedang', dueDate: '2026-10-18', status: 'Open', ownerRole: 'Supervisor' },
  { id: 'tsk-11', title: 'PO menunggu persetujuan', detail: 'PO-2026-0142 — overhaul pompa hidrolik Rp 265 juta', module: '/pengadaan', priority: 'Tinggi', dueDate: '2026-10-16', status: 'Open', ownerRole: 'Project Manager' },
  { id: 'tsk-12', title: 'Tinjau varians biaya BBM', detail: 'Konsumsi unit eq-10 18% di atas baseline', module: '/biaya', priority: 'Sedang', dueDate: '2026-10-22', status: 'Open', ownerRole: 'Finance Manager' },
]

/* ==========================================================================
   Modul baru: Perencanaan Tambang, Pelabuhan, Legal & Compliance
   ========================================================================== */

export const MINE_PLANS: MinePlan[] = [
  { id: 'mp-1', code: 'MP-2026-Q4-LHT', siteId: 'site-lht', period: '2026-Q4', pit: 'Pit Utara', bench: 'Bench 60–80 m', planCoalMt: 145000, planObBcm: 612000, actualCoalMt: 98400, actualObBcm: 431000, status: 'In Progress', engineer: 'Ir. Hendra Wijaya', notes: 'Fokus ekspansi pit utara, tambah 2 unit haul truck' },
  { id: 'mp-2', code: 'MP-2026-Q4-LHT-S', siteId: 'site-lht', period: '2026-Q4', pit: 'Pit Selatan', bench: 'Bench 40–60 m', planCoalMt: 98000, planObBcm: 402000, actualCoalMt: 62800, actualObBcm: 268000, status: 'In Progress', engineer: 'Ir. Hendra Wijaya', notes: 'Akses jalan haul menuju ROM stockpile B' },
  { id: 'mp-3', code: 'MP-2026-Q4-ME', siteId: 'site-me', period: '2026-Q4', pit: 'Pit Tengah', bench: 'Bench 20–40 m', planCoalMt: 76000, planObBcm: 298000, actualCoalMt: 54100, actualObBcm: 214000, status: 'In Progress', engineer: 'Ir. Siti Nurhaliza', notes: 'Optimasi blending pad untuk grade 4100' },
  { id: 'mp-4', code: 'MP-2026-Q4-TE', siteId: 'site-te', period: '2026-Q4', pit: 'Pit Barat', bench: 'Bench 0–20 m', planCoalMt: 42000, planObBcm: 168000, actualCoalMt: 18900, actualObBcm: 81000, status: 'In Progress', engineer: 'Ir. Siti Nurhaliza', notes: 'Ramp-up produksi, target 4.200 MT/hari' },
  { id: 'mp-5', code: 'MP-2026-Q4-BRU', siteId: 'site-berau', period: '2026-Q4', pit: 'Pit Timur', bench: 'Bench 80–100 m', planCoalMt: 186000, planObBcm: 742000, actualCoalMt: 121400, actualObBcm: 502000, status: 'In Progress', engineer: 'Ir. Agus Salim', notes: 'Prioritas kontrak ekspor GAR 5000' },
  { id: 'mp-6', code: 'MP-2026-Q4-BRU-W', siteId: 'site-berau', period: '2026-Q4', pit: 'Pit Barat', bench: 'Bench 40–60 m', planCoalMt: 112000, planObBcm: 468000, actualCoalMt: 58200, actualObBcm: 254000, status: 'Approved', engineer: 'Ir. Agus Salim', notes: 'Menunggu alokasi alat berat tambahan' },
  { id: 'mp-7', code: 'MP-2027-Q1-LHT', siteId: 'site-lht', period: '2027-Q1', pit: 'Pit Utara', bench: 'Bench 60–80 m', planCoalMt: 152000, planObBcm: 640000, actualCoalMt: 0, actualObBcm: 0, status: 'Draft', engineer: 'Ir. Hendra Wijaya', notes: 'Draft awal RKAB 2027' },
  { id: 'mp-8', code: 'MP-2026-Q3-ME', siteId: 'site-me', period: '2026-Q3', pit: 'Pit Tengah', bench: 'Bench 20–40 m', planCoalMt: 71000, planObBcm: 276000, actualCoalMt: 72400, actualObBcm: 281000, status: 'Completed', engineer: 'Ir. Siti Nurhaliza', notes: 'Realisasi 102% dari rencana' },
  { id: 'mp-9', code: 'MP-2026-Q3-BRU', siteId: 'site-berau', period: '2026-Q3', pit: 'Pit Timur', bench: 'Bench 80–100 m', planCoalMt: 178000, planObBcm: 712000, actualCoalMt: 169200, actualObBcm: 698000, status: 'Completed', engineer: 'Ir. Agus Salim', notes: 'Capaian 95% — kendala cuaca musim hujan' },
  { id: 'mp-10', code: 'MP-2026-Q4-KBR', siteId: 'site-kubar', period: '2026-Q4', pit: 'Blok Timur', bench: 'Studi kelayakan', planCoalMt: 0, planObBcm: 0, actualCoalMt: 0, actualObBcm: 0, status: 'Draft', engineer: 'Ir. Rudi Hartono', notes: 'Tahap studi kelayakan, belum produksi' },
]

export const BLENDING_RECIPES: BlendingRecipe[] = [
  { id: 'bl-1', code: 'BLD-001', name: 'Blend Ekspor GAR 4200', siteId: 'site-lht', targetGcv: 4200, targetAsh: 6, targetSulfur: 0.6, components: [{ stockpileId: 'sp-1', pct: 55 }, { stockpileId: 'sp-2', pct: 30 }, { stockpileId: 'sp-6', pct: 15 }], volumeMt: 68000, status: 'Active' },
  { id: 'bl-2', code: 'BLD-002', name: 'Blend Domestik GAR 4100', siteId: 'site-me', targetGcv: 4100, targetAsh: 5.5, targetSulfur: 0.5, components: [{ stockpileId: 'sp-3', pct: 60 }, { stockpileId: 'sp-7', pct: 40 }], volumeMt: 42000, status: 'Active' },
  { id: 'bl-3', code: 'BLD-003', name: 'Premium GAR 5000 (Ekspor)', siteId: 'site-te', targetGcv: 5000, targetAsh: 4, targetSulfur: 0.35, components: [{ stockpileId: 'sp-4', pct: 75 }, { stockpileId: 'sp-5', pct: 25 }], volumeMt: 18500, status: 'Active' },
  { id: 'bl-4', code: 'BLD-004', name: 'Blend Jetty Berau GAR 4800', siteId: 'site-berau', targetGcv: 4800, targetAsh: 4.5, targetSulfur: 0.4, components: [{ stockpileId: 'sp-5', pct: 80 }, { stockpileId: 'sp-6', pct: 20 }], volumeMt: 96000, status: 'Active' },
  { id: 'bl-5', code: 'BLD-005', name: 'Blend Rendah GAR 3800', siteId: 'site-te', targetGcv: 3800, targetAsh: 8.5, targetSulfur: 0.85, components: [{ stockpileId: 'sp-8', pct: 45 }, { stockpileId: 'sp-6', pct: 35 }, { stockpileId: 'sp-3', pct: 20 }], volumeMt: 24000, status: 'Draft' },
]

export const JETTIES: Jetty[] = [
  { id: 'jty-1', code: 'JTY-BRU-01', name: 'Jetty Berau Utara', siteId: 'site-berau', capacityMtPerDay: 28000, maxDraftM: 14.5, status: 'Operating', bargesLoading: 2 },
  { id: 'jty-2', code: 'JTY-TE-01', name: 'Jetty Tanjung Enim', siteId: 'site-te', capacityMtPerDay: 12000, maxDraftM: 9.5, status: 'Operating', bargesLoading: 1 },
  { id: 'jty-3', code: 'JTY-LHT-01', name: 'Barge Loader Lahat', siteId: 'site-lht', capacityMtPerDay: 9000, maxDraftM: 7.2, status: 'Operating', bargesLoading: 1 },
  { id: 'jty-4', code: 'JTY-BRU-02', name: 'Jetty Berau Selatan', siteId: 'site-berau', capacityMtPerDay: 22000, maxDraftM: 12.8, status: 'Maintenance', bargesLoading: 0 },
]

export const VESSELS: Vessel[] = [
  { id: 'vsl-1', code: 'VSL-001', name: 'MV Bara Jaya', type: 'Vessel', dwtMt: 58000, customerId: 'cus-6', contractId: 'ctr-2', jettyId: 'jty-1', eta: '2026-10-14', etb: '2026-10-14', status: 'Loading', tonnageMt: 55000, loadedMt: 38200, loadingRateMtPerDay: 26000, blNumber: '', surveyor: 'SGS', destination: 'Port of Qinzhou, China' },
  { id: 'vsl-2', code: 'VSL-002', name: 'MV Coal Horizon', type: 'Vessel', dwtMt: 63000, customerId: 'cus-7', contractId: 'ctr-4', jettyId: 'jty-1', eta: '2026-10-16', etb: '2026-10-17', status: 'Waiting', tonnageMt: 60000, loadedMt: 0, loadingRateMtPerDay: 28000, blNumber: '', surveyor: 'Cointeste', destination: 'Mundra Port, India' },
  { id: 'vsl-3', code: 'VSL-003', name: 'Barge TBH-12', type: 'Barge', dwtMt: 12000, customerId: 'cus-1', contractId: 'ctr-1', jettyId: 'jty-3', eta: '2026-10-15', etb: '2026-10-15', status: 'Loading', tonnageMt: 11500, loadedMt: 8400, loadingRateMtPerDay: 8500, blNumber: '', surveyor: 'SGS', destination: 'PLTU Suralaya' },
  { id: 'vsl-4', code: 'VSL-004', name: 'Barge TBH-07', type: 'Barge', dwtMt: 10500, customerId: 'cus-2', contractId: 'ctr-3', jettyId: 'jty-3', eta: '2026-10-18', etb: '2026-10-18', status: 'Waiting', tonnageMt: 10000, loadedMt: 0, loadingRateMtPerDay: 8200, blNumber: '', surveyor: 'Intertek', destination: 'Semen Baturaja' },
  { id: 'vsl-5', code: 'VSL-005', name: 'MV Nusantara IX', type: 'Vessel', dwtMt: 47000, customerId: 'cus-6', contractId: 'ctr-2', jettyId: 'jty-1', eta: '2026-10-11', etb: '2026-10-11', status: 'Sailed', tonnageMt: 45000, loadedMt: 45000, loadingRateMtPerDay: 24000, blNumber: 'BL-2026-0451', surveyor: 'SGS', destination: 'Port of Qinzhou, China' },
  { id: 'vsl-6', code: 'VSL-006', name: 'MV Samudra Permai', type: 'Vessel', dwtMt: 52000, customerId: 'cus-7', contractId: 'ctr-4', jettyId: 'jty-1', eta: '2026-10-09', etb: '2026-10-10', status: 'Sailed', tonnageMt: 50000, loadedMt: 50000, loadingRateMtPerDay: 25000, blNumber: 'BL-2026-0448', surveyor: 'Cointeste', destination: 'Mundra Port, India' },
  { id: 'vsl-7', code: 'VSL-007', name: 'Barge KMS-21', type: 'Barge', dwtMt: 13000, customerId: 'cus-1', contractId: 'ctr-1', jettyId: 'jty-3', eta: '2026-10-07', etb: '2026-10-08', status: 'Sailed', tonnageMt: 13000, loadedMt: 13000, loadingRateMtPerDay: 8800, blNumber: 'BL-2026-0442', surveyor: 'SGS', destination: 'PLTU Suralaya' },
  { id: 'vsl-8', code: 'VSL-008', name: 'Barge TBH-19', type: 'Barge', dwtMt: 11800, customerId: 'cus-3', contractId: 'ctr-5', jettyId: 'jty-2', eta: '2026-10-19', etb: '2026-10-20', status: 'Waiting', tonnageMt: 11000, loadedMt: 0, loadingRateMtPerDay: 7800, blNumber: '', surveyor: 'Geoservices', destination: 'Indocement Cirebon' },
  { id: 'vsl-9', code: 'VSL-009', name: 'MV Bara Nusantara', type: 'Vessel', dwtMt: 41000, customerId: 'cus-9', contractId: 'ctr-6', jettyId: 'jty-1', eta: '2026-10-21', etb: '2026-10-22', status: 'Waiting', tonnageMt: 40000, loadedMt: 0, loadingRateMtPerDay: 21000, blNumber: '', surveyor: 'SGS', destination: 'Port of Kaohsiung, Taiwan' },
  { id: 'vsl-10', code: 'VSL-010', name: 'Tug Boat Laut Jaya 3', type: 'Tug Boat', dwtMt: 0, customerId: 'cus-1', contractId: 'ctr-1', jettyId: 'jty-1', eta: '2026-10-13', etb: '2026-10-13', status: 'Loading', tonnageMt: 0, loadedMt: 0, loadingRateMtPerDay: 0, blNumber: '', surveyor: 'SGS', destination: 'Operasional penarik barge' },
  { id: 'vsl-11', code: 'VSL-011', name: 'MV Coal Meridian', type: 'Vessel', dwtMt: 56000, customerId: 'cus-6', contractId: 'ctr-2', jettyId: 'jty-1', eta: '2026-10-24', etb: '2026-10-25', status: 'Waiting', tonnageMt: 54000, loadedMt: 0, loadingRateMtPerDay: 26000, blNumber: '', surveyor: 'SGS', destination: 'Port of Qinzhou, China' },
  { id: 'vsl-12', code: 'VSL-012', name: 'Barge TBH-15', type: 'Barge', dwtMt: 10900, customerId: 'cus-4', contractId: 'ctr-7', jettyId: 'jty-2', eta: '2026-10-06', etb: '2026-10-06', status: 'Sailed', tonnageMt: 10500, loadedMt: 10500, loadingRateMtPerDay: 7600, blNumber: 'BL-2026-0438', surveyor: 'Intertek', destination: 'Tjiwi Kimia Sidoarjo' },
]

export const PERMITS: Permit[] = [
  { id: 'prm-1', code: 'IZN-001', type: 'IUP OP', siteId: 'site-lht', number: '420/KAB-BPPT/2019', authority: 'Bupati Lahat', issuedDate: '2019-06-14', expiryDate: '2029-06-13', status: 'Aktif', pic: 'Legal & Compliance' },
  { id: 'prm-2', code: 'IZN-002', type: 'PKP2B', siteId: 'site-lht', number: 'PKP2B-0032/2019', authority: 'Kementerian ESDM', issuedDate: '2019-08-20', expiryDate: '2039-08-19', status: 'Aktif', pic: 'Legal & Compliance' },
  { id: 'prm-3', code: 'IZN-003', type: 'AMDAL', siteId: 'site-lht', number: 'AMDAL-021/LH/2019', authority: 'Dinas LH Sumsel', issuedDate: '2019-05-02', expiryDate: '2027-05-01', status: 'Akan Berakhir', pic: 'HSE' },
  { id: 'prm-4', code: 'IZN-004', type: 'UKL-UPL', siteId: 'site-lht', number: 'UKL-UPL-018/LH/2019', authority: 'Dinas LH Sumsel', issuedDate: '2019-05-02', expiryDate: '2027-05-01', status: 'Akan Berakhir', pic: 'HSE' },
  { id: 'prm-5', code: 'IZN-005', type: 'IUP OP', siteId: 'site-me', number: '415/KAB-BPPT/2018', authority: 'Bupati Muara Enim', issuedDate: '2018-09-10', expiryDate: '2028-09-09', status: 'Aktif', pic: 'Legal & Compliance' },
  { id: 'prm-6', code: 'IZN-006', type: 'AMDAL', siteId: 'site-me', number: 'AMDAL-045/LH/2018', authority: 'Dinas LH Sumsel', issuedDate: '2018-08-15', expiryDate: '2026-08-14', status: 'Proses Perpanjangan', pic: 'HSE' },
  { id: 'prm-7', code: 'IZN-007', type: 'IUP OPK', siteId: 'site-te', number: '430/KAB-BPPT/2021', authority: 'Bupati Tanjung Enim', issuedDate: '2021-03-18', expiryDate: '2031-03-17', status: 'Aktif', pic: 'Legal & Compliance' },
  { id: 'prm-8', code: 'IZN-008', type: 'RKAB', siteId: 'site-lht', number: 'RKAB-2026/LHT', authority: 'Kementerian ESDM', issuedDate: '2026-01-05', expiryDate: '2026-12-31', status: 'Aktif', pic: 'Perencanaan Tambang' },
  { id: 'prm-9', code: 'IZN-009', type: 'RKAB', siteId: 'site-berau', number: 'RKAB-2026/BRU', authority: 'Kementerian ESDM', issuedDate: '2026-01-08', expiryDate: '2026-12-31', status: 'Aktif', pic: 'Perencanaan Tambang' },
  { id: 'prm-10', code: 'IZN-010', type: 'IUP OP', siteId: 'site-berau', number: '890/KALTIM-BPPT/2017', authority: 'Bupati Berau', issuedDate: '2017-11-22', expiryDate: '2027-11-21', status: 'Aktif', pic: 'Legal & Compliance' },
  { id: 'prm-11', code: 'IZN-011', type: 'AMDAL', siteId: 'site-berau', number: 'AMDAL-112/LH/2017', authority: 'Dinas LH Kaltim', issuedDate: '2017-10-05', expiryDate: '2027-10-04', status: 'Aktif', pic: 'HSE' },
  { id: 'prm-12', code: 'IZN-012', type: 'SIMBAT', siteId: 'site-lht', number: 'SIPB-089/LH/2019', authority: 'Dinas LH Sumsel', issuedDate: '2019-07-11', expiryDate: '2026-12-31', status: 'Akan Berakhir', pic: 'HSE' },
  { id: 'prm-13', code: 'IZN-013', type: 'HO', siteId: 'site-berau', number: 'HO-2026-BRU-112', authority: 'Kementerian ESDM', issuedDate: '2026-02-14', expiryDate: '2026-12-31', status: 'Aktif', pic: 'Perencanaan Tambang' },
  { id: 'prm-14', code: 'IZN-014', type: 'PNBP', siteId: 'site-lht', number: 'PNBP-SPD-2026-0891', authority: 'Kementerian ESDM', issuedDate: '2026-01-15', expiryDate: '2026-12-31', status: 'Aktif', pic: 'Keuangan' },
  { id: 'prm-15', code: 'IZN-015', type: 'Izin Lingkungan', siteId: 'site-te', number: 'SK-045/DLH/2021', authority: 'Dinas LH Sumsel', issuedDate: '2021-04-20', expiryDate: '2026-04-19', status: 'Expired', pic: 'HSE' },
  { id: 'prm-16', code: 'IZN-016', type: 'IUP OPK', siteId: 'site-kubar', number: '905/KALTIM-BPPT/2020', authority: 'Bupati Kutai Barat', issuedDate: '2020-07-30', expiryDate: '2030-07-29', status: 'Aktif', pic: 'Legal & Compliance' },
]

export const COMPLIANCE: ComplianceObligation[] = [
  { id: 'cmp-1', code: 'KPS-001', obligation: 'Laporan Bulanan Produksi & Pengupasan (e-SPN)', authority: 'Kementerian ESDM', category: 'Operasional', siteId: 'site-lht', dueDate: '2026-11-10', frequency: 'Bulanan', status: 'Proses', evidence: 'Laporan Oktober 2026 (draft)', pic: 'Perencanaan Tambang' },
  { id: 'cmp-2', code: 'KPS-002', obligation: 'Pembayaran Royalti PNBP', authority: 'Kementerian ESDM', category: 'Fiskal', siteId: 'site-lht', dueDate: '2026-11-15', frequency: 'Bulanan', status: 'Belum Jatuh Tempo', evidence: 'SSP PNBP Oktober', pic: 'Keuangan' },
  { id: 'cmp-3', code: 'KPS-003', obligation: 'Laporan K3LH Bulanan (SMKP)', authority: 'Kementerian ESDM', category: 'Keselamatan', siteId: 'site-berau', dueDate: '2026-11-05', frequency: 'Bulanan', status: 'Terlambat', evidence: 'Menunggu data insiden Oktober', pic: 'Manager HSE' },
  { id: 'cmp-4', code: 'KPS-004', obligation: 'Laporan Limbah B3 & Manifest', authority: 'Dinas LH Kaltim', category: 'Lingkungan', siteId: 'site-berau', dueDate: '2026-10-28', frequency: 'Triwulan', status: 'Proses', evidence: 'Manifest Q4 2026', pic: 'Environmental Officer' },
  { id: 'cmp-5', code: 'KPS-005', obligation: 'Pembayaran PPh Final 22 Ekspor', authority: 'Direktorat Jenderal Pajak', category: 'Fiskal', siteId: 'site-berau', dueDate: '2026-11-20', frequency: 'Bulanan', status: 'Belum Jatuh Tempo', evidence: 'e-Billing PPh 22', pic: 'Tax Specialist' },
  { id: 'cmp-6', code: 'KPS-006', obligation: 'Laporan Reklamasi & Pasca Tambang', authority: 'Dinas LH Sumsel', category: 'Lingkungan', siteId: 'site-lht', dueDate: '2026-11-30', frequency: 'Tahunan', status: 'Proses', evidence: 'Laporan reklamasi 2026', pic: 'Environmental Officer' },
  { id: 'cmp-7', code: 'KPS-007', obligation: 'Laporan BPJS Ketenagakerjaan', authority: 'BPJS Ketenagakerjaan', category: 'Tenaga Kerja', siteId: 'site-lht', dueDate: '2026-11-10', frequency: 'Bulanan', status: 'Terpenuhi', evidence: 'Bukti setor Oktober', pic: 'HR Generalist' },
  { id: 'cmp-8', code: 'KPS-008', obligation: 'Laporan Penerimaan Tenaga Kerja Asing', authority: 'Kementerian Ketenagakerjaan', category: 'Tenaga Kerja', siteId: 'site-berau', dueDate: '2026-11-15', frequency: 'Triwulan', status: 'Terpenuhi', evidence: 'RPTKA Q4 2026', pic: 'HR Generalist' },
  { id: 'cmp-9', code: 'KPS-009', obligation: 'Uji Emisi Kendaraan & Alat Berat', authority: 'Dinas Perhubungan', category: 'Lingkungan', siteId: 'site-me', dueDate: '2026-10-31', frequency: 'Tahunan', status: 'Proses', evidence: 'Jadwal uji emisi', pic: 'HSE Officer' },
  { id: 'cmp-10', code: 'KPS-010', obligation: 'Laporan Kegiatan Pemberdayaan Masyarakat', authority: 'Dinas ESDM', category: 'Operasional', siteId: 'site-te', dueDate: '2026-12-15', frequency: 'Tahunan', status: 'Proses', evidence: 'Laporan CSR 2026', pic: 'Legal & Compliance' },
  { id: 'cmp-11', code: 'KPS-011', obligation: 'Inspeksi Keselamatan Kerja Periodik', authority: 'Kementerian Ketenagakerjaan', category: 'Keselamatan', siteId: 'site-lht', dueDate: '2026-11-25', frequency: 'Tahunan', status: 'Belum Jatuh Tempo', evidence: 'Undangan inspeksi', pic: 'Safety Supervisor' },
  { id: 'cmp-12', code: 'KPS-012', obligation: 'Laporan Realisasi RKAB', authority: 'Kementerian ESDM', category: 'Operasional', siteId: 'site-me', dueDate: '2026-11-08', frequency: 'Bulanan', status: 'Proses', evidence: 'Realisasi Oktober 2026', pic: 'Cost Controller' },
]

export const ACTIVITY: ActivityItem[] = [
  { id: 'ac-1', time: '2026-10-15 08:42', user: 'Dedi Kurniawan', action: 'Menyetujui laporan produksi PRD-2026-1001', module: 'Monitoring Produksi', type: 'approve', detail: '41.800 BCM Pit Timur Shift 1 — status Verified menjadi Approved' },
  { id: 'ac-2', time: '2026-10-15 08:15', user: 'Joko Prasetyo', action: 'Memverifikasi laporan produksi PRD-2026-1002', module: 'Monitoring Produksi', type: 'approve', detail: '39.400 BCM Pit Timur Shift 2 — status Submitted menjadi Verified' },
  { id: 'ac-3', time: '2026-10-15 08:05', user: 'Slamet Riyadi', action: 'Mengembalikan laporan produksi PRD-2026-1012', module: 'Monitoring Produksi', type: 'reject', detail: 'Tonase tidak sesuai weighbridge — dikembalikan untuk koreksi' },
  { id: 'ac-4', time: '2026-10-15 07:58', user: 'Budi Santoso', action: 'Mencatat pengisian BBM FU-2026-3101', module: 'Manajemen BBM', type: 'create', detail: '420 liter ke unit eq-1 — jam meter 12.480' },
  { id: 'ac-5', time: '2026-10-15 07:40', user: 'Joko Prasetyo', action: 'Membuat penugasan unit ua-1', module: 'Dispatch', type: 'create', detail: 'eq-1 + emp-1 ke Pit Timur Shift 1' },
  { id: 'ac-6', time: '2026-10-14 16:20', user: 'Budi Santoso', action: 'Melaporkan downtime DT-2026-0412', module: 'Downtime', type: 'create', detail: 'eq-5 Mechanical 4,75 jam — kebocoran selang hidrolik' },
  { id: 'ac-7', time: '2026-10-14 15:05', user: 'Ir. Agus Setiawan', action: 'Menyetujui rencana produksi November', module: 'Perencanaan Produksi', type: 'approve', detail: 'TGT-7 44.000 BCM Shift 1 — status Submitted menjadi Approved' },
  { id: 'ac-8', time: '2026-10-14 14:12', user: 'Ir. Sari Wulandari', action: 'Merevisi rencana produksi Oktober', module: 'Perencanaan Produksi', type: 'edit', detail: 'TGT-1 v1 menjadi v2 — penyesuaian produktivitas EX-200' },
  { id: 'ac-9', time: '2026-10-14 11:30', user: 'Ir. Bambang Wijaya', action: 'Menerbitkan purchase order PO-2026-0142', module: 'Procurement', type: 'approve', detail: 'Overhaul pompa hidrolik Rp 265.000.000 — nilai di bawah batas kewenangan' },
  { id: 'ac-10', time: '2026-10-14 10:48', user: 'Andi Prasetyo, S.E.', action: 'Menyiapkan rekonsiliasi REC-2026-0902', module: 'Rekonsiliasi', type: 'create', detail: '1.180.400 BCM periode 2026-10 kontrak KTR-2026-001' },
  { id: 'ac-11', time: '2026-10-14 09:15', user: 'Maya Kusuma, S.E., Ak.', action: 'Membuat transaksi biaya CST-2026-0891', module: 'Cost Control', type: 'create', detail: 'Kategori BBM Rp 412.500.000 — jenis Actual' },
  { id: 'ac-12', time: '2026-10-14 08:55', user: 'Fajar Ramadhan', action: 'Mengubah ambang selisih stok BBM', module: 'Pengaturan Sistem', type: 'edit', detail: 'Ambang selisih 1% menjadi 0,8% — tercatat sebagai konfigurasi yang dapat diaudit' },
  { id: 'ac-13', time: '2026-10-13 16:04', user: 'Supervisor HSE', action: 'Menutup tindakan korektif CA-2026-0093', module: 'HSE', type: 'approve', detail: 'Pemasangan rambu lerangan Pit Timur — bukti foto terlampir' },
  { id: 'ac-14', time: '2026-10-13 14:38', user: 'Rina Hartati, S.E.', action: 'Mengekspor laporan produksi bulanan', module: 'Laporan', type: 'export', detail: 'Laporan Produksi Harian per Shift — format PDF' },
  { id: 'ac-15', time: '2026-10-13 11:20', user: 'Dedi Kurniawan', action: 'Menutup work order WO-3', module: 'Maintenance', type: 'approve', detail: 'eq-2 penggantian aki — pengujian 30 menit berhasil' },
  { id: 'ac-16', time: '2026-10-13 09:02', user: 'Budi Santoso', action: 'Masuk ke sistem', module: 'Sistem', type: 'login', detail: 'Sesi dari Site Berau — peran Operator' },
]

export const CURRENT_USER: User = {
  id: 'usr-1',
  name: 'Ir. Bambang Setiawan',
  email: 'bambang.setiawan@mifacoal.co.id',
  role: 'GM Operasional',
  avatar: 'BS',
}

export const COMPANY = {
  name: 'PT MIFA Bara Nusantara',
  short: 'MIFA',
  tagline: 'Integrated Coal Mining Operations',
  address: 'Jl. Gubernur H. A Bastari No. 88, Palembang, Sumatera Selatan 30139',
  phone: '+62 711 4455 220',
  email: 'corporate@mifacoal.co.id',
  npwp: '71.234.567.8-309.000',
  pkp2b: 'PKP2B-0032/2019',
  since: 2009,
  employees: 1284,
  fx: 15850, // USD/IDR
}
