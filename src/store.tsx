import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as SEED from './data/seed'
import type {
  ActivityItem,
  BillingReconciliation,
  CorrectiveAction,
  CostTransaction,
  DowntimeEvent,
  Employee,
  EnvironmentalReading,
  Equipment,
  FuelIssue,
  FuelReceipt,
  FuelTank,
  Incident,
  MaintenanceJob,
  Notification,
  ProductionLog,
  ProductionRecord,
  ProductionTarget,
  ProjectContract,
  PurchaseOrder,
  ShiftHandover,
  Site,
  TaskItem,
  TrainingRecord,
  UnitAssignment,
  Vendor,
  WarehouseItem,
} from './types'

export interface AppState {
  sites: Site[]
  employees: Employee[]
  /** Ringkasan produksi harian (agregat lintas modul). */
  production: ProductionRecord[]
  warehouseItems: WarehouseItem[]
  fuelTanks: FuelTank[]
  equipment: Equipment[]
  maintenance: MaintenanceJob[]
  incidents: Incident[]
  training: TrainingRecord[]
  environmental: EnvironmentalReading[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
  /* ---- Domain kontraktor ---- */
  projectContracts: ProjectContract[]
  productionTargets: ProductionTarget[]
  productionLogs: ProductionLog[]
  unitAssignments: UnitAssignment[]
  downtimeEvents: DowntimeEvent[]
  fuelIssues: FuelIssue[]
  fuelReceipts: FuelReceipt[]
  shiftHandovers: ShiftHandover[]
  correctiveActions: CorrectiveAction[]
  costTransactions: CostTransaction[]
  billingReconciliations: BillingReconciliation[]
  tasks: TaskItem[]
  /* ---- Sistem ---- */
  notifications: Notification[]
  activity: ActivityItem[]
}

const STORAGE_KEY = 'mifa-erp-state-v1'

function freshState(): AppState {
  return {
    sites: SEED.SITES,
    employees: SEED.EMPLOYEES,
    production: SEED.PRODUCTION,
    warehouseItems: SEED.WAREHOUSE_ITEMS,
    fuelTanks: SEED.FUEL_TANKS,
    equipment: SEED.EQUIPMENT,
    maintenance: SEED.MAINTENANCE,
    incidents: SEED.INCIDENTS,
    training: SEED.TRAINING,
    environmental: SEED.ENVIRONMENTAL,
    vendors: SEED.VENDORS,
    purchaseOrders: SEED.PURCHASE_ORDERS,
    projectContracts: SEED.PROJECT_CONTRACTS,
    productionTargets: SEED.PRODUCTION_TARGETS,
    productionLogs: SEED.PRODUCTION_LOGS,
    unitAssignments: SEED.UNIT_ASSIGNMENTS,
    downtimeEvents: SEED.DOWNTIME_EVENTS,
    fuelIssues: SEED.FUEL_ISSUES,
    fuelReceipts: SEED.FUEL_RECEIPTS,
    shiftHandovers: SEED.SHIFT_HANDOVERS,
    correctiveActions: SEED.CORRECTIVE_ACTIONS,
    costTransactions: SEED.COST_TRANSACTIONS,
    billingReconciliations: SEED.BILLING_RECONCILIATIONS,
    tasks: SEED.TASKS,
    notifications: SEED.NOTIFICATIONS,
    activity: SEED.ACTIVITY,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = freshState()
    // Gabungkan agar koleksi yang belum tersimpan tetap terisi seed.
    return { ...base, ...parsed } as AppState
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
    /* --- Modul 3: Monitoring produksi --- */
    addProductionLog: (r: Omit<ProductionLog, 'id' | 'code' | 'status'>) => void
    setProductionLogStatus: (id: string, status: ProductionLog['status'], note?: string) => void
    /* --- Modul 2: Perencanaan produksi --- */
    addProductionTarget: (r: Omit<ProductionTarget, 'id' | 'status'>) => void
    setProductionTargetStatus: (id: string, status: ProductionTarget['status'], reason?: string) => void
    /* --- Modul 4: Dispatch --- */
    addUnitAssignment: (r: Omit<UnitAssignment, 'id' | 'code'| 'status'>) => void
    setUnitAssignmentStatus: (id: string, status: UnitAssignment['status']) => void
    /* --- Modul 6: Downtime --- */
    addDowntimeEvent: (r: Omit<DowntimeEvent, 'id' | 'code'| 'status'>) => void
    setDowntimeStatus: (id: string, patch: Partial<DowntimeEvent>) => void
    /* --- Modul 7: Maintenance --- */
    addMaintenance: (r: Omit<MaintenanceJob, 'id' | 'status' | 'woNo'>) => void
    setMaintenanceStatus: (id: string, status: MaintenanceJob['status']) => void
    setEquipmentStatus: (id: string, status: Equipment['status']) => void
    /* --- Modul 8: BBM --- */
    addFuelIssue: (r: Omit<FuelIssue, 'id' | 'code' | 'status'>) => void
    setFuelIssueStatus: (id: string, status: FuelIssue['status']) => void
    addFuelReceipt: (r: Omit<FuelReceipt, 'id' | 'code' | 'status'>) => void
    /* --- Modul 9: Inventory --- */
    addWarehouseItem: (r: Omit<WarehouseItem, 'id'>) => void
    adjustStock: (id: string, delta: number) => void
    /* --- Modul 10: Procurement --- */
    addPurchaseOrder: (r: Omit<PurchaseOrder, 'id' | 'status' | 'poNo'>) => void
    setPurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void
    addVendor: (r: Omit<Vendor, 'id' | 'totalSpendIdr' | 'status' | 'rating' | 'code'>) => void
    /* --- Modul 1: Proyek & kontrak --- */
    addProjectContract: (r: Omit<ProjectContract, 'id' | 'version' | 'status'>) => void
    setProjectContractStatus: (id: string, status: ProjectContract['status']) => void
    /* --- Modul 11: Personel --- */
    addEmployee: (r: Omit<Employee, 'id' | 'nip'>) => void
    addTraining: (r: Omit<TrainingRecord, 'id' | 'status'>) => void
    /* --- Modul 12: HSE --- */
    addIncident: (r: Omit<Incident, 'id' | 'status' | 'lostDays'>) => void
    setIncidentStatus: (id: string, status: Incident['status']) => void
    addCorrectiveAction: (r: Omit<CorrectiveAction, 'id' | 'code'| 'status'>) => void
    setCorrectiveActionStatus: (id: string, status: CorrectiveAction['status'], evidence?: string) => void
    /* --- Modul 13: Cost control --- */
    addCostTransaction: (r: Omit<CostTransaction, 'id' | 'code'| 'status'>) => void
    /* --- Modul 14: Rekonsiliasi --- */
    addBillingReconciliation: (r: Omit<BillingReconciliation, 'id' | 'code'| 'status'>) => void
    setBillingReconciliationStatus: (id: string, status: BillingReconciliation['status'], patch?: Partial<BillingReconciliation>) => void
    /* --- Tugas Saya --- */
    setTaskStatus: (id: string, status: TaskItem['status']) => void
    /* --- Sistem --- */
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
      /* storage penuh / tidak tersedia */
    }
  }, [state])

  const toast = useCallback((message: string, variant: Toast['variant'] = 'success') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  /** Mencatat entri audit trail untuk setiap perubahan data penting. */
  const log = useCallback((action: string, detail: string, type: ActivityItem['type']) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: uid('act'), action, detail, user: 'Sesi aktif', time: new Date().toISOString(), module: 'Umum', type },
        ...s.activity,
      ].slice(0, 200),
    }))
  }, [])

  const patch = useCallback(
    <K extends keyof AppState>(key: K, updater: (items: AppState[K]) => AppState[K]) => {
      setState((s) => ({ ...s, [key]: updater(s[key]) }))
    },
    [],
  )

  const actions = useMemo<AppContextValue['actions']>(() => {
    const nextCode = (prefix: string, existing: Array<{ code?: string }>, pattern: RegExp) => {
      let max = 0
      for (const e of existing) {
        const m = e.code?.match(pattern)
        if (m) max = Math.max(max, Number(m[1]))
      }
      return `${prefix}-${String(max + 1).padStart(4, '0')}`
    }

    return {
      /* --- Modul 3 --- */
      addProductionLog: (r) => {
        const code = nextCode('PRD', r as never, /PRD-\d{4}-(\d+)/)
        const item: ProductionLog = { ...r, id: uid('pl'), code, status: 'Draft' }
        patch('productionLogs', (x) => [item, ...x])
        log('Input produksi', `${code} — ${r.qty} ${r.unit} ${r.pit}`, 'create')
      },
      setProductionLogStatus: (id, status, note) => {
        patch('productionLogs', (x) =>
          x.map((l) =>
            l.id === id
              ? { ...l, status, correctionNote: note ?? l.correctionNote, approvedBy: status === 'Approved' ? 'Sesi aktif' : l.approvedBy, verifiedBy: status === 'Verified' || status === 'Approved' ? 'Sesi aktif' : l.verifiedBy }
              : l,
          ),
        )
        log('Status produksi', `${id} → ${status}`, status === 'Approved' ? 'approve' : 'edit')
      },

      /* --- Modul 2 --- */
      addProductionTarget: (r) => {
        const code = nextCode('TGT', r as never, /TGT-(\d+)/)
        patch('productionTargets', (x) => [{ ...r, id: uid('tgt'), code, status: 'Draft' } as ProductionTarget, ...x])
        log('Rencana produksi', `${code} — ${r.targetQty} ${r.unit} ${r.pit}`, 'create')
      },
      setProductionTargetStatus: (id, status, reason) => {
        patch('productionTargets', (x) =>
          x.map((t) => (t.id === id ? { ...t, status, version: status === 'Revised' ? t.version + 1 : t.version, reason: reason ?? t.reason } : t)),
        )
        log('Status rencana', `${id} → ${status}`, status === 'Approved' ? 'approve' : 'edit')
      },

      /* --- Modul 4 --- */
      addUnitAssignment: (r) => {
        const code = nextCode('UA', r as never, /UA-(\d+)/)
        patch('unitAssignments', (x) => [{ ...r, id: uid('ua'), code, status: 'Active' } as UnitAssignment, ...x])
        log('Dispatch unit', `Unit ${r.unitId} → ${r.pit} ${r.shift}`, 'create')
      },
      setUnitAssignmentStatus: (id, status) => {
        patch('unitAssignments', (x) => x.map((u) => (u.id === id ? { ...u, status, endAt: status === 'Completed' ? new Date().toISOString().slice(0, 16) : u.endAt } : u)))
        log('Status penugasan', `${id} → ${status}`, 'edit')
      },

      /* --- Modul 6 --- */
      addDowntimeEvent: (r) => {
        const code = nextCode('DT', r as never, /DT-\d{4}-(\d+)/)
        patch('downtimeEvents', (x) => [{ ...r, id: uid('dt'), code } as DowntimeEvent, ...x])
        log('Laporan downtime', `${code} — ${r.category} ${r.durationHours} jam`, 'create')
      },
      setDowntimeStatus: (id, p) => {
        patch('downtimeEvents', (x) => x.map((d) => (d.id === id ? { ...d, ...p } : d)))
        log('Perbarui downtime', id, 'edit')
      },

      /* --- Modul 7 --- */
      addMaintenance: (r) => {
        const code = nextCode('WO', r as never, /WO-(\d+)/)
        patch('maintenance', (x) => [{ ...r, id: uid('wo'), woNo: code, status: 'Scheduled' } as MaintenanceJob, ...x])
        log('Work order', `${code} — ${r.description}`, 'create')
      },
      setMaintenanceStatus: (id, status) => {
        patch('maintenance', (x) => x.map((w) => (w.id === id ? { ...w, status } : w)))
        log('Status work order', `${id} → ${status}`, status === 'Completed' ? 'approve' : 'edit')
      },
      setEquipmentStatus: (id, status) => {
        patch('equipment', (x) => x.map((e) => (e.id === id ? { ...e, status } : e)))
        log('Status unit', `${id} → ${status}`, 'edit')
      },

      /* --- Modul 8 --- */
      addFuelIssue: (r) => {
        const code = nextCode('FU', r as never, /FU-\d{4}-(\d+)/)
        patch('fuelIssues', (x) => [{ ...r, id: uid('fi'), code, status: 'Draft' } as FuelIssue, ...x])
        log('Pengisian BBM', `${code} — ${r.liters} liter ke ${r.unitId}`, 'create')
      },
      setFuelIssueStatus: (id, status) => {
        patch('fuelIssues', (x) => x.map((f) => (f.id === id ? { ...f, status } : f)))
        log('Status BBM', `${id} → ${status}`, 'edit')
      },
      addFuelReceipt: (r) => {
        const code = nextCode('RCV-FU', r as never, /RCV-FU-(\d+)/)
        patch('fuelReceipts', (x) => [{ ...r, id: uid('fr'), code, status: 'Draft' } as FuelReceipt, ...x])
        log('Penerimaan BBM', `${code} — ${r.liters} liter`, 'create')
      },

      /* --- Modul 9 --- */
      addWarehouseItem: (r) => {
        patch('warehouseItems', (x) => [{ ...r, id: uid('wh') }, ...x])
        log('Master barang', r.name, 'create')
      },
      adjustStock: (id, delta) => {
        patch('warehouseItems', (x) => x.map((w) => (w.id === id ? { ...w, stock: Math.max(0, w.stock + delta) } : w)))
        log('Penyesuaian stok', `${id} ${delta > 0 ? '+' : ''}${delta}`, 'edit')
      },

      /* --- Modul 10 --- */
      addPurchaseOrder: (r) => {
        const code = nextCode('PO', r as never, /PO-\d{4}-(\d+)/)
        patch('purchaseOrders', (x) => [{ ...r, id: uid('po'), poNo: code, status: 'Pending Approval' } as PurchaseOrder, ...x])
        log('Purchase order', `${code} — ${r.category} Rp ${r.amountIdr.toLocaleString('id-ID')}`, 'create')
      },
      setPurchaseOrderStatus: (id, status) => {
        patch('purchaseOrders', (x) => x.map((p) => (p.id === id ? { ...p, status } : p)))
        log('Status PO', `${id} → ${status}`, status === 'Approved' ? 'approve' : 'edit')
      },
      addVendor: (r) => {
        const code = nextCode('VND', r as never, /VND-(\d+)/)
        patch('vendors', (x) => [{ ...r, id: uid('vnd'), code, totalSpendIdr: 0, status: 'Pending', rating: 0 } as Vendor, ...x])
        log('Vendor baru', r.name, 'create')
      },

      /* --- Modul 1 --- */
      addProjectContract: (r) => {
        const code = nextCode('KTR', r as never, /KTR-\d{4}-(\d+)/)
        patch('projectContracts', (x) => [{ ...r, id: uid('ctr'), code, version: 1, status: 'Draft' } as ProjectContract, ...x])
        log('Kontrak proyek', `${code} — ${r.name}`, 'create')
      },
      setProjectContractStatus: (id, status) => {
        patch('projectContracts', (x) => x.map((c) => (c.id === id ? { ...c, status, version: status === 'Active' ? c.version : c.version } : c)))
        log('Status kontrak', `${id} → ${status}`, status === 'Active' ? 'approve' : 'edit')
      },

      /* --- Modul 11 --- */
      addEmployee: (r) => {
        patch('employees', (x) => [{ ...r, id: uid('emp'), nip: `EMP-${x.length + 1}` } as Employee, ...x])
        log('Personel baru', r.name, 'create')
      },
      addTraining: (r) => {
        patch('training', (x) => [{ ...r, id: uid('tr'), status: 'Scheduled' } as TrainingRecord, ...x])
        log('Pelatihan', r.program, 'create')
      },

      /* --- Modul 12 --- */
      addIncident: (r) => {
        patch('incidents', (x) => [{ ...r, id: uid('inc'), status: 'Open', lostDays: 0 } as Incident, ...x])
        log('Insiden HSE', r.description, 'create')
      },
      setIncidentStatus: (id, status) => {
        patch('incidents', (x) => x.map((i) => (i.id === id ? { ...i, status } : i)))
        log('Status insiden', `${id} → ${status}`, status === 'Closed' ? 'approve' : 'edit')
      },
      addCorrectiveAction: (r) => {
        const code = nextCode('CA', r as never, /CA-\d{4}-(\d+)/)
        patch('correctiveActions', (x) => [{ ...r, id: uid('ca'), code, status: 'Open' } as CorrectiveAction, ...x])
        log('Tindakan korektif', `${code} — ${r.description}`, 'create')
      },
      setCorrectiveActionStatus: (id, status, evidence) => {
        patch('correctiveActions', (x) => x.map((c) => (c.id === id ? { ...c, status, evidence: evidence ?? c.evidence, verifiedBy: status === 'Closed' ? 'Sesi aktif' : c.verifiedBy } : c)))
        log('Status korektif', `${id} → ${status}`, status === 'Closed' ? 'approve' : 'edit')
      },

      /* --- Modul 13 --- */
      addCostTransaction: (r) => {
        const code = nextCode('CST', r as never, /CST-\d{4}-(\d+)/)
        patch('costTransactions', (x) => [{ ...r, id: uid('cx'), code, status: 'Draft' } as CostTransaction, ...x])
        log('Transaksi biaya', `${code} — ${r.category} Rp ${r.amountIdr.toLocaleString('id-ID')}`, 'create')
      },

      /* --- Modul 14 --- */
      addBillingReconciliation: (r) => {
        const code = nextCode('REC', r as never, /REC-\d{4}-(\d+)/)
        patch('billingReconciliations', (x) => [{ ...r, id: uid('br'), code, status: 'Draft' } as BillingReconciliation, ...x])
        log('Rekonsiliasi', `${code} — ${r.internalVolume} ${r.unit}`, 'create')
      },
      setBillingReconciliationStatus: (id, status, p) => {
        patch('billingReconciliations', (x) => x.map((b) => (b.id === id ? { ...b, status, ...p } : b)))
        log('Status rekonsiliasi', `${id} → ${status}`, status === 'Invoiced' ? 'approve' : 'edit')
      },

      /* --- Tugas Saya --- */
      setTaskStatus: (id, status) => {
        patch('tasks', (x) => x.map((t) => (t.id === id ? { ...t, status } : t)))
        log('Tugas', `${id} → ${status}`, 'edit')
      },

      /* --- Sistem --- */
      markNotificationRead: (id) => {
        patch('notifications', (x) => x.map((n) => (n.id === id ? { ...n, read: true } : n)))
      },
      markAllNotificationsRead: () => {
        patch('notifications', (x) => x.map((n) => ({ ...n, read: true })))
      },
      resetData: () => setState(freshState()),
    }
  }, [patch, log])

  const value = useMemo<AppContextValue>(() => ({ state, toasts, toast, dismissToast, actions }), [state, toasts, toast, dismissToast, actions])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useERP(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useERP harus digunakan di dalam <AppProvider>')
  return ctx
}
