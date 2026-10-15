import { useMemo, useState } from 'react'
import { Award, CalendarDays, GraduationCap, Plus, UserCheck, Users } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { cx, dmy, daysBetween, idrFull, num, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { BarsChart } from '../components/charts'
import { TODAY } from '../lib/metrics'
import type { Employee, ShiftHandover, TrainingRecord } from '../types'

const PATH = '/personel'

const STATUS_TONE: Record<Employee['status'], 'emerald' | 'sky' | 'amber'> = {
  Permanent: 'emerald',
  Contract: 'sky',
  Outsource: 'amber',
}

export default function Personnel() {
  const { state, actions, toast } = useERP()
  const { authority, user } = useAuth()
  const [tab, setTab] = useState<'personel' | 'shift' | 'kompetensi'>('personel')
  const [open, setOpen] = useState(false)
  const [openTraining, setOpenTraining] = useState(false)
  const [detail, setDetail] = useState<Employee | null>(null)

  const empColumns = useMemo<Column<Employee>[]>(
    () => [
      { key: 'nip', header: 'NIP', sort: (r) => r.nip, render: (r) => <span className="font-mono text-xs text-ink">{r.nip}</span> },
      {
        key: 'name',
        header: 'Nama',
        sort: (r) => r.name,
        render: (r) => (
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[10px] font-bold text-white">
              {r.name.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{r.name}</p>
              <p className="truncate text-[11px] text-ink-faint">{r.position}</p>
            </div>
          </div>
        ),
      },
      { key: 'department', header: 'Departemen', sort: (r) => r.department, render: (r) => <span className="text-ink-muted">{r.department}</span> },
      { key: 'site', header: 'Penempatan', sort: (r) => r.siteId, render: (r) => <span className="text-[11px] text-ink-faint">{state.sites.find((s) => s.id === r.siteId)?.name ?? '-'}</span> },
      { key: 'join', header: 'Bergabung', sort: (r) => r.joinDate, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.joinDate)}</span> },
      {
        key: 'tenure',
        header: 'Masa Kerja',
        align: 'right',
        sort: (r) => r.joinDate,
        render: (r) => <span className="tbl-num text-ink-faint">{Math.floor(daysBetween(r.joinDate, TODAY) / 365)} th</span>,
      },
      { key: 'salary', header: 'Gaji Bulanan', align: 'right', sort: (r) => r.salaryIdr, render: (r) => <span className="tbl-num text-ink">{idrFull(r.salaryIdr)}</span> },
      {
        key: 'cert',
        header: 'Sertifikasi',
        render: (r) =>
          r.certifications.length ? (
            <div className="flex flex-wrap gap-1">
              {r.certifications.slice(0, 2).map((c) => (
                <span key={c} className="chip !px-1.5 !py-0.5 !text-[10px]">
                  {c}
                </span>
              ))}
              {r.certifications.length > 2 && <span className="chip !px-1.5 !py-0.5 !text-[10px]">+{r.certifications.length - 2}</span>}
            </div>
          ) : (
            <span className="text-[11px] text-amber-400">Belum ada</span>
          ),
      },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
    ],
    [state.sites],
  )

  const shiftColumns = useMemo<Column<ShiftHandover>[]>(
    () => [
      { key: 'code', header: 'Kode', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs text-ink">{r.code}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      { key: 'shift', header: 'Shift', sort: (r) => r.shift, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.shift}</span> },
      { key: 'site', header: 'Site', render: (r) => <span className="text-[11px] text-ink-faint">{state.sites.find((s) => s.id === r.siteId)?.name ?? '-'}</span> },
      { key: 'from', header: 'Dari', sort: (r) => r.fromUser, render: (r) => <span className="text-ink">{r.fromUser}</span> },
      { key: 'to', header: 'Kepada', sort: (r) => r.toUser, render: (r) => <span className="text-ink">{r.toUser}</span> },
      {
        key: 'items',
        header: 'Pokok Serah Terima',
        render: (r) => (
          <ul className="max-w-[280px] space-y-0.5">
            {r.items.slice(0, 2).map((i) => (
              <li key={i} className="truncate text-[11px] text-ink-faint">
                • {i}
              </li>
            ))}
            {r.items.length > 2 && <li className="text-[10px] text-ink-faintest">+{r.items.length - 2} item lain</li>}
          </ul>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sort: (r) => r.status,
        render: (r) => <Badge tone={r.status === 'Acknowledged' ? 'emerald' : r.status === 'Submitted' ? 'amber' : 'zinc'} dot>{r.status}</Badge>,
      },
    ],
    [state.sites],
  )

  const trainingColumns = useMemo<Column<TrainingRecord>[]>(
    () => [
      { key: 'program', header: 'Program', sort: (r) => r.program, render: (r) => <span className="font-medium text-ink">{r.program}</span> },
      { key: 'category', header: 'Kategori', sort: (r) => r.category, render: (r) => <span className="chip !px-2 !py-0.5 !text-[10px]">{r.category}</span> },
      { key: 'date', header: 'Tanggal', sort: (r) => r.date, render: (r) => <span className="text-[11px] text-ink-muted">{dmy(r.date)}</span> },
      { key: 'attendees', header: 'Peserta', align: 'right', sort: (r) => r.attendees, render: (r) => <span className="tbl-num text-ink">{num(r.attendees)}</span> },
      { key: 'trainer', header: 'Pelatih', sort: (r) => r.trainer, render: (r) => <span className="text-[11px] text-ink-faint">{r.trainer}</span> },
      { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={r.status === 'Completed' ? 'emerald' : r.status === 'Scheduled' ? 'sky' : 'zinc'} dot>{r.status}</Badge> },
    ],
    [],
  )

  const byDept = useMemo(() => {
    const depts = [...new Set(state.employees.map((e) => e.department))]
    return depts.map((d) => ({ name: d.length > 10 ? d.slice(0, 10) : d, jumlah: state.employees.filter((e) => e.department === d).length }))
  }, [state.employees])

  const noCert = state.employees.filter((e) => e.certifications.length === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel, Shift & Kompetensi"
        subtitle="Modul 11 — master personel, jadwal shift, penempatan, kompetensi, lisensi, dan serah terima shift. Hanya personel berlisensi yang boleh ditugaskan pada unit tertentu."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Personel Baru
            </ActionButton>
            <ActionButton module={PATH} need="create" variant="outline" icon={<GraduationCap className="h-4 w-4" />} onClick={() => setOpenTraining(true)}>
              Jadwalkan Pelatihan
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Personel" value={num(state.employees.length)} icon={<Users className="h-4 w-4" />} tone="sky" hint="Aktif di seluruh site" />
        <StatCard label="Belum Bersertifikat" value={num(noCert)} icon={<Award className="h-4 w-4" />} tone={noCert > 0 ? 'amber' : 'emerald'} hint="Perlu penjadwalan pelatihan" />
        <StatCard label="Penugasan Aktif" value={num(state.unitAssignments.filter((u) => u.status === 'Active').length)} icon={<UserCheck className="h-4 w-4" />} tone="emerald" hint="Unit-operator terpasang" />
        <StatCard label="Serah Terima Shift" value={num(state.shiftHandovers.length)} icon={<CalendarDays className="h-4 w-4" />} tone="violet" hint={`${state.shiftHandovers.filter((s) => s.status !== 'Acknowledged').length} belum diakui`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sebaran Personel per Departemen" subtitle="Komposisi tenaga kerja kontraktor" />
          <div className="p-4 pt-0">
            <BarsChart data={byDept as unknown as Array<Record<string, string | number>>} xKey="name" series={[{ key: 'jumlah', name: 'Jumlah personel' }]} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Status Sertifikasi" subtitle="Lisensi yang menentukan kelayakan penugasan" />
          <div className="space-y-2.5 p-4 pt-0">
            {[
              ['Lisensi operator alat berat', state.employees.filter((e) => e.certifications.some((c) => c.toLowerCase().includes('operator'))).length],
              ['Sertifikat K3 umum', state.employees.filter((e) => e.certifications.some((c) => c.toLowerCase().includes('k3'))).length],
              ['POP / prosedur kerja', state.employees.filter((e) => e.certifications.some((c) => c.toLowerCase().includes('pop'))).length],
              ['First aid / darurat', state.employees.filter((e) => e.certifications.some((c) => c.toLowerCase().includes('first'))).length],
            ].map(([label, count]) => (
              <div key={label as string} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                <span className="text-xs text-ink">{label}</span>
                <span className="text-sm font-bold text-ink">{num(count as number)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(
            [
              ['personel', 'Master Personel'],
              ['shift', 'Serah Terima Shift'],
              ['kompetensi', 'Pelatihan & Kompetensi'],
            ] as Array<['personel' | 'shift' | 'kompetensi', string]>
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('chip', tab === k && 'border-amber-500/40 text-amber-400')}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'personel' && (
          <DataTable
            data={state.employees}
            columns={empColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari nama, NIP, posisi, atau departemen…"
            search={(r) => `${r.nip} ${r.name} ${r.position} ${r.department} ${r.status}`}
            initialSort={{ key: 'name', dir: 'asc' }}
            exportName="personel"
            pageSize={12}
            onRowClick={(r) => setDetail(r)}
            actions={(r) => (
              <div className="flex justify-end">
                <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => toast(`Penempatan ${r.name} diperbarui.`, 'info')}>
                  Perbarui Penempatan
                </ActionButton>
              </div>
            )}
          />
        )}

        {tab === 'shift' && (
          <DataTable
            data={state.shiftHandovers}
            columns={shiftColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode atau nama petugas…"
            search={(r) => `${r.code} ${r.fromUser} ${r.toUser} ${r.openIssues}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="serah-terima-shift"
            pageSize={12}
            actions={(r) =>
              r.status !== 'Acknowledged' ? (
                <div className="flex justify-end">
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => toast(`Serah terima ${r.code} diakui.`, 'success')}>
                    Akui
                  </ActionButton>
                </div>
              ) : null
            }
          />
        )}

        {tab === 'kompetensi' && (
          <DataTable
            data={state.training}
            columns={trainingColumns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari program atau pelatih…"
            search={(r) => `${r.program} ${r.category} ${r.trainer}`}
            initialSort={{ key: 'date', dir: 'desc' }}
            exportName="pelatihan"
            pageSize={12}
            actions={(r) =>
              r.status === 'Scheduled' ? (
                <div className="flex justify-end">
                  <ActionButton module={PATH} need="verify" size="sm" variant="ghost" onClick={() => toast(`Pelatihan ${r.program} ditandai selesai.`, 'success')}>
                    Tandai Selesai
                  </ActionButton>
                </div>
              ) : null
            }
          />
        )}
      </Card>

      {detail && (
        <Card>
          <CardHeader
            title={detail.name}
            subtitle={`${detail.position} · ${detail.department} · ${detail.nip}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Status kepegawaian', detail.status],
                ['Penempatan', state.sites.find((s) => s.id === detail.siteId)?.name ?? '-'],
                ['Bergabung', dmy(detail.joinDate)],
                ['Masa kerja', `${Math.floor(daysBetween(detail.joinDate, TODAY) / 365)} tahun`],
                ['Gaji bulanan', idrFull(detail.salaryIdr)],
                ['Jumlah sertifikat', String(detail.certifications.length)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Sertifikasi & Lisensi</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.certifications.length ? (
                  detail.certifications.map((c) => (
                    <span key={c} className="chip !px-2 !py-1">
                      {c}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-amber-400">Belum ada sertifikasi — personel ini belum boleh ditugaskan pada unit berat.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Personel Baru" subtitle="Data personel menjadi dasar penugasan unit dan perhitungan biaya tenaga kerja.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addEmployee({
              name: String(fd.get('name') ?? ''),
              position: String(fd.get('position') ?? ''),
              department: String(fd.get('department') ?? 'Produksi'),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              joinDate: String(fd.get('joinDate') ?? TODAY),
              status: String(fd.get('status') ?? 'Permanent') as Employee['status'],
              salaryIdr: Number(fd.get('salaryIdr') ?? 0),
              certifications: String(fd.get('certifications') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
            })
            setOpen(false)
            toast('Personel baru ditambahkan ke master.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" required>
              <Input name="name" required />
            </Field>
            <Field label="Jabatan" required>
              <Input name="position" placeholder="mis. Operator Excavator" required />
            </Field>
            <Field label="Departemen" required>
              <Select name="department" options={['Produksi', 'Maintenance', 'HSE', 'Warehouse', 'Manajemen', 'Commercial', 'Cost Control']} defaultValue="Produksi" />
            </Field>
            <Field label="Penempatan" required>
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Tanggal Bergabung" required>
              <Input name="joinDate" type="date" defaultValue={TODAY} required />
            </Field>
            <Field label="Status Kepegawaian" required>
              <Select name="status" options={['Permanent', 'Contract', 'Outsource']} defaultValue="Permanent" />
            </Field>
            <Field label="Gaji Bulanan (IDR)">
              <Input name="salaryIdr" type="number" min={0} placeholder="8500000" />
            </Field>
            <Field label="Sertifikasi (pisahkan dengan koma)">
              <Input name="certifications" placeholder="Operator Excavator, K3 Umum, POP" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Personel
            </ActionButton>
          </div>
        </form>
      </Modal>

      <Modal open={openTraining} onClose={() => setOpenTraining(false)} title="Jadwalkan Pelatihan" subtitle="Pelatihan memastikan kompetensi dan lisensi personel tetap berlaku.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addTraining({
              program: String(fd.get('program') ?? ''),
              category: String(fd.get('category') ?? 'K3 Umum') as TrainingRecord['category'],
              date: String(fd.get('date') ?? TODAY),
              siteId: String(fd.get('siteId') ?? state.sites[0]?.id),
              attendees: Number(fd.get('attendees') ?? 0),
              trainer: String(fd.get('trainer') ?? ''),
            })
            setOpenTraining(false)
            toast('Pelatihan dijadwalkan.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Program" required className="sm:col-span-2">
              <Input name="program" placeholder="mis. Refreshing K3 Umum & Prosedur Darurat" required />
            </Field>
            <Field label="Kategori" required>
              <Select name="category" options={['K3 Umum', 'Teknis', 'Lingkungan', 'Manajemen', 'POP']} defaultValue="K3 Umum" />
            </Field>
            <Field label="Tanggal" required>
              <Input name="date" type="date" defaultValue={TODAY} required />
            </Field>
            <Field label="Site" required>
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Jumlah Peserta" required>
              <Input name="attendees" type="number" min={1} defaultValue={20} required />
            </Field>
            <Field label="Pelatih" className="sm:col-span-2">
              <Textarea name="trainer" rows={2} placeholder="Nama pelatih atau lembaga penyelenggara" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpenTraining(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<GraduationCap className="h-4 w-4" />}>
              Jadwalkan
            </ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
