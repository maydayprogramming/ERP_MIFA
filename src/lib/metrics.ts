import { useMemo } from 'react'
import { useERP } from '../store'
import type { Site } from '../types'
import { daysBetween, royaltyRatePct, sum } from './format'

export const TODAY = '2026-10-15'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const monthKey = (iso: string) => iso.slice(0, 7)
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}
export const monthLabelFull = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

/** Daftar 12 bulan terakhir (inklusif bulan berjalan) */
export function lastMonths(n = 12): string[] {
  const out: string[] = []
  const [y, m] = TODAY.split('-').map(Number)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export function useMetrics() {
  const { state } = useERP()

  return useMemo(() => {
    const { production, salesOrders, equipment, incidents, stockpiles, fuelTanks, budgets, invoices, bills, purchaseOrders, employees, customers, contracts, maintenance, environmental, warehouses } = {
      production: state.production,
      salesOrders: state.salesOrders,
      equipment: state.equipment,
      incidents: state.incidents,
      stockpiles: state.stockpiles,
      fuelTanks: state.fuelTanks,
      budgets: state.budgets,
      invoices: state.invoices,
      bills: state.bills,
      purchaseOrders: state.purchaseOrders,
      employees: state.employees,
      customers: state.customers,
      contracts: state.contracts,
      maintenance: state.maintenance,
      environmental: state.environmental,
      warehouses: state.warehouseItems,
    }
    void warehouses

    const months = lastMonths(12)
    const currentMonth = monthKey(TODAY)
    const prevMonth = months[months.length - 2]

    /* ------------------------- Produksi bulanan ------------------------- */
    const monthly = months.map((m) => {
      const rows = production.filter((p) => monthKey(p.date) === m)
      const coal = sum(rows.map((r) => r.coalMt))
      const ob = sum(rows.map((r) => r.obBcm))
      return {
        month: m,
        label: monthLabel(m),
        coal,
        ob,
        sr: coal > 0 ? Number((ob / coal).toFixed(2)) : 0,
        trips: sum(rows.map((r) => r.haulingTrips)),
        rom: sum(rows.map((r) => r.romMt)),
      }
    })

    const rowsThisMonth = production.filter((p) => monthKey(p.date) === currentMonth)
    const rowsPrevMonth = production.filter((p) => monthKey(p.date) === prevMonth)
    const coalMtd = sum(rowsThisMonth.map((r) => r.coalMt))
    const coalPrev = sum(rowsPrevMonth.map((r) => r.coalMt))
    const obMtd = sum(rowsThisMonth.map((r) => r.obBcm))
    const obPrev = sum(rowsPrevMonth.map((r) => r.obBcm))
    const romMtd = sum(rowsThisMonth.map((r) => r.romMt))

    const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0)

    /* -------------------------- Penjualan ------------------------------ */
    const soRevenue = (id: string) => {
      const so = salesOrders.find((s) => s.id === id)
      return so ? so.tonnageMt * so.priceUsdPerMt : 0
    }
    const revenueMtd = salesOrders
      .filter((s) => monthKey(s.date) === currentMonth && !['Draft', 'Cancelled'].includes(s.status))
      .reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0)
    const revenuePrev = salesOrders
      .filter((s) => monthKey(s.date) === prevMonth && !['Draft', 'Cancelled'].includes(s.status))
      .reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0)
    const revenueTotal = salesOrders.filter((s) => !['Draft', 'Cancelled'].includes(s.status)).reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0)

    const revenueByMonth = months.map((m) => ({
      month: m,
      label: monthLabel(m),
      revenue: salesOrders
        .filter((s) => monthKey(s.date) === m && !['Draft', 'Cancelled'].includes(s.status))
        .reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0),
      tonnage: salesOrders
        .filter((s) => monthKey(s.date) === m && !['Draft', 'Cancelled'].includes(s.status))
        .reduce((a, s) => a + s.tonnageMt, 0),
    }))

    /* --------------------------- Per site ------------------------------ */
    const bySite: Array<{
      site: Site
      coal: number
      ob: number
      sr: number
      stock: number
      capacity: number
      fleetOp: number
      fleetTotal: number
      availability: number
      fuelPct: number
    }> = state.sites.map((site) => {
      const rows = rowsThisMonth.filter((p) => p.siteId === site.id)
      const coal = sum(rows.map((r) => r.coalMt))
      const ob = sum(rows.map((r) => r.obBcm))
      const sp = stockpiles.filter((s) => s.siteId === site.id)
      const eq = equipment.filter((e) => e.siteId === site.id)
      const tanks = fuelTanks.filter((t) => t.siteId === site.id)
      return {
        site,
        coal,
        ob,
        sr: coal > 0 ? Number((ob / coal).toFixed(2)) : 0,
        stock: sum(sp.map((s) => s.tonnageMt)),
        capacity: sum(sp.map((s) => s.capacityMt)),
        fleetOp: eq.filter((e) => e.status === 'Operating').length,
        fleetTotal: eq.length,
        availability: eq.length ? sum(eq.map((e) => e.availabilityPct)) / eq.length : 0,
        fuelPct: tanks.length ? (sum(tanks.map((t) => t.levelL)) / sum(tanks.map((t) => t.capacityL))) * 100 : 0,
      }
    })

    /* ----------------------------- Armada ------------------------------ */
    const fleetTotal = equipment.length
    const fleetOperating = equipment.filter((e) => e.status === 'Operating').length
    const fleetAvailability = fleetTotal ? sum(equipment.map((e) => e.availabilityPct)) / fleetTotal : 0
    const fleetUtilization = fleetTotal ? sum(equipment.map((e) => e.utilizationPct)) / fleetTotal : 0
    const fleetBreakdown = equipment.filter((e) => e.status === 'Breakdown').length
    const fleetMaintenance = equipment.filter((e) => e.status === 'Maintenance').length
    const dueSoon = equipment.filter((e) => e.nextServiceHm - e.hourMeter <= 60).length
    const overdueWO = maintenance.filter((m) => m.status === 'Overdue').length

    /* ------------------------------ HSE -------------------------------- */
    const lti12 = incidents.filter((i) => ['LTI', 'Fatality'].includes(i.type) && daysBetween(i.date, TODAY) <= 365).length
    const fatalities = incidents.filter((i) => i.type === 'Fatality').length
    const manhoursYtd = 1_960_000
    const ltifr = (lti12 * 1_000_000) / manhoursYtd
    const recordable = incidents.filter((i) => ['LTI', 'MTC', 'FAC', 'Fatality'].includes(i.type)).length
    const trir = (recordable * 1_000_000) / manhoursYtd
    const lastLTI = incidents.filter((i) => ['LTI', 'Fatality'].includes(i.type)).sort((a, b) => b.date.localeCompare(a.date))[0]
    const daysSinceLTI = lastLTI ? daysBetween(lastLTI.date, TODAY) : 999
    const openIncidents = incidents.filter((i) => i.status !== 'Closed').length
    const envExceeded = environmental.filter((e) => e.status === 'Exceeded').length
    const envReadings = environmental.length
    const complianceRate = envReadings ? ((envReadings - environmental.filter((e) => e.status !== 'Compliant').length) / envReadings) * 100 : 100

    /* ---------------------------- Keuangan ----------------------------- */
    const budgetTotal = sum(budgets.map((b) => b.budgetIdr))
    const actualTotal = sum(budgets.map((b) => b.actualIdr))
    const rkabPct = budgetTotal > 0 ? (actualTotal / budgetTotal) * 100 : 0
    const arOutstanding = sum(invoices.filter((i) => i.status !== 'Paid').map((i) => i.amountUsd))
    const arOverdue = sum(invoices.filter((i) => i.status === 'Overdue').map((i) => i.amountUsd))
    const apOutstanding = sum(bills.filter((b) => b.status !== 'Paid').map((b) => b.amountIdr))
    const apOverdue = sum(bills.filter((b) => b.status === 'Overdue').map((b) => b.amountIdr))
    const poPending = purchaseOrders.filter((p) => p.status === 'Pending Approval').length
    const poValue = sum(purchaseOrders.filter((p) => ['Approved', 'Received'].includes(p.status)).map((p) => p.amountIdr))

    /* ---------------------------- Royalti ------------------------------ */
    const royaltyYtd = state.royalties.reduce((a, r) => a + r.royaltyUsd, 0)

    /* -------------------------- Top pelanggan -------------------------- */
    const byCustomer = customers
      .map((c) => ({
        customer: c,
        revenue: salesOrders.filter((s) => s.customerId === c.id && !['Draft', 'Cancelled'].includes(s.status)).reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0),
        tonnage: salesOrders.filter((s) => s.customerId === c.id && !['Draft', 'Cancelled'].includes(s.status)).reduce((a, s) => a + s.tonnageMt, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const domesticRevenue = salesOrders
      .filter((s) => !['Draft', 'Cancelled'].includes(s.status) && customers.find((c) => c.id === s.customerId)?.type === 'Domestic')
      .reduce((a, s) => a + s.tonnageMt * s.priceUsdPerMt, 0)
    const exportRevenue = revenueTotal - domesticRevenue

    /* ----------------------------- Stok -------------------------------- */
    const stockTotal = sum(stockpiles.map((s) => s.tonnageMt))
    const stockCapacity = sum(stockpiles.map((s) => s.capacityMt))
    const lowStockItems = state.warehouseItems.filter((i) => i.stock < i.minStock)
    const fuelLevelPct = fuelTanks.length ? (sum(fuelTanks.map((t) => t.levelL)) / sum(fuelTanks.map((t) => t.capacityL))) * 100 : 0
    const fuelDaysCover = fuelLevelPct > 0 ? Math.round((sum(fuelTanks.map((t) => t.levelL)) / 145000) * 1) : 0

    /* ------------------------------ SDM -------------------------------- */
    const headcount = employees.length
    const permanent = employees.filter((e) => e.status === 'Permanent').length
    const payrollMonthly = sum(employees.map((e) => e.salaryIdr)) * 1.4

    /* --------------------- Qualitas & royalti MTD ---------------------- */
    const avgGcv = rowsThisMonth.length ? sum(rowsThisMonth.map((r) => r.gcvAr)) / rowsThisMonth.length : 0
    const avgTm = rowsThisMonth.length ? sum(rowsThisMonth.map((r) => r.totalMoisture)) / rowsThisMonth.length : 0
    const royaltyRate = royaltyRatePct(Math.round(avgGcv))

    return {
      months,
      monthly,
      currentMonth,
      prevMonth,
      coalMtd,
      coalPrev,
      obMtd,
      obPrev,
      romMtd,
      coalDelta: delta(coalMtd, coalPrev),
      obDelta: delta(obMtd, obPrev),
      srMtd: coalMtd > 0 ? obMtd / coalMtd : 0,
      revenueMtd,
      revenuePrev,
      revenueTotal,
      revenueDelta: delta(revenueMtd, revenuePrev),
      revenueByMonth,
      bySite,
      fleetTotal,
      fleetOperating,
      fleetAvailability,
      fleetUtilization,
      fleetBreakdown,
      fleetMaintenance,
      dueSoon,
      overdueWO,
      lti12,
      fatalities,
      ltifr,
      trir,
      daysSinceLTI,
      openIncidents,
      envExceeded,
      complianceRate,
      budgetTotal,
      actualTotal,
      rkabPct,
      arOutstanding,
      arOverdue,
      apOutstanding,
      apOverdue,
      poPending,
      poValue,
      royaltyYtd,
      royaltyRate,
      byCustomer,
      domesticRevenue,
      exportRevenue,
      stockTotal,
      stockCapacity,
      lowStockItems,
      fuelLevelPct,
      fuelDaysCover,
      headcount,
      permanent,
      payrollMonthly,
      avgGcv,
      avgTm,
      contractVolume: sum(contracts.map((c) => c.volumeMt)),
      contractLifted: sum(contracts.map((c) => c.liftedMt)),
      soRevenue,
    }
  }, [state])
}

export type Metrics = ReturnType<typeof useMetrics>
