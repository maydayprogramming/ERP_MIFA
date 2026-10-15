import { useMemo } from 'react'
import { useERP } from '../store'
import type { CostTransaction, DowntimeEvent, Site } from '../types'
import { daysBetween, sum } from './format'

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

const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0)

/**
 * Agregat metrik domain kontraktor tambang. Semua angka pada antarmuka
 * dihitung dari data yang dapat dilacak ke sumbernya (log produksi,
 * downtime, transaksi biaya, rekonsiliasi) — bukan input manual.
 */
export function useMetrics() {
  const { state } = useERP()

  return useMemo(() => {
    const {
      sites,
      equipment,
      incidents,
      maintenance,
      environmental,
      fuelTanks,
      fuelIssues,
      fuelReceipts,
      downtimeEvents,
      productionLogs,
      productionTargets,
      costTransactions,
      billingReconciliations,
      warehouseItems,
      employees,
      purchaseOrders,
      projectContracts,
      correctiveActions,
      unitAssignments,
    } = state

    const months = lastMonths(12)
    const currentMonth = monthKey(TODAY)
    const prevMonth = months[months.length - 2]

    const approved = productionLogs.filter((l) => l.status === 'Approved')

    /* ------------------------ Produksi per bulan ------------------------ */
    const monthly = months.map((m) => {
      const rows = approved.filter((l) => monthKey(l.date) === m)
      return {
        month: m,
        label: monthLabel(m),
        volume: sum(rows.map((r) => r.qty)),
        bcm: sum(rows.filter((r) => r.unit === 'BCM').map((r) => r.qty)),
        ton: sum(rows.filter((r) => r.unit === 'Ton').map((r) => r.qty)),
        km: sum(rows.filter((r) => r.unit === 'Km').map((r) => r.qty)),
        hours: sum(rows.map((r) => r.operatingHours)),
      }
    })

    const logsThisMonth = productionLogs.filter((l) => monthKey(l.date) === currentMonth)
    const logsPrevMonth = productionLogs.filter((l) => monthKey(l.date) === prevMonth)
    const appThisMonth = approved.filter((l) => monthKey(l.date) === currentMonth)
    const appPrevMonth = approved.filter((l) => monthKey(l.date) === prevMonth)

    /* Target vs aktual (modul 2 & 3) */
    const targetThisMonth = sum(
      productionTargets.filter((t) => t.period === currentMonth && t.status === 'Approved').map((t) => t.targetQty),
    )
    const actualThisMonth = sum(appThisMonth.map((l) => l.qty))
    const achievement = targetThisMonth > 0 ? (actualThisMonth / targetThisMonth) * 100 : 0

    /* --------------------------- Per proyek ---------------------------- */
    const byProject = projectContracts.map((c) => {
      const logs = approved.filter((l) => l.contractId === c.id)
      const thisMonth = logs.filter((l) => monthKey(l.date) === currentMonth)
      const costs = costTransactions.filter((x) => x.contractId === c.id && x.period === currentMonth)
      const rec = billingReconciliations.filter((b) => b.contractId === c.id)
      const actual = sum(costs.filter((x) => x.costType === 'Actual').map((x) => x.amountIdr))
      const committed = sum(costs.filter((x) => x.costType === 'Committed').map((x) => x.amountIdr))
      const revenue = sum(rec.filter((b) => ['Ready to Bill', 'Invoiced', 'Paid'].includes(b.status)).map((b) => b.approvedVolume * b.rateIdr))
      return {
        contract: c,
        volumeToDate: sum(logs.map((l) => l.qty)),
        volumeThisMonth: sum(thisMonth.map((l) => l.qty)),
        costActual: actual,
        costCommitted: committed,
        revenue,
        margin: revenue > 0 ? ((revenue - actual - committed) / revenue) * 100 : 0,
        progressPct: c.targetVolume > 0 ? (sum(logs.map((l) => l.qty)) / c.targetVolume) * 100 : 0,
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
    const openWO = maintenance.filter((m) => m.status !== 'Completed').length

    /* ---------------------------- Downtime ----------------------------- */
    const downtimeThisMonth = downtimeEvents.filter((d) => monthKey(d.startedAt) === currentMonth)
    const downtimeHours = sum(downtimeThisMonth.map((d) => d.durationHours))
    const downtimeByCategory = (Object.keys(
      downtimeThisMonth.reduce<Record<string, number>>((acc, d) => {
        acc[d.category] = (acc[d.category] ?? 0) + d.durationHours
        return acc
      }, {}),
    ) as Array<DowntimeEvent['category']>).map((category) => ({
      name: category,
      value: Number(sum(downtimeThisMonth.filter((d) => d.category === category).map((d) => d.durationHours)).toFixed(2)),
    }))
    const topDowntimeUnits = [...downtimeThisMonth]
      .sort((a, b) => b.durationHours - a.durationHours)
      .slice(0, 5)
      .map((d) => ({ event: d, unit: equipment.find((e) => e.id === d.unitId) }))

    /* ------------------------------- BBM ------------------------------- */
    const fuelLevelPct = fuelTanks.length ? (sum(fuelTanks.map((t) => t.levelL)) / sum(fuelTanks.map((t) => t.capacityL))) * 100 : 0
    const fuelIssueMtd = sum(fuelIssues.filter((f) => monthKey(f.date) === currentMonth).map((f) => f.liters))
    const fuelReceiptMtd = sum(fuelReceipts.filter((f) => monthKey(f.date) === currentMonth).map((f) => f.liters))
    const fuelAnomalies = fuelIssues.filter((f) => !!f.anomaly).length
    /** Konsumsi per jam operasi seluruh armada (liter/jam). */
    const litersPerHour = sum(equipment.map((e) => e.fuelLph * (e.utilizationPct / 100) * 30 * 24))
    const fuelPerHourActual = litersPerHour > 0 ? fuelIssueMtd / litersPerHour : 0

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
    const openCA = correctiveActions.filter((c) => !['Closed'].includes(c.status)).length
    const overdueCA = correctiveActions.filter((c) => c.status === 'Overdue' || (c.status !== 'Closed' && daysBetween(c.dueDate, TODAY) > 0)).length

    /* ------------------------------ Biaya ------------------------------ */
    const costThisMonth = costTransactions.filter((x) => x.period === currentMonth)
    const costActual = sum(costThisMonth.filter((x) => x.costType === 'Actual').map((x) => x.amountIdr))
    const costCommitted = sum(costThisMonth.filter((x) => x.costType === 'Committed').map((x) => x.amountIdr))
    const costAccrual = sum(costThisMonth.filter((x) => x.costType === 'Accrual').map((x) => x.amountIdr))
    const costForecast = sum(costThisMonth.filter((x) => x.costType === 'Forecast').map((x) => x.amountIdr))
    const costByCategory = (Object.keys(
      costThisMonth.reduce<Record<string, number>>((acc, x) => {
        acc[x.category] = (acc[x.category] ?? 0) + x.amountIdr
        return acc
      }, {}),
    ) as Array<CostTransaction['category']>)
      .map((category) => ({ name: category, value: sum(costThisMonth.filter((x) => x.category === category).map((x) => x.amountIdr)) }))
      .sort((a, b) => b.value - a.value)

    const monthlyCost = months.map((m) => ({
      month: m,
      label: monthLabel(m),
      actual: sum(costTransactions.filter((x) => x.period === m && x.costType === 'Actual').map((x) => x.amountIdr)),
      committed: sum(costTransactions.filter((x) => x.period === m && x.costType === 'Committed').map((x) => x.amountIdr)),
    }))

    /* --------------------------- Rekonsiliasi -------------------------- */
    const recThisMonth = billingReconciliations.filter((b) => b.period === currentMonth)
    const recInternal = sum(recThisMonth.map((b) => b.internalVolume))
    const recSubmitted = sum(recThisMonth.map((b) => b.submittedVolume))
    const recApproved = sum(recThisMonth.map((b) => b.approvedVolume))
    const recVariance = recInternal - recApproved
    const billableValue = sum(
      billingReconciliations.filter((b) => ['Ready to Bill', 'Invoiced'].includes(b.status)).map((b) => b.approvedVolume * b.rateIdr),
    )
    const paidValue = sum(billingReconciliations.filter((b) => b.status === 'Paid').map((b) => b.approvedVolume * b.rateIdr))

    /* ------------------------------ Stok ------------------------------- */
    const lowStockItems = warehouseItems.filter((i) => i.stock <= i.minStock)

    /* ------------------------------- SDM ------------------------------- */
    const headcount = employees.length
    const activeAssignments = unitAssignments.filter((u) => u.status === 'Active').length
    const unitsWithoutOperator = equipment.filter((e) => !e.operator).length

    /* ---------------------------- Lingkungan --------------------------- */
    const envReadings = environmental.length
    const envExceeded = environmental.filter((e) => e.status === 'Exceeded').length
    const complianceRate = envReadings ? ((envReadings - environmental.filter((e) => e.status !== 'Compliant').length) / envReadings) * 100 : 100

    /* ------------------------- Per site (ringkas) ---------------------- */
    const bySite: Array<{ site: Site; units: number; operating: number; availability: number; downtime: number; fuelPct: number; incidents: number }> =
      sites.map((site) => {
        const eq = equipment.filter((e) => e.siteId === site.id)
        const tanks = fuelTanks.filter((t) => t.siteId === site.id)
        return {
          site,
          units: eq.length,
          operating: eq.filter((e) => e.status === 'Operating').length,
          availability: eq.length ? sum(eq.map((e) => e.availabilityPct)) / eq.length : 0,
          downtime: sum(downtimeThisMonth.filter((d) => d.siteId === site.id).map((d) => d.durationHours)),
          fuelPct: tanks.length ? (sum(tanks.map((t) => t.levelL)) / sum(tanks.map((t) => t.capacityL))) * 100 : 0,
          incidents: incidents.filter((i) => i.siteId === site.id).length,
        }
      })

    return {
      months,
      monthly,
      currentMonth,
      prevMonth,
      /* produksi */
      actualThisMonth,
      targetThisMonth,
      achievement,
      volumeDelta: delta(actualThisMonth, sum(appPrevMonth.map((l) => l.qty))),
      logsThisMonth,
      logsPrevMonth,
      pendingVerification: logsThisMonth.filter((l) => l.status === 'Submitted').length,
      pendingApproval: logsThisMonth.filter((l) => l.status === 'Verified').length,
      drafts: logsThisMonth.filter((l) => l.status === 'Draft').length,
      returned: logsThisMonth.filter((l) => l.status === 'Returned').length,
      /* proyek */
      byProject,
      /* armada */
      fleetTotal,
      fleetOperating,
      fleetAvailability,
      fleetUtilization,
      fleetBreakdown,
      fleetMaintenance,
      dueSoon,
      overdueWO,
      openWO,
      /* downtime */
      downtimeThisMonth,
      downtimeHours,
      downtimeByCategory,
      topDowntimeUnits,
      /* bbm */
      fuelLevelPct,
      fuelIssueMtd,
      fuelReceiptMtd,
      fuelAnomalies,
      fuelPerHourActual,
      /* hse */
      lti12,
      fatalities,
      ltifr,
      trir,
      daysSinceLTI,
      openIncidents,
      openCA,
      overdueCA,
      complianceRate,
      envExceeded,
      /* biaya */
      costActual,
      costCommitted,
      costAccrual,
      costForecast,
      costByCategory,
      monthlyCost,
      /* rekonsiliasi */
      recInternal,
      recSubmitted,
      recApproved,
      recVariance,
      billableValue,
      paidValue,
      recThisMonth,
      /* lain-lain */
      lowStockItems,
      headcount,
      activeAssignments,
      unitsWithoutOperator,
      bySite,
      poPending: purchaseOrders.filter((p) => p.status === 'Pending Approval').length,
    }
  }, [state])
}

export type Metrics = ReturnType<typeof useMetrics>
