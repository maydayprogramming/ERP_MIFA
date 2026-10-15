import { useMemo, useState } from 'react'
import { AlertTriangle, ClipboardCheck, Plus, ShieldCheck, ShieldX, Thermometer } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics } from '../lib/metrics'
import { TODAY } from '../lib/metrics'
import { cx, daysBetween, dmy, num, num1, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart, DonutChart } from '../components/charts'
import type { CorrectiveAction, Incident } from '../types'

const PATH = '/hse'

const RISK_TONE: Record<CorrectiveAction['riskLevel'], 'sky' | 'amber' | 'rose' | 'violet'> = {
  Rendah: 'sky',
  Sedang: 'amber',
  Tinggi: 'rose',
  Ekstrem: 'violet',
}

const CA_TONE: Record<CorrectiveAction['status'], 'zinc' | 'sky' | 'amber' | 'emerald' | 'rose'> = {
  Open: 'zinc',
  'In Progress': 'sky',
  'Awaiting Verification': 'amber',
  Closed: 'emerald',
  Overdue: 'rose',
}

const INC_TONE: Record<Incident['status'], 'amber' | 'sky' | 'emerald'> = {
  Open: 'amber',
  Investigation: 'sky',
  Closed: 'emerald',
}

const SEVERITY_TONE: Record<Incident['severity'], 'sky' | 'amber' | 'rose' | 'violet'> = {
  Minor: 'sky',
  Moderate: 'amber',
  Major: 'rose',
  Fatality: 'violet',
}

export default function HSE() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const m = useMetrics()
  const [tab, setTab] = useState<'korektif' | 'insiden' | 'lingkungan'>('korektif')
  const [open, setOpen] = useState(false)
  const [openIncident, setOpenIncident] = useState(false)
  const [closeCA, setCloseCA] = useState<CorrectiveAction | null>(null)

  const caColumns = useMemo<Column<CorrectiveAction>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'source', header: 'Sumber', sort: (r) => r.source, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.source}</span> },
      { key: 'desc', header: 'Temuan', render: (r) => <span className="max-w-[300px] truncate text-[11px] text-ink-faint">{r.description}</span> },
      { key: 'risk', header: 'Risiko', sort: (r) => r.riskLevel, render: (r) => <Badge tone={RISK_TONE[r.riskLevel]} dot>{r.riskLevel}</Badge> },
      { key: 'pic', header: 'PIC', sort: (r) => r.pic, render: (r) => <span className="text-ink">{r.pic}</span> },
      {
        key: 'due',
        header: 'Tenggat',
        sort: (r) => r.dueDate,
        render: (r) => (
          <span className={cx('text-[11px] font-medium', r.status !== 'Closed' && daysBetween(r.dueDate, TODAY) > 0 ? 'text-rose-400' : 'text-ink-faint')}>
            {dmy(r.dueDate)}
            {r.status !== 'Closed' && daysBetween(r.dueDate, TODAY) > 0 && ` (lewat ${daysBetween(r.dueDate, TODAY)}h)`}
          </span>
        ),
      },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={CA_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [],
  )

  const incColumns = useMemo<Column<Incident>[]>(
    () => [
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      { key: 'type', header: 'Jenis', sort: (r) => r.type, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.type}</span> },
      { key: 'severity', header: 'Tingkat', sort: (r) => r.severity, render: (r) => <Badge tone={SEVERITY_TONE[r.severity]} dot>{r.severity}</Badge> },
      { key: 'desc', header: 'Kronologi', render: (r) => <span className="max-w-[260px] truncate text-[11px] text-ink-faint">{r.description}</span> },
      { key: 'person', header: 'Pihak Terlibat', sort: (r) => r.person, render: (r) => <span className="text-ink">{r.person}</span> },
      { key: 'dept', header: 'Departemen', sort: (r) => r.department, render: (r) => <span className="text-[11px] text-ink-faint">{r.department}</span> },
      { key: 'lost', header: 'Hari Hilang', align: 'right', sort: (r) => r.lostDays, render: (r) => <span className="tbl-num text-ink">{num(r.lostDays)}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={INC_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [],
  )

  const byType = useMemo(() => {
    const types = [...new Set(state.incidents.map((i) => i.type))]
    return types.map((t) => ({ name: t, value: state.incidents.filter((i) => i.type === t).length }))
  }, [state.incidents])

  const envData = state.environmental.map((e) => ({ name: e.parameter, ambang: e.threshold, nilai: e.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="HSE, Inspeksi & Tindakan Korektif"
        subtitle="Modul 12 — inspeksi, pelaporan hazard, risk assessment, near miss dan insiden, penentuan PIC, tenggat, verifikasi, dan penutupan. Setiap temuan wajib memiliki penanggung jawab dan tenggat."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Temuan / Korektif
            </ActionButton>
            <ActionButton module={PATH} need="create" variant="outline" icon={<ShieldX className="h-4 w-4" />} onClick={() => setOpenIncident(true)}>
              Lapor Insiden
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="LTIFR (12 bulan)" value={num1(m.ltifr)} icon={<ShieldCheck className="h-4 w-4" />} tone={m.ltifr > 0 ? 'rose' : 'emerald'} hint={`${m.lti12} LTI · ${m.fatalities} fatalitas`} />
        <StatCard label="Hari Tanpa LTI" value={num(m.daysSinceLTI)} icon={<ClipboardCheck className="h-4 w-4" />} tone={m.daysSinceLTI > 180 ? 'emerald' : 'amber'} hint="Sejak insiden terakhir" />
        <StatCard label="Korektif Terbuka" value={num(m.openCA)} icon={<AlertTriangle className="h-4 w-4" />} tone={m.overdueCA > 0 ? 'rose' : 'amber'} hint={`${m.overdueCA} melewati tenggat`} />
        <StatCard label="Kepatuhan Lingkungan" value={pct1(m.complianceRate)} icon={<Thermometer className="h-4 w-4" />} tone={m.complianceRate >= 90 ? 'emerald' : 'rose'} hint={`${m.envExceeded} parameter melebihi ambang`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Distribusi Insiden" subtitle="Near miss, MTC, FAC, dan insiden berat" />
          <div className="p-4 pt-0">
            <DonutChart data={byType} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Pemantauan Lingkungan" subtitle="Nilai terukur dibanding ambang baku mutu" />
          <div className="p-4 pt-0">
            <BarsChart data={envData as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'nilai', name: 'Nilai terukur' }, { key: 'ambang', name: 'Ambang', type: 'line' }]} height={240} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['korektif', `Tindakan Korektif (${state.correctiveActions.length})`],
              ['insiden', `Insiden & Near Miss (${state.incidents.length})`],
              ['lingkungan', `Pemantauan Lingkungan (${state.environmental.length})`],
            ] as Array<['korektif' | 'insiden' | 'lingkungan', string]>
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'korektif' && (
          <DataTable
            data={state.correctiveActions}
            columns={caColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode, temuan, atau PIC…"
            search={(r) => `${r.code} ${r.description} ${r.pic} ${r.source} ${r.status}`}
            initialSort={{ key: 'due', dir: 'asc' }}
            exportName="tindakan-korektif"
            pageSize={12}
            actions={(r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'Open' && (
                  <ActionButton module={PATH} need="create" size="sm" variant="ghost" onClick={() => actions.setCorrectiveActionStatus(r.id, 'In Progress')}>
                    Mulai
                  </ActionButton>
                )}
                {r.status === 'In Progress' && (
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => setCloseCA(r)}>
                    Ajukan Verifikasi
                  </ActionButton>
                )}
                {(r.status === 'Awaiting Verification' || r.status === 'Overdue') && (
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => setCloseCA(r)}>
                    Verifikasi & Tutup
                  </ActionButton>
                )}
              </div>
            )}
          />
        )}

        {tab === 'insiden' && (
          <DataTable
            data={state.incidents}
            columns={incColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari jenis, kronologi, atau pihak terlibat…"
            search={(r) => `${r.type} ${r.description} ${r.person} ${r.department} ${r.status}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="insiden-hse"
            pageSize={12}
            actions={(r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'Open' && (
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => actions.setIncidentStatus(r.id, 'Investigation')}>
                    Investigasi
                  </ActionButton>
                )}
                {r.status === 'Investigation' && (
                  <ActionButton module={PATH} need="approve" size="sm" variant="ghost" onClick={() => actions.setIncidentStatus(r.id, 'Closed')}>
                    Tutup
                  </ActionButton>
                )}
              </div>
            )}
          />
        )}

        {tab === 'lingkungan' && (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Parameter</th>
                  <th>Lokasi</th>
                  <th className="text-right">Nilai</th>
                  <th className="text-right">Ambang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.environmental.map((e) => (
                  <tr key={e.id}>
                    <td className="text-[11px] text-ink-muted">{dmy(e.date)}</td>
                    <td className="font-medium text-ink">{e.parameter}</td>
                    <td className="text-[11px] text-ink-faint">{e.location}</td>
                    <td className="tbl-num">
                      {num1(e.value)} {e.unit}
                    </td>
                    <td className="tbl-num text-ink-faint">
                      {num1(e.threshold)} {e.unit}
                    </td>
                    <td>
                      <Badge tone={e.status === 'Compliant' ? 'emerald' : e.status === 'Warning' ? 'amber' : 'rose'} dot>
                        {e.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Temuan & Tindakan Korektif" subtitle="Setiap temuan wajib memiliki PIC dan tenggat. Temuan risiko tinggi dieskalasi otomatis.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addCorrectiveAction({
              source: String(fd.get('source') ?? 'Inspeksi') as CorrectiveAction['source'],
              description: String(fd.get('description') ?? ''),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              riskLevel: String(fd.get('riskLevel') ?? 'Sedang') as CorrectiveAction['riskLevel'],
              pic: String(fd.get('pic') ?? ''),
              dueDate: String(fd.get('dueDate') ?? TODAY),
            })
            setOpen(false)
            toast('Tindakan korektif dibuat dan terhubung ke PIC.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sumber Temuan" required>
              <Select name="source" options={['Inspeksi', 'Near Miss', 'Insiden', 'Temuan', 'Risk Assessment']} defaultValue="Inspeksi" />
            </Field>
            <Field label="Tingkat Risiko" required>
              <Select name="riskLevel" options={['Rendah', 'Sedang', 'Tinggi', 'Ekstrem']} defaultValue="Sedang" />
            </Field>
            <Field label="PIC (Penanggung Jawab)" required>
              <Input name="pic" placeholder="mis. Supervisor HSE" required />
            </Field>
            <Field label="Tenggat Penyelesaian" required>
              <Input name="dueDate" type="date" defaultValue={TODAY} required />
            </Field>
            <Field label="Site" required>
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Deskripsi Temuan" className="sm:col-span-2" required>
              <Textarea name="description" rows={3} placeholder="Apa yang ditemukan, di mana, dan apa risikonya…" required />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Temuan
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={openIncident} onClose={() => setOpenIncident(false)} title="Lapor Insiden / Near Miss" subtitle="Laporan segera setelah kejadian. Insiden berat memicu investigasi wajib.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addIncident({
              date: String(fd.get('date') ?? TODAY),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              type: String(fd.get('type') ?? 'Near Miss') as Incident['type'],
              severity: String(fd.get('severity') ?? 'Minor') as Incident['severity'],
              description: String(fd.get('description') ?? ''),
              person: String(fd.get('person') ?? ''),
              department: String(fd.get('department') ?? 'Produksi'),
              correctiveAction: String(fd.get('correctiveAction') ?? ''),
            })
            setOpenIncident(false)
            toast('Insiden dilaporkan dan menunggu investigasi.', 'warning')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal Kejadian" required>
              <Input name="date" type="date" defaultValue={TODAY} required />
            </Field>
            <Field label="Jenis" required>
              <Select name="type" options={['Near Miss', 'MTC', 'FAC', 'LTI', 'Fatality', 'Environmental', 'Property Damage']} defaultValue="Near Miss" />
            </Field>
            <Field label="Tingkat Keparahan" required>
              <Select name="severity" options={['Minor', 'Moderate', 'Major', 'Fatality']} defaultValue="Minor" />
            </Field>
            <Field label="Site" required>
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Pihak Terlibat" required>
              <Input name="person" placeholder="Nama orang atau unit" required />
            </Field>
            <Field label="Departemen" required>
              <Select name="department" options={['Produksi', 'Maintenance', 'HSE', 'Warehouse', 'Manajemen']} defaultValue="Produksi" />
            </Field>
            <Field label="Kronologi" className="sm:col-span-2" required>
              <Textarea name="description" rows={3} placeholder="Apa yang terjadi, urutan kejadian, dan tindakan awal…" required />
            </Field>
            <Field label="Tindakan Segera" className="sm:col-span-2">
              <Textarea name="correctiveAction" rows={2} placeholder="Tindakan yang sudah dilakukan di lapangan…" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpenIncident(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<ShieldX className="h-4 w-4" />}>
              Kirim Laporan
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!closeCA} onClose={() => setCloseCA(null)} title="Verifikasi & Tutup Tindakan Korektif" subtitle="Penutupan wajib disertai bukti. Verifikasi dilakukan oleh pejabat yang berwenang, bukan pelaksana.">
        {closeCA && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              actions.setCorrectiveActionStatus(closeCA.id, 'Closed', String(fd.get('evidence') ?? ''))
              toast(`Tindakan korektif ${closeCA.code} ditutup dengan bukti verifikasi.`, 'success')
              setCloseCA(null)
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
              <p className="text-xs text-ink-faint">Temuan</p>
              <p className="mt-1 text-sm text-ink">{closeCA.description}</p>
              <p className="mt-1.5 text-[11px] text-ink-faintest">
                PIC {closeCA.pic} · risiko {closeCA.riskLevel} · tenggat {dmy(closeCA.dueDate)}
              </p>
            </div>
            <Field label="Bukti Verifikasi" required hint="Deskripsi foto, dokumen, atau hasil pemeriksaan ulang.">
              <Textarea name="evidence" rows={3} placeholder="mis. Foto area setelah pembersihan, hasil inspeksi ulang tanggal …" required />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="ghost" onClick={() => setCloseCA(null)}>
                Batal
              </Button>
              <ActionButton module={PATH} need="approve" type="submit" icon={<ClipboardCheck className="h-4 w-4" />}>
                Tutup Tindakan
              </ActionButton>
            </div>
            {user?.role === 'Operator' && <p className="text-[11px] text-ink-faint">Operator hanya dapat melaporkan; verifikasi dilakukan Supervisor atau di atasnya.</p>}
          </form>
        )}
      </Modal>
    </div>
  )
}
