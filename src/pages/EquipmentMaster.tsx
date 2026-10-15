import { useMemo, useState } from 'react'
import { AlertTriangle, Gauge, Plus, Settings2, Truck, Wrench } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { cx, num, pct0, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart } from '../components/charts'
import type { Equipment } from '../types'

const PATH = '/master-unit'

const STATUS_TONE: Record<Equipment['status'], 'emerald' | 'amber' | 'sky' | 'rose' | 'zinc'> = {
  Operating: 'emerald',
  Standby: 'amber',
  Maintenance: 'sky',
  Breakdown: 'rose',
  Idle: 'zinc',
}

export default function EquipmentMaster() {
  const { state, actions, toast } = useERP()
  const { authority } = useAuth()
  const m = useMetrics()
  const [statusFilter, setStatusFilter] = useState<string>('Semua')
  const [detail, setDetail] = useState<Equipment | null>(null)

  const data = useMemo(
    () => (statusFilter === 'Semua' ? state.equipment : state.equipment.filter((e) => e.status === statusFilter)),
    [state.equipment, statusFilter],
  )

  const columns = useMemo<Column<Equipment>[]>(
    () => [
      { key: 'code', header: 'Kode Unit', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-ink">{r.code}</span> },
      { key: 'name', header: 'Nama / Model', sort: (r) => r.name, render: (r) => <span className="text-ink">{r.name}</span> },
      { key: 'type', header: 'Tipe', sort: (r) => r.type, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.type}</span> },
      { key: 'brand', header: 'Merek', sort: (r) => r.brand, render: (r) => <span className="text-[11px] text-ink-faint">{r.brand}</span> },
      { key: 'year', header: 'Tahun', align: 'center', sort: (r) => r.year, render: (r) => <span className="text-ink-muted">{r.year}</span> },
      { key: 'hm', header: 'Jam Meter', align: 'right', sort: (r) => r.hourMeter, render: (r) => <span className="tbl-num text-ink">{num(r.hourMeter)}</span> },
      {
        key: 'service',
        header: 'Servis Berikut',
        align: 'right',
        sort: (r) => r.nextServiceHm,
        render: (r) => {
          const rem = r.nextServiceHm - r.hourMeter
          return (
            <span className={cx('tbl-num font-medium', rem <= 0 ? 'text-rose-400' : rem <= 60 ? 'text-amber-400' : 'text-ink')}>
              {num(r.nextServiceHm)}
              <span className="ml-1 text-[10px] font-normal text-ink-faintest">({rem > 0 ? `-${num(rem)}` : 'lewat'})</span>
            </span>
          )
        },
      },
      { key: 'avail', header: 'Ketersediaan', align: 'right', sort: (r) => r.availabilityPct, render: (r) => <span className="tbl-num text-ink-muted">{pct0(r.availabilityPct)}</span> },
      { key: 'util', header: 'Pemanfaatan', align: 'right', sort: (r) => r.utilizationPct, render: (r) => <span className="tbl-num text-ink-muted">{pct0(r.utilizationPct)}</span> },
      { key: 'fuel', header: 'BBM (l/jam)', align: 'right', sort: (r) => r.fuelLph, render: (r) => <span className="tbl-num text-ink-faint">{num(r.fuelLph)}</span> },
      { key: 'tyre', header: 'Umur Ban', align: 'right', sort: (r) => r.tyreLifePct, render: (r) => <span className={cx('tbl-num', r.tyreLifePct < 30 ? 'text-rose-400' : 'text-ink-muted')}>{pct0(r.tyreLifePct)}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [],
  )

  const typeData = useMemo(() => {
    const types = [...new Set(state.equipment.map((e) => e.type))]
    return types.map((t) => ({
      name: t,
      total: state.equipment.filter((e) => e.type === t).length,
      operasi: state.equipment.filter((e) => e.type === t && e.status === 'Operating').length,
    }))
  }, [state.equipment])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Unit & Alat"
        subtitle="Modul 5 — data aset unit, spesifikasi, kepemilikan, jam meter, dan status operasional. Modul ini menjadi acuan dispatch, maintenance, BBM, dan downtime."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => toast('Formulir unit baru dibuka.', 'info')}>
              Unit Baru
            </ActionButton>
            <ActionButton module={PATH} need="admin" variant="outline" icon={<Settings2 className="h-4 w-4" />} onClick={() => toast('Konfigurasi master unit hanya dapat diubah administrator.', 'info')}>
              Konfigurasi Master
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Unit" value={num(m.fleetTotal)} icon={<Truck className="h-4 w-4" />} tone="sky" hint="Seluruh proyek" />
        <StatCard label="Beroperasi" value={num(m.fleetOperating)} icon={<Gauge className="h-4 w-4" />} tone="emerald" hint={`${pct0(m.fleetAvailability)} ketersediaan`} />
        <StatCard label="Breakdown" value={num(m.fleetBreakdown)} icon={<AlertTriangle className="h-4 w-4" />} tone={m.fleetBreakdown > 0 ? 'rose' : 'zinc'} hint="Perlu work order" />
        <StatCard label="Servis ≤ 60 Jam" value={num(m.dueSoon)} icon={<Wrench className="h-4 w-4" />} tone="amber" hint="Mendekati jadwal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Armada per Tipe" subtitle="Total unit versus unit yang beroperasi" />
          <div className="p-4 pt-0">
            <BarsChart data={typeData as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'total', name: 'Total unit' }, { key: 'operasi', name: 'Beroperasi' }]} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Konsumsi BBM & Ketersediaan" subtitle="Efisiensi rata-rata per tipe unit" />
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th className="text-right">Jumlah</th>
                  <th className="text-right">BBM Rata-rata</th>
                  <th className="text-right">Ketersediaan</th>
                  <th className="text-right">Umur Ban</th>
                </tr>
              </thead>
              <tbody>
                {typeData.map((t) => {
                  const rows = state.equipment.filter((e) => e.type === t.name)
                  return (
                    <tr key={t.name}>
                      <td className="font-medium text-ink">{t.name}</td>
                      <td className="tbl-num">{t.total}</td>
                      <td className="tbl-num">{num(sum(rows.map((e) => e.fuelLph)) / Math.max(1, rows.length))} l/jam</td>
                      <td className="tbl-num">{pct1(sum(rows.map((e) => e.availabilityPct)) / Math.max(1, rows.length))}</td>
                      <td className="tbl-num">{pct0(sum(rows.map((e) => e.tyreLifePct)) / Math.max(1, rows.length))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Daftar Unit & Alat"
          subtitle={`Kewenangan sesi: ${authority(PATH)}. Perubahan status unit dicatat pada audit trail.`}
          actions={
            <div className="flex flex-wrap gap-1.5">
              {['Semua', 'Operating', 'Standby', 'Maintenance', 'Breakdown', 'Idle'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cx('chip', statusFilter === s && 'border-amber-500/40 text-amber-400')}>
                  {s}
                </button>
              ))}
            </div>
          }
        />
        <DataTable
          data={data}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Cari kode, nama, tipe, atau merek…"
          search={(r) => `${r.code} ${r.name} ${r.type} ${r.brand} ${r.model} ${r.status}`}
          initialSort={{ key: 'code', dir: 'asc' }}
          exportName="master-unit"
          pageSize={12}
          onRowClick={(r) => setDetail(r)}
          actions={(r) => (
            <div className="flex justify-end gap-1">
              {r.status !== 'Operating' && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setEquipmentStatus(r.id, 'Operating')}>
                  Aktifkan
                </ActionButton>
              )}
              {r.status === 'Operating' && (
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setEquipmentStatus(r.id, 'Standby')}>
                  Standby
                </ActionButton>
              )}
            </div>
          )}
        />
      </Card>

      {detail && (
        <Card>
          <CardHeader
            title={`${detail.code} — ${detail.name}`}
            subtitle={`${detail.brand} ${detail.model} · ${detail.year} · ${detail.type}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
              {[
                ['Status operasional', detail.status],
                ['Jam meter', num(detail.hourMeter)],
                ['Servis terakhir', num(detail.lastServiceHm)],
                ['Servis berikutnya', num(detail.nextServiceHm)],
                ['Ketersediaan', pct1(detail.availabilityPct)],
                ['Pemanfaatan', pct1(detail.utilizationPct)],
                ['Konsumsi BBM', `${num(detail.fuelLph)} liter/jam`],
                ['Umur ban', pct0(detail.tyreLifePct)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Riwayat Terkait</p>
              {state.maintenance
                .filter((w) => w.equipmentId === detail.id)
                .slice(0, 4)
                .map((w) => (
                  <div key={w.id} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                    <p className="text-xs font-medium text-ink">{w.woNo}</p>
                    <p className="truncate text-[10px] text-ink-faint">{w.description}</p>
                  </div>
                ))}
              {state.downtimeEvents
                .filter((d) => d.unitId === detail.id)
                .slice(0, 4)
                .map((d) => (
                  <div key={d.id} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                    <p className="text-xs font-medium text-ink">{d.code}</p>
                    <p className="truncate text-[10px] text-ink-faint">
                      {d.category} · {d.durationHours} jam
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
