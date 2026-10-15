import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as SEED from './data/seed'
import type {
  ActivityItem,
  Bill,
  BudgetLine,
  CapexProject,
  Contract,
  Customer,
  Employee,
  EnvironmentalReading,
  Equipment,
  FuelTank,
  Incident,
  Invoice,
  JournalEntry,
  MaintenanceJob,
  Notification,
  ProductionRecord,
  PurchaseOrder,
  RoyaltyRecord,
  SalesOrder,
  Site,
  Stockpile,
  TrainingRecord,
  User,
  Vendor,
  WarehouseItem,
} from './types'

export interface AppState {
  sites: Site[]
  employees: Employee[]
  production: ProductionRecord[]
  stockpiles: Stockpile[]
  warehouseItems: WarehouseItem[]
  fuelTanks: FuelTank[]
  equipment: Equipment[]
  maintenance: MaintenanceJob[]
  incidents: Incident[]
  training: TrainingRecord[]
  environmental: EnvironmentalReading[]
  customers: Customer[]
  contracts: Contract[]
  salesOrders: SalesOrder[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
  journals: JournalEntry[]
  invoices: Invoice[]
  bills: Bill[]
  budgets: BudgetLine[]
  capex: CapexProject[]
  royalties: RoyaltyRecord[]
  notifications: Notification[]
  activity: ActivityItem[]
  currentUser: User
}

const STORAGE_KEY = 'mifa-erp-state-v1'
const TODAY = SEED.TODAY_ISO

function freshState(): AppState {
  return {
    sites: SEED.SITES,
    employees: SEED.EMPLOYEES,
    production: SEED.PRODUCTION,
    stockpiles: SEED.STOCKPILES,
    warehouseItems: SEED.WAREHOUSE_ITEMS,
    fuelTanks: SEED.FUEL_TANKS,
    equipment: SEED.EQUIPMENT,
    maintenance: SEED.MAINTENANCE,
    incidents: SEED.INCIDENTS,
    training: SEED.TRAINING,
    environmental: SEED.ENVIRONMENTAL,
    customers: SEED.CUSTOMERS,
    contracts: SEED.CONTRACTS,
    salesOrders: SEED.SALES_ORDERS,
    vendors: SEED.VENDORS,
    purchaseOrders: SEED.PURCHASE_ORDERS,
    journals: SEED.JOURNALS,
    invoices: SEED.INVOICES,
    bills: SEED.BILLS,
    budgets: SEED.BUDGETS,
    capex: SEED.CAPEX_PROJECTS,
    royalties: SEED.ROYALTIES,
    notifications: SEED.NOTIFICATIONS,
    activity: SEED.ACTIVITY,
    currentUser: SEED.CURRENT_USER,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = freshState()
    return { ...base, ...parsed }
  } catch {
    return freshState()
  }
}

let idCounter = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter += 1)}`

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info' | 'warning'
}

interface AppContextValue {
  state: AppState
  toasts: Toast[]
  toast: (message: string, variant?: Toast['variant']) => void
  dismissToast: (id: string) => void
  actions: {
    addProduction: (r: Omit<ProductionRecord, 'id' | 'status' | 'createdBy'>) => void
    setProductionStatus: (id: string, status: ProductionRecord['status']) => void
    addSalesOrder: (r: Omit<SalesOrder, 'id' | 'status' | 'soNo'>) => void
    setSalesOrderStatus: (id: string, status: SalesOrder['status']) => void
    addContract: (r: Omit<Contract, 'id' | 'liftedMt' | 'status' | 'code'>) => void
    addPurchaseOrder: (r: Omit<PurchaseOrder, 'id' | 'status' | 'poNo'>) => void
    setPurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void
    addMaintenance: (r: Omit<MaintenanceJob, 'id' | 'status' | 'woNo'>) => void
    setMaintenanceStatus: (id: string, status: MaintenanceJob['status']) => void
    setEquipmentStatus: (id: string, status: Equipment['status']) => void
    addIncident: (r: Omit<Incident, 'id' | 'status' | 'lostDays'>) => void
    setIncidentStatus: (id: string, status: Incident['status']) => void
    addTraining: (r: Omit<TrainingRecord, 'id' | 'status'>) => void
    addWarehouseItem: (r: Omit<WarehouseItem, 'id'>) => void
    adjustStock: (id: string, delta: number) => void
    addEmployee: (r: Omit<Employee, 'id' | 'nip'>) => void
    addBudget: (r: Omit<BudgetLine, 'id'>) => void
    addCapex: (r: Omit<CapexProject, 'id'>) => void
    addCustomer: (r: Omit<Customer, 'id' | 'outstandingIdr' | 'status' | 'code'>) => void
    addVendor: (r: Omit<Vendor, 'id' | 'totalSpendIdr' | 'status' | 'rating' | 'code'>) => void
    markNotificationRead: (id: string) => void
    markAllNotificationsRead: () => void
    resetData: () => void
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage penuh / tidak tersedia — abaikan */
    }
  }, [state])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: Toast['variant'] = 'success') => {
      const id = uid('toast')
      setToasts((t) => [...t, { id, message, variant }])
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    },
    [],
  )

  const logActivity = useCallback((action: string, module: string) => {
    setState((s) => ({
      ...s,
      activity: [
        {
          id: uid('ac'),
          time: new Date().toTimeString().slice(0, 5),
          user: s.currentUser.name,
          action,
          module,
        },
        ...s.activity,
      ].slice(0, 40),
    }))
  }, [])

  const pushNotification = useCallback((title: string, body: string, type: Notification['type']) => {
    setState((s) => ({
      ...s,
      notifications: [
        { id: uid('nt'), title, body, time: 'Baru saja', type, read: false },
        ...s.notifications,
      ].slice(0, 30),
    }))
  }, [])

  const actions = useMemo<AppContextValue['actions']>(
    () => ({
      addProduction: (r) => {
        setState((s) => ({
          ...s,
          production: [{ ...r, id: uid('prd'), status: 'Draft', createdBy: s.currentUser.name }, ...s.production],
        }))
        logActivity(`menginput laporan produksi ${r.date}`, 'Produksi')
        toast('Laporan produksi berhasil disimpan', 'success')
      },
      setProductionStatus: (id, status) => {
        setState((s) => ({
          ...s,
          production: s.production.map((p) => (p.id === id ? { ...p, status } : p)),
        }))
        toast(`Status laporan produksi → ${status}`, 'info')
      },
      addSalesOrder: (r) => {
        const soNo = `SO-2026-${String(1022 + Math.floor(Math.random() * 900))}`
        setState((s) => ({
          ...s,
          salesOrders: [{ ...r, id: uid('so'), soNo, status: 'Draft' }, ...s.salesOrders],
        }))
        logActivity(`membuat Sales Order ${soNo}`, 'Penjualan')
        pushNotification('Sales Order baru dibuat', `${soNo} menunggu verifikasi tim komersial.`, 'info')
        toast(`Sales Order ${soNo} berhasil dibuat`, 'success')
      },
      setSalesOrderStatus: (id, status) => {
        setState((s) => ({
          ...s,
          salesOrders: s.salesOrders.map((o) => (o.id === id ? { ...o, status } : o)),
        }))
        toast(`Status SO diperbarui → ${status}`, 'info')
      },
      addContract: (r) => {
        const code = `KTR/2026/${String(Math.floor(Math.random() * 900) + 100)}`
        setState((s) => ({
          ...s,
          contracts: [{ ...r, id: uid('ctr'), code, liftedMt: 0, status: 'Draft' }, ...s.contracts],
        }))
        logActivity(`membuat kontrak ${code}`, 'Penjualan')
        toast(`Kontrak ${code} berhasil dibuat`, 'success')
      },
      addPurchaseOrder: (r) => {
        const poNo = `PO-2026-${String(Math.floor(Math.random() * 900) + 2100)}`
        setState((s) => ({
          ...s,
          purchaseOrders: [{ ...r, id: uid('po'), poNo, status: 'Pending Approval' }, ...s.purchaseOrders],
        }))
        logActivity(`membuat Purchase Order ${poNo}`, 'Pembelian')
        pushNotification('PO menunggu persetujuan', `${poNo} — ${r.category} menunggu approval.`, 'warning')
        toast(`Purchase Order ${poNo} diajukan`, 'success')
      },
      setPurchaseOrderStatus: (id, status) => {
        setState((s) => ({
          ...s,
          purchaseOrders: s.purchaseOrders.map((p) => (p.id === id ? { ...p, status } : p)),
        }))
        toast(`PO diperbarui → ${status}`, status === 'Approved' ? 'success' : 'info')
      },
      addMaintenance: (r) => {
        const woNo = `WO-2026-${String(Math.floor(Math.random() * 900) + 1100)}`
        setState((s) => ({
          ...s,
          maintenance: [{ ...r, id: uid('mt'), woNo, status: 'Scheduled' }, ...s.maintenance],
        }))
        logActivity(`membuat Work Order ${woNo}`, 'Armada')
        toast(`Work Order ${woNo} dijadwalkan`, 'success')
      },
      setMaintenanceStatus: (id, status) => {
        setState((s) => ({
          ...s,
          maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, status } : m)),
        }))
        toast(`Work Order → ${status}`, 'info')
      },
      setEquipmentStatus: (id, status) => {
        setState((s) => ({
          ...s,
          equipment: s.equipment.map((e) => (e.id === id ? { ...e, status } : e)),
        }))
      },
      addIncident: (r) => {
        setState((s) => ({
          ...s,
          incidents: [{ ...r, id: uid('inc'), status: 'Open', lostDays: 0 }, ...s.incidents],
        }))
        logActivity('melaporkan insiden baru', 'HSE')
        pushNotification('Insiden baru dilaporkan', r.description.slice(0, 80), 'alert')
        toast('Laporan insiden tercatat', 'success')
      },
      setIncidentStatus: (id, status) => {
        setState((s) => ({
          ...s,
          incidents: s.incidents.map((i) => (i.id === id ? { ...i, status } : i)),
        }))
        toast(`Insiden → ${status}`, 'info')
      },
      addTraining: (r) => {
        setState((s) => ({
          ...s,
          training: [{ ...r, id: uid('tr'), status: 'Scheduled' }, ...s.training],
        }))
        logActivity(`menjadwalkan pelatihan ${r.program}`, 'HSE')
        toast('Pelatihan dijadwalkan', 'success')
      },
      addWarehouseItem: (r) => {
        setState((s) => ({ ...s, warehouseItems: [{ ...r, id: uid('wh') }, ...s.warehouseItems] }))
        toast('Item gudang ditambahkan', 'success')
      },
      adjustStock: (id, delta) => {
        setState((s) => ({
          ...s,
          warehouseItems: s.warehouseItems.map((i) => (i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i)),
        }))
      },
      addEmployee: (r) => {
        const nip = `2026${String(Math.floor(Math.random() * 9000) + 1000)}`
        setState((s) => ({ ...s, employees: [{ ...r, id: uid('emp'), nip }, ...s.employees] }))
        logActivity(`menambahkan karyawan ${r.name}`, 'SDM')
        toast('Karyawan baru terdaftar', 'success')
      },
      addBudget: (r) => {
        setState((s) => ({ ...s, budgets: [{ ...r, id: uid('bud') }, ...s.budgets] }))
        toast('Anggaran RKAB ditambahkan', 'success')
      },
      addCapex: (r) => {
        setState((s) => ({ ...s, capex: [{ ...r, id: uid('cx') }, ...s.capex] }))
        toast('Proyek investasi dibuat', 'success')
      },
      addCustomer: (r) => {
        const code = `CUS-${String(Math.floor(Math.random() * 900) + 110)}`
        setState((s) => ({
          ...s,
          customers: [{ ...r, id: uid('cus'), code, outstandingIdr: 0, status: 'Active' }, ...s.customers],
        }))
        toast('Pelanggan terdaftar', 'success')
      },
      addVendor: (r) => {
        const code = `VND-${String(Math.floor(Math.random() * 900) + 110)}`
        setState((s) => ({
          ...s,
          vendors: [{ ...r, id: uid('vnd'), code, totalSpendIdr: 0, status: 'Pending', rating: 3 }, ...s.vendors],
        }))
        toast('Vendor terdaftar', 'success')
      },
      markNotificationRead: (id) => {
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
      },
      markAllNotificationsRead: () => {
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
      },
      resetData: () => {
        setState(freshState())
        toast('Data demo dikembalikan ke kondisi awal', 'info')
      },
    }),
    [logActivity, pushNotification, toast],
  )

  const value = useMemo<AppContextValue>(() => ({ state, toasts, toast, dismissToast, actions }), [state, toasts, toast, dismissToast, actions])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useERP(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useERP harus digunakan di dalam <AppProvider>')
  return ctx
}

export { TODAY }
