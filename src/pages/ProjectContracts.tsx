import { useMemo, useState } from 'react'
import { BadgeCheck, CalendarClock, FileSignature, Percent, Plus, Scale, Wallet } from 'lucide-react'
import { useERP } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { useMetrics, TODAY } from '../lib/metrics'
import { cx, daysBetween, dmy, idrFull, num, pct1, sum } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Modal, Select, StatCard, Textarea, Toggle, type Column } from '../components/ui'
import { PageHeader } from '../components/Topbar'
import { ActionButton } from '../auth/ActionButton'
import { DonutChart } from '../components/charts'
import type { ProjectContract } from '../types'

const PATH = '/proyek-kontrak'

const STATUS_TONE: Record<ProjectContract['status'], 'emerald' | 'amber' | 'sky' | 'rose' | 'zinc'> = {
  Active: 'emerald',
  Expiring: 'amber',
  Review: 'sky',
  Draft: 'zinc',
  Closed: 'rose',
}

export default function ProjectContracts() {
  const { state, actions, toast } = useERP()
  const { authority, canDo } = useAuth()
  const m = useMetrics()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ProjectContract | null>(null)

  const a = authority(PATH)

  const columns = useMemo<Column<ProjectContract>[]>(
    () => [
      {
        key: 'code',
        header: 'Kontrak',
        sort: (r) => r.code,
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{r.code}</p>
            <p className="truncate text-[11px] text-ink-faint">{r.name}</p>
          </div>
        ),
      },
      { key: 'owner', header: 'Pemberi Kerja', sort: (r) => r.owner, render: (r) => <span className="text-ink-muted">{r.owner}</span> },
      {
        key: 'work',
        header: 'Cakupan',
        sort: (r) => r.workTypes.join(),
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.workTypes.map((w) => (
              <span key={w} className="chip !px-1.5 !py-0.5 !text-[10px]">
                {w}
              </span>
            ))}
          </div>
        ),
      },
      { key: 'unit', header: 'Satuan', sort: (r) => r.paymentUnit, render: (r) => <span className="text-ink-muted">{r.paymentUnit}</span> },
      { key: 'rate', header: 'Tarif', align: 'right', sort: (r) => r.rateIdr, render: (r) => <span className="tbl-num font-medium text-ink">{idrFull(r.rateIdr)}</span> },
      {
        key: 'target',
        header: 'Target Volume',
        align: 'right',
        sort: (r) => r.targetVolume,
        render: (r) => (
          <div>
            <p className="tbl-num text-ink">{num(r.targetVolume)}</p>
            <p className="text-[10px] text-ink-faintest">{pct1(m.byProject.find((p) => p.contract.id === r.id)?.progressPct ?? 0)} terealisasi</p>
          </div>
        ),
      },
      {
        key: 'value',
        header: 'Nilai Kontrak',
        align: 'right',
        sort: (r) => r.targetVolume * r.rateIdr,
        render: (r) => <span className="tbl-num font-semibold text-ink">{idrFull(r.targetVolume * r.rateIdr)}</span>,
      },
      {
        key: 'period',
        header: 'Masa Berlaku',
        sort: (r) => r.endDate,
        render: (r) => (
          <div>
            <p className="text-xs text-ink-muted">
              {dmy(r.startDate)} — {dmy(r.endDate)}
            </p>
            <p className={cx('text-[10px]', daysBetween(TODAY, r.endDate) < 60 ? 'text-amber-400' : 'text-ink-faintest')}>
              {daysBetween(TODAY, r.endDate) > 0 ? `${daysBetween(TODAY, r.endDate)} hari lagi` : 'Sudah berakhir'}
            </p>
          </div>
        ),
      },
      { key: 'version', header: 'Versi', align: 'center', sort: (r) => r.version, render: (r) => <span className="chip !px-1.5">v{r.version}</span> },
      {
        key: 'status',
        header: 'Status',
        sort: (r) => r.status,
        render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge>,
      },
    ],
    [m.byProject],
  )

  const activeValue = sum(state.projectContracts.filter((c) => c.status === 'Active').map((c) => c.targetVolume * c.rateIdr))
  const expiringSoon = state.projectContracts.filter((c) => daysBetween(TODAY, c.endDate) < 90 && daysBetween(TODAY, c.endDate) > 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyek & Kontrak"
        subtitle="Modul 1 — identitas proyek, kontrak kerja, tarif, cakupan pekerjaan, masa berlaku, dan aturan pengukuran volume. Kontrak adalah acuan seluruh modul operasional dan komersial."
        actions={
          <>
            <ActionButton module={PATH} need="create" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Kontrak Baru
            </ActionButton>
            <ActionButton module={PATH} need="approve" variant="outline" icon={<BadgeCheck className="h-4 w-4" />} onClick={() => toast('Daftar kontrak menunggu persetujuan ditampilkan.', 'info')}>
              Tinjau Persetujuan
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kontrak Aktif" value={num(state.projectContracts.filter((c) => c.status === 'Active').length)} icon={<FileSignature className="h-4 w-4" />} tone="emerald" hint="Sedang berjalan" />
        <StatCard label="Nilai Kontrak Aktif" value={idrFull(activeValue)} icon={<Wallet className="h-4 w-4" />} tone="amber" hint="Target volume × tarif" />
        <StatCard label="Berakhir < 90 Hari" value={num(expiringSoon)} icon={<CalendarClock className="h-4 w-4" />} tone="rose" hint="Perlu perpanjangan" />
        <StatCard label="Tarif Rata-rata" value={idrFull(activeValue > 0 ? activeValue / Math.max(1, sum(state.projectContracts.filter((c) => c.status === 'Active').map((c) => c.targetVolume))) : 0)} icon={<Percent className="h-4 w-4" />} tone="sky" hint="Per satuan pembayaran" />
      </div>

      {a === 'none' ? (
        <Card>
          <div className="p-10 text-center">
            <p className="text-sm text-ink-faint">Anda tidak memiliki kewenangan pada modul ini.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Daftar Kontrak Proyek" subtitle={`Kewenangan sesi ini: ${a === 'admin' ? 'akses teknis penuh' : a}`} />
          <DataTable
            data={state.projectContracts}
            columns={columns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Cari kode, nama, atau pemberi kerja…"
            search={(r) => `${r.code} ${r.name} ${r.owner} ${r.workTypes.join(' ')}`}
            initialSort={{ key: 'code', dir: 'asc' }}
            exportName="kontrak-proyek"
            pageSize={10}
            onRowClick={(r) => setSelected(r)}
            toolbar={
              <div className="flex flex-wrap gap-1.5">
                {(['Semua', 'Active', 'Expiring', 'Review', 'Draft', 'Closed'] as const).map((s) => (
                  <span key={s} className="chip !px-2 !py-0.5 !text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            }
          />
        </Card>
      )}

      {/* Detail kontrak terpilih */}
      {selected && (
        <Card>
          <CardHeader
            title={`${selected.code} — ${selected.name}`}
            subtitle={`Versi ${selected.version} · ${selected.owner} · ${selected.siteId}`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Tutup
              </Button>
            }
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Cakupan pekerjaan', selected.workTypes.join(', ')],
                  ['Satuan pembayaran', selected.paymentUnit],
                  ['Tarif efektif', idrFull(selected.rateIdr)],
                  ['Target volume', `${num(selected.targetVolume)} ${selected.paymentUnit}`],
                  ['Masa berlaku', `${dmy(selected.startDate)} — ${dmy(selected.endDate)}`],
                  ['Batas persetujuan', idrFull(selected.approvalLimitIdr)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">{k}</p>
                    <p className="mt-0.5 text-sm font-medium text-ink">{v}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Catatan & Riwayat Amendment</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{selected.notes}</p>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Aturan pengukuran yang berlaku</p>
                <ul className="space-y-1.5">
                  {[
                    selected.paymentUnit === 'BCM' ? 'Volume OB dihitung dari survey bersama antara pihak kontraktor dan pemilik tambang setiap akhir periode.' : null,
                    selected.paymentUnit === 'Ton' ? 'Tonase dihitung dari data weighbridge yang terintegrasi dan diverifikasi bersama.' : null,
                    selected.paymentUnit === 'Jam' ? 'Jam kerja dihitung dari hour meter unit, diverifikasi supervisor lapangan.' : null,
                    selected.paymentUnit === 'Km' ? 'Panjang segmen diukur dengan GPS dan dikonfirmasi bersama tiap periode.' : null,
                    'Selisih di atas ambang 2% wajib disertai alasan tertulis sebelum penagihan diajukan.',
                    'Perubahan tarif hanya berlaku melalui amendment tertulis dan tercatat pada versi kontrak.',
                  ]
                    .filter(Boolean)
                    .map((t) => (
                      <li key={t as string} className="flex items-start gap-2 text-xs text-ink-muted">
                        <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        {t}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faintest">Realisasi Kumulatif</p>
              <DonutChart
                data={[
                  { name: 'Terealisasi', value: Math.round(m.byProject.find((p) => p.contract.id === selected.id)?.volumeToDate ?? 0) },
                  { name: 'Sisa', value: Math.max(0, selected.targetVolume - (m.byProject.find((p) => p.contract.id === selected.id)?.volumeToDate ?? 0)) },
                ]}
                height={190}
              />
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                  <span className="text-[11px] text-ink-faint">Progres</span>
                  <span className="text-sm font-bold text-ink">{pct1(m.byProject.find((p) => p.contract.id === selected.id)?.progressPct ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                  <span className="text-[11px] text-ink-faint">Biaya aktual periode ini</span>
                  <span className="text-sm font-bold text-ink">{idrFull(m.byProject.find((p) => p.contract.id === selected.id)?.costActual ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                  <span className="text-[11px] text-ink-faint">Margin indikatif</span>
                  <span className={cx('text-sm font-bold', (m.byProject.find((p) => p.contract.id === selected.id)?.margin ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {pct1(m.byProject.find((p) => p.contract.id === selected.id)?.margin ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal kontrak baru */}
      <Modal open={open} onClose={() => setOpen(false)} title="Kontrak Proyek Baru" subtitle="Data master kontrak menjadi acuan target produksi, biaya, dan penagihan." size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            actions.addProjectContract({
              code: `KTR-2026-${String(state.projectContracts.length + 1).padStart(3, '0')}`,
              name: String(fd.get('name') ?? ''),
              owner: String(fd.get('owner') ?? ''),
              siteId: String(fd.get('siteId') ?? 'site-berau'),
              startDate: String(fd.get('startDate') ?? TODAY),
              endDate: String(fd.get('endDate') ?? TODAY),
              workTypes: (String(fd.get('workTypes') ?? 'OB Removal').split(',').map((s) => s.trim()) as ProjectContract['workTypes']).filter(Boolean),
              paymentUnit: String(fd.get('paymentUnit') ?? 'BCM') as ProjectContract['paymentUnit'],
              rateIdr: Number(fd.get('rateIdr') ?? 0),
              targetVolume: Number(fd.get('targetVolume') ?? 0),
              approvalLimitIdr: Number(fd.get('approvalLimitIdr') ?? 0),
              notes: String(fd.get('notes') ?? ''),
            })
            setOpen(false)
            toast('Kontrak baru dibuat sebagai draft. Perlu persetujuan pejabat berwenang untuk mengaktifkan.', 'success')
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Proyek / Paket Pekerjaan" required className="sm:col-span-2">
              <Input name="name" placeholder="mis. Overburden Removal Berau Tahap 5" required />
            </Field>
            <Field label="Pemberi Kerja (Pemilik Tambang)" required>
              <Input name="owner" placeholder="PT …" required />
            </Field>
            <Field label="Site" required>
              <Select name="siteId" options={state.sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Tanggal Mulai" required>
              <Input name="startDate" type="date" defaultValue={TODAY} required />
            </Field>
            <Field label="Tanggal Berakhir" required>
              <Input name="endDate" type="date" required />
            </Field>
            <Field label="Cakupan Pekerjaan (pisahkan dengan koma)">
              <Input name="workTypes" defaultValue="OB Removal, Hauling" placeholder="OB Removal, Coal Getting, Hauling…" />
            </Field>
            <Field label="Satuan Pembayaran" required>
              <Select name="paymentUnit" options={['BCM', 'Ton', 'Jam', 'Km', 'Lump Sum']} defaultValue="BCM" />
            </Field>
            <Field label="Tarif per Satuan (IDR)" required>
              <Input name="rateIdr" type="number" min={0} placeholder="78500" required />
            </Field>
            <Field label="Target Volume" required>
              <Input name="targetVolume" type="number" min={0} placeholder="4200000" required />
            </Field>
            <Field label="Batas Nilai Persetujuan (IDR)" hint="Disimpan sebagai konfigurasi yang dapat diaudit, bukan logika di kode.">
              <Input name="approvalLimitIdr" type="number" min={0} defaultValue={500000000} />
            </Field>
            <Field label="Catatan / Ketentuan Khusus" className="sm:col-span-2">
              <Textarea name="notes" rows={3} placeholder="Ketentuan pengukuran, amendment, asumsi tarif…" />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/40 px-3.5 py-2.5">
            <div>
              <p className="text-xs font-medium text-ink">Aktifkan kontrak segera</p>
              <p className="text-[11px] text-ink-faint">Kosongkan untuk menyimpan sebagai draft.</p>
            </div>
            <Toggle checked={false} onChange={() => undefined} label="Aktif" />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <ActionButton module={PATH} need="create" type="submit" icon={<Plus className="h-4 w-4" />}>
              Simpan Draft Kontrak
            </ActionButton>
          </div>
          {!canDo(PATH, 'create') && (
            <p className="text-[11px] text-ink-faint">Peran Anda hanya memiliki kewenangan lihat pada modul ini — formulir tidak dapat disimpan.</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
