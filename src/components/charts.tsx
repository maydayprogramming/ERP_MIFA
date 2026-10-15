import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from './ui'
import { num1, pct1 } from '../lib/format'

export const CHART_COLORS = {
  amber: '#f59e0b',
  amberSoft: '#fbbf24',
  sky: '#38bdf8',
  emerald: '#34d399',
  violet: '#a78bfa',
  rose: '#fb7185',
  zinc: '#71717a',
  orange: '#fb923c',
} as const

export const PALETTE = [CHART_COLORS.amber, CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.violet, CHART_COLORS.rose, CHART_COLORS.orange]

const AXIS = { stroke: '#52525b', fontSize: 11, tickLine: false, axisLine: false }
const TOOLTIP_STYLE = {
  background: 'rgba(24,24,27,0.96)',
  border: '1px solid #3f3f46',
  borderRadius: 10,
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 24px 48px -24px rgba(0,0,0,0.9)',
}

/* ------------------------------ Frame ------------------------------- */

export function ChartFrame({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="px-2 pb-4 pt-5 sm:px-4">
        <div className="h-[280px] w-full">{children}</div>
      </div>
    </Card>
  )
}

/* --------------------------- Trend (area) --------------------------- */

export interface Series {
  key: string
  name: string
  color?: string
  type?: 'area' | 'line'
}

export function TrendChart({
  data,
  xKey,
  series,
  valueFormatter,
  yTickFormatter,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  xKey: string
  series: Series[]
  valueFormatter?: (v: number) => string
  yTickFormatter?: (v: number) => string
  height?: number
}) {
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : num1(v))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 12, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0.32} />
              <stop offset="100%" stopColor={s.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} tickFormatter={yTickFormatter} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: '#e4e4e7', padding: '1px 0' }}
          formatter={(value: number | string) => [fmt(Number(value)), '']}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="circle" iconSize={8} />}
        {series.map((s, i) => {
          const color = s.color ?? PALETTE[i % PALETTE.length]
          return s.type === 'line' ? (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ) : (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2} fill={`url(#grad-${s.key})`} activeDot={{ r: 4 }} />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------ Bars -------------------------------- */

export function BarsChart({
  data,
  xKey,
  series,
  stacked = false,
  valueFormatter,
  yTickFormatter,
  height = 280,
  colorBy,
}: {
  data: Array<Record<string, string | number>>
  xKey: string
  series: Series[]
  stacked?: boolean
  valueFormatter?: (v: number) => string
  yTickFormatter?: (v: number) => string
  height?: number
  colorBy?: (entry: Record<string, string | number>) => string
}) {
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : num1(v))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 12, left: 4, bottom: 0 }} barSize={stacked ? undefined : 22}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} tickFormatter={yTickFormatter} width={52} />
        <Tooltip
          cursor={{ fill: 'rgba(63,63,70,0.16)' }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: '#e4e4e7', padding: '1px 0' }}
          formatter={(value: number | string) => [fmt(Number(value)), '']}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="circle" iconSize={8} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color ?? PALETTE[i % PALETTE.length]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          >
            {colorBy &&
              data.map((entry, idx) => <Cell key={idx} fill={colorBy(entry)} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------ Donut ------------------------------- */

export function DonutChart({
  data,
  valueFormatter,
  centerLabel,
  centerValue,
  height = 260,
}: {
  data: Array<{ name: string; value: number; color?: string }>
  valueFormatter?: (v: number) => string
  centerLabel?: string
  centerValue?: string
  height?: number
}) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="#18181b"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}
            formatter={(value: number | string, name: string) => [
              `${valueFormatter ? valueFormatter(Number(value)) : num1(Number(value))} (${pct1(total ? (Number(value) / total) * 100 : 0)})`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="font-mono text-xl font-bold text-zinc-50">{centerValue}</span>}
          {centerLabel && <span className="text-[11px] text-zinc-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

/* ---------------------------- Line (multi) -------------------------- */

export function MultiLineChart({
  data,
  xKey,
  series,
  valueFormatter,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  xKey: string
  series: Series[]
  valueFormatter?: (v: number) => string
  height?: number
}) {
  return <TrendChart data={data} xKey={xKey} series={series.map((s) => ({ ...s, type: 'line' }))} valueFormatter={valueFormatter} height={height} />
}
