import { COMPANY } from '../data/seed'

/* ------------------------------- Numbers ------------------------------ */

export const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
export const nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
export const nf2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export const num = (v: number | undefined | null): string => (v == null || isNaN(v) ? '-' : nf.format(v))
export const num1 = (v: number | undefined | null): string => (v == null || isNaN(v) ? '-' : nf1.format(v))
export const num2 = (v: number | undefined | null): string => (v == null || isNaN(v) ? '-' : nf2.format(v))

/** Rupiah ringkas: Rp 1,2 T / Rp 450 M / Rp 12,5 M */
export function idr(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '-'
  const abs = Math.abs(v)
  if (abs >= 1e12) return `Rp ${nf1.format(v / 1e12)} T`
  if (abs >= 1e9) return `Rp ${nf1.format(v / 1e9)} M`
  if (abs >= 1e6) return `Rp ${nf1.format(v / 1e6)} Jt`
  if (abs >= 1e3) return `Rp ${nf1.format(v / 1e3)} Rb`
  return `Rp ${nf.format(v)}`
}

/** Rupiah penuh: Rp 1.234.567.890 */
export const idrFull = (v: number | undefined | null): string =>
  v == null || isNaN(v) ? '-' : `Rp ${nf.format(v)}`

/** USD ringkas: USD 1,2 M */
export function usd(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '-'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `USD ${nf1.format(v / 1e9)} M`
  if (abs >= 1e6) return `USD ${nf1.format(v / 1e6)} Jt`
  if (abs >= 1e3) return `USD ${nf1.format(v / 1e3)} Rb`
  return `USD ${nf.format(v)}`
}

export const usdToIdr = (v: number): string => idrFull(Math.round(v * COMPANY.fx))

/** Tonase: 1.240.000 MT → "1,24 Jt MT" */
export const mt = (v: number | undefined | null): string => (v == null ? '-' : `${nf1.format(v)} MT`)
export const mtShort = (v: number | undefined | null): string => {
  if (v == null) return '-'
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${nf2.format(v / 1e6)} Jt MT`
  if (abs >= 1e3) return `${nf1.format(v / 1e3)} Rb MT`
  return `${nf.format(v)} MT`
}

/** BCM (bank cubic meter) */
export const bcm = (v: number | undefined | null): string => `${nf1.format(v ?? 0)} Bcm`

export const pct1 = (v: number | undefined | null): string => (v == null || isNaN(v) ? '-' : `${nf1.format(v)}%`)

export const pct0 = (v: number | undefined | null): string => (v == null || isNaN(v) ? '-' : `${nf.format(v)}%`)

/* -------------------------------- Dates ------------------------------- */

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_FULL_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** "2026-10-15" → "15 Okt 2026" */
export const dmy = (iso: string | undefined | null): string => {
  if (!iso) return '-'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}

/** "2026-10" → "Okt 2026" */
export const my = (period: string): string => {
  const [y, m] = period.split('-').map(Number)
  return `${MONTHS_ID[m - 1]} ${y}`
}

export const monthName = (m: number): string => MONTHS_FULL_ID[m - 1]

/** Hari antara dua tanggal ISO */
export const daysBetween = (a: string, b: string): number => {
  const d1 = new Date(`${a.slice(0, 10)}T00:00:00`).getTime()
  const d2 = new Date(`${b.slice(0, 10)}T00:00:00`).getTime()
  return Math.round((d2 - d1) / 86400000)
}

export const isOverdue = (due: string, today = '2026-10-15'): boolean => due < today

/* ----------------------------- Coal Quality --------------------------- */

/** Tarif royalti PNBP batubara berdasarkan nilai kalori (GAR), PP No. 9/2010 jo. PP No. 1/2017 */
export function royaltyRatePct(gcvAr: number): { rate: number; band: string } {
  if (gcvAr > 5200) return { rate: 4, band: 'GAR > 5.200' }
  if (gcvAr >= 4200) return { rate: 5, band: 'GAR 4.201 – 5.200' }
  if (gcvAr >= 3400) return { rate: 6, band: 'GAR 3.401 – 4.200' }
  if (gcvAr >= 3100) return { rate: 7, band: 'GAR 3.101 – 3.400' }
  if (gcvAr >= 2100) return { rate: 8, band: 'GAR 2.101 – 3.100' }
  return { rate: 9, band: 'GAR ≤ 2.100' }
}

/** Konversi GCV GAR → NAR (approx) */
export const garToNar = (gar: number, tm: number): number => Math.round(gar * (1 - tm / 100) + 0)

/** Total moisture & ash to ARB conversion helper */
export const ncvArb = (gcvAr: number, tm: number, hydrogen = 4.9): number =>
  Math.round(gcvAr - 212.2 * (tm / 100) - 0.8 * hydrogen)

/* ------------------------------ Helpers ------------------------------- */

export const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')

export const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

export const initials = (name: string): string =>
  name
    .replace(/^(Ir|Drs|H|Hj|Bpk|Ibu)\.?\s+/i, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

export const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i)

/** Download array of objects as CSV */
export function toCSV<T extends Record<string, unknown>>(rows: T[], filename: string): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
