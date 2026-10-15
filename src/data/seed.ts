/* ==========================================================================
   MIFA ERP — Deterministic Seed Data
   Data demo realistis untuk operasional tambang batu bara (IUP Produksi).
   ========================================================================== */

import type {
  Site,
  Employee,
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

const VESSELS = ['MV Bara Jaya', 'MV Coal Horizon', 'Barge TBH-12', 'Barge TBH-07', 'MV Nusantara IX', 'Barge KMS-21', 'MV Samudra Permai', 'Barge TBH-19']
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
    vesselBarge: VESSELS[i % VESSELS.length],
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

export const ACTIVITY: ActivityItem[] = [
  { id: 'ac-1', time: '08:42', user: 'Bambang Setiawan', action: 'menyetujui rencana produksi harian Site Lahat', module: 'Produksi' },
  { id: 'ac-2', time: '09:15', user: 'Hendra Wijaya', action: 'membuat Sales Order SO-2026-1012', module: 'Penjualan' },
  { id: 'ac-3', time: '10:03', user: 'Siti Nurhaliza', action: 'memverifikasi CoA pengiriman barge TBH-12', module: 'Penjualan' },
  { id: 'ac-4', time: '10:38', user: 'Agus Salim', action: 'menutup insiden Near Miss INC-2026-041', module: 'HSE' },
  { id: 'ac-5', time: '11:20', user: 'Rudi Hartono', action: 'menyetujui PO bahan bakar Rp 2,4 M', module: 'Pembelian' },
  { id: 'ac-6', time: '13:05', user: 'Maya Kusuma', action: 'posting jurnal penjualan JV-2026-3042', module: 'Keuangan' },
  { id: 'ac-7', time: '14:12', user: 'Dedi Prasetyo', action: 'menyelesaikan WO preventive CAT 6015B', module: 'Armada' },
  { id: 'ac-8', time: '15:30', user: 'Fitri Ramadani', action: 'menutup stok opname gudang utama', module: 'Inventory' },
  { id: 'ac-9', time: '16:04', user: 'Yanti Lestari', action: 'menyetujui pengajuan cuti 12 karyawan', module: 'SDM' },
  { id: 'ac-10', time: '16:48', user: 'Zulkifli Harahap', action: 'mengunggah laporan RKAB Oktober', module: 'Laporan' },
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
